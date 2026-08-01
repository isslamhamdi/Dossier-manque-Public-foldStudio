import type { Vec2, Vec3 } from './types'
import { v2, v3 } from './math'

export function parseOBJ(text: string): { verts: Vec3[]; faces: number[][] } {
  const verts: Vec3[] = []
  const faces: number[][] = []
  for (const line of text.split('\n')) {
    const p = line.trim().split(/\s+/)
    if (p[0] === 'v') verts.push({ x: +p[1], y: +p[2], z: +p[3] })
    else if (p[0] === 'f') faces.push(p.slice(1).map(s => parseInt(s.split('/')[0]) - 1))
  }
  return { verts, faces }
}

export function edgeKey(a: number, b: number): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

// Project a 3D polygon face into 2D using its plane normal.
// Returns local 2D coords where vertex[0] = (0,0), vertex[1] = (L, 0).
export function faceToLocal2D(faceVerts: Vec3[]): Vec2[] {
  if (faceVerts.length < 3) return []
  const v0 = faceVerts[0]
  const v1 = faceVerts[1]
  const edge01 = v3.sub(v1, v0)
  const L01 = v3.len(edge01)
  if (L01 < 1e-12) return []
  const u = v3.norm(edge01)
  const v2v = faceVerts[2]
  const n = v3.norm(v3.cross(edge01, v3.sub(v2v, v0)))
  const wVec = v3.cross(n, u)
  return faceVerts.map(v => {
    const d = v3.sub(v, v0)
    return { x: v3.dot(d, u), y: v3.dot(d, wVec) }
  })
}

// Given shared edge p0→p1 (in global 2D) and face local 2D coords,
// transform local coords so that local[shareA] → p0, local[shareB] → p1,
// placing the face on the outward side of the edge (away from parentCentroid).
export function localToGlobal(
  local: Vec2[],
  shareA: number,
  shareB: number,
  p0: Vec2,
  p1: Vec2,
  parentCentroid: Vec2,
): Vec2[] {
  const la = local[shareA]
  const lb = local[shareB]

  const localDir = v2.norm(v2.sub(lb, la))
  const globalDir = v2.norm(v2.sub(p1, p0))

  const cos = v2.dot(localDir, globalDir)
  const sin = localDir.x * globalDir.y - localDir.y * globalDir.x

  const rotate = (v: Vec2): Vec2 => ({
    x: cos * v.x - sin * v.y,
    y: sin * v.x + cos * v.y,
  })

  const rotatedLa = rotate(la)
  const tx = p0.x - rotatedLa.x
  const ty = p0.y - rotatedLa.y

  const transformed = local.map(v => {
    const r = rotate(v)
    return { x: r.x + tx, y: r.y + ty }
  })

  const centroid = transformed.reduce(
    (acc, p) => ({ x: acc.x + p.x / transformed.length, y: acc.y + p.y / transformed.length }),
    { x: 0, y: 0 }
  )
  const midEdge = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }
  const toParent = v2.sub(parentCentroid, midEdge)
  const toCentroid = v2.sub(centroid, midEdge)
  const sameSign = v2.dot(toParent, toCentroid) > 0

  if (sameSign) {
    const edgeDir = v2.norm(v2.sub(p1, p0))
    const perpEdge = v2.perp(edgeDir)
    return transformed.map(p => {
      const rel = v2.sub(p, p0)
      const along = v2.dot(rel, edgeDir)
      const perp = v2.dot(rel, perpEdge)
      return v2.add(p0, v2.add(v2.scale(edgeDir, along), v2.scale(perpEdge, -perp)))
    })
  }

  return transformed
}
