import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { trayFoldNode } from './box'

// FEFCO 0301-style — Cross-Shaped Tray / One-Piece Folder
// Central bottom panel (D×W) + 4 walls (height H) + 4 corner flaps (cf) on N/S walls.
// Geometry derived from PackagingWorkbench fefco0301_dieline.py (LGPL-2.1).
export function computeFEFCOTray(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, thickness: T, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, t = T * s, b = B * s
  const cf = Math.max(4 * t, 10 * s)  // corner-flap depth, min 10 mm

  // Column landmarks (x-axis):
  //   [W-wall 0..h] [bottom h..h+d] [E-wall h+d..2h+d]
  //   corner flap span: h-cf .. h+d+cf (for N/S rows only)
  const xe1 = 2 * h + d   // total width
  const xfl = h - cf      // flap left edge
  const xfr = h + d + cf  // flap right edge

  // Row landmarks (y-axis):
  //   [N-wall 0..h] [middle h..h+w] [S-wall h+w..2h+w]
  const ys1 = 2 * h + w   // total height

  // Cross-shaped outer cutPath — 12-vertex polygon (clockwise in SVG y-down)
  const cutPath = [
    `M ${xfl},0`,     `L ${xfr},0`,    // top of N section (flap span)
    `L ${xfr},${h}`,                   // NE corner down
    `L ${xe1},${h}`,                   // step right to E-wall
    `L ${xe1},${h + w}`,               // E-wall right edge
    `L ${xfr},${h + w}`,               // SE corner left
    `L ${xfr},${ys1}`, `L ${xfl},${ys1}`, // bottom of S section
    `L ${xfl},${h + w}`,               // SW corner up
    `L 0,${h + w}`,                    // step left to W-wall
    `L 0,${h}`,                        // W-wall left edge up
    `L ${xfl},${h}`,                   // NW corner right
    `Z`,
  ].join(' ')

  const foldLines = [
    // Bottom panel ↔ walls (4 main fold lines)
    `M ${h},${h} L ${h + d},${h}`,         // N wall fold
    `M ${h},${h + w} L ${h + d},${h + w}`, // S wall fold
    `M ${h},${h} L ${h},${h + w}`,         // W wall fold
    `M ${h + d},${h} L ${h + d},${h + w}`, // E wall fold
    // N wall ↔ corner flaps
    `M ${h},0 L ${h},${h}`,
    `M ${h + d},0 L ${h + d},${h}`,
    // S wall ↔ corner flaps
    `M ${h},${h + w} L ${h},${ys1}`,
    `M ${h + d},${h + w} L ${h + d},${ys1}`,
  ]

  return {
    svgWidth:  xe1 + b * 2,
    svgHeight: ys1 + b * 2,
    cutPath,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(xe1, ys1, b),
    panels: [
      { x: h,     y: h,     w: d, h: w, label: 'Bottom' },
      { x: h,     y: 0,     w: d, h: h, label: 'North'  },
      { x: h,     y: h + w, w: d, h: h, label: 'South'  },
      { x: 0,     y: h,     w: h, h: w, label: 'West'   },
      { x: h + d, y: h,     w: h, h: w, label: 'East'   },
    ],
    foldNode: trayFoldNode(W, D, H),
  }
}
