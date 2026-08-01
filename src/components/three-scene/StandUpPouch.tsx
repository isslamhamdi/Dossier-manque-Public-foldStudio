'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial } from './materials'

interface StandUpPouchProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  params?: BoxParams
}

// Stand-up pouch geometry:
// - Front panel: flat plane, curved top edge
// - Back panel: flat plane, curved top edge
// - Bottom gusset: elliptic half-cylinder connecting front/back at base
// - Side seals: thin flattened strips left & right
// - Zipper strip near top
// - Top seal above zipper
function makePouchGeo(w: number, h: number, d: number, segs = 32): THREE.BufferGeometry {
  const hw = w / 2
  const gussetR  = d / 2    // bottom gusset fold radius
  const bodyH    = h - gussetR   // straight body height
  const sealW    = w * 0.04     // side seal width

  const positions: number[] = []
  const indices: number[] = []
  let vc = 0

  function quad(a: [number,number,number], b: [number,number,number], c: [number,number,number], dd: [number,number,number], flip=false) {
    const i = vc
    positions.push(...a, ...b, ...c, ...dd)
    vc += 4
    if (!flip) { indices.push(i, i+1, i+2, i, i+2, i+3) }
    else        { indices.push(i, i+2, i+1, i, i+3, i+2) }
  }

  // — Front panel (flat, faces +z) —
  // Dimensions: w × bodyH, bottom at y = 0, z = +d/2
  quad(
    [-hw, 0,  d/2],
    [ hw, 0,  d/2],
    [ hw, bodyH, d/2],
    [-hw, bodyH, d/2],
  )

  // — Back panel (flat, faces -z) —
  quad(
    [-hw, 0,  -d/2],
    [ hw, 0,  -d/2],
    [ hw, bodyH, -d/2],
    [-hw, bodyH, -d/2],
    true
  )

  // — Bottom gusset: semi-circle connecting front to back at base —
  // Sweeps from +z to -z (π radians) for segs steps
  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * Math.PI         // 0 → π
    const a1 = ((i + 1) / segs) * Math.PI
    // At each step: two x positions (left strip & right strip combined into full panel)
    // Create a thin quad spanning full width
    const z0f = gussetR * Math.cos(a0), y0f = -gussetR * Math.sin(a0)
    const z1f = gussetR * Math.cos(a1), y1f = -gussetR * Math.sin(a1)
    quad(
      [-hw, y0f, z0f],
      [ hw, y0f, z0f],
      [ hw, y1f, z1f],
      [-hw, y1f, z1f],
      false
    )
  }

  // — Left side seal: thin strip at x = -hw, from y=0 to y=bodyH —
  quad(
    [-hw, 0, -d/2],
    [-hw, 0,  d/2],
    [-hw, bodyH,  d/2],
    [-hw, bodyH, -d/2],
    true
  )
  // — Right side seal —
  quad(
    [ hw, 0, -d/2],
    [ hw, 0,  d/2],
    [ hw, bodyH,  d/2],
    [ hw, bodyH, -d/2],
  )

  // — Zipper strip at 85% body height —
  const zipY = bodyH * 0.82
  const zipT = h * 0.025
  // Front side
  quad(
    [-hw, zipY, d/2 + 0.001],
    [ hw, zipY, d/2 + 0.001],
    [ hw, zipY + zipT, d/2 + 0.001],
    [-hw, zipY + zipT, d/2 + 0.001],
  )

  // — Top seal panel: from zipY+zipT to bodyH (flat, covers both front & back) —
  const topSealH = bodyH - zipY - zipT
  if (topSealH > 0.001) {
    // Front
    quad(
      [-hw, zipY + zipT, d/2 + 0.0005],
      [ hw, zipY + zipT, d/2 + 0.0005],
      [ hw, bodyH, d/2 + 0.0005],
      [-hw, bodyH, d/2 + 0.0005],
    )
    // Back
    quad(
      [-hw, zipY + zipT, -d/2 - 0.0005],
      [ hw, zipY + zipT, -d/2 - 0.0005],
      [ hw, bodyH, -d/2 - 0.0005],
      [-hw, bodyH, -d/2 - 0.0005],
      true
    )
    // Top seal edge connecting front to back
    quad(
      [-hw, bodyH, -d/2],
      [ hw, bodyH, -d/2],
      [ hw, bodyH,  d/2],
      [-hw, bodyH,  d/2],
    )
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function StandUpPouch({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
}: StandUpPouchProps) {
  const gussetR = d / 2
  const geo = useMemo(() => makePouchGeo(w, h, d), [w, h, d])
  useEffect(() => () => { geo.dispose() }, [geo])

  const holoRef = useRef<THREE.ShaderMaterial | null>(null)
  const extMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const m = buildHolographicMaterial(THREE.DoubleSide); holoRef.current = m; return m
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.DoubleSide)
  }, [extPreset, extColor])
  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { extMat.dispose() }, [extMat])

  // Zipper strip material: slightly darker
  const zipMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c8c0b0', roughness: 0.5, metalness: 0.1, side: THREE.DoubleSide,
  }), [])
  useEffect(() => () => { zipMat.dispose() }, [zipMat])

  // Offset everything up so bottom sits at y = -h/2
  const yOff = -h / 2 + gussetR

  return (
    <group position={[0, yOff, 0]}>
      <mesh castShadow receiveShadow geometry={geo} material={extMat} />
    </group>
  )
}
