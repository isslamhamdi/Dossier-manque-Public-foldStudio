/**
 * Polygon offset + boolean operations — pure JS, micron precision.
 * Replicates the core of iShape-js / Clipper.js for Fold Studio's needs:
 *   - Inset / outset a polygon by a distance (bleed zone, safety margin)
 *   - Sutherland-Hodgman clip (convex clip region)
 *   - Point-in-polygon test
 */

export interface Vec2 { x: number; y: number }
export type Polygon = Vec2[]

// ── Vector helpers ────────────────────────────────────────────────────────────

const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y })
const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y })
const scale = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s })
const len = (v: Vec2) => Math.sqrt(v.x * v.x + v.y * v.y)
const norm = (v: Vec2): Vec2 => { const l = len(v) || 1; return { x: v.x / l, y: v.y / l } }
const perp = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x })     // 90° CCW
const dot  = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y
const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x

// Line–line intersection: given p+t*r and q+u*s, return t
function lineIntersectT(p: Vec2, r: Vec2, q: Vec2, s: Vec2): number {
  const c = cross(r, s)
  if (Math.abs(c) < 1e-10) return Infinity
  return cross(sub(q, p), s) / c
}

// ── Polygon winding / signed area ─────────────────────────────────────────────

export function signedArea(poly: Polygon): number {
  let a = 0
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y
  }
  return a / 2
}

/** Returns true when polygon vertices are in CCW order */
export function isCCW(poly: Polygon): boolean { return signedArea(poly) > 0 }

export function ensureCCW(poly: Polygon): Polygon {
  return isCCW(poly) ? poly : [...poly].reverse()
}

// ── Polygon offset (inset / outset) ──────────────────────────────────────────

/**
 * Offsets a polygon outward (positive d) or inward (negative d).
 * Uses edge-normal offset with miter joins.
 * Works correctly for convex polygons; handles mild concavities.
 */
export function offsetPolygon(poly: Polygon, d: number): Polygon {
  const n = poly.length
  if (n < 3) return poly

  const ccw = ensureCCW(poly)

  // Compute outward normals for each edge
  const normals: Vec2[] = ccw.map((v, i) => {
    const next = ccw[(i + 1) % n]
    const edge = sub(next, v)
    return norm(perp(edge))  // CCW poly → left perp = outward
  })

  // Offset edges
  const offEdges = ccw.map((v, i) => ({
    p: add(v, scale(normals[i], d)),
    d: sub(ccw[(i + 1) % n], v),
  }))

  // Find intersections of adjacent offset edges → new vertices
  const result: Polygon = offEdges.map((e, i) => {
    const prev = offEdges[(i - 1 + n) % n]
    const t = lineIntersectT(prev.p, prev.d, e.p, e.d)
    if (!isFinite(t)) return e.p   // parallel edges — use start of current
    return add(prev.p, scale(prev.d, t))
  })

  return result
}

// ── Sutherland-Hodgman clip ───────────────────────────────────────────────────

/**
 * Clips `subject` polygon against a convex `clip` polygon.
 * Returns the intersection polygon.
 */
export function clipPolygon(subject: Polygon, clip: Polygon): Polygon {
  let output = [...subject]
  const n = clip.length

  for (let i = 0; i < n; i++) {
    if (output.length === 0) return []
    const edgeA = clip[i]
    const edgeB = clip[(i + 1) % n]
    const edgeDir = sub(edgeB, edgeA)
    const input = output
    output = []

    for (let j = 0; j < input.length; j++) {
      const curr = input[j]
      const prev = input[(j - 1 + input.length) % input.length]

      const currInside = cross(edgeDir, sub(curr, edgeA)) >= 0
      const prevInside = cross(edgeDir, sub(prev, edgeA)) >= 0

      if (currInside) {
        if (!prevInside) {
          const t = lineIntersectT(prev, sub(curr, prev), edgeA, edgeDir)
          if (isFinite(t)) output.push(add(prev, scale(sub(curr, prev), t)))
        }
        output.push(curr)
      } else if (prevInside) {
        const t = lineIntersectT(prev, sub(curr, prev), edgeA, edgeDir)
        if (isFinite(t)) output.push(add(prev, scale(sub(curr, prev), t)))
      }
    }
  }

  return output
}

// ── Point-in-polygon ─────────────────────────────────────────────────────────

export function pointInPolygon(p: Vec2, poly: Polygon): boolean {
  let inside = false
  const n = poly.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const { x: xi, y: yi } = poly[i]
    const { x: xj, y: yj } = poly[j]
    if ((yi > p.y) !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// ── Rectangle helpers ─────────────────────────────────────────────────────────

export function rectPolygon(x: number, y: number, w: number, h: number): Polygon {
  return [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ]
}

/**
 * Outsets a rectangle by `d` on all sides.
 * Equivalent to offsetPolygon(rectPolygon(...), d) but faster.
 */
export function expandRect(x: number, y: number, w: number, h: number, d: number) {
  return { x: x - d, y: y - d, w: w + 2 * d, h: h + 2 * d }
}

// ── Polygon → SVG path ────────────────────────────────────────────────────────

export function polygonToSvgPath(poly: Polygon): string {
  if (poly.length < 2) return ''
  return poly.map((v, i) => `${i === 0 ? 'M' : 'L'} ${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ') + ' Z'
}

// ── Rounded-corner rectangle polygon ─────────────────────────────────────────

/**
 * Approximates a rounded rectangle as a polygon (for use with offsetPolygon).
 * segments: number of line segments per corner arc.
 */
export function roundedRectPolygon(x: number, y: number, w: number, h: number, r: number, segments = 8): Polygon {
  const pts: Polygon = []
  const corners: [number, number, number, number][] = [
    [x + r, y + r, Math.PI, 3 * Math.PI / 2],
    [x + w - r, y + r, 3 * Math.PI / 2, 2 * Math.PI],
    [x + w - r, y + h - r, 0, Math.PI / 2],
    [x + r, y + h - r, Math.PI / 2, Math.PI],
  ]
  for (const [cx, cy, startA, endA] of corners) {
    for (let s = 0; s <= segments; s++) {
      const a = startA + (s / segments) * (endA - startA)
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r })
    }
  }
  return pts
}
