'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface GableBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

function makeGableGeo(w: number, h: number, d: number) {
  const ph = d * 0.44
  const hw = w / 2, hh = h / 2, hd = d / 2

  // prettier-ignore
  const pos = new Float32Array([
    -hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh, hd, -hw,-hh, hd,  // 0-3 bottom
    -hw, hh,-hd,  hw, hh,-hd,  hw, hh, hd, -hw, hh, hd,  // 4-7 body top
    -hw, hh+ph,0,  hw, hh+ph,0,                            // 8-9 ridge
  ])

  // prettier-ignore
  const idx = [
    0,1,2, 0,2,3,       // bottom (-Y)
    0,4,5, 0,5,1,       // front body (-Z)
    2,7,3, 2,6,7,       // back body (+Z)
    0,3,7, 0,7,4,       // left body (-X)
    1,5,6, 1,6,2,       // right body (+X)
    4,5,9, 4,9,8,       // front roof
    9,8,7, 9,7,6,       // back roof
    4,7,8,              // left gable triangle
    5,9,6,              // right gable triangle
  ]

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function GableBox({ w, h, d, extPreset = 'brillant', extColor = '#ffffff', intPreset = 'carton', intColor = '#e8e4dc', params }: GableBoxProps) {
  const t = (params?.thickness ?? 0.5) * 2 / 100
  const geo = useMemo(() => makeGableGeo(w, h, d), [w, h, d])
  const innerGeo = useMemo(() => makeGableGeo(w - t, h - t, d - t), [w, h, d, t])
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

  const intC = intPreset === 'personnalise' ? intColor : getDef(intPreset).color
  const intMat = useMemo(() => {
    const m = buildMaterial(intPreset, intC, THREE.BackSide)
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
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
