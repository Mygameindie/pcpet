const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  startDrag:            (offsetX, offsetY) => ipcRenderer.send('start-drag', { offsetX, offsetY }),
  stopDrag:             ()      => ipcRenderer.send('stop-drag'),
  openOutfitPanel:      ()      => ipcRenderer.send('open-outfit-panel'),
  closeOutfitPanel:     ()      => ipcRenderer.send('close-outfit-panel'),
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  quitApp:              ()      => ipcRenderer.send('quit-app'),
})
