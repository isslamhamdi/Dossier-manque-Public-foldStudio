import * as THREE from 'three'
import type { AlphaShapeSpec } from './helpers'

// Canvas resolution for generated alpha textures.
// 128×128 gives clean triangles with minimal aliasing at typical panel scales.
const TEX_SIZE = 128

function makeCtx(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null
  const c = document.createElement('canvas')
  c.width = TEX_SIZE
  c.height = TEX_SIZE
  return c.getContext('2d')
}

// Generates a Canvas alpha texture for an irregular panel shape.
// The texture is used as material.alphaMap: white = opaque, black = transparent.
// Uses base panel UVs (0→1 each axis) so it is orientation-independent.
export function generateAlphaTex(shape: AlphaShapeSpec): THREE.CanvasTexture | null {
  const ctx = makeCtx()
  if (!ctx) return null

  const W = TEX_SIZE, H = TEX_SIZE
  ctx.fillStyle = '#ffffff'

  switch (shape.type) {
    case 'triangle': {
      ctx.beginPath()
      switch (shape.tipEdge) {
        case 'bottom':
          // Base at top, tip at center-bottom (gable-top flap shape)
          ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W / 2, H)
          break
        case 'top':
          // Base at bottom, tip at center-top (bottom seal flap)
          ctx.moveTo(W / 2, 0); ctx.lineTo(W, H); ctx.lineTo(0, H)
          break
        case 'left':
          // Base at right, tip at center-left
          ctx.moveTo(0, H / 2); ctx.lineTo(W, 0); ctx.lineTo(W, H)
          break
        case 'right':
          // Base at left, tip at center-right
          ctx.moveTo(0, 0); ctx.lineTo(W, H / 2); ctx.lineTo(0, H)
          break
      }
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'tuckTongue': {
      // Rectangular panel with two rounded bottom corners (tuck flap tongue shape)
      const r = Math.round((shape.roundFrac ?? 0.25) * W)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(W, 0)
      ctx.lineTo(W, H - r)
      ctx.arcTo(W, H, W - r, H, r)
      ctx.lineTo(r, H)
      ctx.arcTo(0, H, 0, H - r, r)
      ctx.closePath()
      ctx.fill()
      break
    }

    case 'archCut': {
      // Full rectangle with a semicircular arch die-cut from one edge (handle box)
      const archR = Math.round(shape.radiusFrac * W)
      const arcX = W / 2

      ctx.fillRect(0, 0, W, H)

      // Erase the arch using destination-out composite
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      if (shape.archEdge === 'top') {
        ctx.arc(arcX, 0, archR, 0, Math.PI, false)
      } else {
        ctx.arc(arcX, H, archR, Math.PI, 0, false)
      }
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
      break
    }

    case 'roundedCorners': {
      const r = Math.round((shape.radiusFrac ?? 0.12) * Math.min(W, H))
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(W - r, 0)
      ctx.arcTo(W, 0, W, r, r)
      ctx.lineTo(W, H - r)
      ctx.arcTo(W, H, W - r, H, r)
      ctx.lineTo(r, H)
      ctx.arcTo(0, H, 0, H - r, r)
      ctx.lineTo(0, r)
      ctx.arcTo(0, 0, r, 0, r)
      ctx.closePath()
      ctx.fill()
      break
    }
  }

  const tex = new THREE.CanvasTexture(ctx.canvas)
  tex.needsUpdate = true
  return tex
}
