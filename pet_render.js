// Draws the base pet sprite centred on the transparent canvas.
// Matches the aspect ratio from mysticcacao/pet_art.js (fallback 400 × 450).

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const petImage = new Image()
petImage.src = 'images/base.png'

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (petImage.complete && petImage.naturalWidth > 0) {
    const aspect = petImage.naturalWidth / petImage.naturalHeight
    const h = canvas.height * 0.9
    const w = h * aspect
    const x = (canvas.width - w) / 2
    const y = (canvas.height - h) / 2
    ctx.drawImage(petImage, x, y, w, h)

    if (typeof window.drawOutfitOverlay === 'function') {
      window.drawOutfitOverlay(ctx, null, x, y, w, h, 0)
    }
  }

  requestAnimationFrame(draw)
}

petImage.onload = draw
petImage.onerror = draw // start loop even if image is missing; shows blank window
draw()
