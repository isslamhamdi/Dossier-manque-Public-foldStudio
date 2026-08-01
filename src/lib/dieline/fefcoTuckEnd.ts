import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode } from './box'

// FEFCO 0713 — Tuck-End Carton
// Body strip: D | W | D | W | Glue. D-panels carry short dust flaps; last W-panel carries
// cover + tuck tongue (both top and bottom, mirrored). Ref: PackagingWorkbench (LGPL-2.1).
export function computeFEFCO0713(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, thickness: T, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const dust  = Math.max(3 * T * s, 8 * s)   // dust flap height (short, D-panels only)
  const cover = w                             // cover flap height = W (full width)
  const tuck  = Math.max(0.6 * d, 12 * s)    // tuck tongue height, min 12 mm

  // Columns: [D-panel][W-panel][D-panel][W-panel][Glue]
  const x0=0, xa=d, xb=d+w, xc=2*d+w, xd=2*d+2*w, xe=xd+g
  // Vertical origin: top of blank is max(dust, cover+tuck) above body
  const topH = Math.max(dust, cover + tuck)
  const y1 = topH          // top body fold
  const y2 = topH + h      // bottom body fold
  const y3 = topH + h + Math.max(dust, cover + tuck)

  // Outer cut path — clockwise boundary.
  // Top section: left D-dust → bare W → right D-dust → cover+tuck on last W
  // Bottom section: mirrored.
  const cutPath = [
    `M ${x0},${y1 - dust}`,
    // ── TOP (left → right) ────────────────────────────────────────────────────
    `L ${xa},${y1 - dust}`,                   // top of left D dust flap
    `L ${xa},${y1}`,                           // slit down to body fold (D | W boundary)
    `L ${xb},${y1}`,                           // across bare W top (col1 has no flap)
    `L ${xb},${y1 - dust}`,                   // up to right D dust flap
    `L ${xc},${y1 - dust}`,                   // top of right D dust flap
    `L ${xc},${y1 - cover - tuck}`,          // up left edge of cover+tuck (col3)
    `L ${xd},${y1 - cover - tuck}`,          // across tuck tongue top
    `L ${xd},${y1 - cover}`,                 // tuck right edge down to cover fold
    //   cover fold (crease) at y1-cover: shown in foldLines, not cutPath
    `L ${xd},${y1}`,                          // right edge of cover down to body fold
    // ── GLUE TAB ──────────────────────────────────────────────────────────────
    `L ${xe},${y1}`, `L ${xe},${y2}`, `L ${xd},${y2}`,
    // ── BOTTOM (right → left, mirrored) ──────────────────────────────────────
    `L ${xd},${y2 + cover}`,                 // down right edge of bottom cover
    `L ${xd},${y2 + cover + tuck}`,          // down right edge of bottom tuck
    `L ${xc},${y2 + cover + tuck}`,          // across bottom tuck tip
    `L ${xc},${y2 + dust}`,                  // up left edge of cover to dust level
    `L ${xb},${y2 + dust}`,                  // right D bottom dust flap
    `L ${xb},${y2}`,                          // slit up at xb
    `L ${xa},${y2}`,                          // across bare W bottom
    `L ${xa},${y2 + dust}`,                  // slit down at xa
    `L ${x0},${y2 + dust}`,                  // left D bottom dust flap
    // ── LEFT SIDE ─────────────────────────────────────────────────────────────
    `L ${x0},${y1 - dust}`, `Z`,
  ].join(' ')

  const foldLines = [
    // Vertical panel folds (full body height)
    `M ${xa},${y1} L ${xa},${y2}`,
    `M ${xb},${y1} L ${xb},${y2}`,
    `M ${xc},${y1} L ${xc},${y2}`,
    `M ${xd},${y1} L ${xd},${y2}`,
    // Horizontal body fold lines
    `M ${x0},${y1} L ${xe},${y1}`,
    `M ${x0},${y2} L ${xe},${y2}`,
    // Cover fold lines (crease between cover panel and tuck tongue)
    `M ${xc},${y1 - cover} L ${xd},${y1 - cover}`,
    `M ${xc},${y2 + cover} L ${xd},${y2 + cover}`,
  ]

  const gluePaths = [
    `M ${xd},${y1} L ${xe},${y1} L ${xe},${y2} L ${xd},${y2} Z`,
  ]

  return {
    svgWidth:  xe + b * 2,
    svgHeight: y3 + b * 2,
    cutPath,
    foldLines,
    gluePaths,
    bleedPath: bleedRect(xe, y3, b),
    panels: [
      { x: x0, y: y1, w: d, h, label: 'Left'  },
      { x: xa, y: y1, w,    h, label: 'Front' },
      { x: xb, y: y1, w: d, h, label: 'Right' },
      { x: xc, y: y1, w,    h, label: 'Back'  },
      { x: xd, y: y1, w: g, h, label: 'Glue'  },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}
