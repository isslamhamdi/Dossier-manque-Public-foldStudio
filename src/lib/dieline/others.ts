import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode } from './box'

// Mailer Box (Full-Overlap RSC / FORC): flaps = full depth, seal score lines
export function computeMailer(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = d                              // full-depth flaps (vs D/2 for standard)
  const cf = Math.min(d * 0.32, h * 0.22)  // corner chamfer
  const sc = d * 0.38                       // seal score from fold edge

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
    `M ${x1},${y0+sc} L ${x2},${y0+sc}`,
    `M ${x1},${y3-sc} L ${x2},${y3-sc}`,
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`, `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`, `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`, `M ${x3-cf},${y1} L ${x3},${y1+cf}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`, `M ${x3},${y2-cf} L ${x3-cf},${y2}`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
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

// Flip-Top Box: hinged lid attached above the Back panel column
export function computeFlipTop(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D / 2) * s
  const lid = d * 0.92   // lid depth
  // Shift all y-coords so content starts at y=0
  const yOff = Math.max(0, lid - hf)
  const cf = Math.min(d * 0.4, hf * 0.8, h * 0.2)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0 = yOff               // top of front flap
  const y1 = yOff + hf          // top of body panels
  const y2 = y1 + h             // bottom of body panels
  const y3 = y2 + hf            // bottom of bottom flaps
  const yLid = y1 - lid         // lid top (at or above y0)

  const cutPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`,
    `L ${x2},${y1}`, `L ${x3},${y1}`,
    `L ${x3},${yLid}`, `L ${x4},${yLid}`,
    `L ${x4},${y1}`, `L ${x5},${y1}`,
    `L ${x5},${y2}`, `L ${x4},${y2}`,
    `L ${x2},${y2}`, `L ${x2},${y3}`,
    `L ${x1},${y3}`, `L ${x1},${y2}`,
    `L ${x0},${y2}`, `L ${x0},${y1}`,
    `L ${x1},${y1}`, `L ${x1},${y0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    `M ${x3},${y1} L ${x4},${y1}`,
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`, `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`, `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`,
    `M ${x2},${y2-cf} L ${x2+cf},${y2}`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
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

// Gable Box (Milk-Carton style): triangular peaked top panels
export function computeGable(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D / 2) * s
  const gf = d * 1.0   // gable height (triangular peak height)
  const bf = hf        // bottom flap height (same as half depth)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y1=gf, y2=gf+h, y3=y2+bf

  // Peaks: front (x1..x2) and back (x3..x4) panels have triangular tops
  const fpx = (x1 + x2) / 2  // front peak apex x
  const bpx = (x3 + x4) / 2  // back peak apex x

  const cutPath = [
    // Start at bottom-left of front peak
    `M ${x1},${y1}`,
    `L ${fpx},${0}`,        // front peak apex
    `L ${x2},${y1}`,        // top-right of right panel
    `L ${x3},${y1}`,        // right panel flat top
    `L ${bpx},${0}`,        // back peak apex
    `L ${x4},${y1}`,        // top of glue area
    `L ${x5},${y1}`,
    `L ${x5},${y2}`,        // down right edge
    `L ${x4},${y2}`,
    `L ${x2},${y2}`,
    `L ${x2},${y3}`,        // front bottom flap
    `L ${x1},${y3}`,
    `L ${x1},${y2}`,
    `L ${x0},${y2}`,
    `L ${x0},${y1}`,        // up left edge
    `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y1} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    // Gable score lines (diagonal from panel corners to peak)
    `M ${x1},${y1} L ${fpx},${0}`,
    `M ${x2},${y1} L ${fpx},${0}`,
    `M ${x3},${y1} L ${bpx},${0}`,
    `M ${x4},${y1} L ${bpx},${0}`,
    // Ridge fold (horizontal across the gable)
    `M ${x1},${gf*0.5} L ${x2},${gf*0.5}`,
    `M ${x3},${gf*0.5} L ${x4},${gf*0.5}`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
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

// Auto-Bottom Box (Crash-Lock): standard top, interlocking 4-flap bottom
export function computeAutoBottom(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D / 2) * s  // top flap (same as standard)
  const bf = d             // bottom flap = full depth (crash-lock)
  const cf = Math.min(d * 0.4, hf * 0.8, h * 0.2)

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=hf, y2=hf+h, y3=hf+h+bf

  // Crash-lock bottom: front/back have full-depth flaps with diagonal locks
  // Left/right have shorter locking flaps
  const lbf = bf * 0.55    // side bottom flap height
  const lockW = w * 0.28   // lock tab width
  const lockH = bf * 0.35  // lock tab height

  // Bottom right side (x2..x3 bottom region) — shorter locking flap
  // Main left bottom (x0..x1) and right-back bottom (x3..x4) are shorter

  // cutPath: standard top, crash-lock bottom
  // Top part: same as standard box cross shape at y0..y1
  // Bottom: front (x1..x2) has full bf, back (x3..x4) has full bf, sides shorter
  const cutPath = [
    // Top: standard front top flap + standard shape
    `M ${x1},${y0}`, `L ${x2},${y0}`, `L ${x2},${y1}`,
    `L ${x5},${y1}`, `L ${x5},${y2}`,
    // Bottom-right side panel (shorter locking flap)
    `L ${x5},${y2+lbf}`, `L ${x4},${y2+lbf}`,
    // Back bottom full flap with lock tabs
    `L ${x4},${y2+bf}`,
    `L ${x3+lockW},${y2+bf}`, `L ${x3+lockW},${y2+bf-lockH}`,
    `L ${x3},${y2+bf-lockH}`,
    `L ${x3},${y2+lbf}`, `L ${x2},${y2+lbf}`,
    // Front bottom full flap with lock tabs
    `L ${x2},${y2+bf}`,
    `L ${x2-lockW},${y2+bf}`, `L ${x2-lockW},${y2+bf-lockH}`,
    `L ${x1},${y2+bf-lockH}`,
    `L ${x1},${y2+lbf}`,
    // Left bottom shorter locking flap
    `L ${x0},${y2+lbf}`, `L ${x0},${y2}`,
    `L ${x0},${y1}`,
    `L ${x1},${y1}`, `L ${x1},${y0}`, `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y2}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    // Crash-lock bottom fold lines
    `M ${x0},${y2+lbf} L ${x5},${y2+lbf}`,
    `M ${x1},${y2+bf-lockH} L ${x2},${y2+bf-lockH}`,
    `M ${x3},${y2+bf-lockH} L ${x4},${y2+bf-lockH}`,
    // Top dust flap diagonals
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`, `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x2+cf},${y1} L ${x2},${y1+cf}`, `M ${x3-cf},${y1} L ${x3},${y1+cf}`,
  ]

  return {
    svgWidth: x5 + b*2, svgHeight: y3 + b*2,
    cutPath, foldLines,
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
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
