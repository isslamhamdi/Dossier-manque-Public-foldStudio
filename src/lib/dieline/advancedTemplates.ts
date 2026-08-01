import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode, trayFoldNode } from './box'

// ── Shrink Sleeve ──────────────────────────────────────────────────────────────
// Flat rectangular tube that wraps 360° around a container.
// W = circumference = (width + depth) * 2, H = height
// Center vertical fold + small glue tab on one side
export function computeShrinkSleeve(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const h = H * s, d = D * s, g = G * s, b = B * s

  const circ = (W + D) * 2 * s   // total circumference (unrolled)
  const halfCirc = circ / 2      // center fold

  // Main rectangle
  const x0 = 0, x1 = circ, xG = circ + g
  const y0 = 0, y1 = h

  const cutPath = [
    `M ${x0},${y0}`,
    `L ${x1},${y0}`,
    `L ${xG},${y0}`,
    `L ${xG},${y1}`,
    `L ${x1},${y1}`,
    `L ${x0},${y1}`,
    `Z`,
  ].join(' ')

  const foldLines = [
    // Center vertical fold
    `M ${halfCirc},${y0} L ${halfCirc},${y1}`,
    // Quarter fold lines (front/back transitions)
    `M ${circ * 0.25},${y0} L ${circ * 0.25},${y1}`,
    `M ${circ * 0.75},${y0} L ${circ * 0.75},${y1}`,
    // Glue tab boundary
    `M ${x1},${y0} L ${x1},${y1}`,
  ]

  const totalW = xG
  const totalH = y1

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath,
    foldLines,
    gluePaths: [
      `M ${x1},${y0} L ${xG},${y0} L ${xG},${y1} L ${x1},${y1} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0,          y: y0, w: circ * 0.25, h, label: 'Front' },
      { x: circ * 0.25, y: y0, w: circ * 0.25, h, label: 'Side' },
      { x: halfCirc,    y: y0, w: circ * 0.25, h, label: 'Back' },
      { x: circ * 0.75, y: y0, w: circ * 0.25, h, label: 'Side' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ── IML Label (In-Mold Label) ──────────────────────────────────────────────────
// Flat rectangular label — no fold lines, just cut path + bleed
export function computeIMLLabel(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, b = B * s

  const cutPath = `M 0,0 L ${w},0 L ${w},${h} L 0,${h} Z`

  return {
    svgWidth: w + b * 2,
    svgHeight: h + b * 2,
    cutPath,
    foldLines: [],
    gluePaths: [],
    bleedPath: bleedRect(w, h, b),
    panels: [
      { x: 0, y: 0, w, h, label: 'Label' },
    ],
  }
}

// ── Flow Wrap / Pillow Bag ─────────────────────────────────────────────────────
// Film rectangle: W = width + 2*depth + 2*seal, H = height + 2*depth + 2*seal
// seal = depth/2. Seal lines at top/bottom, fold guides at depth from center.
export function computeFlowWrap(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  const seal = d / 2    // top/bottom seal band height
  const filmW = w + 2 * d + 2 * seal
  const filmH = h + 2 * d + 2 * seal

  const x0 = 0, x1 = filmW
  const y0 = 0, y1 = filmH

  const cutPath = `M ${x0},${y0} L ${x1},${y0} L ${x1},${y1} L ${x0},${y1} Z`

  // Horizontal seal lines
  const ySealTop    = seal
  const ySealBottom = filmH - seal

  // Center vertical line (where fin seal is formed)
  const xCenter = filmW / 2

  // Depth guides (product width boundaries)
  const xDepthL = seal + d
  const xDepthR = filmW - seal - d

  // Vertical fold guides marking product depth (dotted fold indicators)
  const yDepthTop    = seal + d
  const yDepthBottom = filmH - seal - d

  const foldLines = [
    // Top seal line
    `M ${x0},${ySealTop} L ${x1},${ySealTop}`,
    // Bottom seal line
    `M ${x0},${ySealBottom} L ${x1},${ySealBottom}`,
    // Center fin seal vertical line
    `M ${xCenter},${y0} L ${xCenter},${y1}`,
    // Depth width guides (vertical)
    `M ${xDepthL},${y0} L ${xDepthL},${y1}`,
    `M ${xDepthR},${y0} L ${xDepthR},${y1}`,
    // Depth height guides (horizontal)
    `M ${x0},${yDepthTop} L ${x1},${yDepthTop}`,
    `M ${x0},${yDepthBottom} L ${x1},${yDepthBottom}`,
  ]

  const totalW = filmW
  const totalH = filmH

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath,
    foldLines,
    gluePaths: [
      // Top seal band
      `M ${x0},${y0} L ${x1},${y0} L ${x1},${ySealTop} L ${x0},${ySealTop} Z`,
      // Bottom seal band
      `M ${x0},${ySealBottom} L ${x1},${ySealBottom} L ${x1},${y1} L ${x0},${y1} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: xDepthL, y: yDepthTop, w: w, h, label: 'Product Area' },
    ],
  }
}

// ── Blister Pack ───────────────────────────────────────────────────────────────
// Card (W×H) + blister area (W×depth) below. Fold line between card and blister.
// Oval cavity indicators show blister locations.
export function computeBlisterPack(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  // Card section (top)
  const cx0 = 0, cx1 = w
  const cy0 = 0, cy1 = h

  // Blister tray section (bottom, attached via fold)
  const bx0 = 0, bx1 = w
  const by0 = cy1, by1 = cy1 + d

  const cardPath  = `M ${cx0},${cy0} L ${cx1},${cy0} L ${cx1},${cy1} L ${cx0},${cy1} Z`
  const blisterPath = `M ${bx0},${by0} L ${bx1},${by0} L ${bx1},${by1} L ${bx0},${by1} Z`

  // Oval blister cavity indicators — 2 per row, 3 rows (6 blisters)
  const cavities: string[] = []
  const cols = 2, rows = 3
  const cavW = (w / cols) * 0.5
  const cavH = (h / rows) * 0.4
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ox = (w / cols) * (c + 0.5)
      const oy = (h / rows) * (r + 0.5)
      const rx = cavW / 2
      const ry = cavH / 2
      cavities.push(
        `M ${ox - rx},${oy} A ${rx},${ry} 0 1 0 ${ox + rx},${oy} A ${rx},${ry} 0 1 0 ${ox - rx},${oy} Z`
      )
    }
  }

  const totalW = w
  const totalH = by1

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath: cardPath + ' ' + blisterPath + ' ' + cavities.join(' '),
    foldLines: [
      // Fold line between card and blister tray
      `M ${cx0},${cy1} L ${cx1},${cy1}`,
    ],
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: cx0, y: cy0, w, h,  label: 'Card'    },
      { x: bx0, y: by0, w, h: d, label: 'Blister' },
    ],
    foldNode: {
      id: 'Card', face: 'front' as const, w: W, h: H, worldPos: [0, 0, 0] as [number, number, number],
      children: [
        { id: 'Blister', face: 'bottom' as const, w: W, h: D,
          hinge: { pivotPos: [0, -H / 2, 0] as [number, number, number], panelPos: [0, -D / 2, 0] as [number, number, number], axis: [1, 0, 0] as [number, number, number], angle: Math.PI / 2, seq: [0.0, 0.5] as [number, number] },
          children: [] },
      ],
    },
  }
}

// ── Ballotin (chocolate box) ───────────────────────────────────────────────────
// Standard tuck-end body + attached lid panel above (H*0.4 tall)
export function computeBallotin(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const flapH = Math.min(d * 0.85, h * 0.22)   // top/bottom tuck flap height
  const dustH = d * 0.45                         // side dust flap height
  const lidH  = h * 0.4 * s                      // lid panel height (already in px)

  // Body columns: left-depth | front | right-depth | back | glue-tab
  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 3 * d + w, x5 = 3 * d + w + g

  // Lid panel rows (above body)
  const lidY0 = 0
  const lidY1 = lidH

  // Body rows (below lid)
  const y0 = lidY1          // body top (flush with lid bottom)
  const y1 = y0 + flapH
  const y2 = y1 + h
  const y3 = y2 + flapH

  // Lid cut (simple rectangle same width as body)
  const lidPath = `M ${x1},${lidY0} L ${x2},${lidY0} L ${x2},${lidY1} L ${x1},${lidY1} Z`

  // Body cut outline (tuck-end style with side dust flaps)
  const bodyPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`,
    `L ${x2},${y1}`, `L ${x3},${y1 - dustH}`, `L ${x3},${y2 + dustH}`, `L ${x2},${y2}`,
    `L ${x2},${y3}`, `L ${x1},${y3}`,
    `L ${x1},${y2}`, `L ${x0},${y2 + dustH}`, `L ${x0},${y1 - dustH}`, `L ${x1},${y1}`,
    `Z`,
    // Back panel
    `M ${x3},${y0} L ${x4},${y0} L ${x4},${y3} L ${x3},${y3} Z`,
    // Glue tab
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
  ].join(' ')

  const foldLines = [
    // Lid fold line (junction between lid and body top flap)
    `M ${x1},${lidY1} L ${x2},${lidY1}`,
    // Body vertical folds
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y0} L ${x2},${y3}`,
    `M ${x3},${y0} L ${x3},${y3}`,
    // Body horizontal folds
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const totalW = x5
  const totalH = y3

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath: lidPath + ' ' + bodyPath,
    foldLines,
    gluePaths: [
      `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: lidY0, w,    h: lidH, label: 'Lid'   },
      { x: x1, y: y1,    w,    h,       label: 'Front'  },
      { x: x2, y: y1,    w: d, h,       label: 'Right'  },
      { x: x3, y: y1,    w,    h,       label: 'Back'   },
      { x: x0, y: y1,    w: d, h,       label: 'Left'   },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ── Fourreau Rigide (rigid sleeve / slipcase) ──────────────────────────────────
// Two-piece: outer sleeve (W+4mm × H × D) printed above inner tray (W × H*0.8 × D-2mm)
export function computeFourreauRigide(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const h = H * s, d = D * s, g = G * s, b = B * s

  // outer sleeve is 4mm wider total (2mm per side) — accounted for in ow calculation above
  const gap   = 10 * s   // gap between the two dielines on sheet

  // Outer sleeve (slightly larger)
  const ow = (W + 4) * s
  const od = d                        // same depth
  const ohf = od / 2                  // half-flap

  const sx0=0, sx1=od, sx2=od+ow, sx3=2*od+ow, sx4=2*od+2*ow, sx5=2*od+2*ow+g
  const sy0=0, sy1=ohf, sy2=ohf+h, sy3=2*ohf+h

  const sleeveCut = [
    `M ${sx1},${sy0}`, `L ${sx2},${sy0}`, `L ${sx2},${sy1}`,
    `L ${sx5},${sy1}`, `L ${sx5},${sy2}`, `L ${sx4},${sy2}`,
    `L ${sx2},${sy2}`, `L ${sx2},${sy3}`, `L ${sx1},${sy3}`,
    `L ${sx1},${sy2}`, `L ${sx0},${sy2}`, `L ${sx0},${sy1}`,
    `L ${sx1},${sy1}`, `L ${sx1},${sy0}`, `Z`,
  ].join(' ')

  // Inner tray (narrower and shorter)
  const iw = W * s
  const id = (D - 2) * s
  const ihf = id / 2
  const ih = h * 0.8

  const tx0=0, tx1=id, tx2=id+iw, tx3=2*id+iw, tx4=2*id+2*iw, tx5=2*id+2*iw+g
  const ty0=sy3+gap, ty1=ty0+ihf, ty2=ty1+ih, ty3=ty2+ihf

  const trayCut = [
    `M ${tx1},${ty0}`, `L ${tx2},${ty0}`, `L ${tx2},${ty1}`,
    `L ${tx5},${ty1}`, `L ${tx5},${ty2}`, `L ${tx4},${ty2}`,
    `L ${tx2},${ty2}`, `L ${tx2},${ty3}`, `L ${tx1},${ty3}`,
    `L ${tx1},${ty2}`, `L ${tx0},${ty2}`, `L ${tx0},${ty1}`,
    `L ${tx1},${ty1}`, `L ${tx1},${ty0}`, `Z`,
  ].join(' ')

  const totalW = Math.max(sx5, tx5)
  const totalH = ty3

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath: sleeveCut + ' ' + trayCut,
    foldLines: [
      // Sleeve folds
      `M ${sx1},${sy0} L ${sx1},${sy3}`,
      `M ${sx2},${sy1} L ${sx2},${sy2}`,
      `M ${sx3},${sy1} L ${sx3},${sy2}`,
      `M ${sx4},${sy1} L ${sx4},${sy2}`,
      `M ${sx0},${sy1} L ${sx5},${sy1}`,
      `M ${sx0},${sy2} L ${sx5},${sy2}`,
      // Tray folds
      `M ${tx1},${ty0} L ${tx1},${ty3}`,
      `M ${tx2},${ty1} L ${tx2},${ty2}`,
      `M ${tx3},${ty1} L ${tx3},${ty2}`,
      `M ${tx4},${ty1} L ${tx4},${ty2}`,
      `M ${tx0},${ty1} L ${tx5},${ty1}`,
      `M ${tx0},${ty2} L ${tx5},${ty2}`,
    ],
    gluePaths: [
      `M ${sx4},${sy1} L ${sx5},${sy1} L ${sx5},${sy2} L ${sx4},${sy2} Z`,
      `M ${tx4},${ty1} L ${tx5},${ty1} L ${tx5},${ty2} L ${tx4},${ty2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: sx0, y: sy1, w: od, h, label: 'Left (sleeve)' },
      { x: sx1, y: sy1, w: ow, h, label: 'Front (sleeve)' },
      { x: sx2, y: sy1, w: od, h, label: 'Right (sleeve)' },
      { x: sx3, y: sy1, w: ow, h, label: 'Back (sleeve)' },
      { x: tx1, y: ty1, w: iw, h: ih, label: 'Tray' },
    ],
    foldNode: boxFoldNode(W + 4, H, D),
  }
}

// ── Thermoform Tray ────────────────────────────────────────────────────────────
// Classic tray dieline: center bottom (W×H) surrounded by D-wide fold-up walls
// on all 4 sides, each corner has a notch cut.
export function computeThermoformTray(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  // Corner notch size (45° cut at each corner, notch = depth wide)
  const n = d   // notch = full wall depth for clean fold

  // Layout columns/rows (cross shape)
  const x0 = 0, x1 = d, x2 = d + w, x3 = d + w + d
  const y0 = 0, y1 = d, y2 = d + h, y3 = d + h + d

  // Cross-shaped dieline with corner notches
  // Go clockwise from top-left corner of top flap
  const cutPath = [
    // Top flap (full width, between notches)
    `M ${x1},${y0}`,
    `L ${x2},${y0}`,
    // Top-right corner notch (diagonal cut)
    `L ${x2},${y1}`,
    // Right flap top edge
    `L ${x3},${y1}`,
    // Right flap bottom edge
    `L ${x3},${y2}`,
    // Bottom-right corner notch
    `L ${x2},${y2}`,
    // Bottom flap right edge
    `L ${x2},${y3}`,
    // Bottom flap left edge
    `L ${x1},${y3}`,
    // Bottom-left corner notch
    `L ${x1},${y2}`,
    // Left flap bottom edge
    `L ${x0},${y2}`,
    // Left flap top edge
    `L ${x0},${y1}`,
    // Top-left corner notch
    `L ${x1},${y1}`,
    `Z`,
  ].join(' ')

  const foldLines = [
    // Vertical fold lines (left and right wall folds)
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y0} L ${x2},${y3}`,
    // Horizontal fold lines (top and bottom wall folds)
    `M ${x0},${y1} L ${x3},${y1}`,
    `M ${x0},${y2} L ${x3},${y2}`,
  ]

  const totalW = x3
  const totalH = y3

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w, h,    label: 'Bottom'      },
      { x: x1, y: y0, w, h: d, label: 'Front Wall'  },
      { x: x1, y: y2, w, h: d, label: 'Back Wall'   },
      { x: x0, y: y1, w: d, h, label: 'Left Wall'   },
      { x: x2, y: y1, w: d, h, label: 'Right Wall'  },
    ],
    foldNode: trayFoldNode(W, H, D),
  }
}
