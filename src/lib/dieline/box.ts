import type { BoxParams } from '../types'
import { MM_TO_PX, bleedRect, type DielineData, type FoldNode, type FaceName } from './helpers'

// Shared fold tree for all 4-panel tube templates (box, tuck-end, seal-end, etc.)
export function boxFoldNode(W: number, H: number, D: number): FoldNode {
  const PI2 = Math.PI / 2
  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'Bottom', face: 'bottom', w: W, h: D,
        hinge: { pivotPos: [0, -H/2, 0], panelPos: [0, -D/2, 0], axis: [1,0,0], angle:  PI2, seq: [0.00, 0.18] },
        children: [] },
      { id: 'Top', face: 'top', w: W, h: D,
        hinge: { pivotPos: [0,  H/2, 0], panelPos: [0,  D/2, 0], axis: [1,0,0], angle: -PI2, seq: [0.05, 0.25] },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: { pivotPos: [-W/2, 0, 0], panelPos: [-D/2, 0, 0], axis: [0,1,0], angle: -PI2, seq: [0.20, 0.55] },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: { pivotPos: [W/2, 0, 0], panelPos: [D/2, 0, 0], axis: [0,1,0], angle: PI2, seq: [0.20, 0.55] },
        children: [
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: { pivotPos: [D, 0, 0], panelPos: [W/2, 0, 0], axis: [0,1,0], angle: PI2, seq: [0.50, 0.85] },
            children: [] },
        ] },
    ],
  }
}

// Tuck-end fold tree: same as boxFoldNode but with tuckTongue alpha shapes on top/bottom flaps.
// roundFrac controls how wide the rounded tongue corners are (0.2 = narrow, 0.35 = wide).
export function tuckEndFoldNode(W: number, H: number, D: number, roundFrac = 0.25): FoldNode {
  const PI2 = Math.PI / 2
  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'Bottom', face: 'bottom', w: W, h: D,
        alphaShape: { type: 'tuckTongue', roundFrac },
        hinge: { pivotPos: [0, -H/2, 0], panelPos: [0, -D/2, 0], axis: [1,0,0], angle:  PI2, seq: [0.00, 0.18] },
        children: [] },
      { id: 'Top', face: 'top', w: W, h: D,
        alphaShape: { type: 'tuckTongue', roundFrac },
        hinge: { pivotPos: [0,  H/2, 0], panelPos: [0,  D/2, 0], axis: [1,0,0], angle: -PI2, seq: [0.05, 0.25] },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: { pivotPos: [-W/2, 0, 0], panelPos: [-D/2, 0, 0], axis: [0,1,0], angle: -PI2, seq: [0.20, 0.55] },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: { pivotPos: [W/2, 0, 0], panelPos: [D/2, 0, 0], axis: [0,1,0], angle: PI2, seq: [0.20, 0.55] },
        children: [
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: { pivotPos: [D, 0, 0], panelPos: [W/2, 0, 0], axis: [0,1,0], angle: PI2, seq: [0.50, 0.85] },
            children: [] },
        ] },
    ],
  }
}

// N-sided polygon tube (hexagonal, octagonal, etc.)
// sideWidth = width of each face panel in mm, H = body height in mm
export function buildPolygonFoldNode(nSides: number, sideWidth: number, H: number): FoldNode {
  const foldAngle = (2 * Math.PI) / nSides
  const inRadius  = sideWidth / (2 * Math.tan(Math.PI / nSides))
  const faceNames: FaceName[] = ['front', 'right', 'back', 'left', 'flap', 'glue']

  const root: FoldNode = {
    id: 'Face_0', face: 'front', w: sideWidth, h: H,
    worldPos: [0, 0, inRadius],
    children: [],
  }

  let parent = root
  for (let i = 1; i < nSides; i++) {
    const isGlue = i === nSides - 1
    const face   = isGlue ? 'glue' : (faceNames[i] ?? 'flap') as FaceName
    const spread = 0.35 / nSides
    const child: FoldNode = {
      id: isGlue ? 'Glue' : `Face_${i}`,
      face,
      w: sideWidth, h: H,
      isGlue,
      hinge: {
        pivotPos: [sideWidth / 2, 0, 0],
        panelPos: [sideWidth / 2, 0, 0],
        axis:     [0, 1, 0],
        angle:    foldAngle,
        seq:      [
          parseFloat((0.15 + i * spread).toFixed(3)),
          parseFloat((0.55 + i * spread).toFixed(3)),
        ],
        easing: 'cubic',
      },
      children: [],
    }
    parent.children.push(child)
    parent = child
  }

  return root
}

// Tray FoldNode (cross-shaped: bottom + 4 walls fold up)
export function trayFoldNode(W: number, D: number, H: number): FoldNode {
  const PI2 = Math.PI / 2
  return {
    id: 'Bottom', face: 'bottom', w: W, h: D,
    worldPos: [0, 0, 0],
    children: [
      { id: 'Front', face: 'front', w: W, h: H,
        hinge: { pivotPos: [0, D/2, 0], panelPos: [0, H/2, 0], axis: [1,0,0], angle: -PI2, seq: [0.20, 0.55] },
        children: [] },
      { id: 'Back', face: 'back', w: W, h: H,
        hinge: { pivotPos: [0, -D/2, 0], panelPos: [0, -H/2, 0], axis: [1,0,0], angle: PI2, seq: [0.20, 0.55] },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: { pivotPos: [-W/2, 0, 0], panelPos: [-H/2, 0, 0], axis: [0,1,0], angle: -PI2, seq: [0.30, 0.65] },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: { pivotPos: [W/2, 0, 0], panelPos: [H/2, 0, 0], axis: [0,1,0], angle: PI2, seq: [0.30, 0.65] },
        children: [] },
    ],
  }
}

// Standard RSC / Mailer box
export function computeBox(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const hf = (D/2)*s
  const cf = Math.min(d*0.4, hf*0.8, h*0.2)

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
    // Dust-flap diagonals LEFT
    `M ${x0+cf},${y1} L ${x0},${y1+cf}`,
    `M ${x1-cf},${y1} L ${x1},${y1+cf}`,
    `M ${x0},${y2-cf} L ${x0+cf},${y2}`,
    `M ${x1},${y2-cf} L ${x1-cf},${y2}`,
    // Dust-flap diagonals RIGHT
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

// Tuck-End Box: full-width top+bottom tuck flaps, side dust flaps
export function computeTuckEnd(p: BoxParams): DielineData {
  const { width: W, height: H, depth: D, glueTab: G, bleed: B } = p
  const s = MM_TO_PX
  const w = W*s, h = H*s, d = D*s, g = G*s, b = B*s
  const tf = d * 0.9   // tuck flap height
  const df = d * 0.45  // dust flap height
  const ts = d * 0.12  // tongue size on tuck flap

  const x0=0, x1=d, x2=d+w, x3=2*d+w, x4=2*d+2*w, x5=2*d+2*w+g
  const y0=0, y1=tf, y2=tf+h, y3=tf+h+tf

  const tkMid = (x1+x2)/2
  const tkW = w*0.35
  const topTuck = [
    `M ${x0},${y1}`, `L ${x0},${y1-df}`,
    `L ${x1},${y1-df}`,
    `L ${x1},${y0}`,
    `L ${tkMid-tkW/2},${y0}`,
    `Q ${tkMid},${-ts} ${tkMid+tkW/2},${y0}`,
    `L ${x2},${y0}`,
    `L ${x2},${y1-df}`,
    `L ${x3},${y1-df}`,
    `L ${x3},${y1}`,
  ]

  const btMid = (x1+x2)/2
  const btW = w*0.35
  const botTuck = [
    `L ${x3},${y2}`,
    `L ${x3},${y2+df}`,
    `L ${x2},${y2+df}`,
    `L ${x2},${y3}`,
    `L ${btMid+btW/2},${y3}`,
    `Q ${btMid},${y3+ts} ${btMid-btW/2},${y3}`,
    `L ${x1},${y3}`,
    `L ${x1},${y2+df}`,
    `L ${x0},${y2+df}`,
    `L ${x0},${y2}`,
  ]

  const cutPath = [
    ...topTuck,
    `L ${x5},${y1}`, `L ${x5},${y2}`,
    ...botTuck,
    `Z`,
  ].join(' ')

  const foldLines = [
    `M ${x1},${y0} L ${x1},${y3}`,
    `M ${x2},${y1} L ${x2},${y2}`,
    `M ${x3},${y1} L ${x3},${y2}`,
    `M ${x4},${y1} L ${x4},${y2}`,
    `M ${x0},${y1} L ${x5},${y1}`,
    `M ${x0},${y2} L ${x5},${y2}`,
    `M ${x0},${y1-df} L ${x1},${y1-df}`,
    `M ${x2},${y1-df} L ${x3},${y1-df}`,
    `M ${x0},${y2+df} L ${x1},${y2+df}`,
    `M ${x2},${y2+df} L ${x3},${y2+df}`,
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
    foldNode: tuckEndFoldNode(W, H, D),
  }
}
