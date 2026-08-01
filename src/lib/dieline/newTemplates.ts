import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode, buildPolygonFoldNode, trayFoldNode } from './box'

// ── Lid Box (2-piece gift box) ────────────────────────────────────────────────
// Dieline: bottom tray (standard box flap layout, 66% height)
//          + lid tray (32% height, slightly wider, printed below the body)
export function computeLidBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const hBody = h * 0.66   // body tray height
  const hLid  = h * 0.36   // lid tray height
  const gap   = 8 * s      // gap between body and lid dieline sections

  const hf = (D / 2) * s   // half-flap height (standard)

  // Body dieline
  const bx0=0, bx1=d, bx2=d+w, bx3=2*d+w, bx4=2*d+2*w, bx5=2*d+2*w+g
  const by0=0, by1=hf, by2=hf+hBody, by3=2*hf+hBody

  const bodyCut = [
    `M ${bx1},${by0}`, `L ${bx2},${by0}`, `L ${bx2},${by1}`,
    `L ${bx5},${by1}`, `L ${bx5},${by2}`, `L ${bx4},${by2}`,
    `L ${bx2},${by2}`, `L ${bx2},${by3}`, `L ${bx1},${by3}`,
    `L ${bx1},${by2}`, `L ${bx0},${by2}`, `L ${bx0},${by1}`,
    `L ${bx1},${by1}`, `L ${bx1},${by0}`, `Z`,
  ].join(' ')

  // Lid dieline (slightly wider W+2 mm to fit over body)
  const extra = 2 * s  // lid is 2mm wider per side (4mm total)
  const lx0=0, lx1=d, lx2=d+w+extra, lx3=2*d+w+extra, lx4=2*d+2*w+extra*2, lx5=2*d+2*w+extra*2+g
  const ly0=by3+gap, ly1=ly0+hf*0.5, ly2=ly1+hLid, ly3=ly2+hf*0.5

  const lidCut = [
    `M ${lx1},${ly0}`, `L ${lx2},${ly0}`, `L ${lx2},${ly1}`,
    `L ${lx5},${ly1}`, `L ${lx5},${ly2}`, `L ${lx4},${ly2}`,
    `L ${lx2},${ly2}`, `L ${lx2},${ly3}`, `L ${lx1},${ly3}`,
    `L ${lx1},${ly2}`, `L ${lx0},${ly2}`, `L ${lx0},${ly1}`,
    `L ${lx1},${ly1}`, `L ${lx1},${ly0}`, `Z`,
  ].join(' ')

  const totalW = Math.max(bx5, lx5)
  const totalH = ly3

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: bodyCut + ' ' + lidCut,
    foldLines: [
      // Body
      `M ${bx1},${by0} L ${bx1},${by3}`,
      `M ${bx2},${by1} L ${bx2},${by2}`,
      `M ${bx3},${by1} L ${bx3},${by2}`,
      `M ${bx4},${by1} L ${bx4},${by2}`,
      `M ${bx0},${by1} L ${bx5},${by1}`,
      `M ${bx0},${by2} L ${bx5},${by2}`,
      // Lid
      `M ${lx1},${ly0} L ${lx1},${ly3}`,
      `M ${lx2},${ly1} L ${lx2},${ly2}`,
      `M ${lx3},${ly1} L ${lx3},${ly2}`,
      `M ${lx4},${ly1} L ${lx4},${ly2}`,
      `M ${lx0},${ly1} L ${lx5},${ly1}`,
      `M ${lx0},${ly2} L ${lx5},${ly2}`,
    ],
    gluePaths: [
      `M ${bx4},${by1} L ${bx5},${by1} L ${bx5},${by2} L ${bx4},${by2} Z`,
      `M ${lx4},${ly1} L ${lx5},${ly1} L ${lx5},${ly2} L ${lx4},${ly2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: bx0, y: by1, w: d, h: hBody, label: 'Left' },
      { x: bx1, y: by1, w, h: hBody, label: 'Front' },
      { x: bx2, y: by1, w: d, h: hBody, label: 'Right' },
      { x: bx3, y: by1, w, h: hBody, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H * 0.66, D),
  }
}

// ── Pillow Box ─────────────────────────────────────────────────────────────────
// Dieline: 2 mirror-image curved panels, fold in the middle
// Each panel is W wide, H tall, with a half-oval curve at top+bottom
export function computePillowBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  // Pillow box dieline: 2 rectangular panels side by side (front + back)
  // with curved top+bottom that create the pillow shape when folded
  const panW = w        // each panel is W wide
  const panH = h + d    // height includes the curved flap depth
  const curveH = d * 0.6  // the curve/flap depth at top and bottom

  const x0 = 0, x1 = panW, x2 = 2 * panW
  const y0 = 0, y1 = curveH, y2 = curveH + h, y3 = curveH + h + curveH

  // Front panel: rectangle with curved top and bottom
  // Back panel: mirror image beside it
  const midX = x1

  const cutPath = [
    `M ${x0},${y1}`,
    // Bottom-left curve of front panel (concave)
    `Q ${x0 + panW * 0.25},${y0} ${midX},${y0}`,
    // Bottom-right curve of back panel (concave, mirror)
    `Q ${x2 - panW * 0.25},${y0} ${x2},${y1}`,
    `L ${x2},${y2}`,
    // Top-right curve of back panel
    `Q ${x2 - panW * 0.25},${y3} ${midX},${y3}`,
    // Top-left curve of front panel
    `Q ${x0 + panW * 0.25},${y3} ${x0},${y2}`,
    `Z`,
  ].join(' ')

  return {
    svgWidth: x2 + b * 2, svgHeight: y3 + b * 2,
    cutPath,
    foldLines: [
      // Center fold line between front and back panels
      `M ${midX},${y0} L ${midX},${y3}`,
      // Curve start lines (where flat body meets curved ends)
      `M ${x0},${y1} L ${x2},${y1}`,
      `M ${x0},${y2} L ${x2},${y2}`,
    ],
    gluePaths: [],
    bleedPath: bleedRect(x2, y3, b),
    panels: [
      { x: x0, y: y1, w: panW, h, label: 'Front' },
      { x: midX, y: y1, w: panW, h, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D * 0.5),
  }
}

// ── Drawer Box (sleeve + tray) ─────────────────────────────────────────────────
// Dieline: outer sleeve (top) + inner tray (bottom), printed on same sheet
export function computeDrawerBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const gap = 10 * s   // gap between sleeve and tray in dieline

  // Sleeve dieline (same as standard box but all 4 sides = sleeve panels)
  const hf = (D / 2) * s
  const sx0=0, sx1=d, sx2=d+w, sx3=2*d+w, sx4=2*d+2*w, sx5=2*d+2*w+g
  const sy0=0, sy1=hf, sy2=hf+h, sy3=2*hf+h

  const sleeveCut = [
    `M ${sx1},${sy0}`, `L ${sx2},${sy0}`, `L ${sx2},${sy1}`,
    `L ${sx5},${sy1}`, `L ${sx5},${sy2}`, `L ${sx4},${sy2}`,
    `L ${sx2},${sy2}`, `L ${sx2},${sy3}`, `L ${sx1},${sy3}`,
    `L ${sx1},${sy2}`, `L ${sx0},${sy2}`, `L ${sx0},${sy1}`,
    `L ${sx1},${sy1}`, `L ${sx1},${sy0}`, `Z`,
  ].join(' ')

  // Inner tray dieline (slightly smaller — sits inside sleeve)
  const tw = w - 2 * s   // 2mm narrower on each side
  const td = d - 2 * s
  const tg = g
  const thf = td / 2

  const tx0=0, tx1=td, tx2=td+tw, tx3=2*td+tw, tx4=2*td+2*tw, tx5=2*td+2*tw+tg
  const ty0=sy3+gap, ty1=ty0+thf, ty2=ty1+h, ty3=ty2+thf

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
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: sleeveCut + ' ' + trayCut,
    foldLines: [
      `M ${sx1},${sy0} L ${sx1},${sy3}`, `M ${sx2},${sy1} L ${sx2},${sy2}`,
      `M ${sx3},${sy1} L ${sx3},${sy2}`, `M ${sx4},${sy1} L ${sx4},${sy2}`,
      `M ${sx0},${sy1} L ${sx5},${sy1}`, `M ${sx0},${sy2} L ${sx5},${sy2}`,
      `M ${tx1},${ty0} L ${tx1},${ty3}`, `M ${tx2},${ty1} L ${tx2},${ty2}`,
      `M ${tx3},${ty1} L ${tx3},${ty2}`, `M ${tx4},${ty1} L ${tx4},${ty2}`,
      `M ${tx0},${ty1} L ${tx5},${ty1}`, `M ${tx0},${ty2} L ${tx5},${ty2}`,
    ],
    gluePaths: [
      `M ${sx4},${sy1} L ${sx5},${sy1} L ${sx5},${sy2} L ${sx4},${sy2} Z`,
      `M ${tx4},${ty1} L ${tx5},${ty1} L ${tx5},${ty2} L ${tx4},${ty2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: sx0, y: sy1, w: d, h, label: 'Left' },
      { x: sx1, y: sy1, w, h, label: 'Front' },
      { x: sx2, y: sy1, w: d, h, label: 'Right' },
      { x: sx3, y: sy1, w, h, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ── Hexagonal Box ──────────────────────────────────────────────────────────────
// Dieline: 6 rectangular side panels in a strip + 2 hexagonal end caps
export function computeHexagonalBox(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const s = MM_TO_PX
  const h = H * s, b = B * s

  // Hexagon circumradius from width
  const r  = W * s / 2
  const sw = r           // side panel width = circumradius (edge length of regular hex)
  const totalStripW = sw * 6
  const hexH = r * Math.sqrt(3)   // hex height (flat-to-flat)

  // 6 side panels in a horizontal strip
  const y0 = hexH, y1 = hexH + h

  // Build the cut path for 6 side panels (strip)
  const stripPath = `M 0,${y0} L ${totalStripW},${y0} L ${totalStripW},${y1} L 0,${y1} Z`

  // Top hexagon cap — centered above panel 3 (at x = sw*3)
  const hcx = totalStripW / 2
  const hcy = hexH / 2
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3
    return `${hcx + r * Math.cos(a)},${hcy + r * Math.sin(a)}`
  })
  const hexPath = `M ${hexPoints[0]} L ${hexPoints.slice(1).join(' L ')} Z`

  // Bottom hexagon cap
  const bcy = y1 + hexH / 2
  const botHexPoints = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3
    return `${hcx + r * Math.cos(a)},${bcy + r * Math.sin(a)}`
  })
  const botHexPath = `M ${botHexPoints[0]} L ${botHexPoints.slice(1).join(' L ')} Z`

  const totalW = totalStripW
  const totalH = y1 + hexH

  const foldLines: string[] = []
  for (let i = 1; i < 6; i++) {
    foldLines.push(`M ${sw * i},${y0} L ${sw * i},${y1}`)
  }
  foldLines.push(`M 0,${y0} L ${totalStripW},${y0}`)
  foldLines.push(`M 0,${y1} L ${totalStripW},${y1}`)

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: stripPath + ' ' + hexPath + ' ' + botHexPath,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: sw, y: y0, w: sw, h, label: 'Front' },
      { x: sw * 2, y: y0, w: sw, h, label: 'Right' },
      { x: sw * 3, y: y0, w: sw, h, label: 'Back' },
      { x: sw * 4, y: y0, w: sw, h, label: 'Left' },
    ],
    foldNode: buildPolygonFoldNode(6, sw / s, H),
  }
}

// ── Cylinder Box ───────────────────────────────────────────────────────────────
// Dieline: a rectangle (unrolled tube) + 2 circle caps
export function computeCylinderBox(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const s = MM_TO_PX
  const h = H * s, b = B * s

  const r    = W * s / 2
  const circ = 2 * Math.PI * r  // tube circumference

  // Tube body rectangle
  const bx0 = 0, bx1 = circ
  const by0 = r * 2 + 10 * s, by1 = by0 + h  // positioned below the top circle

  const tubePath = `M ${bx0},${by0} L ${bx1},${by0} L ${bx1},${by1} L ${bx0},${by1} Z`

  // Top circle cap (lid)
  const cx  = r + 10 * s
  const cy  = r
  const topCircle = makeSvgCircle(cx, cy, r)

  // Bottom circle cap
  const bcy = by1 + r + 10 * s
  const botCircle = makeSvgCircle(cx, bcy, r)

  const totalW = Math.max(bx1, cx + r + 10 * s)
  const totalH = bcy + r

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: tubePath + ' ' + topCircle + ' ' + botCircle,
    foldLines: [
      // Score lines on tube where tube connects to caps
      `M ${bx0},${by0} L ${bx1},${by0}`,
      `M ${bx0},${by1} L ${bx1},${by1}`,
      // Vertical seam overlap line
      `M ${bx0},${by0} L ${bx0},${by1}`,
    ],
    gluePaths: [
      // Glue strip at seam overlap (10mm wide at left edge of tube)
      `M ${bx0},${by0} L ${10 * s},${by0} L ${10 * s},${by1} L ${bx0},${by1} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: bx0, y: by0, w: circ, h, label: 'Front' },
    ],
  }
}

// ── Stand-Up Pouch ─────────────────────────────────────────────────────────────
// Dieline inspired by n-ate/dieline-designer PouchTemplate (MIT)
// Layout: front panel + back panel side by side, bottom gusset below both
export function computeStandUpPouch(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, b = B * s

  const gussetW  = d / 2             // half-gusset unfolded width
  const sealW    = w * 0.04          // side seal width
  const zipY     = h * 0.82          // zipper height from bottom
  const zipH     = h * 0.025         // zipper strip height
  const topSeal  = h * 0.04          // top seal height
  const bodyH    = h - topSeal       // main body height (excl. top seal)

  // Front panel: from (0, 0) to (w, bodyH)
  const fx0 = sealW, fx1 = fx0 + w - sealW * 2
  const fy0 = 0, fy1 = bodyH

  // Back panel: placed to the right of front with a 4mm gap
  const gap = 4 * s
  const bx0 = fx1 + gap + sealW, bx1 = bx0 + w - sealW * 2

  // Bottom gusset strip: below front+back, unfolded (two half-gussets side by side)
  const gx0 = 0, gx1 = gx0 + gussetW * 2 + w
  const gy0 = fy1 + 4 * s, gy1 = gy0 + w

  const frontPath = `M ${fx0},${fy0} L ${fx1},${fy0} L ${fx1},${fy1} L ${fx0},${fy1} Z`
  const backPath  = `M ${bx0},${fy0} L ${bx1},${fy0} L ${bx1},${fy1} L ${bx0},${fy1} Z`
  const gussetPath = `M ${gx0},${gy0} L ${gx1},${gy0} L ${gx1},${gy1} L ${gx0},${gy1} Z`

  const foldLines: string[] = [
    // Zipper score lines on front
    `M ${fx0},${gy0 - bodyH + zipY} L ${fx1},${gy0 - bodyH + zipY}`,
    // Gusset center fold line
    `M ${gx0 + gussetW},${gy0} L ${gx0 + gussetW},${gy1}`,
    `M ${gx0 + gussetW + w},${gy0} L ${gx0 + gussetW + w},${gy1}`,
  ]

  const totalW = Math.max(bx1, gx1)
  const totalH = gy1

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: frontPath + ' ' + backPath + ' ' + gussetPath,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: fx0, y: fy0, w: fx1 - fx0, h: bodyH, label: 'Front' },
      { x: bx0, y: fy0, w: bx1 - bx0, h: bodyH, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

function makeSvgCircle(cx: number, cy: number, r: number): string {
  return `M ${cx - r},${cy} A ${r},${r} 0 1 0 ${cx + r},${cy} A ${r},${r} 0 1 0 ${cx - r},${cy} Z`
}

// ── Tray Box (4-corner locked display tray) ────────────────────────────────────
// Dieline: cross shape — bottom + 4 walls + 4 corner tabs
export function computeTrayBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  // Tray wall height = min(H, D*0.6)
  const wall = Math.min(h, d * 0.6)

  // Layout:  corner | front-wall | corner
  //          left   | bottom     | right
  //          corner | back-wall  | corner
  const cx0 = 0, cx1 = wall, cx2 = wall + w, cx3 = wall * 2 + w
  const cy0 = 0, cy1 = wall, cy2 = wall + d, cy3 = wall * 2 + d

  const cutPath = [
    // Outer perimeter with corner tabs
    `M ${cx0},${cy1}`,
    `L ${cx1},${cy1}`, `L ${cx1},${cy0}`, `L ${cx2},${cy0}`, `L ${cx2},${cy1}`,
    `L ${cx3},${cy1}`, `L ${cx3},${cy2}`,
    `L ${cx2},${cy2}`, `L ${cx2},${cy3}`, `L ${cx1},${cy3}`, `L ${cx1},${cy2}`,
    `L ${cx0},${cy2}`, `Z`,
    // Glue tab on right side
    `M ${cx3},${cy1} L ${cx3 + g},${cy1} L ${cx3 + g},${cy2} L ${cx3},${cy2} Z`,
  ].join(' ')

  const foldLines = [
    `M ${cx1},${cy0} L ${cx1},${cy3}`,
    `M ${cx2},${cy0} L ${cx2},${cy3}`,
    `M ${cx0},${cy1} L ${cx3 + g},${cy1}`,
    `M ${cx0},${cy2} L ${cx3 + g},${cy2}`,
  ]

  const totalW = cx3 + g
  const totalH = cy3

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath,
    foldLines,
    gluePaths: [`M ${cx3},${cy1} L ${cx3 + g},${cy1} L ${cx3 + g},${cy2} L ${cx3},${cy2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: cx1, y: cy1, w, h: d, label: 'Bottom' },
      { x: cx1, y: cy0, w, h: wall, label: 'Front' },
      { x: cx1, y: cy2, w, h: wall, label: 'Back' },
    ],
    foldNode: trayFoldNode(W, D, Math.min(H, D * 0.6)),
  }
}

// ── Reverse Tuck Box ───────────────────────────────────────────────────────────
// Top flap tucks into front panel; bottom flap tucks into back panel
export function computeReverseTuck(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  // Flap height = min(D*0.85, H*0.22)
  const flapH = Math.min(d * 0.85, h * 0.22)
  const dustH = d * 0.45   // dust flap on sides

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 3 * d + w, x5 = 3 * d + w + g
  const y0 = 0, y1 = flapH, y2 = flapH + h, y3 = flapH + h + flapH

  // Main cut outline
  const cutPath = [
    `M ${x1},${y0}`, `L ${x2},${y0}`,
    // Top dust flaps on sides
    `L ${x2},${y1}`, `L ${x3},${y1 - dustH}`, `L ${x3},${y2 + dustH}`, `L ${x2},${y2}`,
    `L ${x2},${y3}`, `L ${x1},${y3}`,
    `L ${x1},${y2}`, `L ${x0},${y2 + dustH}`, `L ${x0},${y1 - dustH}`, `L ${x1},${y1}`,
    `Z`,
    // Glue tab
    `M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`,
    // Back panel
    `M ${x3},${y0} L ${x4},${y0} L ${x4},${y3} L ${x3},${y3} Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y0} L ${x2},${y3}`,
    `M ${x3},${y0} L ${x3},${y3}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
  ]

  const totalW = x5
  const totalH = y3

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
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

// ── Book Box (clamshell) ───────────────────────────────────────────────────────
// Base tray + lid tray, unfolded flat side by side, connected at spine
export function computeBookBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  const hBase = h * 0.58
  const hLid  = h * 0.44
  const spine = d * 0.06  // spine width between the two trays

  // Base tray dieline — standard tray cross:  wall | bottom | wall
  const bx0=0, bx1=d, bx2=d+w, bx3=2*d+w+g
  const by0=0, by1=d, by2=d+hBase, by3=2*d+hBase

  const baseShape = [
    `M ${bx1},${by0}`, `L ${bx2},${by0}`, `L ${bx2},${by1}`,
    `L ${bx3},${by1}`, `L ${bx3},${by2}`, `L ${bx2},${by2}`,
    `L ${bx2},${by3}`, `L ${bx1},${by3}`, `L ${bx1},${by2}`,
    `L 0,${by2}`, `L 0,${by1}`, `L ${bx1},${by1}`, `Z`,
  ].join(' ')

  // Lid tray dieline — placed to the right with spine gap
  const lx0 = bx3 + spine
  const lx1 = lx0 + d, lx2 = lx0 + d + w, lx3 = lx0 + 2 * d + w + g
  const ly1 = (by3 - hLid - d) / 2 + d   // vertically centered
  const ly2 = ly1 + hLid, ly3 = ly2 + d

  const lidShape = [
    `M ${lx1},${ly1 - d}`, `L ${lx2},${ly1 - d}`, `L ${lx2},${ly1}`,
    `L ${lx3},${ly1}`, `L ${lx3},${ly2}`, `L ${lx2},${ly2}`,
    `L ${lx2},${ly3}`, `L ${lx1},${ly3}`, `L ${lx1},${ly2}`,
    `L ${lx0},${ly2}`, `L ${lx0},${ly1}`, `L ${lx1},${ly1}`, `Z`,
  ].join(' ')

  const foldLines = [
    // Base
    `M ${bx1},${by0} L ${bx1},${by3}`,
    `M ${bx2},${by0} L ${bx2},${by3}`,
    `M 0,${by1} L ${bx3},${by1}`,
    `M 0,${by2} L ${bx3},${by2}`,
    // Lid
    `M ${lx1},${ly1 - d} L ${lx1},${ly3}`,
    `M ${lx2},${ly1 - d} L ${lx2},${ly3}`,
    `M ${lx0},${ly1} L ${lx3},${ly1}`,
    `M ${lx0},${ly2} L ${lx3},${ly2}`,
  ]

  const totalW = lx3
  const totalH = Math.max(by3, ly3)

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: baseShape + ' ' + lidShape,
    foldLines,
    gluePaths: [
      `M ${bx2 + d},${by1} L ${bx3},${by1} L ${bx3},${by2} L ${bx2 + d},${by2} Z`,
      `M ${lx2 + d},${ly1} L ${lx3},${ly1} L ${lx3},${ly2} L ${lx2 + d},${ly2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: bx1, y: by1, w, h: hBase, label: 'Base' },
      { x: lx1, y: ly1, w, h: hLid, label: 'Lid' },
    ],
    foldNode: trayFoldNode(W, D, H * 0.58),
  }
}
