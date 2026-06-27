// Adapted from Pet_template_toy2 / pet_script.js drag logic (branch: claude/wind-clothing-physics-lgy26g)
// In the desktop version, dragging moves the OS window instead of the sprite within the canvas.

const canvas = document.getElementById('canvas')
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

function isOnPet(x, y) {
  // Hit-test against the centre 80% of the canvas (10% margin each side),
  // matching the bounding-box check in the source pet_script.js.
  const margin = 0.1
  const w = canvas.width
  const h = canvas.height
  return (
    x > w * margin && x < w * (1 - margin) &&
    y > h * margin && y < h * (1 - margin)
  )
}

function startDrag(e) {
  const p = getPos(e)
  if (!isOnPet(p.x, p.y)) return

  isDragging = true
  // Offset = cursor distance from the window's top-left corner.
  // The main process uses this to keep the window anchored under the cursor.
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

// Touch support (touch-screen Windows / Mac trackpad tap-drag)
canvas.addEventListener('touchstart', startDrag, { passive: false })
window.addEventListener('touchend', endDrag)
