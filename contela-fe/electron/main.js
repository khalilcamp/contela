const { app, BrowserWindow, Menu, protocol, net, session, desktopCapturer, shell, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');
const loopback = process.platform === 'win32' ? require('application-loopback') : null;

const PROTOCOLO_DEEP_LINK = 'contela';
const ESQUEMA_APP = 'app';
const HOST_APP = 'contela';
const OUT_DIR = path.join(__dirname, '..', 'out');

const usarEstatico = app.isPackaged || process.argv.includes('--static');
const DEV_URL = process.env.ELECTRON_START_URL || 'http://localhost:3000';
const ORIGEM_APP = usarEstatico ? `${ESQUEMA_APP}://${HOST_APP}` : new URL(DEV_URL).origin;
const ID_SALA_VALIDO = /^[A-Za-z0-9-]{1,16}$/;

function urlConfiavel(url) {
    try {
        const u = new URL(url);
        return `${u.protocol}//${u.host}` === ORIGEM_APP;
    } catch {
        return false;
    }
}

function abrirExterno(url) {
    try {
        const u = new URL(url);
        if (['https:', 'http:', 'mailto:'].includes(u.protocol)) shell.openExternal(u.toString());
    } catch {}
}

function remetenteConfiavel(evento) {
    return Boolean(evento.senderFrame) && urlConfiavel(evento.senderFrame.url);
}

if (loopback && app.isPackaged) {
    loopback.setExecutablesRoot(
        path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'application-loopback', 'bin')
    );
}

const FORMATO_AUDIO_JANELA = { sampleRate: 48000, canais: 2, bits: 16 };
let capturaJanela = null;

function listarJanelasComProcesso() {
    return new Promise((resolve) => {
        let saida = '';
        let filho;
        try {
            filho = spawn(loopback.getProcessListBinaryPath(), [], { windowsHide: true });
        } catch {
            return resolve([]);
        }
        filho.on('error', () => resolve([]));
        filho.stdout.setEncoding('utf8');
        filho.stdout.on('data', (dados) => (saida += dados));
        filho.on('close', () => {
            const janelas = saida
                .split('\n')
                .map((linha) => linha.replace('\r', '').split(';'))
                .filter((partes) => partes.length >= 3)
                .map(([processId, hwnd, ...titulo]) => ({ processId, hwnd, title: titulo.join(';') }));
            resolve(janelas);
        });
    });
}

function pararCapturaJanela() {
    if (!capturaJanela) return;
    try {
        capturaJanela.filho.kill();
    } catch {}
    capturaJanela = null;
}

async function iniciarCapturaJanela(sourceId, destino) {
    if (!loopback || typeof sourceId !== 'string' || !sourceId.startsWith('window:')) return null;
    if (janela && sourceId === janela.getMediaSourceId()) return null;

    const hwnd = Number(sourceId.split(':')[1]);
    if (!Number.isFinite(hwnd)) return null;

    const alvo = (await listarJanelasComProcesso()).find((j) => Number(j.hwnd) === hwnd);
    if (!alvo) return null;

    pararCapturaJanela();

    let filho;
    try {
        filho = spawn(loopback.getLoopbackBinaryPath(), [String(alvo.processId)], {
            windowsHide: true,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
    } catch {
        return null;
    }

    const iniciou = await new Promise((resolve) => {
        filho.once('error', () => resolve(false));
        filho.once('spawn', () => resolve(true));
    });
    if (!iniciou) return null;

    filho.on('error', () => {});
    filho.stdin.on('error', () => {});
    filho.stderr.resume();
    filho.stdout.on('data', (pedaco) => {
        if (!destino.isDestroyed()) destino.send('contela:audio-pcm', pedaco);
    });
    filho.on('close', () => {
        if (capturaJanela && capturaJanela.filho === filho) capturaJanela = null;
    });

    capturaJanela = { filho };
    return FORMATO_AUDIO_JANELA;
}

let janela = null;
let salaPendente = null;
let escolhaCaptura = null;

protocol.registerSchemesAsPrivileged([
    { scheme: ESQUEMA_APP, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function extrairSala(url) {
    try {
        const u = new URL(url);
        if (u.protocol !== `${PROTOCOLO_DEEP_LINK}:`) return null;
        const partes = [u.hostname, ...u.pathname.split('/')].filter(Boolean);
        const salaId = partes[0] === 'sala' && partes[1] ? decodeURIComponent(partes[1]) : null;
        return salaId && ID_SALA_VALIDO.test(salaId) ? salaId : null;
    } catch {
        return null;
    }
}

function tratarDeepLink(url) {
    const salaId = extrairSala(url);
    if (!salaId) return;
    salaPendente = salaId;
    if (janela) {
        if (janela.isMinimized()) janela.restore();
        janela.focus();
        janela.webContents.send('contela:sala', salaId);
    }
}

function registrarProtocoloApp() {
    protocol.handle(ESQUEMA_APP, (request) => {
        const { pathname } = new URL(request.url);
        let arquivo = path.normalize(path.join(OUT_DIR, decodeURIComponent(pathname)));
        if (arquivo !== OUT_DIR && !arquivo.startsWith(OUT_DIR + path.sep)) {
            return new Response('Forbidden', { status: 403 });
        }
        if (pathname === '/' || !path.extname(arquivo)) arquivo = path.join(arquivo, 'index.html');
        return net.fetch(pathToFileURL(arquivo).toString());
    });
}

function audioDoSistema(querAudio) {
    return querAudio && process.platform === 'win32' ? 'loopback' : undefined;
}

async function listarFontes() {
    const fontes = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: true,
    });
    const idJanelaPropria = janela?.getMediaSourceId();
    return fontes
        .filter((f) => f.id !== idJanelaPropria)
        .map((f) => ({
            id: f.id,
            name: f.name,
            tipo: f.id.startsWith('screen:') ? 'screen' : 'window',
            thumbnail: f.thumbnail.toDataURL(),
            appIcon: f.appIcon && !f.appIcon.isEmpty() ? f.appIcon.toDataURL() : null,
        }));
}

function registrarCapturaDeTela() {
    ipcMain.handle('contela:listar-fontes', (evento) => (remetenteConfiavel(evento) ? listarFontes() : []));
    ipcMain.handle('contela:audio-janela-iniciar', (evento, sourceId) =>
        remetenteConfiavel(evento) ? iniciarCapturaJanela(sourceId, evento.sender) : null
    );
    ipcMain.handle('contela:audio-janela-parar', (evento) => {
        if (remetenteConfiavel(evento)) pararCapturaJanela();
    });
    ipcMain.handle('contela:selecionar-fonte', (evento, escolha) => {
        if (!remetenteConfiavel(evento)) return;
        if (!escolha || typeof escolha.id !== 'string') return;
        escolhaCaptura = { id: escolha.id, audio: Boolean(escolha.audio) };
    });

    session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
        const fontes = await desktopCapturer.getSources({
            types: ['screen', 'window'],
            thumbnailSize: { width: 160, height: 90 },
        });

        if (escolhaCaptura) {
            const { id, audio } = escolhaCaptura;
            escolhaCaptura = null;
            const fonte = fontes.find((f) => f.id === id);
            const audioPermitido = audio && id.startsWith('screen:');
            return fonte ? callback({ video: fonte, audio: audioDoSistema(audioPermitido) }) : callback({});
        }

        const escolhida = await new Promise((resolve) => {
            let resolvido = false;
            const finalizar = (fonte) => {
                if (resolvido) return;
                resolvido = true;
                resolve(fonte);
            };
            const menu = Menu.buildFromTemplate([
                { label: 'Escolha o que compartilhar', enabled: false },
                { type: 'separator' },
                ...fontes.map((fonte) => ({
                    label: fonte.name.slice(0, 60),
                    icon: fonte.thumbnail.resize({ width: 32 }),
                    click: () => finalizar(fonte),
                })),
            ]);
            menu.popup({ window: janela ?? undefined, callback: () => setTimeout(() => finalizar(null), 0) });
        });

        if (!escolhida) return callback({});
        callback({ video: escolhida, audio: audioDoSistema(true) });
    });
}

function criarJanela() {
    janela = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#0c0d12',
        icon: path.join(__dirname, 'icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    janela.loadURL(usarEstatico ? `${ESQUEMA_APP}://${HOST_APP}/` : DEV_URL);

    janela.webContents.setWindowOpenHandler(({ url }) => {
        abrirExterno(url);
        return { action: 'deny' };
    });
    janela.webContents.on('will-navigate', (evento, url) => {
        if (urlConfiavel(url)) return;
        evento.preventDefault();
        abrirExterno(url);
    });
    janela.on('closed', () => {
        pararCapturaJanela();
        janela = null;
    });
}

if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(PROTOCOLO_DEEP_LINK, process.execPath, [path.resolve(process.argv[1])]);
} else {
    app.setAsDefaultProtocolClient(PROTOCOLO_DEEP_LINK);
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', (_e, argv) => {
        const url = argv.find((a) => a.startsWith(`${PROTOCOLO_DEEP_LINK}://`));
        if (url) tratarDeepLink(url);
        else janela?.focus();
    });
    app.on('open-url', (event, url) => {
        event.preventDefault();
        tratarDeepLink(url);
    });

    ipcMain.handle('contela:sala-inicial', (evento) => {
        if (!remetenteConfiavel(evento)) return null;
        const s = salaPendente;
        salaPendente = null;
        return s;
    });

    app.whenReady().then(() => {
        if (usarEstatico) registrarProtocoloApp();
        registrarCapturaDeTela();

        const urlInicial = process.argv.find((a) => a.startsWith(`${PROTOCOLO_DEEP_LINK}://`));
        if (urlInicial) salaPendente = extrairSala(urlInicial);

        criarJanela();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) criarJanela();
        });
    });

    app.on('will-quit', pararCapturaJanela);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
