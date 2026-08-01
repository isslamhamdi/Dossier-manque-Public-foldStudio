import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode } from './box'

// HSC — Half Slotted Container (FEFCO 0202)
// Open-top container: flat top edge, full 4-flap bottom with slits.
export function computeHSCBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D / 2) * s
  const cf = Math.min(d * 0.4, hf * 0.8, h * 0.2)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=x4+g
  const y0=0, y1=h, y2=h+hf

  // Flat top, full-width body rectangle + bottom 4-flap row (+ slit subpaths)
  const outer = [
    `M ${x0},${y0}`, `L ${x4},${y0}`,  // flat open top
    `L ${x4},${y1}`,                    // right body edge
    `L ${x5},${y1}`, `L ${x5},${y2}`,  // glue tab
    `L ${x4},${y2}`,
    `L ${x0},${y2}`,                    // bottom edge of all flaps
    `L ${x0},${y0}`, `Z`,
  ]
  const slits = [
    `M ${x1},${y1} L ${x1},${y2}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
  ]
  const cutPath = [...outer, ...slits].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y1}`,
    `M ${x2},${y0} L ${x2},${y1}`,
    `M ${x3},${y0} L ${x3},${y1}`,
    `M ${x4},${y0} L ${x4},${y1}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    // Corner marks on bottom flap corners
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`,
    `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`,
    `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`,
    `M ${x3-cf},${y1} L ${x3},${y1+cf}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`,
    `M ${x3},${y2-cf} L ${x3-cf},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    `M ${x0},${y1} L ${x0+cf},${y1} L ${x0},${y1+cf} Z`,
    `M ${x1},${y1} L ${x1-cf},${y1} L ${x1},${y1+cf} Z`,
    `M ${x0},${y2} L ${x0+cf},${y2} L ${x0},${y2-cf} Z`,
    `M ${x1},${y2} L ${x1-cf},${y2} L ${x1},${y2-cf} Z`,
    `M ${x2},${y1} L ${x2+cf},${y1} L ${x2},${y1+cf} Z`,
    `M ${x3},${y1} L ${x3-cf},${y1} L ${x3},${y1+cf} Z`,
    `M ${x2},${y2} L ${x2+cf},${y2} L ${x2},${y2-cf} Z`,
    `M ${x3},${y2} L ${x3-cf},${y2} L ${x3},${y2-cf} Z`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y2 + b*2,
    cutPath, foldLines, gluePaths,
    bleedPath: bleedRect(x5, y2, b),
    panels: [
      { x: x0, y: 0, w: d, h, label: 'Left'  },
      { x: x1, y: 0, w,    h, label: 'Front' },
      { x: x2, y: 0, w: d, h, label: 'Right' },
      { x: x3, y: 0, w,    h, label: 'Back'  },
      { x: x4, y: 0, w: g, h, label: 'Glue'  },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// OSC — Overlap Slotted Container (FEFCO 0204)
// Same layout as RSC but flaps extend past center by a fixed overlap.
export function computeOSCBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const overlap = Math.max(25, W * 0.1) * s  // min 25 mm overlap
  const hf  = (D / 2) * s + overlap
  const hfH = (D / 2) * s                    // inner half for reference lines
  const cf  = Math.min(d * 0.4, hfH * 0.8, h * 0.2)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=hf, y2=hf+h, y3=2*hf+h

  const cutPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`, `L ${x2},${y1}`,
    `L ${x5},${y1}`, `L ${x5},${y2}`, `L ${x4},${y2}`,
    `L ${x2},${y2}`, `L ${x2},${y3}`, `L ${x1},${y3}`,
    `L ${x1},${y2}`, `L ${x0},${y2}`, `L ${x0},${y1}`,
    `L ${x1},${y1}`, `L ${x1},${y0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    // Center reference line — where RSC flaps would meet
    `M ${x1},${hfH} L ${x2},${hfH}`,
    `M ${x1},${y2+hfH} L ${x2},${y2+hfH}`,
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`,
    `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`,
    `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`,
    `M ${x3-cf},${y1} L ${x3},${y1+cf}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`,
    `M ${x3},${y2-cf} L ${x3-cf},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    `M ${x0},${y1} L ${x0+cf},${y1} L ${x0},${y1+cf} Z`,
    `M ${x1},${y1} L ${x1-cf},${y1} L ${x1},${y1+cf} Z`,
    `M ${x0},${y2} L ${x0+cf},${y2} L ${x0},${y2-cf} Z`,
    `M ${x1},${y2} L ${x1-cf},${y2} L ${x1},${y2-cf} Z`,
    `M ${x2},${y1} L ${x2+cf},${y1} L ${x2},${y1+cf} Z`,
    `M ${x3},${y1} L ${x3-cf},${y1} L ${x3},${y1+cf} Z`,
    `M ${x2},${y2} L ${x2+cf},${y2} L ${x2},${y2-cf} Z`,
    `M ${x3},${y2} L ${x3-cf},${y2} L ${x3},${y2-cf} Z`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines, gluePaths,
    bleedPath: bleedRect(x5, y3, b),
    panels: [
      { x: x0, y: y1, w: d, h, label: 'Left' },
      { x: x1, y: y1, w, h, label: 'Front' },
      { x: x2, y: y1, w: d, h, label: 'Right' },
      { x: x3, y: y1, w, h, label: 'Back' },
      { x: x4, y: y1, w: g, h, label: 'Glue' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// FOL — Full Overlap Slotted Container (FEFCO 0205)
// Outer (W-panel) flaps equal full depth D — they completely cover the top/bottom.
export function computeFOLBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf    = D * s           // full-depth flap (outer W panels)
  const hfHalf = (D / 2) * s   // inner D-panel reference
  const cf = Math.min(d * 0.4, hfHalf * 0.8, h * 0.2)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=hf, y2=hf+h, y3=2*hf+h

  const cutPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`, `L ${x2},${y1}`,
    `L ${x5},${y1}`, `L ${x5},${y2}`, `L ${x4},${y2}`,
    `L ${x2},${y2}`, `L ${x2},${y3}`, `L ${x1},${y3}`,
    `L ${x1},${y2}`, `L ${x0},${y2}`, `L ${x0},${y1}`,
    `L ${x1},${y1}`, `L ${x1},${y0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    // D/2 reference — where inner flaps end beneath the outer flap
    `M ${x1},${hfHalf} L ${x2},${hfHalf}`,
    `M ${x1},${y2+hfHalf} L ${x2},${y2+hfHalf}`,
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`,
    `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`,
    `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`,
    `M ${x3-cf},${y1} L ${x3},${y1+cf}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`,
    `M ${x3},${y2-cf} L ${x3-cf},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    `M ${x0},${y1} L ${x0+cf},${y1} L ${x0},${y1+cf} Z`,
    `M ${x1},${y1} L ${x1-cf},${y1} L ${x1},${y1+cf} Z`,
    `M ${x0},${y2} L ${x0+cf},${y2} L ${x0},${y2-cf} Z`,
    `M ${x1},${y2} L ${x1-cf},${y2} L ${x1},${y2-cf} Z`,
    `M ${x2},${y1} L ${x2+cf},${y1} L ${x2},${y1+cf} Z`,
    `M ${x3},${y1} L ${x3-cf},${y1} L ${x3},${y1+cf} Z`,
    `M ${x2},${y2} L ${x2+cf},${y2} L ${x2},${y2-cf} Z`,
    `M ${x3},${y2} L ${x3-cf},${y2} L ${x3},${y2-cf} Z`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines, gluePaths,
    bleedPath: bleedRect(x5, y3, b),
    panels: [
      { x: x0, y: y1, w: d, h, label: 'Left' },
      { x: x1, y: y1, w, h, label: 'Front' },
      { x: x2, y: y1, w: d, h, label: 'Right' },
      { x: x3, y: y1, w, h, label: 'Back' },
      { x: x4, y: y1, w: g, h, label: 'Glue' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}
