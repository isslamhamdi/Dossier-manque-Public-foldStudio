// Automatic fold sequence assignment for FoldNode trees.
// Assigns [start, end] intervals and easing to every hinge based on
// panel size, depth in the tree, and adjacency to the anchor.
//
// Three-phase model:
//   Phase 1 [0.00–0.30] — small lock flaps, glue tabs    → elastic
//   Phase 2 [0.30–0.70] — main body panels (Left/Right)  → cubic
//   Phase 3 [0.70–1.00] — top/bottom covers, tuck tongue → cubic / back

import type { FoldNode } from './helpers'

interface PhaseConfig {
  phase1: readonly [number, number]
  phase2: readonly [number, number]
  phase3: readonly [number, number]
}

const DEFAULT_PHASES: PhaseConfig = {
  phase1: [0.00, 0.30],
  phase2: [0.30, 0.70],
  phase3: [0.70, 1.00],
}

interface NodeInfo {
  node: FoldNode
  depth: number
  siblingIndex: number
  siblingCount: number
  parentArea: number
}

// Walk the FoldNode tree depth-first, collecting info needed for sequencing.
function collectNodes(
  root: FoldNode,
  depth = 0,
  parentArea = root.w * root.h,
  out: NodeInfo[] = []
): NodeInfo[] {
  const siblingCount = root.children.length
  root.children.forEach((child, i) => {
    out.push({
      node: child,
      depth,
      siblingIndex: i,
      siblingCount,
      parentArea,
    })
    collectNodes(child, depth + 1, child.w * child.h, out)
  })
  return out
}

// Spread siblings slightly within their phase to avoid exact simultaneous folds.
function staggeredSeq(
  phase: readonly [number, number],
  siblingIndex: number,
  siblingCount: number,
  spread = 0.06
): [number, number] {
  const total = Math.max(siblingCount - 1, 1)
  const offset = siblingCount > 1 ? (siblingIndex / total) * spread : 0
  const duration = phase[1] - phase[0]
  const start = Math.min(phase[0] + offset, phase[1] - 0.05)
  const end   = Math.min(start + duration * (1 - spread * 0.5), 0.98)
  return [parseFloat(start.toFixed(3)), parseFloat(end.toFixed(3))]
}

// Assign seq + easing to every hinge in the tree (mutates in-place).
export function assignFoldSequences(
  root: FoldNode,
  phases: PhaseConfig = DEFAULT_PHASES
): FoldNode {
  const infos = collectNodes(root)

  for (const info of infos) {
    const { node, depth, siblingIndex, siblingCount, parentArea } = info
    if (!node.hinge) continue

    const area = node.w * node.h
    const isSmall = area < parentArea * 0.45    // < 45% of parent → flap
    const isGlue  = node.isGlue ?? false

    let seq:    [number, number]
    let easing: FoldNode['hinge'] extends undefined ? never : NonNullable<FoldNode['hinge']>['easing']

    if (isGlue) {
      // Glue tabs are always phase 1, snapping into position
      seq    = staggeredSeq(phases.phase1, siblingIndex, siblingCount)
      easing = 'elastic'

    } else if (isSmall && depth === 0) {
      // Small direct flaps (dust flaps, inner locking tabs)
      seq    = staggeredSeq(phases.phase1, siblingIndex, siblingCount)
      easing = 'elastic'

    } else if (depth === 0) {
      // Main body panels at depth 0 (Left, Right, Top, Bottom)
      // Distinguish horizontal (top/bottom) from vertical (left/right)
      const axis = node.hinge.axis
      const isVertHinge = Math.abs(axis[1]) > 0.5  // Y-dominant → vertical hinge (L/R panels)

      if (isVertHinge) {
        // Left / Right — Phase 2
        seq    = staggeredSeq(phases.phase2, siblingIndex, siblingCount)
        easing = 'cubic'
      } else if (isSmall) {
        // Small top/bottom flaps — Phase 1
        seq    = staggeredSeq(phases.phase1, siblingIndex, siblingCount)
        easing = 'back'
      } else {
        // Large top/bottom covers — Phase 3
        seq    = staggeredSeq(phases.phase3, siblingIndex, siblingCount)
        easing = 'cubic'
      }

    } else if (depth === 1) {
      // Back (child of Right) — late Phase 2
      seq    = [0.50, 0.85]
      easing = 'cubic'

    } else {
      // Deeper flaps — late Phase 3
      seq    = staggeredSeq(phases.phase3, siblingIndex, siblingCount, 0.04)
      easing = 'back'
    }

    node.hinge = { ...node.hinge, seq, easing }
  }

  return root
}

// Convenience: build the standard box fold tree with auto-sequencing applied.
// Call this instead of boxFoldNode() if you want auto-sequencing.
export function autoSequencedBoxFoldNode(W: number, H: number, D: number): FoldNode {
  // We import boxFoldNode here to avoid circular deps at module level.
  const { boxFoldNode } = require('./box') as typeof import('./box')
  const tree = boxFoldNode(W, H, D)
  return assignFoldSequences(tree)
}
