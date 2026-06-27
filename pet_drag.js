// Drag: moves #pet-container around the fullscreen transparent window.
// Also manages click-through so the desktop stays interactive behind the pet.

const canvas    = document.getElementById('canvas')
const container = document.getElementById('pet-container')
const hitCtx    = canvas.getContext('2d')

let isDragging  = false
let dragOffsetX = 0
let dragOffsetY = 0

// Returns true when the canvas pixel under (x, y) is non-transparent,
// giving pixel-perfect hit-testing against the actual sprite shape.
function isOpaquePixel(x, y) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false
  try {
    return hitCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] > 10
  } catch (_) {
    // Fallback bounding-box if canvas is tainted
    const m = 0.1
    return x > canvas.width * m && x < canvas.width * (1 - m) &&
           y > canvas.height * m && y < canvas.height * (1 - m)
  }
}

// ---- Click-through -------------------------------------------------------
// mousemove is forwarded even when the OS window ignores mouse events, so
// this handler always fires and can re-enable interaction as needed.
document.addEventListener('mousemove', (e) => {
  const el = document.elementFromPoint(e.clientX, e.clientY)

  if (el === canvas) {
    // Over the canvas — only interactive when over an opaque sprite pixel
    const r  = canvas.getBoundingClientRect()
    const cx = e.clientX - r.left
    const cy = e.clientY - r.top
    window.electronAPI.setIgnoreMouseEvents(!isOpaquePixel(cx, cy))
    return
  }

  // Over any other element inside the container (button bar, panels) → interactive
  if (container.contains(el)) {
    window.electronAPI.setIgnoreMouseEvents(false)
    return
  }

  // Over transparent background → click-through
  window.electronAPI.setIgnoreMouseEvents(true)
})

document.addEventListener('mouseleave', () => {
  window.electronAPI.setIgnoreMouseEvents(true)
})

// ---- Drag ----------------------------------------------------------------
function getCanvasPos(e) {
  const r = canvas.getBoundingClientRect()
  return {
    cx: (e.touches ? e.touches[0].clientX : e.clientX) - r.left,
    cy: (e.touches ? e.touches[0].clientY : e.clientY) - r.top,
    clientX: e.touches ? e.touches[0].clientX : e.clientX,
    clientY: e.touches ? e.touches[0].clientY : e.clientY,
  }
}

function startDrag(e) {
  const { cx, cy, clientX, clientY } = getCanvasPos(e)
  if (!isOpaquePixel(cx, cy)) return

  isDragging = true
  const cr = container.getBoundingClientRect()
  dragOffsetX = clientX - cr.left
  dragOffsetY = clientY - cr.top

  // Switch to left/top so right/bottom don't fight the drag
  container.style.right  = 'auto'
  container.style.bottom = 'auto'
  container.style.left   = cr.left + 'px'
  container.style.top    = cr.top  + 'px'

  e.preventDefault()
}

function onDrag(e) {
  if (!isDragging) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY

  // Keep the container inside the viewport
  const maxX = window.innerWidth  - container.offsetWidth
  const maxY = window.innerHeight - container.offsetHeight
  const x = Math.max(0, Math.min(clientX - dragOffsetX, maxX))
  const y = Math.max(0, Math.min(clientY - dragOffsetY, maxY))

  container.style.left = x + 'px'
  container.style.top  = y + 'px'
}

function endDrag() {
  isDragging = false
}

canvas.addEventListener('mousedown',  startDrag)
document.addEventListener('mousemove', onDrag)
window.addEventListener('mouseup',    endDrag)

canvas.addEventListener('touchstart', startDrag,  { passive: false })
document.addEventListener('touchmove',  onDrag,   { passive: false })
window.addEventListener('touchend',   endDrag)
