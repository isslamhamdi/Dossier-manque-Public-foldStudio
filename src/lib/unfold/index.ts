import { v2 } from './math'
import { parseOBJ, edgeKey, faceToLocal2D, localToGlobal } from './geometry'
import type { UnfoldResult, UnfoldFace } from './types'

export type { Vec2, Vec3, UnfoldFace, UnfoldResult } from './types'

export function unfoldMesh(objText: string, targetSize = 200): UnfoldResult | null {
  try {
    const { verts: raw, faces } = parseOBJ(objText)
    if (raw.length === 0 || faces.length === 0) return null

    const xs = raw.map(v => v.x), ys = raw.map(v => v.y), zs = raw.map(v => v.z)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2
    const cz = (Math.min(...zs) + Math.max(...zs)) / 2
    const maxDim = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), Math.max(...zs) - Math.min(...zs))
    const sf = maxDim > 0 ? targetSize / maxDim : 1
    const verts = raw.map(v => ({ x: (v.x - cx) * sf, y: (v.y - cy) * sf, z: (v.z - cz) * sf }))

    const edgeToFaces = new Map<string, number[]>()
    faces.forEach((face, fi) => {
      for (let i = 0; i < face.length; i++) {
        const a = face[i], b = face[(i + 1) % face.length]
        const key = edgeKey(a, b)
        if (!edgeToFaces.has(key)) edgeToFaces.set(key, [])
        edgeToFaces.get(key)!.push(fi)
      }
    })

    const adj: Array<Array<{ fi: number; ea: number; eb: number }>> = faces.map(() => [])
    edgeToFaces.forEach((fs, key) => {
      if (fs.length >= 2) {
        const [f0, f1] = fs
        const [a, b] = key.split('|').map(Number)
        adj[f0].push({ fi: f1, ea: a, eb: b })
        adj[f1].push({ fi: f0, ea: a, eb: b })
      }
    })

    const pos2D: (import('./types').Vec2[] | null)[] = faces.map(() => null)
    const visited = new Uint8Array(faces.length)
    const treeEdges = new Set<string>()
    const queue: number[] = [0]
    visited[0] = 1

    const rootLocal = faceToLocal2D(faces[0].map(i => verts[i]))
    if (!rootLocal.length) return null
    pos2D[0] = rootLocal

    while (queue.length > 0) {
      const fi = queue.shift()!
      const parentPos = pos2D[fi]!
      const parentCentroid = parentPos.reduce(
        (acc, p) => ({ x: acc.x + p.x / parentPos.length, y: acc.y + p.y / parentPos.length }),
        { x: 0, y: 0 }
      )

      for (const { fi: ni, ea, eb } of adj[fi]) {
        if (visited[ni]) continue
        visited[ni] = 1
        queue.push(ni)
        treeEdges.add(edgeKey(ea, eb))

        const parentFace = faces[fi]
        const parentA = parentFace.indexOf(ea)
        const parentB = parentFace.indexOf(eb)
        if (parentA === -1 || parentB === -1) continue
        const p0 = parentPos[parentA]
        const p1 = parentPos[parentB]

        const childFace = faces[ni]
        const childLocal = faceToLocal2D(childFace.map(i => verts[i]))
        if (!childLocal.length) continue

        const childA = childFace.indexOf(ea)
        const childB = childFace.indexOf(eb)
        if (childA === -1 || childB === -1) continue

        pos2D[ni] = localToGlobal(childLocal, childA, childB, p0, p1, parentCentroid)
      }
    }

    const unfoldedFaces: UnfoldFace[] = []
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    faces.forEach((_, fi) => {
      const p = pos2D[fi]
      if (!p) return
      unfoldedFaces.push({ vertices: p, originalFaceIdx: fi })
      p.forEach(v => {
        if (v.x < minX) minX = v.x
        if (v.y < minY) minY = v.y
        if (v.x > maxX) maxX = v.x
        if (v.y > maxY) maxY = v.y
      })
    })

    const foldLines: [import('./types').Vec2, import('./types').Vec2][] = []
    const cutLines: [import('./types').Vec2, import('./types').Vec2][] = []

    edgeToFaces.forEach((fs, key) => {
      const [a, b] = key.split('|').map(Number)
      const isTree = treeEdges.has(key)

      if (fs.length >= 2) {
        const f0 = fs[0]
        const p = pos2D[f0]
        if (!p) return
        const ia = faces[f0].indexOf(a)
        const ib = faces[f0].indexOf(b)
        if (ia === -1 || ib === -1) return
        if (isTree) foldLines.push([p[ia], p[ib]])
      } else if (fs.length === 1) {
        const f0 = fs[0]
        const p = pos2D[f0]
        if (!p) return
        const ia = faces[f0].indexOf(a)
        const ib = faces[f0].indexOf(b)
        if (ia === -1 || ib === -1) return
        cutLines.push([p[ia], p[ib]])
      }
    })

    const TAB_SIZE = targetSize * 0.06
    const glueTabs: import('./types').Vec2[][] = []
    cutLines.forEach((line, i) => {
      if (i % 2 !== 0) return
      const [a, b] = line
      const dir = v2.norm(v2.sub(b, a))
      const perp = v2.perp(dir)
      const inset = TAB_SIZE * 0.1
      const a2 = v2.add(v2.add(a, v2.scale(dir, inset)), v2.scale(perp, TAB_SIZE))
      const b2 = v2.add(v2.add(b, v2.scale(dir, -inset)), v2.scale(perp, TAB_SIZE))
      glueTabs.push([a, b, b2, a2])
    })

    return {
      faces: unfoldedFaces,
      foldLines,
      cutLines,
      glueTabs,
      bounds: { minX, minY, maxX, maxY },
      stats: {
        originalFaces: faces.length,
        cutEdges: cutLines.length,
        foldEdges: foldLines.length,
        glueTabs: glueTabs.length,
      },
    }
  } catch {
    return null
  }
}
