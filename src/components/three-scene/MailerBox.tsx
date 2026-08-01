'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface MailerBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

export function MailerBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: MailerBoxProps) {
  const t = (params?.thickness ?? 0.5) * 2 / 100

  // Two-piece telescope box: shallow lid on deep base
  // Clear gap between pieces so the junction is obvious
  const gap  = h * 0.018               // dark visible gap at seam
  const lidH = h * 0.30
  const baseH = h - lidH - gap         // remaining height for base

  // Lid: occupies top 30% (from h/2 down)
  const lidY  = h / 2 - lidH / 2
  // Gap: immediately below the lid
  const gapY  = h / 2 - lidH - gap / 2
  // Base: fills everything below the gap
  const baseY = -h / 2 + baseH / 2

  // Lid is noticeably wider/deeper so the step at the seam is clearly visible
  const lidW = w + Math.max(t * 5, w * 0.030)
  const lidD = d + Math.max(t * 5, d * 0.030)

  const holoRef = useRef<THREE.ShaderMaterial | null>(null)

  // Lid exterior material (shared between lid mesh instances)
  const lidExtMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const m = buildHolographicMaterial(THREE.FrontSide)
      holoRef.current = m
      return m
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.FrontSide)
  }, [extPreset, extColor])

  // Base exterior — same look but separate instance
  const baseExtMat = useMemo(
    () => buildMaterial(extPreset, extColor, THREE.FrontSide),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extPreset, extColor]
  )

  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { lidExtMat.dispose() }, [lidExtMat])
  useEffect(() => () => { baseExtMat.dispose() }, [baseExtMat])

  const intC = intPreset === 'personnalise' ? intColor : getDef(intPreset).color

  const lidIntMat = useMemo(() => {
    const m = buildMaterial(intPreset, intC, THREE.BackSide)
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])

  const baseIntMat = useMemo(() => {
    const m = buildMaterial(intPreset, intC, THREE.BackSide)
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])

  useEffect(() => () => { lidIntMat.dispose() }, [lidIntMat])
  useEffect(() => () => { baseIntMat.dispose() }, [baseIntMat])

  // Dark material for the gap — MeshBasicMaterial ignores lighting, always dark
  const seamMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#2a2520' }), [])
  useEffect(() => () => { seamMat.dispose() }, [seamMat])

  return (
    <group>
      {/* ── LID (top piece, telescopes over base) ── */}
      <group position={[0, lidY, 0]}>
        <mesh castShadow receiveShadow material={lidExtMat}>
          <boxGeometry args={[lidW, lidH, lidD]} />
        </mesh>
        {/* Interior backside */}
        <mesh material={lidIntMat}>
          <boxGeometry args={[lidW - t * 2, lidH - t, lidD - t * 2]} />
        </mesh>
      </group>

      {/* ── BASE (deep bottom piece) ── */}
      <group position={[0, baseY, 0]}>
        <mesh castShadow receiveShadow material={baseExtMat}>
          <boxGeometry args={[w, baseH, d]} />
        </mesh>
        <mesh material={baseIntMat}>
          <boxGeometry args={[w - t * 2, baseH - t, d - t * 2]} />
        </mesh>
      </group>

      {/* Dark gap stripe between lid and base — always visible */}
      <mesh position={[0, gapY, 0]} material={seamMat} renderOrder={0}>
        <boxGeometry args={[lidW + 0.004, gap, lidD + 0.004]} />
      </mesh>
    </group>
  )
}
