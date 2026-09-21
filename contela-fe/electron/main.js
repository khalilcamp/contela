const { app, BrowserWindow, Menu, protocol, net, session, desktopCapturer, shell, ipcMain, globalShortcut, Notification, nativeImage } = require('electron');
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

let statusAtualizacao = { estado: 'nenhum' };

function publicarStatusAtualizacao(status) {
    statusAtualizacao = status;
    if (janela && !janela.isDestroyed()) janela.webContents.send('contela:atualizacao', status);
}

const ATALHOS_GLOBAIS = {
    'CommandOrControl+Alt+Shift+M': 'silenciar',
    'CommandOrControl+Alt+Shift+C': 'chat',
    'CommandOrControl+Alt+Shift+S': 'parar',
};

function desativarAtalhosGlobais() {
    Object.keys(ATALHOS_GLOBAIS).forEach((acelerador) => globalShortcut.unregister(acelerador));
}

function ativarAtalhosGlobais() {
    desativarAtalhosGlobais();
    const registrados = [];
    const falhas = [];
    for (const [acelerador, acao] of Object.entries(ATALHOS_GLOBAIS)) {
        const rotulo = acelerador.replace('CommandOrControl', 'Ctrl').replaceAll('+', ' + ');
        const ok = globalShortcut.register(acelerador, () => {
            if (!janela || janela.isDestroyed()) return;
            if (acao === 'chat' && (!janela.isVisible() || janela.isMinimized() || !janela.isFocused())) {
                if (janela.isMinimized()) janela.restore();
                janela.show();
                janela.focus();
                janela.webContents.send('contela:atalho', 'chat-abrir');
                return;
            }
            janela.webContents.send('contela:atalho', acao);
        });
        (ok ? registrados : falhas).push(rotulo);
    }
    return { registrados, falhas };
}

ipcMain.handle('contela:atalhos', (evento, ativo) => {
    if (!remetenteConfiavel(evento)) return { registrados: [], falhas: [] };
    if (!ativo) {
        desativarAtalhosGlobais();
        return { registrados: [], falhas: [] };
    }
    return ativarAtalhosGlobais();
});

function trazerJanelaParaFrente() {
    if (!janela || janela.isDestroyed()) return;
    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();
}

ipcMain.handle('contela:notificar', (evento, aviso) => {
    if (!remetenteConfiavel(evento) || !aviso || typeof aviso.titulo !== 'string' || typeof aviso.corpo !== 'string') return false;
    if (!janela || janela.isDestroyed() || (janela.isFocused() && !janela.isMinimized()) || !Notification.isSupported()) return false;

    const notificacao = new Notification({ title: aviso.titulo.slice(0, 60), body: aviso.corpo.slice(0, 200) });
    notificacao.on('click', () => {
        trazerJanelaParaFrente();
        if (janela && !janela.isDestroyed()) janela.webContents.send('contela:atalho', 'chat-abrir');
    });
    notificacao.show();
    return true;
});

ipcMain.handle('contela:nao-lidas', (evento, quantidade, icone) => {
    if (!remetenteConfiavel(evento) || !janela || janela.isDestroyed()) return false;
    const qtd = Number.isInteger(quantidade) ? Math.max(0, Math.min(quantidade, 999)) : 0;

    if (qtd === 0) {
        janela.setOverlayIcon(null, '');
        janela.flashFrame(false);
        return true;
    }
    const iconeValido = typeof icone === 'string' && icone.startsWith('data:image/png;base64,') && icone.length < 30000;
    if (iconeValido) janela.setOverlayIcon(nativeImage.createFromDataURL(icone), `${qtd} mensagens não lidas`);
    if (!janela.isFocused()) janela.flashFrame(true);
    return true;
});

const TEMPO_MAXIMO_VERIFICACAO_MS = 5000;
const demoAbertura = !app.isPackaged && process.env.CONTELA_ABERTURA_DEMO === '1';
let abertura = null;

function enviarParaAbertura(status) {
    if (abertura && !abertura.isDestroyed()) abertura.webContents.send('contela:abertura', status);
}

function abrirJanelaDeAbertura() {
    abertura = new BrowserWindow({
        width: 380,
        height: 280,
        frame: false,
        resizable: false,
        maximizable: false,
        minimizable: false,
        fullscreenable: false,
        center: true,
        show: false,
        backgroundColor: '#0c0d12',
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'abertura-preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    abertura.loadFile(path.join(__dirname, 'abertura.html'));
    abertura.once('ready-to-show', () => abertura.show());
    abertura.on('closed', () => {
        abertura = null;
    });
    abertura.webContents.on('will-navigate', (evento) => evento.preventDefault());
    abertura.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

function fecharJanelaDeAbertura() {
    if (abertura && !abertura.isDestroyed()) abertura.close();
}

function demonstrarAbertura() {
    return new Promise((resolve) => {
        enviarParaAbertura({ estado: 'verificando' });
        const total = 112363569;
        let feito = 0;
        setTimeout(() => {
            const passo = setInterval(() => {
                feito = Math.min(total, feito + total * 0.04);
                enviarParaAbertura({
                    estado: 'baixando',
                    versao: '9.9.9',
                    progresso: { percentual: (feito / total) * 100, transferido: feito, total, bytesPorSegundo: 5200000 },
                });
                if (feito >= total) {
                    clearInterval(passo);
                    enviarParaAbertura({ estado: 'pronta' });
                    setTimeout(resolve, 1200);
                }
            }, 150);
        }, 1500);
    });
}

function atualizadorInstalavel() {
    return app.isPackaged && process.platform === 'win32' && !process.env.PORTABLE_EXECUTABLE_FILE;
}

function verificarNaAbertura(autoUpdater) {
    return new Promise((resolve) => {
        let baixando = false;
        let seguiu = false;
        const seguir = () => {
            if (seguiu) return;
            seguiu = true;
            clearTimeout(limite);
            resolve(true);
        };
        const limite = setTimeout(() => {
            if (!baixando) seguir();
        }, TEMPO_MAXIMO_VERIFICACAO_MS);

        enviarParaAbertura({ estado: 'verificando' });
        autoUpdater.once('update-not-available', seguir);
        autoUpdater.once('error', seguir);
        autoUpdater.once('update-available', (info) => {
            if (seguiu) return;
            baixando = true;
            enviarParaAbertura({ estado: 'baixando', versao: info.version });
        });
        autoUpdater.on('download-progress', (p) => {
            if (!baixando) return;
            enviarParaAbertura({
                estado: 'baixando',
                versao: statusAtualizacao.versao,
                progresso: {
                    percentual: p.percent,
                    bytesPorSegundo: p.bytesPerSecond,
                    transferido: p.transferred,
                    total: p.total,
                },
            });
        });
        autoUpdater.once('update-downloaded', () => {
            if (!baixando || seguiu) return;
            seguiu = true;
            clearTimeout(limite);
            enviarParaAbertura({ estado: 'pronta' });
            setTimeout(() => autoUpdater.quitAndInstall(true, true), 1200);
            resolve(false);
        });
        autoUpdater.checkForUpdates().catch(seguir);
    });
}

async function iniciarApp() {
    const atualizador = atualizadorInstalavel() ? configurarAtualizador() : null;

    if (demoAbertura || atualizador) {
        abrirJanelaDeAbertura();
        const abrir = demoAbertura ? await demonstrarAbertura().then(() => true) : await verificarNaAbertura(atualizador);
        if (!abrir) return;
    }

    criarJanela();
    fecharJanelaDeAbertura();
    if (atualizador) setInterval(() => atualizador.checkForUpdates().catch(() => {}), 4 * 60 * 60 * 1000);
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) criarJanela();
    });
}

function configurarAtualizador() {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => publicarStatusAtualizacao({ estado: 'baixando', versao: info.version }));
    autoUpdater.on('download-progress', (p) =>
        publicarStatusAtualizacao({
            estado: 'baixando',
            versao: statusAtualizacao.versao,
            progresso: {
                percentual: p.percent,
                bytesPorSegundo: p.bytesPerSecond,
                transferido: p.transferred,
                total: p.total,
            },
        }),
    );
    autoUpdater.on('update-downloaded', (info) => publicarStatusAtualizacao({ estado: 'pronta', versao: info.version }));
    autoUpdater.on('error', () => publicarStatusAtualizacao({ estado: 'erro' }));

    ipcMain.handle('contela:atualizacao-reiniciar', (evento) => {
        if (!remetenteConfiavel(evento) || statusAtualizacao.estado !== 'pronta') return;
        autoUpdater.quitAndInstall();
    });

    return autoUpdater;
}

ipcMain.handle('contela:atualizacao-status', (evento) => (remetenteConfiavel(evento) ? statusAtualizacao : { estado: 'nenhum' }));

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
    janela.on('focus', () => janela.flashFrame(false));
    janela.on('closed', () => {
        desativarAtalhosGlobais();
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
        if (process.platform === 'win32') app.setAppUserModelId('com.contela.app');
        if (usarEstatico) registrarProtocoloApp();
        registrarCapturaDeTela();

        const urlInicial = process.argv.find((a) => a.startsWith(`${PROTOCOLO_DEEP_LINK}://`));
        if (urlInicial) salaPendente = extrairSala(urlInicial);

        iniciarApp();
    });

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
        pararCapturaJanela();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
