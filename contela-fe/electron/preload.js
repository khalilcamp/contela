const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('contela', {
    ehDesktop: true,
    audioPorJanela: process.platform === 'win32',
    salaInicial: () => ipcRenderer.invoke('contela:sala-inicial'),
    aoReceberSala: (cb) => {
        const handler = (_e, salaId) => cb(salaId);
        ipcRenderer.on('contela:sala', handler);
        return () => ipcRenderer.removeListener('contela:sala', handler);
    },
    atualizacaoStatus: () => ipcRenderer.invoke('contela:atualizacao-status'),
    aoMudarAtualizacao: (cb) => {
        const handler = (_e, status) => cb(status);
        ipcRenderer.on('contela:atualizacao', handler);
        return () => ipcRenderer.removeListener('contela:atualizacao', handler);
    },
    reiniciarParaAtualizar: () => ipcRenderer.invoke('contela:atualizacao-reiniciar'),
    listarFontes: () => ipcRenderer.invoke('contela:listar-fontes'),
    selecionarFonte: (escolha) => ipcRenderer.invoke('contela:selecionar-fonte', escolha),
    iniciarAudioJanela: (fonteId) => ipcRenderer.invoke('contela:audio-janela-iniciar', fonteId),
    pararAudioJanela: () => ipcRenderer.invoke('contela:audio-janela-parar'),
    aoReceberAudio: (cb) => {
        const handler = (_e, pedaco) => cb(pedaco);
        ipcRenderer.on('contela:audio-pcm', handler);
        return () => ipcRenderer.removeListener('contela:audio-pcm', handler);
    },
});
