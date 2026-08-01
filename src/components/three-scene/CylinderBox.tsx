'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface CylinderBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

export function CylinderBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: CylinderBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)
  const segs = 40

  const r     = Math.min(w, d) / 2          // radius fits within footprint
  const hBody = h * 0.72
  const hLid  = h * 0.30 + t_ps
  const yBody = -h / 2 + hBody / 2
  const yLid  = -h / 2 + hBody + 0.014 + hLid / 2

  // Body: open-top cylinder (tube + bottom cap)
  const tubeGeo = useMemo(() => new THREE.CylinderGeometry(r, r, hBody, segs, 1, true), [r, hBody, segs])
  const botGeo  = useMemo(() => new THREE.CircleGeometry(r, segs), [r, segs])
  const inGeo   = useMemo(() => new THREE.CylinderGeometry(r - t_ps, r - t_ps, hBody - t_ps, segs, 1, true), [r, hBody, t_ps, segs])

  // Lid: slightly larger closed cylinder
  const lidGeo  = useMemo(() => new THREE.CylinderGeometry(r + t_ps * 0.6, r + t_ps * 0.6, hLid, segs, 1, false), [r, hLid, t_ps, segs])
  const lidInGeo = useMemo(() => new THREE.CylinderGeometry(r - t_ps * 0.2, r - t_ps * 0.2, hLid - t_ps, segs, 1, false), [r, hLid, t_ps, segs])

  useEffect(() => () => {
    tubeGeo.dispose(); botGeo.dispose(); inGeo.dispose()
    lidGeo.dispose(); lidInGeo.dispose()
  }, [tubeGeo, botGeo, inGeo, lidGeo, lidInGeo])

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
      {/* Body tube */}
      <group position={[0, yBody, 0]}>
        <mesh castShadow receiveShadow geometry={tubeGeo} material={extMat} />
        <mesh position={[0, -hBody / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={botGeo} material={extMat} />
        <mesh geometry={inGeo} material={intMat} />
      </group>
      {/* Lid cap */}
      <group position={[0, yLid, 0]}>
        <mesh castShadow receiveShadow geometry={lidGeo} material={extMat} />
        <mesh geometry={lidInGeo} material={intMat} />
      </group>
    </group>
  )
}
