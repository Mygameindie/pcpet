const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let mainWindow
let dragTimer = null

const PET_W = 220
const PET_H = 290
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

  // macOS: float above all apps and stay visible across every Space
  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  // Start click-through so the desktop/windows behind are fully interactive.
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

// Quit on all platforms when the last window closes (desktop pet has no menu bar)
app.on('window-all-closed', () => app.quit())

// ---- Drag ---------------------------------------------------------------
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

// ---- Click-through toggle -----------------------------------------------
// Renderer sends true when cursor is over transparent space (pass through),
// false when cursor is over the pet sprite or UI controls (intercept).
ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  if (mainWindow) mainWindow.setIgnoreMouseEvents(ignore, { forward: true })
})

// ---- Outfit panel -------------------------------------------------------
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
  if (mainWindow) mainWindow.setSize(PET_W, PET_H)
})

// ---- Quit ---------------------------------------------------------------
ipcMain.on('quit-app', () => app.quit())
