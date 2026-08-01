import * as THREE from 'three'

// Park-Miller LCG seeded PRNG
export function rng(seed: number) {
  let t = seed
  return () => { t = (t * 16807) % 2147483647; return (t - 1) / 2147483646 }
}

// Tiled draw for seamless wrapping
export function tiled(ctx: CanvasRenderingContext2D, size: number, fn: () => void) {
  for (let r = -1; r <= 1; r++) for (let i = -1; i <= 1; i++) {
    ctx.save(); ctx.translate(r * size, i * size); fn(); ctx.restore()
  }
}

export function mkTex(canvas: HTMLCanvasElement, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (repeat !== 1) t.repeat.set(repeat, repeat)
  t.needsUpdate = true
  return t
}
