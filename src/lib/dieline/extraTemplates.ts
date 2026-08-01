import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode, trayFoldNode } from './box'

// Envelope — classic pocket/business envelope dieline.
// Front panel (W×H) + triangular seal flap (top) + trapezoidal side flaps + triangular glue flap (bottom).
export function computeEnvelope(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, b = B * s
  const sf = Math.min(h * 0.38, 50 * s)   // seal flap height
  const bf = Math.min(h * 0.22, 30 * s)   // bottom glue flap height
  const lf = Math.min(w * 0.45, 35 * s)   // side flap width
  const tp = lf * 0.28                     // taper on all flaps (trapezoid narrowing)

  // Coordinate origin: top-left of the side-flap area
  // Front panel: x from lf to lf+w (cx .. cx2), y from sf to sf+h (y1 .. y2)
  const cx = lf, cx2 = lf + w
  const y0 = 0, y1 = sf, y2 = sf + h, y3 = sf + h + bf
  const totalW = lf + w + lf

  // Outer cutPath — clockwise from BL of seal flap
  const cutPath = [
    `M ${cx - tp},${y1}`,          // BL of seal flap (front top-left, inset by tp)
    `L ${cx + w / 2},${y0}`,       // seal flap tip (center top)
    `L ${cx2 + tp},${y1}`,         // BR of seal flap
    `L ${cx2},${y1}`,              // front panel top-right corner
    `L ${cx2 + lf},${y1 + tp}`,   // top-right of right side flap
    `L ${cx2 + lf},${y2 - tp}`,   // bottom-right of right side flap
    `L ${cx2},${y2}`,              // front panel bottom-right corner
    `L ${cx2 + tp},${y2}`,        // bottom flap top-right (inset)
    `L ${cx + w / 2},${y3}`,      // bottom flap tip
    `L ${cx - tp},${y2}`,         // bottom flap top-left
    `L ${cx},${y2}`,              // front panel bottom-left corner
    `L ${cx - lf},${y2 - tp}`,   // bottom-left of left side flap
    `L ${cx - lf},${y1 + tp}`,   // top-left of left side flap
    `L ${cx},${y1}`,              // front panel top-left corner
    `Z`,
  ].join(' ')

  const foldLines = [
    `M ${cx},${y1} L ${cx2},${y1}`,  // seal flap fold
    `M ${cx},${y2} L ${cx2},${y2}`,  // bottom flap fold
    `M ${cx},${y1} L ${cx},${y2}`,   // left side fold
    `M ${cx2},${y1} L ${cx2},${y2}`, // right side fold
  ]

  const gluePaths = [
    `M ${cx - tp},${y2} L ${cx2 + tp},${y2} L ${cx + w / 2},${y3} Z`,
  ]

  const PI2 = Math.PI / 2
  return {
    svgWidth:  totalW + b * 2,
    svgHeight: y3 + b * 2,
    cutPath,
    foldLines,
    gluePaths,
    bleedPath: bleedRect(totalW, y3, b),
    panels: [
      { x: cx, y: y1, w, h, label: 'Front' },
    ],
    foldNode: {
      id: 'Front', face: 'front', w: W, h: H,
      worldPos: [0, 0, 0],
      children: [
        { id: 'SealFlap',   face: 'top',    w: W, h: sf / MM_TO_PX,
          hinge: { pivotPos: [0, H/2, 0], panelPos: [0, sf/(2*MM_TO_PX), 0], axis: [1,0,0], angle: -PI2, seq: [0.80, 1.00], easing: 'back' as const },
          children: [] },
        { id: 'BottomFlap', face: 'bottom', w: W, h: bf / MM_TO_PX,
          hinge: { pivotPos: [0, -H/2, 0], panelPos: [0, -bf/(2*MM_TO_PX), 0], axis: [1,0,0], angle: PI2, seq: [0.00, 0.20] },
          children: [] },
        { id: 'LeftFlap',   face: 'left',   w: lf / MM_TO_PX, h: H,
          hinge: { pivotPos: [-W/2, 0, 0], panelPos: [-lf/(2*MM_TO_PX), 0, 0], axis: [0,1,0], angle: -PI2, seq: [0.10, 0.40] },
          children: [] },
        { id: 'RightFlap',  face: 'right',  w: lf / MM_TO_PX, h: H,
          hinge: { pivotPos: [W/2, 0, 0], panelPos: [lf/(2*MM_TO_PX), 0, 0], axis: [0,1,0], angle: PI2, seq: [0.10, 0.40] },
          children: [] },
      ],
    },
  }
}

// Shallow Box — simple cross tray with square corner cuts (no corner flaps).
// Bottom panel (D×W) + 4 walls of height H. Corners are open square notches.
export function computeShallowBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  // Cross shape: middle row H+D+H wide, top/bottom rows D wide centered
  const x0=0, x1=h, x2=h+d, x3=2*h+d
  const y0=0, y1=h, y2=h+w, y3=2*h+w

  // 12-vertex cross with square (90°) corners — no corner flaps protruding
  const cutPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`,  // top wall top edge
    `L ${x2},${y1}`,                    // top-right corner (square cut)
    `L ${x3},${y1}`,                    // right wall top edge
    `L ${x3},${y2}`,                    // right wall bottom edge
    `L ${x2},${y2}`,                    // bottom-right corner (square cut)
    `L ${x2},${y3}`, `L ${x1},${y3}`, // bottom wall bottom edge
    `L ${x1},${y2}`,                    // bottom-left corner
    `L ${x0},${y2}`,                    // left wall bottom edge
    `L ${x0},${y1}`,                    // left wall top edge
    `L ${x1},${y1}`,                    // top-left corner
    `L ${x1},${y0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y1} L ${x2},${y1}`,   // bottom ↔ top wall
    `M ${x1},${y2} L ${x2},${y2}`,   // bottom ↔ bottom wall
    `M ${x1},${y1} L ${x1},${y2}`,   // bottom ↔ left wall
    `M ${x2},${y1} L ${x2},${y2}`,   // bottom ↔ right wall
  ]

  return {
    svgWidth:  x3 + b * 2,
    svgHeight: y3 + b * 2,
    cutPath,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(x3, y3, b),
    panels: [
      { x: x1, y: y1, w: d, h: w, label: 'Bottom' },
      { x: x1, y: y0, w: d, h,    label: 'North'  },
      { x: x1, y: y2, w: d, h,    label: 'South'  },
      { x: x0, y: y1, w: h, h: w, label: 'West'   },
      { x: x2, y: y1, w: h, h: w, label: 'East'   },
    ],
    foldNode: trayFoldNode(W, D, H),
  }
}
