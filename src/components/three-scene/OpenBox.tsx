'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface OpenBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

function makeOpenBoxGeo(w: number, h: number, d: number) {
  const hw = w / 2, hh = h / 2, hd = d / 2

  // prettier-ignore
  const pos = new Float32Array([
    -hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh, hd, -hw,-hh, hd,  // 0-3 bottom
    -hw, hh,-hd,  hw, hh,-hd,  hw, hh, hd, -hw, hh, hd,  // 4-7 top rim (no top face)
  ])

  // prettier-ignore
  const idx = [
    0,1,2, 0,2,3,   // bottom
    0,4,5, 0,5,1,   // front
    2,7,3, 2,6,7,   // back
    0,3,7, 0,7,4,   // left
    1,5,6, 1,6,2,   // right
    // no top face — box is open
  ]

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function OpenBox({ w, h, d, extPreset = 'brillant', extColor = '#ffffff', intPreset = 'carton', intColor = '#e8e4dc', params }: OpenBoxProps) {
  const t = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)  // per-side thickness, min 1mm visible
  const geo = useMemo(() => makeOpenBoxGeo(w, h, d), [w, h, d])
  const innerGeo = useMemo(() => makeOpenBoxGeo(w - t, h - t, d - t), [w, h, d, t])
  useEffect(() => () => { geo.dispose(); innerGeo.dispose() }, [geo, innerGeo])

  const holoRef = useRef<THREE.ShaderMaterial | null>(null)
  const extMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const m = buildHolographicMaterial(THREE.FrontSide)
      holoRef.current = m
      return m
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.FrontSide)
  }, [extPreset, extColor])

  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { extMat.dispose() }, [extMat])

  const intDef = getDef(intPreset)
  const intC = intPreset === 'personnalise' ? intColor : intDef.color
  const intMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(intC), roughness: intDef.roughness, metalness: 0, side: THREE.BackSide })
    if (intPreset === 'carton') { m.map = getCardboardColorMap(); m.bumpMap = getCardboardBumpMap(); m.bumpScale = 0.004 }
    else if (intPreset === 'kraft') { m.map = getKraftColorMap(); m.bumpMap = getKraftBumpMap(); m.bumpScale = 0.006 }
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])
  useEffect(() => () => { intMat.dispose() }, [intMat])

  return (
    <group>
      <mesh castShadow receiveShadow geometry={geo} material={extMat} />
      <mesh geometry={innerGeo} material={intMat} />
    </group>
  )
}
