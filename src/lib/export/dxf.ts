// DXF export for Fold Studio dielines using dxf-writer
// Each layer (cut, fold, bleed, glue) is on its own DXF layer for imprimeurs.
import type { DielineData } from '@/lib/dieline'

const MM_TO_PX = 3.7795275591

// dxf-writer is a CommonJS module
/* eslint-disable */
const Drawing = require('dxf-writer') as any
/* eslint-enable */

// Convert SVG path "d" string → array of [x, y] polyline points (mm).
// Handles M, L, Z commands only (our dielines never emit curves on cut/fold paths).
function svgPathToPolylines(d: string, scaleMmPerPx: number): [number, number][][] {
  const polylines: [number, number][][] = []
  let current: [number, number][] = []
  let cx = 0, cy = 0

  const tokens = d.trim().replace(/([MLZz])/g, ' $1 ').split(/[\s,]+/).filter(Boolean)
  let i = 0
  while (i < tokens.length) {
    const cmd = tokens[i]
    if (cmd === 'M' || cmd === 'm') {
      if (current.length > 1) polylines.push(current)
      current = []
      i++
      cx = parseFloat(tokens[i]) * scaleMmPerPx; i++
      cy = parseFloat(tokens[i]) * scaleMmPerPx; i++
      current.push([cx, cy])
    } else if (cmd === 'L' || cmd === 'l') {
      i++
      cx = parseFloat(tokens[i]) * scaleMmPerPx; i++
      cy = parseFloat(tokens[i]) * scaleMmPerPx; i++
      current.push([cx, cy])
    } else if (cmd === 'Z' || cmd === 'z') {
      if (current.length > 0) {
        current.push([...current[0]] as [number, number])  // close
        polylines.push(current)
        current = []
      }
      i++
    } else {
      // Treat consecutive numbers as implicit L after M
      const x = parseFloat(cmd)
      if (!isNaN(x)) {
        i++
        const y = parseFloat(tokens[i]) * scaleMmPerPx; i++
        cx = x * scaleMmPerPx
        cy = y
        current.push([cx, cy])
      } else {
        i++
      }
    }
  }
  if (current.length > 1) polylines.push(current)
  return polylines
}

// DXF coordinates: Y is flipped (DXF uses bottom-left origin, SVG uses top-left)
function flipY(pts: [number, number][], totalH: number): [number, number][] {
  return pts.map(([x, y]) => [x, totalH - y])
}

export function dielineToDxf(dieline: DielineData): string {
  // Scale: our dieline coords are in px (MM_TO_PX px per mm). Convert to mm.
  const scale = 1 / MM_TO_PX
  const totalH = dieline.svgHeight * scale  // for Y-flip

  const d = new Drawing()
  d.setUnits('Millimeters')

  // Layers: CUT (magenta), FOLD (blue), BLEED (orange), GLUE (gray)
  d.addLayer('CUT',   Drawing.ACI.MAGENTA, 'CONTINUOUS')
  d.addLayer('FOLD',  Drawing.ACI.BLUE,    'DASHED')
  d.addLayer('BLEED', Drawing.ACI.YELLOW,  'DASHED')
  d.addLayer('GLUE',  Drawing.ACI.CYAN,    'CONTINUOUS')

  // Draw cut path
  d.setActiveLayer('CUT')
  const cutPolylines = svgPathToPolylines(dieline.cutPath, scale)
  for (const pts of cutPolylines) {
    const flipped = flipY(pts, totalH)
    d.drawPolyline(flipped, false)
  }

  // Draw fold lines
  d.setActiveLayer('FOLD')
  for (const foldPath of dieline.foldLines) {
    const polys = svgPathToPolylines(foldPath, scale)
    for (const pts of polys) {
      const flipped = flipY(pts, totalH)
      if (flipped.length === 2) {
        d.drawLine(flipped[0][0], flipped[0][1], flipped[1][0], flipped[1][1])
      } else {
        d.drawPolyline(flipped, false)
      }
    }
  }

  // Draw bleed path
  if (dieline.bleedPath) {
    d.setActiveLayer('BLEED')
    const bleedPolys = svgPathToPolylines(dieline.bleedPath, scale)
    for (const pts of bleedPolys) {
      d.drawPolyline(flipY(pts, totalH), false)
    }
  }

  // Draw glue paths
  d.setActiveLayer('GLUE')
  for (const gluePath of dieline.gluePaths ?? []) {
    const polys = svgPathToPolylines(gluePath, scale)
    for (const pts of polys) {
      d.drawPolyline(flipY(pts, totalH), false)
    }
  }

  return d.toDxfString()
}

export function downloadDxf(dieline: DielineData, filename = 'fold-studio-dieline.dxf') {
  const dxfStr = dielineToDxf(dieline)
  const blob = new Blob([dxfStr], { type: 'application/dxf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
