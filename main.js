const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let mainWindow

function createWindow() {
  // Cover the full work area (excludes taskbar on Windows, menu bar on macOS)
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea

  mainWindow = new BrowserWindow({
    x, y, width, height,
    transparent: true,
    frame:       false,
    alwaysOnTop: true,
    resizable:   false,
    hasShadow:   false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  // macOS: float above all apps and stay visible across every Space
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  // Start click-through — transparent areas pass clicks to the desktop.
  // { forward: true } keeps mouse events flowing to the renderer so we can
  // detect when the cursor enters the pet and restore normal interaction.
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => app.quit())

// ---- Click-through toggle -----------------------------------------------
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
})

// ---- Quit ---------------------------------------------------------------
ipcMain.on('quit-app', () => app.quit())

// ---- Outfit panel (no-ops: window is already fullscreen) ----------------
ipcMain.on('open-outfit-panel',  () => {})
ipcMain.on('close-outfit-panel', () => {})
