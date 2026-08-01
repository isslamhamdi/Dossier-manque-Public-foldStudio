'use client'

import * as THREE from 'three'
import { useMemo } from 'react'

interface ProductInsideBoxProps {
  w: number   // box width (Three.js units)
  h: number   // box height
  d: number   // box depth
  shape?: 'box' | 'cylinder' | 'sphere'
  color?: string
  scale?: number  // 0.5 = fills half the box
}

// #44: Renders a simple product placeholder inside the 3D packaging
export function ProductInsideBox({ w, h, d, shape = 'box', color = '#f0e9de', scale = 0.7 }: ProductInsideBoxProps) {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    roughness: 0.6,
    metalness: 0,
    side: THREE.FrontSide,
  }), [color])

  const pw = w * scale * 0.9
  const ph = h * scale
  const pd = d * scale * 0.9

  // Position: sit on the interior floor, slightly inside
  const py = -h / 2 + ph / 2 + h * 0.02

  if (shape === 'cylinder') {
    const r = Math.min(pw, pd) / 2
    return (
      <mesh position={[0, py, 0]} material={mat} castShadow>
        <cylinderGeometry args={[r, r, ph, 20]} />
      </mesh>
    )
  }
  if (shape === 'sphere') {
    const r = Math.min(pw, ph, pd) / 2
    return (
      <mesh position={[0, py, 0]} material={mat} castShadow>
        <sphereGeometry args={[r, 20, 16]} />
      </mesh>
    )
  }
  return (
    <mesh position={[0, py, 0]} material={mat} castShadow receiveShadow>
      <boxGeometry args={[pw, ph, pd]} />
    </mesh>
  )
}
