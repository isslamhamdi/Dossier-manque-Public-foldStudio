import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode } from './box'

// FEFCO 0201 — Regular Slotted Container (full 4-flap dieline)
// All 4 panel pairs of flaps visible, with slits separating adjacent flaps.
// Geometry: outer rectangle + slits at x1/x2/x3 top and bottom.
// Ref: PackagingWorkbench fefco0201_dieline.py (LGPL-2.1).
export function computeRSCFull(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const hf = (D / 2) * s   // flap height = D/2

  // Columns: [Left D][Front W][Right D][Back W][Glue]
  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  // Rows: [Top flaps][Body][Bottom flaps]
  const y0 = 0, y1 = hf, y2 = hf + h, y3 = 2 * hf + h

  // Outer boundary: full rectangle x0..x4 (no glue flap flaps) + glue tab strip
  // Slits added as separate subpaths within cutPath (SVG multi-subpath)
  const outer = [
    `M ${x0},${y0}`, `L ${x4},${y0}`,  // top of all flaps (left D to back W)
    `L ${x4},${y1}`,                    // right edge of back W down to body
    `L ${x5},${y1}`, `L ${x5},${y2}`,  // glue tab right side
    `L ${x4},${y2}`,                    // back to body bottom fold
    `L ${x4},${y3}`,                    // right edge of back W flap bottom
    `L ${x0},${y3}`,                    // bottom of all flaps
    `L ${x0},${y0}`, `Z`,              // left edge up, close
  ]

  // Slits (cut lines between adjacent flap pairs — top and bottom)
  const slits = [
    `M ${x1},${y0} L ${x1},${y1}`,   // top slit: left D | front W
    `M ${x2},${y0} L ${x2},${y1}`,   // top slit: front W | right D
    `M ${x3},${y0} L ${x3},${y1}`,   // top slit: right D | back W
    `M ${x1},${y2} L ${x1},${y3}`,   // bottom slit
    `M ${x2},${y2} L ${x2},${y3}`,
    `M ${x3},${y2} L ${x3},${y3}`,
  ]

  const cutPath = [...outer, ...slits].join(' ')

  const foldLines = [
    // Vertical body panel folds
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    // Horizontal body/flap folds (full width)
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const gluePaths = [
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
  ]

  return {
    svgWidth:  x5 + b * 2,
    svgHeight: y3 + b * 2,
    cutPath,
    foldLines,
    gluePaths,
    bleedPath: bleedRect(x5, y3, b),
    panels: [
      { x: x0, y: y1, w: d, h, label: 'Left'  },
      { x: x1, y: y1, w,    h, label: 'Front' },
      { x: x2, y: y1, w: d, h, label: 'Right' },
      { x: x3, y: y1, w,    h, label: 'Back'  },
      { x: x4, y: y1, w: g, h, label: 'Glue'  },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}
