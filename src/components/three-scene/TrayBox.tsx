'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface TrayBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
}

// 4-corner tray: open top display tray — bottom + 4 walls with corner locks visible
function makeTrayGeo(w: number, h: number, d: number): THREE.BufferGeometry {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const pos = new Float32Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,  // 0-3 bottom
     -hw,  hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd, -hw,  hh,  hd,  // 4-7 top ring
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

export function TrayBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
}: TrayBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  // Tray is shallow — use height as the tray wall height
  const trayH = Math.min(h, d * 0.6)

  const extGeo = useMemo(() => makeTrayGeo(w, trayH, d), [w, trayH, d])
  const intGeo = useMemo(() => makeTrayGeo(w - t, trayH - t_ps, d - t), [w, trayH, d, t, t_ps])

  useEffect(() => () => { extGeo.dispose(); intGeo.dispose() }, [extGeo, intGeo])

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

  const intDef = getDef(intPreset)
  const intC   = intPreset === 'personnalise' ? intColor : intDef.color
  const intMat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(intC), roughness: intDef.roughness, metalness: 0, side: THREE.BackSide,
    })
    if (intPreset === 'carton') { m.map = getCardboardColorMap(); m.bumpMap = getCardboardBumpMap(); m.bumpScale = 0.004 }
    else if (intPreset === 'kraft') { m.map = getKraftColorMap(); m.bumpMap = getKraftBumpMap(); m.bumpScale = 0.006 }
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intC])
  useEffect(() => () => { intMat.dispose() }, [intMat])

  const yOffset = -(h - trayH) / 2

  return (
    <group position={[0, yOffset, 0]}>
      <mesh castShadow receiveShadow geometry={extGeo} material={extMat} />
      <mesh geometry={intGeo} material={intMat} />
    </group>
  )
}
