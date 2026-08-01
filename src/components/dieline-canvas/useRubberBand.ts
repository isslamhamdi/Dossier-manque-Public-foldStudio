'use client'

/**
 * Rubber-band (drag-to-select) for image layers in the 2D patron canvas.
 * Implements the core Konva multi-select feature without the library.
 * Press Shift and drag to draw a selection rectangle — all layers
 * whose center falls inside get added to selectedLayerIds.
 */

import { useState, useRef, useCallback } from 'react'
import type { ImageLayer } from '@/lib/types'

export interface RubberBandRect {
  x: number; y: number; w: number; h: number
}

export function useRubberBand() {
  const [rubberBand, setRubberBand] = useState<RubberBandRect | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const isActiveRef = useRef(false)

  const startRubberBand = useCallback((x: number, y: number) => {
    startRef.current = { x, y }
    isActiveRef.current = true
    setRubberBand({ x, y, w: 0, h: 0 })
  }, [])

  const updateRubberBand = useCallback((x: number, y: number): RubberBandRect | null => {
    if (!isActiveRef.current || !startRef.current) return null
    const { x: sx, y: sy } = startRef.current
    const rect: RubberBandRect = {
      x: Math.min(sx, x), y: Math.min(sy, y),
      w: Math.abs(x - sx), h: Math.abs(y - sy),
    }
    setRubberBand(rect)
    return rect
  }, [])

  const endRubberBand = useCallback((
    layers: ImageLayer[],
    zoom: number,
    pan: { x: number; y: number },
    MM_TO_PX: number,
  ): string[] => {
    if (!isActiveRef.current || !rubberBand) return []
    isActiveRef.current = false
    startRef.current = null
    setRubberBand(null)

    const { x: rx, y: ry, w: rw, h: rh } = rubberBand

    // Convert canvas px → SVG mm for hit test
    const svgToCanvas = (mmX: number, mmY: number) => ({
      cx: mmX * MM_TO_PX * zoom + pan.x,
      cy: mmY * MM_TO_PX * zoom + pan.y,
    })

    return layers
      .filter(layer => {
        // Center of layer in canvas pixels
        const cx_mm = layer.x + (layer.width * layer.scale) / 2
        const cy_mm = layer.y + (layer.height * layer.scale) / 2
        const { cx, cy } = svgToCanvas(cx_mm, cy_mm)
        return cx >= rx && cx <= rx + rw && cy >= ry && cy <= ry + rh
      })
      .map(l => l.id)
  }, [rubberBand])

  return { rubberBand, startRubberBand, updateRubberBand, endRubberBand, isActive: isActiveRef }
}
