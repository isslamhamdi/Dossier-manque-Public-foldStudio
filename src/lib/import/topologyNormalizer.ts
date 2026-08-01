// Topology Normalizer — 3-pass SVG cleanup pipeline.
//
// Pass 1 — Vertex clustering:
//   Merge endpoints within ε = 0.05mm of each other into a single shared vertex.
//   Eliminates the near-duplicate endpoints left by Illustrator/Inkscape exports.
//
// Pass 2 — Intersection detection:
//   Find segment pairs that cross but share no endpoint (T-junctions from badly
//   drawn dielines). Split each pair at the crossing point via Cramer's rule.
//   Caps at MAX_INTERSECTIONS to avoid O(n²) freeze on complex dielines.
//
// Pass 3 — Loop reconstruction:
//   Walk the adjacency graph built in passes 1-2 to extract closed polygons.
//   Dangling single-connection edges (score lines that end mid-sheet) are kept
//   as open polylines. The closed loops become the cut contour; open chains
//   become fold lines.

export interface Segment {
  x1: number; y1: number
  x2: number; y2: number
  role: 'cut' | 'fold' | 'glue' | 'bleed' | 'unknown'
}

export interface NormalizedTopology {
  closedLoops: [number, number][][]   // closed polygons in mm (cut outlines)
  openChains:  [number, number][][]   // open polylines in mm (fold/score lines)
  segments:    Segment[]              // all segments after passes 1-2
}

// ── Pass 1: Vertex clustering ─────────────────────────────────────────────────

const EPSILON = 0.05   // mm — merge threshold
const MAX_INTERSECTIONS = 2000

type Pt = [number, number]

function ptKey(x: number, y: number): string {
  return `${Math.round(x / EPSILON)},${Math.round(y / EPSILON)}`
}

function clusterVertices(segs: Segment[]): Segment[] {
  const canon = new Map<string, Pt>()

  function snap(x: number, y: number): Pt {
    const k = ptKey(x, y)
    if (!canon.has(k)) canon.set(k, [x, y])
    return canon.get(k)!
  }

  return segs.map(s => {
    const [sx1, sy1] = snap(s.x1, s.y1)
    const [sx2, sy2] = snap(s.x2, s.y2)
    return { ...s, x1: sx1, y1: sy1, x2: sx2, y2: sy2 }
  }).filter(s => !(s.x1 === s.x2 && s.y1 === s.y2))  // remove zero-length
}

// ── Pass 2: Intersection detection (Cramer's rule) ───────────────────────────

function segIntersect(
  ax1: number, ay1: number, ax2: number, ay2: number,
  bx1: number, by1: number, bx2: number, by2: number,
): Pt | null {
  const dx1 = ax2 - ax1, dy1 = ay2 - ay1
  const dx2 = bx2 - bx1, dy2 = by2 - by1
  const denom = dx1 * dy2 - dy1 * dx2
  if (Math.abs(denom) < 1e-10) return null  // parallel

  const t = ((bx1 - ax1) * dy2 - (by1 - ay1) * dx2) / denom
  const u = ((bx1 - ax1) * dy1 - (by1 - ay1) * dx1) / denom

  // Must be strictly interior (not at endpoints) to count as a T-junction
  if (t <= 1e-6 || t >= 1 - 1e-6) return null
  if (u <= 1e-6 || u >= 1 - 1e-6) return null

  return [ax1 + t * dx1, ay1 + t * dy1]
}

function splitAtIntersections(segs: Segment[]): Segment[] {
  let result = [...segs]
  let itersFound = 0

  outer:
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      if (itersFound >= MAX_INTERSECTIONS) break outer

      const a = result[i]
      const b = result[j]
      const pt = segIntersect(a.x1, a.y1, a.x2, a.y2, b.x1, b.y1, b.x2, b.y2)
      if (!pt) continue

      itersFound++
      const [ix, iy] = pt

      // Split segment a at intersection
      const a1: Segment = { ...a, x2: ix, y2: iy }
      const a2: Segment = { ...a, x1: ix, y1: iy }
      // Split segment b at intersection
      const b1: Segment = { ...b, x2: ix, y2: iy }
      const b2: Segment = { ...b, x1: ix, y1: iy }

      // Replace a and b with split halves
      result.splice(j, 1, b1, b2)
      result.splice(i, 1, a1, a2)

      // Re-start from i because new segments may intersect others
      i = Math.max(0, i - 1)
      break
    }
  }

  return result
}

// ── Pass 3: Loop reconstruction ───────────────────────────────────────────────

function buildAdjacency(segs: Segment[]): Map<string, Pt[]> {
  const adj = new Map<string, Pt[]>()

  function addEdge(from: Pt, to: Pt) {
    const k = ptKey(from[0], from[1])
    if (!adj.has(k)) adj.set(k, [])
    adj.get(k)!.push(to)
  }

  for (const s of segs) {
    const a: Pt = [s.x1, s.y1]
    const b: Pt = [s.x2, s.y2]
    addEdge(a, b)
    addEdge(b, a)
  }

  return adj
}

function walkChain(start: Pt, adj: Map<string, Pt[]>, visited: Set<string>): Pt[] {
  const chain: Pt[] = [start]
  visited.add(ptKey(start[0], start[1]))

  let current = start
  for (;;) {
    const k = ptKey(current[0], current[1])
    const neighbors = adj.get(k) ?? []
    const next = neighbors.find(n => !visited.has(ptKey(n[0], n[1])))
    if (!next) break
    visited.add(ptKey(next[0], next[1]))
    chain.push(next)
    current = next
  }

  return chain
}

function reconstructLoops(segs: Segment[]): { closedLoops: Pt[][]; openChains: Pt[][] } {
  const adj = buildAdjacency(segs)
  const visited = new Set<string>()
  const closedLoops: Pt[][] = []
  const openChains: Pt[][] = []

  const adjEntries = Array.from(adj.entries())

  // Find degree-1 vertices (chain endpoints) and walk from them first
  const degree1: Pt[] = []
  for (const [k, neighbors] of adjEntries) {
    if (neighbors.length === 1) {
      const parts = k.split(',')
      const nx = parseInt(parts[0]) * EPSILON
      const ny = parseInt(parts[1]) * EPSILON
      degree1.push([nx, ny])
    }
  }

  for (const start of degree1) {
    const k = ptKey(start[0], start[1])
    if (visited.has(k)) continue
    const chain = walkChain(start, adj, visited)
    if (chain.length >= 2) openChains.push(chain)
  }

  // Remaining unvisited form closed loops
  for (const [k] of adjEntries) {
    if (visited.has(k)) continue
    const parts = k.split(',')
    const nx = parseInt(parts[0]) * EPSILON
    const ny = parseInt(parts[1]) * EPSILON
    const start: Pt = [nx, ny]
    const chain = walkChain(start, adj, visited)
    if (chain.length >= 3) closedLoops.push([...chain, chain[0]])  // close the polygon
    else if (chain.length >= 2) openChains.push(chain)
  }

  return { closedLoops, openChains }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function normalizeTopology(segs: Segment[]): NormalizedTopology {
  if (segs.length === 0) return { closedLoops: [], openChains: [], segments: [] }

  const pass1 = clusterVertices(segs)
  const pass2 = splitAtIntersections(pass1)
  const pass3 = reconstructLoops(pass2)

  return {
    closedLoops: pass3.closedLoops,
    openChains:  pass3.openChains,
    segments:    pass2,
  }
}
