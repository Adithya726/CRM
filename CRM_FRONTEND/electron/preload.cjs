const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },

  getAppInfo: () => ipcRenderer.invoke('app:get-info'),
  getBackendStatus: () => ipcRenderer.invoke('backend:status'),
  getBackendStartup: () => ipcRenderer.invoke('backend:startup'),
  restartBackend: () => ipcRenderer.invoke('backend:restart'),

  /** Subscribe to backend lifecycle updates from main process */
  onBackendStatus: (callback) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('backend:status', listener)
    return () => ipcRenderer.removeListener('backend:status', listener)
  },
})
