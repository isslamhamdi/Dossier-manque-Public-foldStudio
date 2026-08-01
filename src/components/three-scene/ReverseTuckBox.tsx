'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface ReverseTuckBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

// French Reverse Tuck: top flap tucks into front, bottom flap tucks into back
// Visually: standard closed box + visible top & bottom tuck tabs
export function ReverseTuckBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: ReverseTuckBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  const flapH = Math.min(d * 0.85, h * 0.22)   // tuck flap height

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

  const creaseMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#1a0e00', transparent: true, opacity: 0.22, depthTest: false,
  }), [])
  useEffect(() => () => { creaseMat.dispose() }, [creaseMat])

  // Top tuck flap: folds into front face (-z) — angled slightly open
  const topFlapGeo  = useMemo(() => new THREE.PlaneGeometry(w - t * 2, flapH), [w, flapH, t])
  // Bottom tuck flap: folds into back face (+z)
  const botFlapGeo  = useMemo(() => new THREE.PlaneGeometry(w - t * 2, flapH), [w, flapH, t])
  useEffect(() => () => { topFlapGeo.dispose(); botFlapGeo.dispose() }, [topFlapGeo, botFlapGeo])

  // Crease lines matching SolidBox style
  const creaseOffset = 0.0008
  const creases = [
    { pos: [0, h / 2 - flapH, d / 2 + creaseOffset] as [number,number,number], args: [w, 0.003, 0.001] as [number,number,number] },
    { pos: [0, h / 2 - flapH, -d / 2 - creaseOffset] as [number,number,number], args: [w, 0.003, 0.001] as [number,number,number] },
    { pos: [0, -(h / 2 - flapH), d / 2 + creaseOffset] as [number,number,number], args: [w, 0.003, 0.001] as [number,number,number] },
    { pos: [0, -(h / 2 - flapH), -d / 2 - creaseOffset] as [number,number,number], args: [w, 0.003, 0.001] as [number,number,number] },
  ]

  return (
    <group>
      {/* Main box body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <primitive object={extMat} attach="material" />
      </mesh>
      {/* Interior */}
      <mesh>
        <boxGeometry args={[w - t * 2, h - t * 2, d - t * 2]} />
        <primitive object={intMat} attach="material" />
      </mesh>

      {/* Top tuck flap — slightly angled into front face */}
      <group position={[0, h / 2, -d / 2 + t_ps]} rotation={[-Math.PI * 0.06, 0, 0]}>
        <mesh geometry={topFlapGeo} material={extMat} />
      </group>
      {/* Bottom tuck flap — slightly angled into back face */}
      <group position={[0, -h / 2, d / 2 - t_ps]} rotation={[Math.PI * 0.06, 0, 0]}>
        <mesh geometry={botFlapGeo} material={extMat} />
      </group>

      {/* Crease lines */}
      {creases.map((c, i) => (
        <mesh key={i} position={c.pos} renderOrder={1}>
          <boxGeometry args={c.args} />
          <primitive object={creaseMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
