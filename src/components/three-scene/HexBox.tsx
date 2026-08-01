'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface HexBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

// Regular hexagonal prism — fits within (w × h × d) bounding box
function makeHexGeo(r: number, hh: number, open = false): THREE.BufferGeometry {
  const positions: number[] = []
  const indices: number[] = []

  // 6 top verts (0–5), 6 bottom verts (6–11)
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    positions.push(r * Math.cos(a), hh, r * Math.sin(a))
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3
    positions.push(r * Math.cos(a), -hh, r * Math.sin(a))
  }

  // 6 side panels — outward-facing normals
  for (let i = 0; i < 6; i++) {
    const n = (i + 1) % 6
    indices.push(i, n, n + 6,  i, n + 6, i + 6)
  }

  if (!open) {
    // Top cap (normal +y) — fan from center vertex 12
    positions.push(0, hh, 0)
    const cT = 12
    for (let i = 0; i < 6; i++) indices.push(cT, (i + 1) % 6, i)

    // Bottom cap (normal -y) — fan from center vertex 13
    positions.push(0, -hh, 0)
    const cB = 13
    for (let i = 0; i < 6; i++) indices.push(cB, i + 6, (i + 1) % 6 + 6)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function HexBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: HexBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  // Fit hex inside the (w × d) footprint:  apothem = min(w, d)/2 → r = apothem / cos(30°)
  const apothem = Math.min(w, d) / 2
  const r       = apothem / Math.cos(Math.PI / 6)   // circumradius

  const hBody = h * 0.68
  const hLid  = h * 0.35
  const yBody = -h / 2 + hBody / 2
  const yLid  = -h / 2 + hBody + 0.016 + hLid / 2

  const bodyGeo   = useMemo(() => makeHexGeo(r, hBody / 2, true),  [r, hBody])
  const bodyInGeo = useMemo(() => makeHexGeo(r - t_ps, hBody / 2 - t_ps / 2, true), [r, hBody, t_ps])
  // Body bottom cap
  const botCapGeo = useMemo(() => makeHexGeo(r, 0.001, false), [r])   // flat hex for bottom
  const lidGeo    = useMemo(() => makeHexGeo(r + t_ps * 0.5, hLid / 2, false), [r, hLid, t_ps])

  useEffect(() => () => {
    bodyGeo.dispose(); bodyInGeo.dispose(); botCapGeo.dispose(); lidGeo.dispose()
  }, [bodyGeo, bodyInGeo, botCapGeo, lidGeo])

  const holoRef = useRef<THREE.ShaderMaterial | null>(null)
  const extMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const m = buildHolographicMaterial(THREE.FrontSide); holoRef.current = m; return m
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.FrontSide)
  }, [extPreset, extColor])
  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { extMat.dispose() }, [extMat])

  const intC   = intPreset === 'personnalise' ? intColor : getDef(intPreset).color
  const intMat = useMemo(() => {
    const m = buildMaterial(intPreset, intC, THREE.BackSide)
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])
  useEffect(() => () => { intMat.dispose() }, [intMat])

  return (
    <group>
      {/* Body tray */}
      <group position={[0, yBody, 0]}>
        <mesh castShadow receiveShadow geometry={bodyGeo} material={extMat} />
        <mesh geometry={bodyInGeo} material={intMat} />
        <mesh position={[0, -hBody / 2, 0]} geometry={botCapGeo} material={extMat} />
      </group>
      {/* Hex lid */}
      <group position={[0, yLid, 0]}>
        <mesh castShadow receiveShadow geometry={lidGeo} material={extMat} />
      </group>
    </group>
  )
}
