'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial } from './materials'

interface PillowBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  params?: BoxParams
}

// Pillow box: flat left/right panels, curved front/back (sinusoidal depth profile), pointed top/bottom
function makePillowGeo(w: number, h: number, d: number, segs = 24): THREE.BufferGeometry {
  const hw = w / 2, hh = h / 2, hd = d / 2
  const positions: number[] = []
  const indices: number[] = []
  let vc = 0

  function strip(
    getA: (iy: number) => [number, number, number],
    getB: (iy: number) => [number, number, number],
    rows: number,
    flip: boolean
  ) {
    const base = vc
    for (let iy = 0; iy <= rows; iy++) {
      const [ax, ay, az] = getA(iy)
      const [bx, by, bz] = getB(iy)
      positions.push(ax, ay, az, bx, by, bz)
      vc += 2
    }
    for (let iy = 0; iy < rows; iy++) {
      const a = base + iy * 2, b = a + 1, c = a + 2, dd = a + 3
      if (!flip) { indices.push(a, b, c, b, dd, c) }
      else       { indices.push(a, c, b, b, c, dd) }
    }
  }

  // Front face (+z): left edge to right edge, depth = hd * sin(π * t)
  strip(
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [-hw, -hh + (iy / segs) * h, dz] },
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [ hw, -hh + (iy / segs) * h, dz] },
    segs, false
  )
  // Back face (-z)
  strip(
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [-hw, -hh + (iy / segs) * h, -dz] },
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [ hw, -hh + (iy / segs) * h, -dz] },
    segs, true
  )
  // Left side (-x): z from +dz to -dz
  strip(
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [-hw, -hh + (iy / segs) * h,  dz] },
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [-hw, -hh + (iy / segs) * h, -dz] },
    segs, true
  )
  // Right side (+x)
  strip(
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [hw, -hh + (iy / segs) * h,  dz] },
    iy => { const dz = hd * Math.sin(Math.PI * iy / segs); return [hw, -hh + (iy / segs) * h, -dz] },
    segs, false
  )

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export function PillowBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
}: PillowBoxProps) {
  const geo = useMemo(() => makePillowGeo(w, h, d), [w, h, d])
  useEffect(() => () => { geo.dispose() }, [geo])

  const holoRef = useRef<THREE.ShaderMaterial | null>(null)
  const extMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const m = buildHolographicMaterial(THREE.DoubleSide); holoRef.current = m; return m
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.DoubleSide)
  }, [extPreset, extColor])
  useFrame(s => { holoRef.current?.uniforms.uCameraPos.value.copy(s.camera.position) })
  useEffect(() => () => { extMat.dispose() }, [extMat])

  return <mesh castShadow receiveShadow geometry={geo} material={extMat} />
}
