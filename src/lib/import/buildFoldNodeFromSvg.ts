// buildFoldNodeFromSvg.ts — Deduce box type + dimensions from fold-line grid, build FoldNode.
//
// Detection rules (ordered by priority):
//   0 vertical + 0 horizontal → cylinder / label (no fold node returned)
//   cross shape (0 vert, 4 perimeter folds) → trayFoldNode
//   N vertical equal-width cols → buildPolygonFoldNode(N+1, sideW, H)
//   standard tube (≥3 vertical, variable widths) → boxFoldNode(W, H, D)

import type { FoldNode } from '../dieline/helpers'
import { boxFoldNode, buildPolygonFoldNode, trayFoldNode } from '../dieline/box'
import type { ParsedSVGDieline } from './parseSvgDieline'

const SNAP_TOL   = 2    // mm — snap radius for fold-line clustering
const EQUAL_TOL  = 5    // mm — tolerance for "equal width" columns (polygon detection)

// ── Position clustering ──────────────────────────────────────────

function groupPositions(values: number[], tol = SNAP_TOL): number[] {
  if (values.length === 0) return []
  const sorted = [...values].sort((a, b) => a - b)
  const groups: number[] = [sorted[0]]
  for (const v of sorted.slice(1)) {
    if (v - groups[groups.length - 1] > tol) {
      groups.push(v)
    } else {
      groups[groups.length - 1] = (groups[groups.length - 1] + v) / 2
    }
  }
  return groups
}

// ── Panel dimension helpers ──────────────────────────────────────

function columnWidths(xFolds: number[], docWidth: number): number[] {
  const xs = [0, ...xFolds, docWidth]
  return xs.slice(0, -1).map((x, i) => Math.abs(xs[i + 1] - x))
}

function rowHeights(yFolds: number[], docHeight: number): number[] {
  const ys = [0, ...yFolds, docHeight]
  return ys.slice(0, -1).map((y, i) => Math.abs(ys[i + 1] - y))
}

// Are all values within EQUAL_TOL of each other?
function allEqual(values: number[], tol = EQUAL_TOL): boolean {
  if (values.length === 0) return true
  const mn = Math.min(...values), mx = Math.max(...values)
  return mx - mn <= tol
}

// ── Public types ─────────────────────────────────────────────────

export interface DielineDimensions {
  W: number
  H: number
  D: number
}

export function deduceDimensions(parsed: ParsedSVGDieline): DielineDimensions | null {
  const { widthMm, heightMm, foldSegments } = parsed

  const vertXs  = foldSegments.filter(s => s.isVertical).map(s => (s.x1 + s.x2) / 2)
  const horizYs  = foldSegments.filter(s => s.isHorizontal).map(s => (s.y1 + s.y2) / 2)

  const xGroups  = groupPositions(vertXs)
  const yGroups  = groupPositions(horizYs)

  if (xGroups.length < 2) return null

  const cols = columnWidths(xGroups, widthMm)
  const rows = rowHeights(yGroups, heightMm)
  const H    = Math.max(...rows, 0)

  const sorted  = [...cols].sort((a, b) => b - a)
  const W = sorted[0]
  const D = sorted[1] ?? W * 0.4

  if (W < 1 || H < 1 || D < 1) return null

  return {
    W: Math.round(W * 10) / 10,
    H: Math.round(H * 10) / 10,
    D: Math.round(D * 10) / 10,
  }
}

// ── Main entry point ─────────────────────────────────────────────

export function buildFoldNodeFromSvg(parsed: ParsedSVGDieline): FoldNode | null {
  const { widthMm, heightMm, foldSegments } = parsed

  // ── Case 1 : No fold segments at all → cylinder / label ─────────
  if (foldSegments.length === 0) return null

  const vertSegs  = foldSegments.filter(s => s.isVertical)
  const horizSegs = foldSegments.filter(s => s.isHorizontal)
  const diagSegs  = foldSegments.filter(s => !s.isVertical && !s.isHorizontal)

  const vertXs   = vertSegs.map(s => (s.x1 + s.x2) / 2)
  const horizYs  = horizSegs.map(s => (s.y1 + s.y2) / 2)

  const xGroups  = groupPositions(vertXs)
  const yGroups  = groupPositions(horizYs)

  // ── Case 2 : Diagonal-dominant polygon (exploding box, hexagonal star, etc.)
  // Cluster diagonal lengths at 6% tolerance to find the dominant edge length.
  // sideHint (from layer IDs / URL params) overrides the geometric N count.
  if (diagSegs.length >= 3) {
    const lengths = diagSegs.map(s => {
      const dx = s.x2 - s.x1, dy = s.y2 - s.y1
      return Math.sqrt(dx * dx + dy * dy)
    }).filter(l => l > 2)

    // Find the most frequent cluster at 6% tolerance
    let bestLen = 0, bestCount = 0
    for (const len of lengths) {
      const count = lengths.filter(l => Math.abs(l - len) / len < 0.06).length
      if (count > bestCount) { bestCount = count; bestLen = len }
    }

    if (bestCount >= 3 && bestLen > 5) {
      // Use sideHint for nSides when available; otherwise infer from cluster count
      const nSides = (parsed.sideHint && parsed.sideHint >= 3)
        ? parsed.sideHint
        : Math.min(bestCount, 12)
      // Estimate height from horizontal fold line gaps
      const rows = rowHeights(yGroups, heightMm)
      const shortRows = rows.filter(r => r > 5 && r < heightMm * 0.45)
      const H = shortRows.length > 0
        ? Math.min(...shortRows)
        : Math.min(widthMm, heightMm) * 0.28
      if (nSides >= 3 && H > 5) return buildPolygonFoldNode(nSides, bestLen, H)
    }
  }

  // ── Case 3 : Cross-shaped tray ──────────────────────────────────
  if (xGroups.length === 2 && yGroups.length === 2) {
    const cols = columnWidths(xGroups, widthMm)
    const rows = rowHeights(yGroups, heightMm)
    const wallH = Math.min(cols[0], cols[2] ?? cols[0])
    const W     = cols[1] ?? cols[0]
    const bodyH = rows[1] ?? rows[0]
    if (W > 5 && bodyH > 5 && wallH > 2) {
      return trayFoldNode(W, bodyH, wallH)
    }
  }

  // ── Case 4 : Polygon tube — all columns equal width ─────────────
  if (xGroups.length >= 2 && yGroups.length <= 2) {
    const cols = columnWidths(xGroups, widthMm)
    const bodyC = cols.filter(c => c > 10)
    if (bodyC.length >= 3 && allEqual(bodyC)) {
      const sideWidth = bodyC[0]
      const nSides    = bodyC.length
      const rows      = rowHeights(yGroups, heightMm)
      const H         = yGroups.length > 0 ? Math.max(...rows) : heightMm
      if (nSides >= 3 && sideWidth > 5 && H > 5) {
        return buildPolygonFoldNode(nSides, sideWidth, H)
      }
    }
  }

  // ── Case 5 : Standard rectangular tube ──────────────────────────
  const dims = deduceDimensions(parsed)
  if (dims) return boxFoldNode(dims.W, dims.H, dims.D)

  // ── Case 5b : Cylindrical — horizontal-only folds (round box, tube) ─
  // Detect: no vertical fold groups, at least 1 horizontal group.
  // Strip width ≈ circumference; distance between fold rings ≈ cylinder height.
  if (xGroups.length === 0 && yGroups.length >= 1) {
    const xVals = foldSegments.flatMap(s => [s.x1, s.x2])
    const xMin = Math.min(...xVals)
    const xMax = Math.max(...xVals)
    const stripWidth = xMax - xMin   // ≈ circumference
    const rows = rowHeights(yGroups, heightMm)
    const cylH = Math.max(...rows)   // tallest band ≈ body height
    if (stripWidth > 10 && cylH > 5) {
      const nSides = 12
      const sideWidth = Math.round((stripWidth / nSides) * 10) / 10
      if (sideWidth > 3) return buildPolygonFoldNode(nSides, sideWidth, cylH)
    }
  }

  // ── Case 6 : Fallback — always return something proportional to SVG ──
  // Never leave the 3D view empty: use overall SVG dimensions as rough box
  const W = Math.max(Math.round(widthMm  * 0.40), 20)
  const H = Math.max(Math.round(heightMm * 0.30), 20)
  const D = Math.max(Math.round(widthMm  * 0.28), 20)
  return boxFoldNode(W, H, D)
}
