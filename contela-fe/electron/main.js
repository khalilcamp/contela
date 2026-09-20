const { app, BrowserWindow, Menu, protocol, net, session, desktopCapturer, shell, ipcMain } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const PROTOCOLO_DEEP_LINK = 'contela';
const ESQUEMA_APP = 'app';
const HOST_APP = 'contela';
const OUT_DIR = path.join(__dirname, '..', 'out');

const usarEstatico = app.isPackaged || process.argv.includes('--static');
const DEV_URL = process.env.ELECTRON_START_URL || 'http://localhost:3000';

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
        return partes[0] === 'sala' && partes[1] ? decodeURIComponent(partes[1]) : null;
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
        if (!arquivo.startsWith(OUT_DIR)) return new Response('Forbidden', { status: 403 });
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
    ipcMain.handle('contela:listar-fontes', listarFontes);
    ipcMain.handle('contela:selecionar-fonte', (_e, escolha) => {
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
        backgroundColor: '#0b0b0f',
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
        shell.openExternal(url);
        return { action: 'deny' };
    });
    janela.on('closed', () => (janela = null));
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

    ipcMain.handle('contela:sala-inicial', () => {
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

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
