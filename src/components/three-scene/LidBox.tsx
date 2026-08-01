'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { getCardboardColorMap, getCardboardBumpMap, getKraftColorMap, getKraftBumpMap } from '../../lib/textures'

interface LidBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
  foldProgress?: number
}

// Open-top tray geometry (bottom + 4 walls, no top face)
function makeTrayGeo(w: number, h: number, d: number) {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const pos = new Float32Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, -hh,  hd, -hw, -hh,  hd,
    -hw,  hh, -hd,  hw,  hh, -hd,  hw,  hh,  hd, -hw,  hh,  hd,
  ])
  const idx = [
    0, 1, 2,  0, 2, 3,    // bottom
    0, 4, 5,  0, 5, 1,    // front (-z)
    3, 2, 6,  3, 6, 7,    // back (+z)
    0, 3, 7,  0, 7, 4,    // left (-x)
    1, 5, 6,  1, 6, 2,    // right (+x)
  ]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

export function LidBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton', intColor = '#e8e4dc',
  params,
  foldProgress = 1,
}: LidBoxProps) {
  const t    = (params?.thickness ?? 0.5) * 2 / 100
  const t_ps = Math.max(t / 2, 0.010)

  const hBody = h * 0.66
  const hLid  = h * 0.36
  const yBody = -h / 2 + hBody / 2
  const yLid  = -h / 2 + hBody + 0.016 + hLid / 2

  const bodyGeo   = useMemo(() => makeTrayGeo(w, hBody, d), [w, hBody, d])
  const bodyInGeo = useMemo(() => makeTrayGeo(w - t, hBody - t, d - t), [w, hBody, d, t])
  const lidGeo    = useMemo(() => new THREE.BoxGeometry(w + t, hLid, d + t), [w, t, hLid, d])
  const lidInGeo  = useMemo(() => new THREE.BoxGeometry(w - t, hLid - t_ps, d - t), [w, t, t_ps, hLid, d])

  useEffect(() => () => {
    bodyGeo.dispose(); bodyInGeo.dispose(); lidGeo.dispose(); lidInGeo.dispose()
  }, [bodyGeo, bodyInGeo, lidGeo, lidInGeo])

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

  // #43: Animated lid opening — foldProgress 0→1 = fully closed, use reverse to open
  // openAngle: 0 = closed, ~120° = fully open
  const openAngle = (1 - Math.max(0, Math.min(1, foldProgress))) * (Math.PI * 2 / 3)
  const lidGroupRef = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!lidGroupRef.current) return
    // Pivot around the back edge of the lid (z = -d/2)
    lidGroupRef.current.rotation.x = -openAngle
  })

  return (
    <group>
      {/* Body tray */}
      <group position={[0, yBody, 0]}>
        <mesh castShadow receiveShadow geometry={bodyGeo} material={extMat} />
        <mesh geometry={bodyInGeo} material={intMat} />
      </group>
      {/* Lid — animated opening: pivot at back edge (z = -d/2) */}
      <group position={[0, yLid - hLid / 2, -(d / 2)]}>
        <group ref={lidGroupRef} position={[0, hLid / 2, d / 2]}>
          <mesh castShadow receiveShadow geometry={lidGeo} material={extMat} />
          <mesh geometry={lidInGeo} material={intMat} />
        </group>
      </group>
    </group>
  )
}
