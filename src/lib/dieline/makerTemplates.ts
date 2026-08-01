// New dieline templates using maker.js (Microsoft Garage) for parametric geometry.
// Each function returns DielineData matching our existing format.
// maker.js: https://maker.js.org/
import type { BoxParams } from '../types'
import type { DielineData } from './helpers'
import { MM_TO_PX, bleedRect } from './helpers'
import * as makerjs from 'makerjs'
import { boxFoldNode } from './box'

const s = MM_TO_PX  // px per mm

// Convert a maker.js model to an SVG path string (closed polyline from the model paths)
function modelToSvgPaths(model: makerjs.IModel): string[] {
  const svg = makerjs.exporter.toSVG(model, { units: makerjs.unitType.Millimeter })
  // Extract d= attributes from path elements
  const paths: string[] = []
  const re = /\sd="([^"]+)"/g
  let m
  while ((m = re.exec(svg)) !== null) {
    // Scale mm → px
    const scaled = m[1].replace(/(-?\d+\.?\d*)/g, (n) => (parseFloat(n) * s).toFixed(2))
    paths.push(scaled)
  }
  return paths
}

// ── Crash Lock Bottom ──────────────────────────────────────────────────────────
// Standard box body + automatic crash-lock bottom (4 interlocking panels)
// The lock base is more secure than auto-bottom and snaps into place flat.
export function computeCrashLockBottom(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const lockH = d * 0.6    // crash lock tab height
  const noseH = lockH * 0.4 // triangular nose
  const dustH = d * 0.45   // dust flap

  // Column x positions (left to right): depth | width | depth | width | glue
  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=3*d+w, x5=3*d+w+g
  // Row y positions (bottom to top): lock | body | top-flap
  const y0=0, y1=lockH, y2=lockH+h, y3=lockH+h+(d/2*0.85)

  // Main outline cut
  const cutPath = [
    // Bottom crash-lock row
    `M ${x1},${y0}`,
    `L ${x2},${y0}`,
    `L ${x2},${y1}`, `L ${x3},${y1-noseH}`, `L ${x3},${y1}`,
    `L ${x4},${y1}`,
    // Body sides (right)
    `L ${x4},${y2}`,
    // Top flap row
    `L ${x4},${y3}`, `L ${x3},${y3}`, `L ${x3},${y2}`,
    `L ${x2},${y3}`, `L ${x1},${y3}`, `L ${x1},${y2}`,
    `L ${x0},${y3}`, `L ${x0},${y2}`,
    // Body sides (left)
    `L ${x0},${y1}`, `L ${x1},${y1}`, `Z`,
    // Crash lock left wing (on left depth panel)
    `M ${x0},${y1}`,
    `L ${x0},${y0}`,
    `L ${x1},${y0}`, `Z`,
    // Crash lock right wing (on right depth panel)
    `M ${x3},${y1-noseH}`,
    `L ${x3},${y0}`,
    `L ${x4},${y0}`, `L ${x4},${y1}`, `Z`,
    // Glue tab
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    // Dust flaps top
    `M ${x0},${y2} L ${x0-dustH},${y2+dustH*0.5} L ${x0-dustH},${y3-dustH*0.5} L ${x0},${y3} Z`,
    `M ${x4},${y2} L ${x4+dustH},${y2+dustH*0.5} L ${x4+dustH},${y3-dustH*0.5} L ${x4},${y3} Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y0} L ${x2},${y3}`,
    `M ${x3},${y0} L ${x3},${y3}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const totalW = x5 + dustH, totalH = y3
  return {
    svgWidth: totalW + b*2, svgHeight: totalH + b*2,
    cutPath,
    foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w, h, label: 'Front' },
      { x: x2, y: y1, w: d, h, label: 'Right' },
      { x: x3, y: y1, w: d, h, label: 'Back' },
      { x: x0, y: y1, w: d, h, label: 'Left' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ── Window Box ────────────────────────────────────────────────────────────────
// Standard tuck-end box with a rectangular window cutout on the front face.
// The window is centered with a 10mm margin from each edge.
export function computeWindowBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const flapH = Math.min(d * 0.85, h * 0.22)
  const dustH = d * 0.45

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=3*d+w, x5=3*d+w+g
  const y0=0, y1=flapH, y2=flapH+h, y3=flapH+h+flapH

  const cut = [
    // Top tuck flap
    `M ${x1},${y0} L ${x2},${y0}`,
    `L ${x2},${y1}`, `L ${x3},${y1-dustH}`, `L ${x3},${y2+dustH}`, `L ${x2},${y2}`,
    `L ${x2},${y3}`, `L ${x1},${y3}`,
    `L ${x1},${y2}`, `L ${x0},${y2+dustH}`, `L ${x0},${y1-dustH}`, `L ${x1},${y1}`, `Z`,
    // Back panel + glue
    `M ${x3},${y0} L ${x4},${y0} L ${x4},${y3} L ${x3},${y3} Z`,
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
  ].join(' ')

  // Window cutout on front face (x1→x2, y1→y2) with 12mm margin
  const margin = 12 * s
  const wx0 = x1 + margin, wy0 = y1 + margin
  const wx1 = x2 - margin, wy1 = y2 - margin
  // Corner radius 4mm
  const cr = 4 * s
  const windowPath = [
    `M ${wx0+cr},${wy0}`,
    `L ${wx1-cr},${wy0}`,
    `Q ${wx1},${wy0} ${wx1},${wy0+cr}`,
    `L ${wx1},${wy1-cr}`,
    `Q ${wx1},${wy1} ${wx1-cr},${wy1}`,
    `L ${wx0+cr},${wy1}`,
    `Q ${wx0},${wy1} ${wx0},${wy1-cr}`,
    `L ${wx0},${wy0+cr}`,
    `Q ${wx0},${wy0} ${wx0+cr},${wy0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y0} L ${x2},${y3}`,
    `M ${x3},${y0} L ${x3},${y3}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const totalW = x5, totalH = y3
  return {
    svgWidth: totalW + b*2, svgHeight: totalH + b*2,
    cutPath: cut + ' ' + windowPath,
    foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w, h, label: 'Front' },
      { x: x2, y: y1, w: d, h, label: 'Right' },
      { x: x3, y: y1, w: d, h, label: 'Back' },
      { x: x0, y: y1, w: d, h, label: 'Left' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ── Sleeve + Insert ──────────────────────────────────────────────────────────
// Two-part packaging: outer sleeve (open both ends) + inner insert tray.
// Sleeve is thinner (depth D). Insert is placed inside the sleeve.
export function computeSleeveInsert(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  // Sleeve: 4 panels side by side, open at top and bottom (no flaps)
  const sx0=0, sx1=d, sx2=d+w, sx3=2*d+w, sx4=3*d+w, sx5=3*d+w+g
  const sy0=0, sy1=h

  const sleeveCut = [
    `M ${sx0},${sy0} L ${sx4},${sy0} L ${sx4},${sy1} L ${sx0},${sy1} Z`,
    `M ${sx4},${sy0} L ${sx5},${sy0} L ${sx5},${sy1} L ${sx4},${sy1} Z`,
  ].join(' ')

  const sleeveFolds = [
    `M ${sx1},${sy0} L ${sx1},${sy1}`,
    `M ${sx2},${sy0} L ${sx2},${sy1}`,
    `M ${sx3},${sy0} L ${sx3},${sy1}`,
  ]

  // Insert tray: small open-top tray placed below the sleeve with a gap
  const gap = 10 * s
  const insertW = w * 0.88   // slightly smaller to fit inside
  const insertD = d * 0.5
  const insertH = h * 0.55

  const ix0 = sx0, ix1 = insertD, ix2 = insertD + insertW, ix3 = 2*insertD + insertW, ix4 = 2*insertD + insertW + g
  const iy0 = sy1 + gap, iy1 = iy0 + insertD, iy2 = iy1 + insertH, iy3 = iy2 + insertD

  const insertCut = [
    `M ${ix1},${iy0} L ${ix2},${iy0} L ${ix2},${iy1}`,
    `L ${ix4},${iy1} L ${ix4},${iy2} L ${ix2},${iy2}`,
    `L ${ix2},${iy3} L ${ix1},${iy3} L ${ix1},${iy2}`,
    `L ${ix0},${iy2} L ${ix0},${iy1} L ${ix1},${iy1}`, `Z`,
  ].join(' ')

  const insertFolds = [
    `M ${ix1},${iy0} L ${ix1},${iy3}`,
    `M ${ix2},${iy0} L ${ix2},${iy3}`,
    `M ${ix0},${iy1} L ${ix4},${iy1}`,
    `M ${ix0},${iy2} L ${ix4},${iy2}`,
  ]

  const totalW = Math.max(sx5, ix4)
  const totalH = iy3

  return {
    svgWidth: totalW + b*2, svgHeight: totalH + b*2,
    cutPath: sleeveCut + ' ' + insertCut,
    foldLines: [...sleeveFolds, ...insertFolds],
    gluePaths: [
      `M ${sx4},${sy0} L ${sx5},${sy0} L ${sx5},${sy1} L ${sx4},${sy1} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: sx1, y: sy0, w, h, label: 'Front' },
      { x: sx2, y: sy0, w: d, h, label: 'Right' },
      { x: sx3, y: sy0, w: d, h, label: 'Back' },
      { x: ix1, y: iy1, w: insertW, h: insertH, label: 'Insert' },
    ],
  }
}
