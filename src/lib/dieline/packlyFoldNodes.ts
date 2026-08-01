// packlyFoldNodes.ts — Packly-accurate FoldNode builders for every article code.
// Proportions derived from Packly's scraped blank data and 3D API animation params.

import type { FoldNode } from './helpers'

const PI2 = Math.PI / 2
// 120° — Packly's animation.rotation.stopAt = 120 for tuck-end groups
const TUCK = (120 * Math.PI) / 180

// ── Tuck-end box (s001, s023) ─────────────────────────────────────────────────
export function packlyTuckFoldNode(W: number, H: number, D: number): FoldNode {
  const dustH = D * 0.475
  const tuckH = Math.min(D * 0.987, H * 0.72)

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'TopFlap', face: 'top', w: W, h: tuckH,
        alphaShape: { type: 'tuckTongue', roundFrac: 0.22 },
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, tuckH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -TUCK,
          seq:      [0.62, 0.97] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.20, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopDustL', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.65] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'BotDustL', face: 'bottom', w: D, h: dustH,
            hinge: {
              pivotPos: [-D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.22] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.20, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopDustR', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.65] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'BotDustR', face: 'bottom', w: D, h: dustH,
            hinge: {
              pivotPos: [D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.22] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.45, 0.82] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'BotFlap', face: 'bottom', w: W, h: tuckH,
                alphaShape: { type: 'tuckTongue', roundFrac: 0.22 },
                hinge: {
                  pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                  panelPos: [0, -tuckH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -TUCK,
                  seq:      [0.02, 0.38] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
            ] },
        ] },
    ],
  }
}

// ── Open-top snap tray (s011, s013) ───────────────────────────────────────────
export function packlySnapTrayFoldNode(W: number, H: number, D: number): FoldNode {
  return {
    id: 'Bottom', face: 'bottom', w: W, h: D,
    worldPos: [0, 0, 0],
    children: [
      { id: 'Front', face: 'front', w: W, h: H,
        hinge: {
          pivotPos: [0, D / 2, 0] as [number, number, number],
          panelPos: [0, H / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.20, 0.55] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Back', face: 'back', w: W, h: H,
        hinge: {
          pivotPos: [0, -D / 2, 0] as [number, number, number],
          panelPos: [0, -H / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.20, 0.55] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-H / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.30, 0.65] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [H / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.30, 0.65] as [number, number],
          easing:   'cubic',
        },
        children: [] },
    ],
  }
}

// ── Crash-lock / auto-bottom (s004, s006, s009, s014) ────────────────────────
export function packlyAutoBottomFoldNode(W: number, H: number, D: number): FoldNode {
  const snapH = D * 0.70
  const tuckH = D * 0.987
  const dustH = D * 0.475

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'TopFlap', face: 'top', w: W, h: tuckH,
        alphaShape: { type: 'tuckTongue', roundFrac: 0.22 },
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, tuckH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -TUCK,
          seq:      [0.60, 0.97] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.20, 0.52] as [number, number],
        },
        children: [
          { id: 'TopDustL', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.65] as [number, number],
            },
            children: [] },
          { id: 'BotSnapL', face: 'bottom', w: D, h: snapH,
            hinge: {
              pivotPos: [-D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -snapH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.30] as [number, number],
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.20, 0.52] as [number, number],
        },
        children: [
          { id: 'TopDustR', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.65] as [number, number],
            },
            children: [] },
          { id: 'BotSnapR', face: 'bottom', w: D, h: snapH,
            hinge: {
              pivotPos: [D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -snapH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.30] as [number, number],
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.45, 0.82] as [number, number],
            },
            children: [
              { id: 'BotFlap', face: 'bottom', w: W, h: tuckH,
                hinge: {
                  pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                  panelPos: [0, -tuckH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -TUCK,
                  seq:      [0.30, 0.55] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
            ] },
        ] },
    ],
  }
}

// ── Sleeve / band (s012) ──────────────────────────────────────────────────────
export function packlySleeveFoldNode(W: number, H: number, D: number): FoldNode {
  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.10, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.10, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.40, 0.85] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
    ],
  }
}

// ── Rollover hinged lid box (s002, s003) ──────────────────────────────────────
export function packlyLidBoxFoldNode(W: number, H: number, D: number): FoldNode {
  const dustH = D * 0.45
  const rollH = Math.min(H * 0.25, D * 0.35)

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'Bottom', face: 'bottom', w: W, h: D,
        hinge: {
          pivotPos: [0, -H / 2, 0] as [number, number, number],
          panelPos: [0, -D / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.00, 0.20] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'LidDustL', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.65, 0.88] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'LidDustR', face: 'top', w: D, h: dustH,
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, dustH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.65, 0.88] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.38, 0.75] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'LidTop', face: 'top', w: W, h: D,
                hinge: {
                  pivotPos: [0, H / 2, 0] as [number, number, number],
                  panelPos: [0, D / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -PI2,
                  seq:      [0.68, 1.00] as [number, number],
                  easing:   'easeOut',
                },
                children: [
                  { id: 'LidFront', face: 'front', w: W, h: rollH,
                    hinge: {
                      pivotPos: [0, D / 2, 0] as [number, number, number],
                      panelPos: [0, rollH / 2, 0] as [number, number, number],
                      axis:     [1, 0, 0] as [number, number, number],
                      angle:    PI2,
                      seq:      [0.82, 1.00] as [number, number],
                      easing:   'easeOut',
                    },
                    children: [] },
                ] },
            ] },
        ] },
    ],
  }
}

// ── Gable top box (s016, s017, s027) ─────────────────────────────────────────
export function packlyGableFoldNode(W: number, H: number, D: number): FoldNode {
  const gH    = W * 0.50
  const earH  = D * 0.45
  const snapH = D * 0.70
  const botH  = Math.min(D * 0.987, H * 0.72)

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'GableFront', face: 'top', w: W, h: gH,
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, gH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.65, 1.00] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'EarL', face: 'top', w: D, h: earH,
            alphaShape: { type: 'triangle', tipEdge: 'top' },
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, earH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.50, 0.70] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'BotSnapL', face: 'bottom', w: D, h: snapH,
            hinge: {
              pivotPos: [-D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -snapH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.28] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'EarR', face: 'top', w: D, h: earH,
            alphaShape: { type: 'triangle', tipEdge: 'top' },
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, earH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.50, 0.70] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'BotSnapR', face: 'bottom', w: D, h: snapH,
            hinge: {
              pivotPos: [D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -snapH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.28] as [number, number],
              easing:   'cubic',
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.42, 0.78] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'GableBack', face: 'top', w: W, h: gH,
                hinge: {
                  pivotPos: [0, H / 2, 0] as [number, number, number],
                  panelPos: [0, gH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -PI2,
                  seq:      [0.65, 1.00] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
              { id: 'BotFlap', face: 'bottom', w: W, h: botH,
                hinge: {
                  pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                  panelPos: [0, -botH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -TUCK,
                  seq:      [0.28, 0.55] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
            ] },
        ] },
    ],
  }
}

// ── Hanging box (s007) ────────────────────────────────────────────────────────
// Tuck-end with Euro arch hang hole on the top tuck flap.
export function packlyHangingBoxFoldNode(W: number, H: number, D: number): FoldNode {
  const node = packlyTuckFoldNode(W, H, D)
  node.children[0].alphaShape = { type: 'archCut', radiusFrac: 0.28, archEdge: 'bottom' }
  return node
}

// ── Handle box (s010, s026) ───────────────────────────────────────────────────
// Tuck-end with arch handle die-cut on Front and Back panels.
export function packlyHandleBoxFoldNode(W: number, H: number, D: number): FoldNode {
  const node = packlyTuckFoldNode(W, H, D)
  node.alphaShape = { type: 'archCut', radiusFrac: 0.32, archEdge: 'top' }
  // Back is Right.children[2]
  const back = node.children[2]?.children[2]
  if (back) back.alphaShape = { type: 'archCut', radiusFrac: 0.32, archEdge: 'top' }
  return node
}

// ── Full-overlap seal-end (s018) ──────────────────────────────────────────────
// All 4 faces contribute D/2-height flaps. Minor flaps (Left/Right) close first.
export function packlySealEndFoldNode(W: number, H: number, D: number): FoldNode {
  const flH = D * 0.50

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'TopFlap', face: 'top', w: W, h: flH,
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, flH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.65, 0.98] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'BotFlap', face: 'bottom', w: W, h: flH,
        hinge: {
          pivotPos: [0, -H / 2, 0] as [number, number, number],
          panelPos: [0, -flH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.65, 0.98] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.20, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopDustL', face: 'top', w: D, h: flH,
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, flH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.68] as [number, number],
            },
            children: [] },
          { id: 'BotDustL', face: 'bottom', w: D, h: flH,
            hinge: {
              pivotPos: [-D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -flH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.25] as [number, number],
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.20, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopDustR', face: 'top', w: D, h: flH,
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, flH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.44, 0.68] as [number, number],
            },
            children: [] },
          { id: 'BotDustR', face: 'bottom', w: D, h: flH,
            hinge: {
              pivotPos: [D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -flH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.25] as [number, number],
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.45, 0.82] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'TopFlapBack', face: 'top', w: W, h: flH,
                hinge: {
                  pivotPos: [W / 2, H / 2, 0] as [number, number, number],
                  panelPos: [0, flH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -PI2,
                  seq:      [0.55, 0.85] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
              { id: 'BotFlapBack', face: 'bottom', w: W, h: flH,
                hinge: {
                  pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                  panelPos: [0, -flH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    PI2,
                  seq:      [0.55, 0.85] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
            ] },
        ] },
    ],
  }
}

// ── RSC Mailer box (s035, s036, s020) ────────────────────────────────────────
// Inner flaps from sides (h≈D/2) close first; major flaps from Front/Back (h≈D) seal last.
export function packlyMailerFoldNode(W: number, H: number, D: number): FoldNode {
  const minorH = D * 0.48
  const majorH = D * 0.98

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'TopMajor', face: 'top', w: W, h: majorH,
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, majorH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.65, 0.98] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'BotMajor', face: 'bottom', w: W, h: majorH,
        hinge: {
          pivotPos: [0, -H / 2, 0] as [number, number, number],
          panelPos: [0, -majorH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.65, 0.98] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.15, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopMinorL', face: 'top', w: D, h: minorH,
            hinge: {
              pivotPos: [-D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, minorH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.40, 0.65] as [number, number],
            },
            children: [] },
          { id: 'BotMinorL', face: 'bottom', w: D, h: minorH,
            hinge: {
              pivotPos: [-D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -minorH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.25] as [number, number],
            },
            children: [] },
        ] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.15, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'TopMinorR', face: 'top', w: D, h: minorH,
            hinge: {
              pivotPos: [D / 2, H / 2, 0] as [number, number, number],
              panelPos: [0, minorH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.40, 0.65] as [number, number],
            },
            children: [] },
          { id: 'BotMinorR', face: 'bottom', w: D, h: minorH,
            hinge: {
              pivotPos: [D / 2, -H / 2, 0] as [number, number, number],
              panelPos: [0, -minorH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.01, 0.25] as [number, number],
            },
            children: [] },
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.42, 0.80] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'TopMajorBack', face: 'top', w: W, h: majorH,
                hinge: {
                  pivotPos: [W / 2, H / 2, 0] as [number, number, number],
                  panelPos: [0, majorH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    -PI2,
                  seq:      [0.55, 0.88] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
              { id: 'BotMajorBack', face: 'bottom', w: W, h: majorH,
                hinge: {
                  pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                  panelPos: [0, -majorH / 2, 0] as [number, number, number],
                  axis:     [1, 0, 0] as [number, number, number],
                  angle:    PI2,
                  seq:      [0.55, 0.88] as [number, number],
                  easing:   'easeOut',
                },
                children: [] },
            ] },
        ] },
    ],
  }
}

// ── Drawer / pull-out box sleeve (s008) ───────────────────────────────────────
// Outer sleeve with closed bottom — inner tray slides in from the open top.
export function packlyDrawerBoxFoldNode(W: number, H: number, D: number): FoldNode {
  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'Bottom', face: 'bottom', w: W, h: D,
        hinge: {
          pivotPos: [0, -H / 2, 0] as [number, number, number],
          panelPos: [0, -D / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.00, 0.22] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Left', face: 'left', w: D, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Right', face: 'right', w: D, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [D / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.15, 0.52] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [D, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.42, 0.80] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
    ],
  }
}

// ── Counter display stand (s015, s039) ────────────────────────────────────────
// Tall back panel stands vertical; shelf base folds forward 90°; front retainer folds up.
export function packlyDisplayStandFoldNode(W: number, H: number, D: number): FoldNode {
  const backH  = H * 0.62
  const shelfD = D * 0.85
  const retH   = D * 0.22
  const sideW  = D * 0.50

  return {
    id: 'Back', face: 'back', w: W, h: backH,
    worldPos: [0, 0, 0],
    children: [
      { id: 'Shelf', face: 'bottom', w: W, h: shelfD,
        hinge: {
          pivotPos: [0, -backH / 2, 0] as [number, number, number],
          panelPos: [0, -shelfD / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.08, 0.45] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'Retainer', face: 'front', w: W, h: retH,
            hinge: {
              pivotPos: [0, shelfD / 2, 0] as [number, number, number],
              panelPos: [0, retH / 2, 0] as [number, number, number],
              axis:     [1, 0, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.42, 0.72] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
      { id: 'Header', face: 'top', w: W, h: H * 0.22,
        hinge: {
          pivotPos: [0, backH / 2, 0] as [number, number, number],
          panelPos: [0, H * 0.22 / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.62, 0.96] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'SideL', face: 'left', w: sideW, h: backH,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-sideW / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.15, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'SideR', face: 'right', w: sideW, h: backH,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [sideW / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.15, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [] },
    ],
  }
}

// ── Gusset / soufflet (s031–s034) ─────────────────────────────────────────────
// Each side has a W-fold gusset: outer half folds 90°, inner half reverses 90°.
// gW = D/2 per gusset panel; Back connects through inner-right gusset.
export function packlyGussetBoxFoldNode(W: number, H: number, D: number): FoldNode {
  const gW   = D / 2
  const tuck = Math.min(D * 0.90, H * 0.65)

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, D / 2],
    children: [
      { id: 'TopFlap', face: 'top', w: W, h: tuck,
        alphaShape: { type: 'tuckTongue', roundFrac: 0.20 },
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, tuck / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -TUCK,
          seq:      [0.60, 0.97] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'LeftOuter', face: 'left', w: gW, h: H,
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-gW / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.10, 0.40] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'LeftInner', face: 'flap', w: gW, h: H,
            hinge: {
              pivotPos: [-gW, 0, 0] as [number, number, number],
              panelPos: [-gW / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.28, 0.58] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
      { id: 'RightOuter', face: 'right', w: gW, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [gW / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.10, 0.40] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'RightInner', face: 'flap', w: gW, h: H,
            hinge: {
              pivotPos: [gW, 0, 0] as [number, number, number],
              panelPos: [gW / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    -PI2,
              seq:      [0.28, 0.58] as [number, number],
              easing:   'cubic',
            },
            children: [
              { id: 'Back', face: 'back', w: W, h: H,
                hinge: {
                  pivotPos: [gW, 0, 0] as [number, number, number],
                  panelPos: [W / 2, 0, 0] as [number, number, number],
                  axis:     [0, 1, 0] as [number, number, number],
                  angle:    PI2,
                  seq:      [0.48, 0.85] as [number, number],
                  easing:   'cubic',
                },
                children: [
                  { id: 'BotFlap', face: 'bottom', w: W, h: tuck,
                    hinge: {
                      pivotPos: [W / 2, -H / 2, 0] as [number, number, number],
                      panelPos: [0, -tuck / 2, 0] as [number, number, number],
                      axis:     [1, 0, 0] as [number, number, number],
                      angle:    -TUCK,
                      seq:      [0.28, 0.55] as [number, number],
                      easing:   'easeOut',
                    },
                    children: [] },
                ] },
            ] },
        ] },
    ],
  }
}

// ── Envelope (s030) ───────────────────────────────────────────────────────────
// Classic flat envelope: 4 flaps close over a rectangular back panel.
// Bottom seals first, then side triangles, then top tongue seals last.
export function packlyEnvelopeFoldNode(W: number, H: number, _D: number): FoldNode {
  const topH  = W * 0.55
  const botH  = H * 0.28
  const sideH = H * 0.46

  return {
    id: 'Back', face: 'back', w: W, h: H,
    worldPos: [0, 0, 0],
    children: [
      { id: 'TopFlap', face: 'top', w: W, h: topH,
        alphaShape: { type: 'triangle', tipEdge: 'top' },
        hinge: {
          pivotPos: [0, H / 2, 0] as [number, number, number],
          panelPos: [0, topH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.70, 1.00] as [number, number],
          easing:   'easeOut',
        },
        children: [] },
      { id: 'BotFlap', face: 'bottom', w: W, h: botH,
        alphaShape: { type: 'triangle', tipEdge: 'bottom' },
        hinge: {
          pivotPos: [0, -H / 2, 0] as [number, number, number],
          panelPos: [0, -botH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.00, 0.28] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Left', face: 'left', w: sideH, h: H,
        alphaShape: { type: 'triangle', tipEdge: 'left' },
        hinge: {
          pivotPos: [-W / 2, 0, 0] as [number, number, number],
          panelPos: [-sideH / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.22, 0.58] as [number, number],
          easing:   'cubic',
        },
        children: [] },
      { id: 'Right', face: 'right', w: sideH, h: H,
        alphaShape: { type: 'triangle', tipEdge: 'right' },
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [sideH / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    -PI2,
          seq:      [0.22, 0.58] as [number, number],
          easing:   'cubic',
        },
        children: [] },
    ],
  }
}

// ── Pillow box (s037) ─────────────────────────────────────────────────────────
// Sleeve tube with rounded ends (approximated via roundedCorners alpha shape).
export function packlyPillowBoxFoldNode(W: number, H: number, D: number): FoldNode {
  const node = packlySleeveFoldNode(W, H, D)
  node.alphaShape = { type: 'roundedCorners', radiusFrac: 0.38 }
  return node
}

// ── Folder with spine (s005) ──────────────────────────────────────────────────
// Two or three cover panels connected by a narrow spine (D = spine width).
export function packlyFolderFoldNode(W: number, H: number, D: number): FoldNode {
  const spineW = Math.max(D, 4)

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, spineW / 2],
    children: [
      { id: 'Spine', face: 'right', w: spineW, h: H,
        hinge: {
          pivotPos: [W / 2, 0, 0] as [number, number, number],
          panelPos: [spineW / 2, 0, 0] as [number, number, number],
          axis:     [0, 1, 0] as [number, number, number],
          angle:    PI2,
          seq:      [0.10, 0.50] as [number, number],
          easing:   'cubic',
        },
        children: [
          { id: 'Back', face: 'back', w: W, h: H,
            hinge: {
              pivotPos: [spineW, 0, 0] as [number, number, number],
              panelPos: [W / 2, 0, 0] as [number, number, number],
              axis:     [0, 1, 0] as [number, number, number],
              angle:    PI2,
              seq:      [0.40, 0.90] as [number, number],
              easing:   'cubic',
            },
            children: [] },
        ] },
    ],
  }
}

// ── Bag topper / banderole (s038) ─────────────────────────────────────────────
// Flat two-panel piece: front folds 180° over back at the top crease.
export function packlyBagTopperFoldNode(W: number, H: number, _D: number): FoldNode {
  const halfH = H / 2
  return {
    id: 'Front', face: 'front', w: W, h: halfH,
    worldPos: [0, 0, 0],
    children: [
      { id: 'Back', face: 'back', w: W, h: halfH,
        alphaShape: { type: 'roundedCorners', radiusFrac: 0.12 },
        hinge: {
          pivotPos: [0, halfH / 2, 0] as [number, number, number],
          panelPos: [0, halfH / 2, 0] as [number, number, number],
          axis:     [1, 0, 0] as [number, number, number],
          angle:    Math.PI,
          seq:      [0.20, 0.90] as [number, number],
          easing:   'cubic',
        },
        children: [] },
    ],
  }
}

// ── Article-code → FoldNode builder dispatch ──────────────────────────────────

const TUCK_CODES = new Set([
  's001_v0', 's001_v1', 's001_v2', 's001_v3', 's001_v4', 's001_v5',
  's020_v0', 's020_v1',
  's021_v0',
  's023_v0', 's023_v1', 's023_v2',
])

const TRAY_CODES = new Set([
  's013_v0', 's013_v1', 's013_v2',
  's011_v0', 's011_v1',
  's029_v0',
])

const AUTO_BOTTOM_CODES = new Set([
  's004_v0', 's004_v1',
  's006_v0', 's006_v1',
  's009_v0',
  's014_v0', 's014_v1',
])

const SLEEVE_CODES = new Set([
  's012_v0', 's012_v2', 's012_v3',
  's019_v0', 's019_v1',
  's022_v0',
  's025_v0',
])

const LID_BOX_CODES = new Set([
  's002_v0', 's002_v1', 's002_v2', 's002_v3', 's002_v4',
  's003_v0', 's003_v1', 's003_v2', 's003_v3',
  's024_v0',
])

const GABLE_CODES = new Set([
  's016_v0', 's016_v1',
  's017_v1', 's017_v4',
  's027_v0',
])

const HANGING_CODES = new Set([
  's007_v0', 's007_v1', 's007_v2', 's007_v3', 's007_v4',
])

const HANDLE_CODES = new Set([
  's010_v0', 's010_v1', 's010_v2',
  's026_v0',
])

const SEAL_END_CODES = new Set([
  's018_v0',
])

const MAILER_CODES = new Set([
  's035_v0',
  's036_v0', 's036_v1',
])

const DRAWER_CODES = new Set([
  's008_v0', 's008_v1',
])

const DISPLAY_CODES = new Set([
  's015_v0', 's015_v1',
  's039_v0',
])

const GUSSET_CODES = new Set([
  's031_v0', 's032_v0', 's033_v0', 's034_v0',
])

const ENVELOPE_CODES = new Set([
  's030_v0', 's030_v1',
])

const PILLOW_CODES = new Set([
  's037_v0',
])

const FOLDER_CODES = new Set([
  's005_v0', 's005_v1',
])

const BAG_TOPPER_CODES = new Set([
  's038_v0', 's038_v1', 's038_v2', 's038_v3',
])

export function buildPacklyFoldNode(
  articleCode: string,
  W: number,
  H: number,
  D: number,
): FoldNode | null {
  if (TUCK_CODES.has(articleCode))        return packlyTuckFoldNode(W, H, D)
  if (TRAY_CODES.has(articleCode))        return packlySnapTrayFoldNode(W, H, D)
  if (AUTO_BOTTOM_CODES.has(articleCode)) return packlyAutoBottomFoldNode(W, H, D)
  if (SLEEVE_CODES.has(articleCode))      return packlySleeveFoldNode(W, H, D)
  if (LID_BOX_CODES.has(articleCode))     return packlyLidBoxFoldNode(W, H, D)
  if (GABLE_CODES.has(articleCode))       return packlyGableFoldNode(W, H, D)
  if (HANGING_CODES.has(articleCode))     return packlyHangingBoxFoldNode(W, H, D)
  if (HANDLE_CODES.has(articleCode))      return packlyHandleBoxFoldNode(W, H, D)
  if (SEAL_END_CODES.has(articleCode))    return packlySealEndFoldNode(W, H, D)
  if (MAILER_CODES.has(articleCode))      return packlyMailerFoldNode(W, H, D)
  if (DRAWER_CODES.has(articleCode))      return packlyDrawerBoxFoldNode(W, H, D)
  if (DISPLAY_CODES.has(articleCode))     return packlyDisplayStandFoldNode(W, H, D)
  if (GUSSET_CODES.has(articleCode))      return packlyGussetBoxFoldNode(W, H, D)
  if (ENVELOPE_CODES.has(articleCode))    return packlyEnvelopeFoldNode(W, H, D)
  if (PILLOW_CODES.has(articleCode))      return packlyPillowBoxFoldNode(W, H, D)
  if (FOLDER_CODES.has(articleCode))      return packlyFolderFoldNode(W, H, D)
  if (BAG_TOPPER_CODES.has(articleCode))  return packlyBagTopperFoldNode(W, H, D)
  return null
}
