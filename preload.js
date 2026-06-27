const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  startDrag: (offsetX, offsetY) => ipcRenderer.send('start-drag', { offsetX, offsetY }),
  stopDrag: () => ipcRenderer.send('stop-drag'),
  openOutfitPanel: () => ipcRenderer.send('open-outfit-panel'),
  closeOutfitPanel: () => ipcRenderer.send('close-outfit-panel'),
})
