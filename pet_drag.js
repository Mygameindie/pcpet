// Desktop drag: moves the OS window to follow the cursor.
// Also toggles click-through so the background remains interactive when the
// cursor is over a transparent part of the window.

const canvas = document.getElementById('canvas')
const hitCtx = canvas.getContext('2d')
let isDragging = false

function getPos(e) {
  const r = canvas.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - r.left,
    y: clientY - r.top,
    screenX: e.screenX !== undefined ? e.screenX : clientX,
    screenY: e.screenY !== undefined ? e.screenY : clientY,
  }
}

// Returns true when the canvas pixel under (x, y) is non-transparent.
// This gives pixel-perfect hit-testing against the actual sprite shape.
function isOpaquePixel(x, y) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false
  try {
    const px = hitCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data
    return px[3] > 10
  } catch (_) {
    // Fallback: treat the centre 80% as hit area (e.g. if canvas is tainted)
    const margin = 0.1
    return (
      x > canvas.width  * margin && x < canvas.width  * (1 - margin) &&
      y > canvas.height * margin && y < canvas.height * (1 - margin)
    )
  }
}

// ---- Click-through: pass transparent-area clicks to the desktop -----------
// mousemove is forwarded even when the window is in ignore-mouse-events mode,
// so this handler always runs and can re-enable interaction as needed.
document.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect()
  const cx = e.clientX - r.left
  const cy = e.clientY - r.top

  // Interact when cursor is over an opaque pet pixel or over any UI element
  // below the canvas (button bar, panels).
  const overPet = isOpaquePixel(cx, cy)
  const overUI  = e.clientY > r.bottom

  window.electronAPI.setIgnoreMouseEvents(!(overPet || overUI))
})

// When the cursor leaves the window entirely, restore click-through
document.addEventListener('mouseleave', () => {
  window.electronAPI.setIgnoreMouseEvents(true)
})

// ---- Drag -----------------------------------------------------------------
function startDrag(e) {
  const p = getPos(e)
  if (!isOpaquePixel(p.x, p.y)) return

  isDragging = true
  const offsetX = p.screenX - window.screenX
  const offsetY = p.screenY - window.screenY
  window.electronAPI.startDrag(offsetX, offsetY)
  e.preventDefault()
}

function endDrag() {
  if (!isDragging) return
  isDragging = false
  window.electronAPI.stopDrag()
}

canvas.addEventListener('mousedown', startDrag)
window.addEventListener('mouseup', endDrag)

canvas.addEventListener('touchstart', startDrag, { passive: false })
window.addEventListener('touchend', endDrag)
