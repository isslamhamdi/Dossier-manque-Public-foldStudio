'use client'

import { useMemo, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createLODMesh } from './useAssetExport'

function parseOBJ(text: string): THREE.BufferGeometry | null {
  try {
    const positions: number[] = [], vertices: number[] = []
    for (const line of text.split('\n')) {
      const p = line.trim().split(/\s+/)
      if (p[0] === 'v') positions.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]))
      else if (p[0] === 'f') {
        const idx = p.slice(1).map(x => parseInt(x.split('/')[0]) - 1)
        for (let i = 1; i < idx.length - 1; i++)
          for (const j of [idx[0], idx[i], idx[i + 1]])
            vertices.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2])
      }
    }
    if (!vertices.length) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    g.computeVertexNormals(); g.center()
    const box = new THREE.Box3().setFromBufferAttribute(g.attributes.position as THREE.BufferAttribute)
    const sz = new THREE.Vector3(); box.getSize(sz)
    const s = Math.max(sz.x, sz.y, sz.z); if (s > 0) g.scale(2 / s, 2 / s, 2 / s)
    return g
  } catch { return null }
}

export function OBJMesh({ content }: { content: string }) {
  const { scene } = useThree()
  const geo = useMemo(() => parseOBJ(content), [content])

  // #174 LOD — 3 niveaux de détail pour le mesh OBJ
  const lod = useMemo(() => {
    if (!geo) return null
    const mat = new THREE.MeshStandardMaterial({ color: '#d0ccc8', roughness: 0.7, metalness: 0, side: THREE.DoubleSide })
    return createLODMesh(geo, mat)
  }, [geo])

  useEffect(() => {
    if (!lod) return
    scene.add(lod)
    return () => { scene.remove(lod) }
  }, [lod, scene])

  if (!geo) return null
  return (
    <lineSegments>
      <edgesGeometry args={[geo]} />
      <lineBasicMaterial color="#999" />
    </lineSegments>
  )
}
