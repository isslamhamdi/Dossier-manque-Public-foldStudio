'use client'

import { useState, useEffect } from 'react'
import * as THREE from 'three'
import type { ImageLayer, BoxParams, TemplateType } from '../../lib/types'
import { computeDieline } from '../../lib/dieline'

export const MM_TO_PX = 3.7795275591

export const FACE_LIST = ['front', 'back', 'left', 'right', 'top', 'bottom'] as const
export type FaceName = typeof FACE_LIST[number]

export const PANEL_LABEL_TO_FACE: Record<string, string> = {
  Front: 'front', Back: 'back', Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom',
}

// Composite ALL visible layers for a face onto one canvas and return a CanvasTexture.
// Layers are drawn in array order (bottom → top) with their opacity.
export function buildCompositeFaceTexture(
  layers: ImageLayer[],
  panel: { x: number; y: number; w: number; h: number },
  fillColor = '#ffffff',
  res = 4
): Promise<THREE.CanvasTexture> {
  const RES = res
  const cw = Math.max(1, Math.round(panel.w * RES))
  const ch = Math.max(1, Math.round(panel.h * RES))
  const cv = document.createElement('canvas')
  cv.width = cw; cv.height = ch
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = fillColor
  ctx.fillRect(0, 0, cw, ch)

  // Load all layer images first, then draw in order
  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise(res => {
      const img = new Image()
      img.onload = () => res(img)
      img.onerror = () => res(img)   // resolve even on error — just skip blank
      img.src = src
    })

  return Promise.all(layers.map(l => loadImage(l.src))).then(imgs => {
    layers.forEach((layer, i) => {
      const img = imgs[i]
      if (!img.naturalWidth) return   // failed to load
      const opacity = layer.opacity ?? 1
      if (opacity <= 0) return
      ctx.save()
      ctx.globalAlpha = opacity

      const dx = (layer.x * MM_TO_PX - panel.x) * RES
      const dy = (layer.y * MM_TO_PX - panel.y) * RES
      const dw = layer.width * layer.scale * MM_TO_PX * RES
      const dh = layer.height * layer.scale * MM_TO_PX * RES

      if (layer.rotation) {
        // Rotate around the layer center
        const cx = dx + dw / 2
        const cy = dy + dh / 2
        ctx.translate(cx, cy)
        ctx.rotate(layer.rotation * Math.PI / 180)
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      } else {
        ctx.drawImage(img, dx, dy, dw, dh)
      }
      ctx.restore()
    })

    const tex = new THREE.CanvasTexture(cv)
    tex.minFilter = THREE.LinearFilter
    tex.generateMipmaps = false
    tex.needsUpdate = true
    return tex
  })
}

// Legacy single-layer helper kept for backward compat
export function buildCanvasTexture(
  layer: ImageLayer,
  panel: { x: number; y: number; w: number; h: number },
  fillColor = '#ffffff'
): Promise<THREE.CanvasTexture> {
  return buildCompositeFaceTexture([layer], panel, fillColor)
}

export function useFaceTextures(
  imageLayers: ImageLayer[] | undefined,
  params?: BoxParams,
  activeTemplate?: TemplateType,
  exteriorColor?: string
): (THREE.Texture | null)[] {
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>(() => Array(6).fill(null))

  useEffect(() => {
    if (!imageLayers?.length) { setTextures(Array(6).fill(null)); return }

    // Build panel → UV bounds map from the current dieline
    const panelMap = new Map<string, { x: number; y: number; w: number; h: number }>()
    if (params && activeTemplate) {
      for (const panel of computeDieline(params, activeTemplate).panels) {
        const key = PANEL_LABEL_TO_FACE[panel.label]
        if (key) panelMap.set(key, panel)
      }
    }

    let cancelled = false
    const loaded: (THREE.Texture | null)[] = []

    Promise.all(
      FACE_LIST.map(async (face) => {
        const panel = panelMap.get(face)

        // Collect ALL visible layers for this face (in z-order)
        const faceLayers = imageLayers.filter(l => {
          if (!l.visible) return false
          if (l.faceAssignment === face) return true
          if (l.faceAssignment !== 'auto') return false
          // 'auto': check if layer center falls within this panel
          if (!panel) return face === 'front'
          const cx = (l.x + (l.width * l.scale) / 2) * MM_TO_PX
          const cy = (l.y + (l.height * l.scale) / 2) * MM_TO_PX
          return cx >= panel.x && cx <= panel.x + panel.w && cy >= panel.y && cy <= panel.y + panel.h
        })
        if (!faceLayers.length) return null
        if (panel) {
          return buildCompositeFaceTexture(faceLayers, panel, exteriorColor ?? '#ffffff')
        }

        // Fallback: load first layer image directly (no panel coords)
        const first = faceLayers[0]
        if (!first?.src) return null
        return new Promise<THREE.Texture>(res => new THREE.TextureLoader().load(first.src, res))
      })
    ).then(result => {
      result.forEach(t => loaded.push(t))
      if (!cancelled) setTextures(result)
      else result.forEach(t => t?.dispose())
    })

    return () => {
      cancelled = true
      loaded.forEach(t => t?.dispose())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageLayers, params, activeTemplate, exteriorColor])

  return textures
}
