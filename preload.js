const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Dragging now happens entirely in the renderer (no window-move IPC needed)
  startDrag:            () => {},
  stopDrag:             () => {},
  // Panel open/close are no-ops; the window is fullscreen so no resize is needed
  openOutfitPanel:      () => {},
  closeOutfitPanel:     () => {},
  // Click-through toggle
  setIgnoreMouseEvents: (ignore) => ipcRenderer.send('set-ignore-mouse-events', ignore),
  // Quit
  quitApp:              () => ipcRenderer.send('quit-app'),
})
