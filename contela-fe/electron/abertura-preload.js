const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('abertura', {
    aoMudar: (cb) => ipcRenderer.on('contela:abertura', (_e, status) => cb(status)),
});
