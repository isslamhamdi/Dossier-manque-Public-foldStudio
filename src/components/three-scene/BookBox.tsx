'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface BookBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

// Open-top tray (5 faces, no top)
function makeTrayGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const pos = new Float32Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,
    -hw,  hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd, -hw,  hh,  hd,
  ])
  const idx = [
    0, 1, 2,  0, 2, 3,    // bottom
    0, 4, 5,  0, 5, 1,    // front (-z)
    3, 2, 6,  3, 6, 7,    // back  (+z)
    0, 3, 7,  0, 7, 4,    // left  (-x)
    1, 5, 6,  1, 6, 2,    // right (+x)
  ]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

// Book box / clamshell: base tray (60% of height) + lid tray (42%) hinged open ~30°
// The two halves share the same footprint (w × d) and hinge on the right spine (-x edge)
export function BookBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: BookBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  const hBase = h * 0.58
  const hLid  = h * 0.44
  const spineAngle = Math.PI * 0.18   // how far lid is open (~32°)

  const baseGeo   = useMemo(() => makeTrayGeo(w, hBase, d), [w, hBase, d])
  const baseInGeo = useMemo(() => makeTrayGeo(w - t, hBase - t_ps, d - t), [w, hBase, d, t, t_ps])
  const lidGeo    = useMemo(() => makeTrayGeo(w, hLid, d), [w, hLid, d])
  const lidInGeo  = useMemo(() => makeTrayGeo(w - t, hLid - t_ps, d - t), [w, hLid, d, t, t_ps])

  useEffect(() => () => {
    baseGeo.dispose(); baseInGeo.dispose(); lidGeo.dispose(); lidInGeo.dispose()
  }, [baseGeo, baseInGeo, lidGeo, lidInGeo])

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

  // Base sits at bottom, lid hinges from base's top edge on the left spine
  const yBase = -h / 2 + hBase / 2
  const pivotX = -w / 2
  const pivotY = -h / 2 + hBase

  return (
    <group>
      {/* Base tray */}
      <group position={[0, yBase, 0]}>
        <mesh castShadow receiveShadow geometry={baseGeo} material={extMat} />
        <mesh geometry={baseInGeo} material={intMat} />
      </group>

      {/* Lid — hinged open from left spine edge */}
      <group position={[pivotX, pivotY, 0]}>
        <group rotation={[0, 0, spineAngle]}>
          <group position={[w / 2, hLid / 2, 0]}>
            <mesh castShadow geometry={lidGeo} material={extMat} />
            <mesh geometry={lidInGeo} material={intMat} />
          </group>
        </group>
      </group>
    </group>
  )
}
