'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface FlipTopBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

function makeOpenTopGeo(w: number, h: number, d: number) {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const pos = new Float32Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,  // bottom
    -hw,  hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd, -hw,  hh,  hd,  // top rim
  ])
  const idx = [
    0, 1, 2, 0, 2, 3,    // bottom
    0, 4, 5, 0, 5, 1,    // front (-z)
    2, 7, 3, 2, 6, 7,    // back  (+z)
    0, 3, 7, 0, 7, 4,    // left  (-x)
    1, 5, 6, 1, 6, 2,    // right (+x)
    // no top
  ]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function FlipTopBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: FlipTopBoxProps) {
  const t = (params?.thickness ?? 0.5) * 2 / 100
  const lidThick = Math.max(t * 1.5, h * 0.018)   // lid panel thickness

  // Body is the full box without the top face
  const bodyGeo = useMemo(() => makeOpenTopGeo(w, h, d), [w, h, d])
  const innerGeo = useMemo(() => makeOpenTopGeo(w - t * 2, h - t, d - t * 2), [w, h, d, t])
  useEffect(() => () => { bodyGeo.dispose(); innerGeo.dispose() }, [bodyGeo, innerGeo])

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

  const lidExtMat = useMemo(
    () => buildMaterial(extPreset, extColor, THREE.DoubleSide),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extPreset, extColor]
  )

  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { extMat.dispose() }, [extMat])
  useEffect(() => () => { lidExtMat.dispose() }, [lidExtMat])

  const intC = intPreset === 'personnalise' ? intColor : getDef(intPreset).color

  const intMat = useMemo(() => {
    const m = buildMaterial(intPreset, intC, THREE.BackSide)
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])
  useEffect(() => () => { intMat.dispose() }, [intMat])

  // Lid is a thin panel (w × d × lidThick) hinged at the back-top edge
  // Hinge pivot: (0, h/2, -d/2)  ← back-top edge of body
  // When closed, lid center is at (0, h/2, 0) → local offset from pivot = (0, 0, d/2)
  // Rotation around X: negative angle lifts the front edge upward (box opens)
  const OPEN_ANGLE = -Math.PI * 0.38   // ≈ 68° open

  return (
    <group>
      {/* ── Box body (5 walls, open top) ── */}
      <mesh castShadow receiveShadow geometry={bodyGeo} material={extMat} />
      <mesh geometry={innerGeo} material={intMat} />

      {/* ── Hinged lid, shown open ── */}
      {/* Pivot at back-top edge */}
      <group position={[0, h / 2, -d / 2]}>
        <group rotation={[OPEN_ANGLE, 0, 0]}>
          {/* Lid center is d/2 forward from the pivot */}
          <group position={[0, 0, d / 2]}>
            {/* Lid outer panel */}
            <mesh castShadow material={lidExtMat}>
              <boxGeometry args={[w, lidThick, d]} />
            </mesh>
            {/* Underside of lid shows interior colour */}
            <mesh material={intMat}>
              <boxGeometry args={[w - t, lidThick * 0.4, d - t]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
