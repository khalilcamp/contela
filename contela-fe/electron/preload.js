const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contela', {
    ehDesktop: true,
    salaInicial: () => ipcRenderer.invoke('contela:sala-inicial'),
    aoReceberSala: (cb) => {
        const handler = (_e, salaId) => cb(salaId);
        ipcRenderer.on('contela:sala', handler);
        return () => ipcRenderer.removeListener('contela:sala', handler);
    },
    listarFontes: () => ipcRenderer.invoke('contela:listar-fontes'),
    selecionarFonte: (escolha) => ipcRenderer.invoke('contela:selecionar-fonte', escolha),
});
