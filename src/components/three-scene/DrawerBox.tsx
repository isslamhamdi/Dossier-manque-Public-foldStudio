'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface DrawerBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

// Sleeve: rectangular tube open at front (+z) — back + top + bottom + left + right
function makeSleeveGeo(w: number, h: number, d: number) {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const pos = new Float32Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,
    -hw,  hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd, -hw,  hh,  hd,
  ])
  const idx = [
    0, 1, 2,  0, 2, 3,    // bottom
    4, 7, 6,  4, 6, 5,    // top
    0, 4, 5,  0, 5, 1,    // back (-z)
    0, 3, 7,  0, 7, 4,    // left (-x)
    1, 5, 6,  1, 6, 2,    // right (+x)
    // no front (+z) — open end where drawer slides out
  ]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function DrawerBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: DrawerBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  // Sleeve: full box size, open at front
  const sleeveGeo   = useMemo(() => makeSleeveGeo(w, h, d), [w, h, d])
  const sleeveInGeo = useMemo(() => makeSleeveGeo(w - t, h - t, d - t), [w, h, d, t])

  // Drawer: slightly smaller, pulled forward 28% out of the sleeve
  const dW = w - t * 1.4
  const dH = h - t * 1.4
  const dD = d * 0.72          // 72% of sleeve depth
  const pullOut = d * 0.28     // how far the drawer front sticks past the sleeve front
  const drawerZ = d / 2 - dD / 2 + pullOut   // center z of the drawer in world space

  const drawerGeo   = useMemo(() => new THREE.BoxGeometry(dW, dH, dD), [dW, dH, dD])
  const drawerInGeo = useMemo(() => new THREE.BoxGeometry(dW - t, dH - t, dD - t), [dW, dH, dD, t])

  useEffect(() => () => {
    sleeveGeo.dispose(); sleeveInGeo.dispose(); drawerGeo.dispose(); drawerInGeo.dispose()
  }, [sleeveGeo, sleeveInGeo, drawerGeo, drawerInGeo])

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
      {/* Outer sleeve */}
      <mesh castShadow receiveShadow geometry={sleeveGeo} material={extMat} />
      <mesh geometry={sleeveInGeo} material={intMat} />
      {/* Inner drawer, pulled forward */}
      <group position={[0, 0, drawerZ]}>
        <mesh castShadow receiveShadow geometry={drawerGeo} material={extMat} />
        <mesh geometry={drawerInGeo} material={intMat} />
      </group>
    </group>
  )
}
