import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode } from './box'

// Display Box: open top, with front panel shorter
export function computeDisplay(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D/2)*s

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=hf, y2=hf+h, y3=2*hf+h

  const cf = Math.min(d*0.4, hf*0.8, h*0.2)

  const cutPath = [
    `M ${x0},${y1}`,
    `L ${x5},${y1}`,
    `L ${x5},${y2}`,
    `L ${x4},${y2}`,
    `L ${x2},${y2}`,
    `L ${x2},${y3}`,
    `L ${x1},${y3}`,
    `L ${x1},${y2}`,
    `L ${x0},${y2}`,
    `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y1} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`,
    `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`,
    `M ${x3},${y2-cf} L ${x3-cf},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
  ]

  // suppress unused y0
  void y0

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

// Seal-End Box: wide top+bottom flaps covering full width
export function computeSealEnd(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const sf = d * 0.6

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=sf, y2=sf+h, y3=sf+h+sf

  const cutPath = [
    `M ${x1-d*0.3},${y0}`,
    `L ${x3+d*0.3},${y0}`,
    `L ${x3+d*0.3},${y1}`,
    `L ${x5},${y1}`,
    `L ${x5},${y2}`,
    `L ${x3+d*0.3},${y2}`,
    `L ${x3+d*0.3},${y3}`,
    `L ${x1-d*0.3},${y3}`,
    `L ${x1-d*0.3},${y2}`,
    `L ${x0},${y2}`,
    `L ${x0},${y1}`,
    `L ${x1-d*0.3},${y1}`,
    `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
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

// Snap-Lock Tray: open top, snap-lock tabs on bottom
export function computeSnapLock(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const ef = d * 0.5
  const sw = w * 0.28

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y1=ef, y2=ef+h, y3=2*ef+h

  const cx = (x1+x2)/2
  const cutPath = [
    `M ${x0},${y1}`, `L ${x5},${y1}`,
    `L ${x5},${y2}`, `L ${x4},${y2}`,
    `L ${x2},${y2}`,
    `L ${x2},${y3-ef*0.3}`,
    `L ${cx+sw},${y3-ef*0.3}`, `L ${cx+sw},${y3}`,
    `L ${cx-sw},${y3}`, `L ${cx-sw},${y3-ef*0.3}`,
    `L ${x1},${y3-ef*0.3}`,
    `L ${x1},${y2}`,
    `L ${x0},${y2}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y1} L ${x1},${y2}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    `M ${x1},${y2} L ${x2},${y2+ef*0.3}`,
    `M ${x2},${y2} L ${x1},${y2+ef*0.3}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
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
