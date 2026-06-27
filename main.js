const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let mainWindow
let dragTimer = null

// Default size: canvas (250) + button bar (40)
const PET_W = 220
const PET_H = 290
// Expanded size when outfit/preset panel is open
const PANEL_W = 360
const PANEL_H = 560

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width:  PET_W,
    height: PET_H,
    x: width  - PET_W - 20,
    y: height - PET_H - 20,
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

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ---- Drag: move window in sync with cursor at ~60 fps ----------------------
ipcMain.on('start-drag', (event, { offsetX, offsetY }) => {
  if (dragTimer) clearInterval(dragTimer)
  dragTimer = setInterval(() => {
    if (!mainWindow) return
    const { x, y } = screen.getCursorScreenPoint()
    mainWindow.setPosition(Math.round(x - offsetX), Math.round(y - offsetY))
  }, 16)
})

ipcMain.on('stop-drag', () => {
  if (dragTimer) { clearInterval(dragTimer); dragTimer = null }
})

// ---- Outfit panel: expand window downward, keep it on screen ---------------
ipcMain.on('open-outfit-panel', () => {
  if (!mainWindow) return
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize
  const [wx, wy] = mainWindow.getPosition()
  const safeX = Math.min(wx, sw - PANEL_W)
  const safeY = Math.min(wy, sh - PANEL_H)
  mainWindow.setPosition(Math.max(0, safeX), Math.max(0, safeY))
  mainWindow.setSize(PANEL_W, PANEL_H)
})

ipcMain.on('close-outfit-panel', () => {
  if (!mainWindow) return
  mainWindow.setSize(PET_W, PET_H)
})
