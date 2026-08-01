// packlyTemplates.ts — 17 packaging types matching Packly catalog.
// All formulas use public FEFCO / ECMA standards. No proprietary data.

import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData } from './helpers'
import { boxFoldNode, trayFoldNode, tuckEndFoldNode } from './box'

const s = MM_TO_PX

// ─────────────────────────────────────────────────────────────────────────────
// 1. COFFRET À OREILLES — Ear Box (FEFCO 0426 variant)
//    Cross-shaped blank. Ears fold to form sides without glue.
//    Layout:          [TOP_FLAP]
//            [LEFT]  [FRONT]  [RIGHT]
//                    [BOTTOM]
//            [EAR_L] [BACK]   [EAR_R]
// ─────────────────────────────────────────────────────────────────────────────
export function computeEarBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, b = B * s
  const ear = (D * 0.45) * s   // ear width — 45% of depth

  // Main cross: Front panel is the center
  const cx0 = ear, cx1 = ear + d, cx2 = ear + d + w, cx3 = ear + 2 * d + w, cx4 = ear + 2 * d + w + ear

  // Vertical: top flap + front + bottom flap + back
  const cy0 = 0, cy1 = d * 0.5, cy2 = cy1 + h, cy3 = cy2 + d, cy4 = cy3 + h

  const totalW = cx4
  const totalH = cy4

  // Front ear flap diagonal (triangle cut on ear corners)
  const cutPath = [
    // Top flap (above front)
    `M ${cx1},${cy0} L ${cx2},${cy0} L ${cx2},${cy1} L ${cx1},${cy1} Z`,
    // Main cross body
    `M ${cx0},${cy1}`,
    `L ${cx4},${cy1}`,
    `L ${cx4},${cy2}`,
    // Right ear
    `L ${cx3},${cy2}`,
    `L ${cx3},${cy3}`,
    `L ${cx4},${cy3}`,
    `L ${cx4},${cy4}`,
    // Bottom of back
    `L ${cx1},${cy4}`,
    `L ${cx1},${cy3}`,
    `L ${cx0},${cy3}`,
    `L ${cx0},${cy2}`,
    `L ${cx1},${cy2}`,
    `L ${cx1},${cy1}`,
    `L ${cx0},${cy1} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2,
    svgHeight: totalH + b * 2,
    cutPath,
    foldLines: [
      `M ${cx1},${cy1} L ${cx1},${cy2}`,   // front/left
      `M ${cx2},${cy1} L ${cx2},${cy2}`,   // front/right
      `M ${cx1},${cy1} L ${cx2},${cy1}`,   // top
      `M ${cx1},${cy2} L ${cx2},${cy2}`,   // bottom
      `M ${cx0},${cy1} L ${cx4},${cy1}`,   // horizontal top
      `M ${cx0},${cy2} L ${cx4},${cy2}`,   // horizontal mid
      `M ${cx1},${cy3} L ${cx2},${cy3}`,   // back bottom
      `M ${cx3},${cy2} L ${cx3},${cy3}`,   // back right
      `M ${cx1},${cy3} L ${cx1},${cy4}`,   // back left edge
      `M ${cx2},${cy3} L ${cx2},${cy4}`,   // back right edge
    ],
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: cx1, y: cy1, w: W * s, h: H * s, label: 'Front' },
      { x: cx0, y: cy1, w: ear + d - ear, h: H * s, label: 'Left' },
      { x: cx2, y: cy1, w: ear + d - ear, h: H * s, label: 'Right' },
      { x: cx1, y: cy3, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: trayFoldNode(W, H, D * 0.5),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. BOÎTE À SOUFFLET PARTIEL — Partial Bellows Box (gusset sides)
//    The side panels are pleated (accordion fold) allowing expansion.
//    Classic for: cosmetics, food bags needing volume flexibility.
// ─────────────────────────────────────────────────────────────────────────────
export function computeSouffletPartiel(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const gusset = (D / 2) * s   // half the depth = gusset fold width

  // Layout: GLUE | BACK | gusset | FRONT | gusset | (seam)
  const x0 = 0, x1 = g, x2 = x1 + w, x3 = x2 + gusset, x4 = x3 + w, x5 = x4 + gusset, x6 = x5 + g
  const y0 = 0, y1 = gusset, y2 = y1 + h, y3 = y2 + gusset
  const totalW = x6, totalH = y3

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${x1},${y0} L ${x5},${y0} L ${x5},${y1} L ${x6},${y1} L ${x6},${y2} L ${x5},${y2} L ${x5},${y3} L ${x1},${y3} L ${x1},${y2} L ${x0},${y2} L ${x0},${y1} L ${x1},${y1} Z`,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`,
      `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y0} L ${x3},${y3}`,
      `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x5},${y0} L ${x5},${y3}`,
      `M ${x0},${y1} L ${x6},${y1}`,
      `M ${x0},${y2} L ${x6},${y2}`,
      // Gusset center folds (diagonal NOT possible in SVG path straight line, use H line at mid)
      `M ${x2},${y0} L ${x2},${y1}`,
      `M ${x4},${y0} L ${x4},${y1}`,
      `M ${x2},${y2} L ${x2},${y3}`,
      `M ${x4},${y2} L ${x4},${y3}`,
    ],
    gluePaths: [
      `M ${x0},${y1} L ${x1},${y1} L ${x1},${y2} L ${x0},${y2} Z`,
      `M ${x5},${y1} L ${x6},${y1} L ${x6},${y2} L ${x5},${y2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Back' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: y1, w: gusset, h: H * s, label: 'GussetL' },
      { x: x4, y: y1, w: gusset, h: H * s, label: 'GussetR' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BOÎTE À SOUFFLET FERMÉE — Closed Bellows Box
//    Same as partial but top and bottom are fully sealed with extra panels.
// ─────────────────────────────────────────────────────────────────────────────
export function computeSouffletFerme(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const gusset = (D / 2) * s
  const flap = (D / 2) * s

  const x0 = 0, x1 = g, x2 = x1 + w, x3 = x2 + gusset, x4 = x3 + w, x5 = x4 + gusset, x6 = x5 + g
  const y0 = 0, y1 = flap, y2 = y1 + h, y3 = y2 + flap
  const totalW = x6, totalH = y3

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${x1},${y0} L ${x5},${y0} L ${x5},${y3} L ${x1},${y3} Z`,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y0} L ${x3},${y3}`, `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x5},${y0} L ${x5},${y3}`,
      `M ${x1},${y1} L ${x5},${y1}`, `M ${x1},${y2} L ${x5},${y2}`,
    ],
    gluePaths: [
      `M ${x0},${y1} L ${x1},${y1} L ${x1},${y2} L ${x0},${y2} Z`,
      `M ${x5},${y1} L ${x6},${y1} L ${x6},${y2} L ${x5},${y2} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Back' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Front' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. BANDEROLE — Wrap-Around Sleeve (band / belly band)
//    A simple rectangular strip that wraps around a product.
//    No top/bottom — open on both ends.
// ─────────────────────────────────────────────────────────────────────────────
export function computeBanderole(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s

  // Total perimeter: Front + Side + Back + Side + glue
  const x0 = 0, x1 = w, x2 = x1 + d, x3 = x2 + w, x4 = x3 + d, x5 = x4 + g
  const y0 = 0, y1 = h
  const totalW = x5, totalH = y1

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${x0},${y0} L ${x5},${y0} L ${x5},${y1} L ${x0},${y1} Z`,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y1}`,
      `M ${x2},${y0} L ${x2},${y1}`,
      `M ${x3},${y0} L ${x3},${y1}`,
      `M ${x4},${y0} L ${x4},${y1}`,
    ],
    gluePaths: [`M ${x4},${y0} L ${x5},${y0} L ${x5},${y1} L ${x4},${y1} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: y0, w: W * s, h: H * s, label: 'Front' },
      { x: x1, y: y0, w: d, h: H * s, label: 'Side R' },
      { x: x2, y: y0, w: W * s, h: H * s, label: 'Back' },
      { x: x3, y: y0, w: d, h: H * s, label: 'Side L' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. BANDEROLE FINE — Narrow Sleeve (height = D only, like a band)
// ─────────────────────────────────────────────────────────────────────────────
export function computeBanderoleFine(p: BoxParams): DielineData {
  return computeBanderole({ ...p, height: p.depth * 0.5 })
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BOÎTE AVEC POIGNÉE — Handle Box (FEFCO 0215 variant)
//    Standard auto-bottom box + die-cut handle arch on top panel.
// ─────────────────────────────────────────────────────────────────────────────
export function computeHandleBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const hf = (D * 0.45) * s   // flap height

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = hf, y2 = y1 + h, y3 = y2 + hf
  const totalW = x5, totalH = y3

  // Handle arch die-cut: centered on front (x1→x2), top flap (y0→y1)
  const hx = (x1 + x2) / 2, hy = y1
  const hr = Math.min(w * 0.25, hf * 0.8)   // handle radius
  const handleCut = `M ${hx - hr},${hy} A ${hr},${hr} 0 0 1 ${hx + hr},${hy}`

  const mainCut = [
    `M ${x1},${y0} L ${x2},${y0} L ${x2},${y1}`,
    `L ${x5},${y1} L ${x5},${y2} L ${x4},${y2}`,
    `L ${x2},${y2} L ${x2},${y3} L ${x1},${y3}`,
    `L ${x1},${y2} L ${x0},${y2} L ${x0},${y1}`,
    `L ${x1},${y1} L ${x1},${y0} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: mainCut + ' ' + handleCut,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y1} L ${x3},${y2}`, `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`, `M ${x0},${y2} L ${x5},${y2}`,
    ],
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: y1, w: d, h: H * s, label: 'Left' },
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: y1, w: d, h: H * s, label: 'Right' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. BOÎTE À ACCROCHER — Hanging Display Box (euro slot on front top)
//    Standard tuck-end box + die-cut euro hang hole (6×4mm oval slot).
// ─────────────────────────────────────────────────────────────────────────────
export function computeHangingBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const tuck = Math.min(D * 0.8, 20) * s
  const tongue = 10 * s

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = tuck + tongue, y2 = y1 + h, y3 = y2 + tuck
  const totalW = x5, totalH = y3

  // Euro slot die-cut: 6×4mm oval centered on top flap above front panel
  const slotX = (x1 + x2) / 2, slotY = tongue / 2
  const slotW = 6 * s, slotH = 4 * s
  const euroSlot = `M ${slotX - slotW / 2},${slotY} A ${slotH / 2},${slotH / 2} 0 0 1 ${slotX + slotW / 2},${slotY} A ${slotH / 2},${slotH / 2} 0 0 1 ${slotX - slotW / 2},${slotY} Z`

  // Tongue tuck arc on top
  const tongueArc = `M ${x1},${y0} Q ${(x1 + x2) / 2},${-tongue * 0.3} ${x2},${y0}`

  const mainCut = [
    `M ${x1},${y0} L ${x2},${y0} L ${x2},${y1}`,
    `L ${x5},${y1} L ${x5},${y2} L ${x4},${y2}`,
    `L ${x2},${y2} L ${x2},${y3} L ${x1},${y3}`,
    `L ${x1},${y2} L ${x0},${y2} L ${x0},${y1}`,
    `L ${x1},${y1} L ${x1},${y0} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: mainCut + ' ' + euroSlot,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y1} L ${x3},${y2}`, `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`, `M ${x0},${y2} L ${x5},${y2}`,
      `M ${x1},${tongue} L ${x2},${tongue}`,
    ],
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: y1, w: d, h: H * s, label: 'Left' },
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: y1, w: d, h: H * s, label: 'Right' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: tuckEndFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. BOÎTE DISTRIBUTRICE — Dispenser Box (perforated front opening)
//    Counter/shelf display — front panel has a die-cut dispensing slot.
// ─────────────────────────────────────────────────────────────────────────────
export function computeDispenserBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const hf = (D * 0.45) * s

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = hf, y2 = y1 + h, y3 = y2 + hf
  const totalW = x5, totalH = y3

  // Front panel dispenser slot — rectangular cut covering lower 40% of front
  const slotMargin = w * 0.1
  const slotTop = y1 + h * 0.55, slotBot = y2 - hf * 0.3
  const dispenserSlot = `M ${x1 + slotMargin},${slotTop} L ${x2 - slotMargin},${slotTop} L ${x2 - slotMargin},${slotBot} L ${x1 + slotMargin},${slotBot} Z`

  const mainCut = [
    `M ${x1},${y0} L ${x2},${y0} L ${x2},${y1}`,
    `L ${x5},${y1} L ${x5},${y2} L ${x4},${y2}`,
    `L ${x2},${y2} L ${x2},${y3} L ${x1},${y3}`,
    `L ${x1},${y2} L ${x0},${y2} L ${x0},${y1}`,
    `L ${x1},${y1} L ${x1},${y0} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: mainCut + ' ' + dispenserSlot,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y1} L ${x3},${y2}`, `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`, `M ${x0},${y2} L ${x5},${y2}`,
    ],
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: y1, w: d, h: H * s, label: 'Left' },
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: y1, w: d, h: H * s, label: 'Right' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. BOÎTE PRÉSENTOIR — Counter Display Stand
//    Front panel is angled/shorter — creates a natural product display tilt.
//    The front is H * 0.6 height, back is full H.
// ─────────────────────────────────────────────────────────────────────────────
export function computeDisplayStand(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const frontH = h * 0.6   // shorter front = angled display
  const hf = d * 0.45

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  // Back (full H) + flaps
  const by0 = 0, by1 = hf, by2 = by1 + h, by3 = by2 + hf
  const totalW = x5, totalH = by3

  // Angled front cut (trapezoidal): bottom at full width, top is shorter
  const frontCut = [
    `M ${x1},${by3}`,
    `L ${x1 + w * 0.15},${by2 + hf}`,  // bottom of front flap angled
    `L ${x2 - w * 0.15},${by2 + hf}`,
    `L ${x2},${by3}`,
  ].join(' ')

  const mainCut = [
    `M ${x1},${by0} L ${x2},${by0} L ${x2},${by1}`,
    `L ${x5},${by1} L ${x5},${by2} L ${x4},${by2}`,
    `L ${x2},${by2} L ${x2},${by3} L ${x1},${by3}`,
    `L ${x1},${by2} L ${x0},${by2} L ${x0},${by1}`,
    `L ${x1},${by1} L ${x1},${by0} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: mainCut,
    foldLines: [
      `M ${x1},${by0} L ${x1},${by3}`, `M ${x2},${by1} L ${x2},${by2}`,
      `M ${x3},${by1} L ${x3},${by2}`, `M ${x4},${by1} L ${x4},${by2}`,
      `M ${x0},${by1} L ${x5},${by1}`, `M ${x0},${by2} L ${x5},${by2}`,
    ],
    gluePaths: [`M ${x4},${by1} L ${x5},${by1} L ${x5},${by2} L ${x4},${by2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: by1, w: d, h: H * s, label: 'Left' },
      { x: x1, y: by1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: by1, w: d, h: H * s, label: 'Right' },
      { x: x3, y: by1, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. BOÎTE BERLINGOT — Tetrahedral / Gable Top Carton
//     Classic milk/juice carton shape. Top seals diagonally.
//     Body = tube (Front+Back+Left+Right). Top = two diagonal-sealed flaps.
// ─────────────────────────────────────────────────────────────────────────────
export function computeBerlingot(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const topSeal = (W * 0.5) * s   // top seal flap height
  const bottomFlap = d * 0.5

  const x0 = 0, x1 = w, x2 = w + d, x3 = 2 * w + d, x4 = 2 * w + 2 * d, x5 = x4 + g
  const y0 = 0, y1 = topSeal, y2 = y1 + h, y3 = y2 + bottomFlap
  const totalW = x5, totalH = y3

  // Top diagonal seal lines
  const topMid = (y0 + y1) / 2

  // Custom fold node: body panels + triangular gable flaps with alpha shapes
  const PI2 = Math.PI / 2
  const topSealMm = W * 0.5   // mm
  const botFlapMm = D * 0.5   // mm
  const berlingotNode = {
    ...boxFoldNode(W, H, D),
    children: [
      // Bottom gable flap — triangular seal, tip pointing UP
      { id: 'Bottom', face: 'bottom' as const, w: W, h: botFlapMm,
        alphaShape: { type: 'triangle' as const, tipEdge: 'top' as const },
        hinge: { pivotPos: [0, -H/2, 0] as [number,number,number], panelPos: [0, -botFlapMm/2, 0] as [number,number,number], axis: [1,0,0] as [number,number,number], angle: PI2, seq: [0.00, 0.18] as [number,number] },
        children: [] },
      // Top gable flap — triangular seal, tip pointing DOWN (base at top)
      { id: 'Top', face: 'top' as const, w: W, h: topSealMm,
        alphaShape: { type: 'triangle' as const, tipEdge: 'bottom' as const },
        hinge: { pivotPos: [0, H/2, 0] as [number,number,number], panelPos: [0, topSealMm/2, 0] as [number,number,number], axis: [1,0,0] as [number,number,number], angle: -PI2, seq: [0.05, 0.30] as [number,number] },
        children: [] },
      // Side panels (rectangular, no alpha)
      { id: 'Left', face: 'left' as const, w: D, h: H,
        hinge: { pivotPos: [-W/2, 0, 0] as [number,number,number], panelPos: [-D/2, 0, 0] as [number,number,number], axis: [0,1,0] as [number,number,number], angle: -PI2, seq: [0.20, 0.55] as [number,number] },
        children: [] },
      { id: 'Right', face: 'right' as const, w: D, h: H,
        hinge: { pivotPos: [W/2, 0, 0] as [number,number,number], panelPos: [D/2, 0, 0] as [number,number,number], axis: [0,1,0] as [number,number,number], angle: PI2, seq: [0.20, 0.55] as [number,number] },
        children: [
          { id: 'Back', face: 'back' as const, w: W, h: H,
            hinge: { pivotPos: [D, 0, 0] as [number,number,number], panelPos: [W/2, 0, 0] as [number,number,number], axis: [0,1,0] as [number,number,number], angle: PI2, seq: [0.50, 0.85] as [number,number] },
            children: [] },
        ] },
    ],
  }

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${x0},${y0} L ${x5},${y0} L ${x5},${y3} L ${x0},${y3} Z`,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y0} L ${x2},${y3}`,
      `M ${x3},${y0} L ${x3},${y3}`, `M ${x4},${y0} L ${x4},${y3}`,
      `M ${x0},${y1} L ${x5},${y1}`,   // body top
      `M ${x0},${y2} L ${x5},${y2}`,   // body bottom
      // Diagonal gable seals
      `M ${x0},${y0} L ${x1},${topMid}`,
      `M ${x1},${topMid} L ${x2},${y0}`,
      `M ${x2},${y0} L ${x3},${topMid}`,
      `M ${x3},${topMid} L ${x4},${y0}`,
    ],
    gluePaths: [`M ${x4},${y0} L ${x5},${y0} L ${x5},${y3} L ${x4},${y3} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x0, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x1, y: y1, w: d, h: H * s, label: 'Right' },
      { x: x2, y: y1, w: W * s, h: H * s, label: 'Back' },
      { x: x3, y: y1, w: d, h: H * s, label: 'Left' },
    ],
    foldNode: berlingotNode,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. FOURREAU FOND AUTOMATIQUE — Auto-Lock Sleeve Box
//     Tube (front+back+sides) with auto-lock bottom (crash-lock style).
//     Top is open (display box use). No glue needed on bottom.
// ─────────────────────────────────────────────────────────────────────────────
export function computeFourreauAuto(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const lockFlap = d * 0.9   // auto-lock flap = slightly under depth

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = lockFlap, y2 = y1 + h
  const totalW = x5, totalH = y2

  // Auto-lock cuts: two diagonal slots on the lock flaps
  const slotDepth = lockFlap * 0.35
  const leftSlotCut  = `M ${x0},${y1 - slotDepth} L ${d * 0.4},${y1} L ${x0},${y1} Z`
  const rightSlotCut = `M ${x5},${y1 - slotDepth} L ${x5 - d * 0.4},${y1} L ${x5},${y1} Z`

  const mainCut = `M ${x0},${y0} L ${x5},${y0} L ${x5},${y2} L ${x0},${y2} Z`

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: mainCut + ' ' + leftSlotCut + ' ' + rightSlotCut,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y2}`, `M ${x2},${y0} L ${x2},${y2}`,
      `M ${x3},${y0} L ${x3},${y2}`, `M ${x4},${y0} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`,   // lock line
    ],
    gluePaths: [`M ${x4},${y0} L ${x5},${y0} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w: W * s, h: (H - D * 0.9) * s, label: 'Front' },
      { x: x2, y: y1, w: d, h: (H - D * 0.9) * s, label: 'Right' },
      { x: x3, y: y1, w: W * s, h: (H - D * 0.9) * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 12. FOURREAU FOND SEMI-AUTOMATIQUE — Semi-Auto Sleeve
//     Like FourreauAuto but bottom requires one glue application.
// ─────────────────────────────────────────────────────────────────────────────
export function computeFourreauSemiAuto(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const flap = d * 0.5

  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = flap, y2 = y1 + h
  const totalW = x5, totalH = y2

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${x0},${y0} L ${x5},${y0} L ${x5},${y2} L ${x0},${y2} Z`,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y2}`, `M ${x2},${y0} L ${x2},${y2}`,
      `M ${x3},${y0} L ${x3},${y2}`, `M ${x4},${y0} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`,
    ],
    gluePaths: [
      `M ${x4},${y0} L ${x5},${y0} L ${x5},${y1} L ${x4},${y1} Z`,
      `M ${x1},${y0} L ${x2},${y0} L ${x2},${y1} L ${x1},${y1} Z`,
    ],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: x1, y: y1, w: W * s, h: (H - D * 0.5) * s, label: 'Front' },
      { x: x3, y: y1, w: W * s, h: (H - D * 0.5) * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13. CALAGE / INSERT — Internal Padding Insert (accordion divider)
//     A flat blank with multiple vertical scores — folds into a cell divider.
//     N = number of cells = p.depth (reused as cell count, min 2).
// ─────────────────────────────────────────────────────────────────────────────
export function computeCalageInsert(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const h = H * s, b = B * s
  const cells = Math.max(2, Math.round(D))   // D reused as cell count
  const cellW = (W / cells) * s
  const totalW = W * s, totalH = h

  const foldLines: string[] = []
  for (let i = 1; i < cells; i++) {
    foldLines.push(`M ${i * cellW},${0} L ${i * cellW},${h}`)
  }

  const panels: Array<{x: number; y: number; w: number; h: number; label: string}> = []
  for (let i = 0; i < cells; i++) {
    panels.push({ x: i * cellW, y: 0, w: cellW, h, label: `Cell ${i + 1}` })
  }

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${0},${0} L ${totalW},${0} L ${totalW},${h} L ${0},${h} Z`,
    foldLines,
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels,
    foldNode: {
      id: 'Insert', face: 'front', w: W, h: H,
      worldPos: [0, 0, 0],
      children: [],
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 14. SÉPARATEUR — Box Divider (central fold, 2 halves)
//     A simple scored panel that folds to create an internal partition.
// ─────────────────────────────────────────────────────────────────────────────
export function computeSeparateur(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const w = W * s, h = H * s, b = B * s
  const totalW = w * 2, totalH = h

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: `M ${0},${0} L ${totalW},${0} L ${totalW},${h} L ${0},${h} Z`,
    foldLines: [`M ${w},${0} L ${w},${h}`],
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: 0, y: 0, w, h, label: 'Half A' },
      { x: w, y: 0, w, h, label: 'Half B' },
    ],
    foldNode: {
      id: 'HalfA', face: 'front', w: W, h: H,
      worldPos: [0, 0, 0],
      children: [{
        id: 'HalfB', face: 'back', w: W, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0], panelPos: [W / 2, 0, 0],
          axis: [0, 1, 0], angle: Math.PI, seq: [0.2, 0.8],
        },
        children: [],
      }],
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 15. ÉTIQUETTE FERME-SAC OVALE — Oval Bag Seal Label
//     Flat oval/round label with die-cut slot to close a bag opening.
//     Width = label W, Height = label H. Slot = W*0.4 × H*0.12 centered.
// ─────────────────────────────────────────────────────────────────────────────
export function computeEtiquetteSacOvale(p: BoxParams): DielineData {
  const { width: W, height: H, bleed: B } = p
  const w = W * s, h = H * s, b = B * s
  const rx = w / 2, ry = h / 2
  const cx = w / 2, cy = h / 2
  const totalW = w, totalH = h

  // Oval outer cut
  const ovalCut = `M ${cx + rx},${cy} A ${rx},${ry} 0 1 1 ${cx - rx},${cy} A ${rx},${ry} 0 1 1 ${cx + rx},${cy} Z`

  // Slot die-cut (bag neck slot)
  const slotW = w * 0.35, slotH = h * 0.15
  const slotX = cx - slotW / 2, slotY = cy - slotH / 2
  const slotRx = slotH / 2, slotRy = slotH / 2
  const slotCut = `M ${slotX},${slotY + slotRy} A ${slotRx},${slotRy} 0 0 1 ${slotX + slotH},${slotY + slotRy} L ${slotX + slotW - slotH},${slotY + slotRy} A ${slotRx},${slotRy} 0 0 1 ${slotX + slotW - slotH},${slotY + slotH - slotRy} L ${slotX + slotH},${slotY + slotH - slotRy} A ${slotRx},${slotRy} 0 0 1 ${slotX},${slotY + slotH - slotRy} Z`

  // Euro hole (top)
  const holeR = 3 * s, holeX = cx, holeY = ry * 0.35
  const holeCut = `M ${holeX + holeR},${holeY} A ${holeR},${holeR} 0 1 1 ${holeX - holeR},${holeY} A ${holeR},${holeR} 0 1 1 ${holeX + holeR},${holeY} Z`

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath: ovalCut + ' ' + slotCut + ' ' + holeCut,
    foldLines: [],
    gluePaths: [],
    bleedPath: `M ${cx + rx + b},${cy} A ${rx + b},${ry + b} 0 1 1 ${cx - rx - b},${cy} A ${rx + b},${ry + b} 0 1 1 ${cx + rx + b},${cy} Z`,
    panels: [{ x: slotX, y: h * 0.15, w: slotW, h: h * 0.7, label: 'Label' }],
    foldNode: {
      id: 'Label', face: 'front', w: W, h: H, worldPos: [0, 0, 0], children: [],
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 16. PLATEAU SANS POINTS DE COLLAGE — Snap-Fit Tray (no glue)
//     Four corner tabs interlock with slots — no adhesive needed.
//     Standard for retail trays and inserts.
// ─────────────────────────────────────────────────────────────────────────────
export function computePlateauSnap(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, b = B * s
  const tab = d * 0.35   // lock tab width

  // Cross layout: center = bottom, 4 sides fold up
  const cx0 = d, cx1 = d + w, cy0 = d, cy1 = d + h
  const totalW = 2 * d + w, totalH = 2 * d + h

  // Corner notches for interlocking tabs
  const notch = tab
  const cutPath = [
    // Top side panel
    `M ${cx0},${0} L ${cx1},${0} L ${cx1},${cy0} L ${cx0},${cy0} Z`,
    // Bottom side panel
    `M ${cx0},${cy1} L ${cx1},${cy1} L ${cx1},${totalH} L ${cx0},${totalH} Z`,
    // Left side panel
    `M ${0},${cy0} L ${cx0},${cy0} L ${cx0},${cy1} L ${0},${cy1} Z`,
    // Right side panel
    `M ${cx1},${cy0} L ${totalW},${cy0} L ${totalW},${cy1} L ${cx1},${cy1} Z`,
    // Bottom
    `M ${cx0},${cy0} L ${cx1},${cy0} L ${cx1},${cy1} L ${cx0},${cy1} Z`,
    // Lock slots in corners
    `M ${cx0},${cy0} L ${cx0 + notch},${cy0} L ${cx0 + notch},${cy0 + notch} L ${cx0},${cy0 + notch} Z`,
    `M ${cx1 - notch},${cy0} L ${cx1},${cy0} L ${cx1},${cy0 + notch} L ${cx1 - notch},${cy0 + notch} Z`,
    `M ${cx0},${cy1 - notch} L ${cx0 + notch},${cy1 - notch} L ${cx0 + notch},${cy1} L ${cx0},${cy1} Z`,
    `M ${cx1 - notch},${cy1 - notch} L ${cx1},${cy1 - notch} L ${cx1},${cy1} L ${cx1 - notch},${cy1} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: totalH + b * 2,
    cutPath,
    foldLines: [
      `M ${cx0},${0} L ${cx0},${totalH}`,
      `M ${cx1},${0} L ${cx1},${totalH}`,
      `M ${0},${cy0} L ${totalW},${cy0}`,
      `M ${0},${cy1} L ${totalW},${cy1}`,
    ],
    gluePaths: [],
    bleedPath: bleedRect(totalW, totalH, b),
    panels: [
      { x: cx0, y: cy0, w: W * s, h: H * s, label: 'Bottom' },
      { x: cx0, y: 0, w: W * s, h: d, label: 'Front Flap' },
      { x: cx0, y: cy1, w: W * s, h: d, label: 'Back Flap' },
      { x: 0, y: cy0, w: d, h: H * s, label: 'Left Flap' },
      { x: cx1, y: cy0, w: d, h: H * s, label: 'Right Flap' },
    ],
    foldNode: trayFoldNode(W, H, D),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 17. BOÎTE DELUXE À SOUFFLET — Deluxe Gusset Box
//     Premium box: full RSC body + gusset (soufflet) side inserts.
//     The gusset adds structured sides that collapse flat for shipping.
// ─────────────────────────────────────────────────────────────────────────────
export function computeDeluxeSoufflet(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const w = W * s, h = H * s, d = D * s, g = G * s, b = B * s
  const gusset = (D * 0.5) * s
  const hf = (D * 0.45) * s

  // Main body: like RSC
  const x0 = 0, x1 = d, x2 = d + w, x3 = 2 * d + w, x4 = 2 * d + 2 * w, x5 = x4 + g
  const y0 = 0, y1 = hf, y2 = y1 + h, y3 = y2 + hf
  const totalW = x5, totalH = y3

  // Gusset side panels printed below main body
  const gx0 = x1 + w * 0.1, gx1 = x2 - w * 0.1
  const gy0 = totalH + 8 * s, gy1 = gy0 + d, gy2 = gy1 + gusset * 2, gy3 = gy2 + d
  const gussetPanel = `M ${gx0},${gy0} L ${gx1},${gy0} L ${gx1},${gy3} L ${gx0},${gy3} Z`
  const gussetFoldLine = `M ${gx0},${gy1} L ${gx1},${gy1} M ${gx0},${gy2} L ${gx1},${gy2}`

  const gTotalH = gy3

  const mainCut = [
    `M ${x1},${y0} L ${x2},${y0} L ${x2},${y1}`,
    `L ${x5},${y1} L ${x5},${y2} L ${x4},${y2}`,
    `L ${x2},${y2} L ${x2},${y3} L ${x1},${y3}`,
    `L ${x1},${y2} L ${x0},${y2} L ${x0},${y1}`,
    `L ${x1},${y1} L ${x1},${y0} Z`,
  ].join(' ')

  return {
    svgWidth: totalW + b * 2, svgHeight: gTotalH + b * 2,
    cutPath: mainCut + ' ' + gussetPanel,
    foldLines: [
      `M ${x1},${y0} L ${x1},${y3}`, `M ${x2},${y1} L ${x2},${y2}`,
      `M ${x3},${y1} L ${x3},${y2}`, `M ${x4},${y1} L ${x4},${y2}`,
      `M ${x0},${y1} L ${x5},${y1}`, `M ${x0},${y2} L ${x5},${y2}`,
      gussetFoldLine,
    ],
    gluePaths: [`M ${x4},${y1} L ${x5},${y1} L ${x5},${y2} L ${x4},${y2} Z`],
    bleedPath: bleedRect(totalW, gTotalH, b),
    panels: [
      { x: x0, y: y1, w: d, h: H * s, label: 'Left' },
      { x: x1, y: y1, w: W * s, h: H * s, label: 'Front' },
      { x: x2, y: y1, w: d, h: H * s, label: 'Right' },
      { x: x3, y: y1, w: W * s, h: H * s, label: 'Back' },
    ],
    foldNode: boxFoldNode(W, H, D),
  }
}
