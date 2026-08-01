import { rng, tiled } from './helpers'

export function cardboardCanvas(seed: number, isRoughness: boolean, size = 1024): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!

  if (isRoughness) {
    // Roughness map: medium gray with corrugation variation
    const R = 165, G = 158, B = 148
    ctx.fillStyle = `rgb(${R},${G},${B})`
    ctx.fillRect(0, 0, size, size)

    // Strong corrugation bands
    const wl = 185 + n() * 25
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / wl * Math.PI * 2)
      const v = Math.round(R + wave * 55)
      ctx.fillStyle = `rgba(${v},${v},${v},0.75)`
      ctx.fillRect(0, y, size, 1)
    }
    // Dense fiber noise on roughness
    for (let i = 0; i < 1500; i++) {
      const px = n() * size, py = n() * size, len = 20 + n() * 90
      const dk = 25 + n() * 55, al = 0.25 + n() * 0.45
      ctx.strokeStyle = `rgba(${Math.max(0, R - dk)},${Math.max(0, G - dk)},${Math.max(0, B - dk)},${al})`
      ctx.lineWidth = 0.4 + n() * 1.2
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + len, py + (n() - 0.5) * 4); ctx.stroke()
    }
  } else {
    // Color map: rich kraft brown — carry all the color, material will be set to white
    const R = 186, G = 150, B = 100
    ctx.fillStyle = `rgb(${R},${G},${B})`
    ctx.fillRect(0, 0, size, size)

    // Primary corrugation: clear horizontal grooves (like real corrugated cardboard)
    const wl = 185 + n() * 25
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / wl * Math.PI * 2)
      // Dark groove + bright ridge
      const dR = Math.round(wave * 28), dG = Math.round(wave * 20), dB = Math.round(wave * 12)
      ctx.fillStyle = `rgba(${Math.max(0, R + dR)},${Math.max(0, G + dG)},${Math.max(0, B + dB)},0.85)`
      ctx.fillRect(0, y, size, 1)
    }

    // Secondary finer wave (cross-corrugation detail)
    const wl2 = 48 + n() * 14
    for (let y = 0; y < size; y++) {
      const wave2 = Math.sin(y / wl2 * Math.PI * 2)
      const v = Math.round(wave2 * 7)
      ctx.fillStyle = `rgba(${R + v},${G + v},${B + v},0.22)`
      ctx.fillRect(0, y, size, 1)
    }

    // Dense dark horizontal fibers (dominant paper fiber direction)
    for (let i = 0; i < 2800; i++) {
      const px = n() * size, py = n() * size
      const len = 60 + n() * 250
      const dk = 18 + n() * 42
      const al = 0.18 + n() * 0.40
      const lw = 0.3 + n() * 0.85
      tiled(ctx, size, () => {
        ctx.strokeStyle = `rgba(${Math.max(0, R - dk)},${Math.max(0, G - dk - 4)},${Math.max(0, B - dk - 8)},${al})`
        ctx.lineWidth = lw
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + len, py + (n() - 0.5) * 3); ctx.stroke()
      })
    }

    // Light highlight fibers (surface sheen)
    for (let i = 0; i < 1000; i++) {
      const px = n() * size, py = n() * size
      const len = 30 + n() * 120
      const lt = 18 + n() * 30
      const al = 0.10 + n() * 0.22
      ctx.strokeStyle = `rgba(${Math.min(255, R + lt)},${Math.min(255, G + lt)},${Math.min(255, B + lt)},${al})`
      ctx.lineWidth = 0.25 + n() * 0.65
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + len, py + (n() - 0.5) * 2); ctx.stroke()
    }

    // Cross-direction fibers (minority — perpendicular weave)
    for (let i = 0; i < 500; i++) {
      const px = n() * size, py = n() * size
      const len = 15 + n() * 55
      const dk = 22 + n() * 35
      const al = 0.06 + n() * 0.14
      ctx.strokeStyle = `rgba(${Math.max(0, R - dk)},${Math.max(0, G - dk)},${Math.max(0, B - dk)},${al})`
      ctx.lineWidth = 0.3 + n() * 0.7
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (n() - 0.5) * 3, py + len); ctx.stroke()
    }

    // Pulp spot variation (natural density variation in paper)
    for (let i = 0; i < 35; i++) {
      const x = n() * size, y = n() * size, r = 80 + n() * 180
      const dR = Math.round((n() - 0.5) * 22)
      const a = 0.04 + n() * 0.09
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${Math.max(0, R + dR)},${Math.max(0, G + Math.round(dR * 0.6))},${Math.max(0, B + Math.round(dR * 0.3))},${a})`)
      g.addColorStop(1, `rgba(${R},${G},${B},0)`)
      ctx.fillStyle = g; ctx.fillRect(0, 0, size, size)
    }

    // Deep groove shadows at corrugation troughs
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / (185 + n() * 25) * Math.PI * 2)
      if (wave < -0.7) {
        const darkAmount = Math.round((-wave - 0.7) / 0.3 * 25)
        ctx.fillStyle = `rgba(${Math.max(0, R - darkAmount - 10)},${Math.max(0, G - darkAmount - 8)},${Math.max(0, B - darkAmount - 5)},0.6)`
        ctx.fillRect(0, y, size, 1)
      }
    }
  }

  return cv
}
