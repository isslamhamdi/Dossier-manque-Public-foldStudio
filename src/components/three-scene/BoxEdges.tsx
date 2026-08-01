'use client'

import * as THREE from 'three'

export function BoxEdges({ w, h, d, foldProgress, thickness = 0.5 }: { w: number; h: number; d: number; foldProgress: number; thickness?: number }) {
  const halfW = w / 2, halfH = h / 2, halfD = d / 2
  // Edge width = cardboard thickness in Three.js units (mm * 1/100)
  const t = Math.max(thickness * 2 / 100, Math.max(w, h, d) * 0.006)
  if (foldProgress < 0.88) return null
  const edges: [THREE.Vector3, 'x' | 'y' | 'z', number][] = [
    [new THREE.Vector3(0, -halfH, -halfD), 'x', w], [new THREE.Vector3(0, -halfH,  halfD), 'x', w],
    [new THREE.Vector3(-halfW, -halfH, 0), 'z', d], [new THREE.Vector3( halfW, -halfH, 0), 'z', d],
    [new THREE.Vector3(0,  halfH, -halfD), 'x', w], [new THREE.Vector3(0,  halfH,  halfD), 'x', w],
    [new THREE.Vector3(-halfW,  halfH, 0), 'z', d], [new THREE.Vector3( halfW,  halfH, 0), 'z', d],
    [new THREE.Vector3(-halfW, 0, -halfD), 'y', h], [new THREE.Vector3( halfW, 0, -halfD), 'y', h],
    [new THREE.Vector3( halfW, 0,  halfD), 'y', h], [new THREE.Vector3(-halfW, 0,  halfD), 'y', h],
  ]
  return (
    <group>
      {edges.map(([pos, axis, len], i) => {
        const args: [number, number, number] =
          axis === 'x' ? [len + t, t, t] : axis === 'y' ? [t, len + t, t] : [t, t, len + t]
        return (
          <mesh key={i} position={pos}>
            <boxGeometry args={args} />
            <meshStandardMaterial color="#c8a87a" roughness={0.85} metalness={0} />
          </mesh>
        )
      })}
    </group>
  )
}
