'use client'

import { useRef, useMemo, useEffect } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SEGS   = 10
const VCOUNT = 2 * (SEGS + 1)  // 22 vertices: 2 rows × 11 columns

// Parent face always lies in XY plane — constant, never mutated
const ARC_PARENT_NORMAL = new THREE.Vector3(0, 0, 1)

interface HingeArcProps {
  foldLineLen: number                     // crease length in scene units
  radius: number                          // T/2 in scene units
  panelDir: THREE.Vector3                 // pre-allocated, read-only sweep direction
  foldAxis: THREE.Vector3                 // pre-allocated, read-only crease direction
  angleRef: MutableRefObject<number>      // current fold angle (signed radians) from parent
  color: string
}

export function HingeArc({ foldLineLen, radius, panelDir, foldAxis, angleRef, color }: HingeArcProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  const geo = useMemo(() => {
    const g       = new THREE.BufferGeometry()
    const posArr  = new Float32Array(VCOUNT * 3)
    const nrmArr  = new Float32Array(VCOUNT * 3)

    // Indexed strip: 2 triangles per segment, SEGS segments
    const idx = new Uint16Array(SEGS * 6)
    for (let i = 0; i < SEGS; i++) {
      const v = i * 2
      idx[i * 6 + 0] = v;     idx[i * 6 + 1] = v + 1; idx[i * 6 + 2] = v + 2
      idx[i * 6 + 3] = v + 1; idx[i * 6 + 4] = v + 3; idx[i * 6 + 5] = v + 2
    }

    const posAttr = new THREE.BufferAttribute(posArr, 3)
    const nrmAttr = new THREE.BufferAttribute(nrmArr, 3)
    posAttr.usage = THREE.DynamicDrawUsage
    nrmAttr.usage = THREE.DynamicDrawUsage

    g.setAttribute('position', posAttr)
    g.setAttribute('normal', nrmAttr)
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    g.setDrawRange(0, 0)
    return g
  }, [])

  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color).multiplyScalar(0.82),
    roughness: 0.68,
    metalness: 0,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  }), [color])

  useEffect(() => () => { geo.dispose(); mat.dispose() }, [geo, mat])

  // Pre-allocated scratch vectors — zero heap allocation in useFrame hot path
  const _ptBase   = useMemo(() => new THREE.Vector3(), [])
  const _nrm      = useMemo(() => new THREE.Vector3(), [])
  const _halfAxis = useMemo(() => new THREE.Vector3(), [])

  const prevAngle = useRef(Infinity)

  useFrame(() => {
    const thetaRad = angleRef.current
    const absTheta = Math.abs(thetaRad)

    // Skip GPU upload when angle hasn't moved perceptibly
    if (Math.abs(absTheta - Math.abs(prevAngle.current)) < 0.006) return
    prevAngle.current = thetaRad

    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const nrmAttr = geo.attributes.normal   as THREE.BufferAttribute
    const posArr  = posAttr.array as Float32Array
    const nrmArr  = nrmAttr.array as Float32Array

    if (absTheta < 0.01) {
      geo.setDrawRange(0, 0)
      return
    }

    // Half-extent of strip along the fold crease
    _halfAxis.copy(foldAxis).multiplyScalar(foldLineLen / 2)

    for (let i = 0; i <= SEGS; i++) {
      const a  = (i / SEGS) * absTheta
      const sa = Math.sin(a)
      const ca = Math.cos(a)

      // Arc point: panelDir·r·sin(a) + parentNormal·r·(1−cos(a))
      // This traces a circular arc of radius r centred at r·parentNormal
      _ptBase
        .copy(panelDir).multiplyScalar(radius * sa)
        .addScaledVector(ARC_PARENT_NORMAL, radius * (1 - ca))

      // Outward surface normal: sin(a)·panelDir − cos(a)·parentNormal
      _nrm
        .copy(panelDir).multiplyScalar(sa)
        .addScaledVector(ARC_PARENT_NORMAL, -ca)

      const v0 = i * 2      // row 0: −halfAxis side
      const v1 = v0 + 1     // row 1: +halfAxis side

      posArr[v0 * 3]     = _ptBase.x - _halfAxis.x
      posArr[v0 * 3 + 1] = _ptBase.y - _halfAxis.y
      posArr[v0 * 3 + 2] = _ptBase.z - _halfAxis.z
      nrmArr[v0 * 3]     = _nrm.x
      nrmArr[v0 * 3 + 1] = _nrm.y
      nrmArr[v0 * 3 + 2] = _nrm.z

      posArr[v1 * 3]     = _ptBase.x + _halfAxis.x
      posArr[v1 * 3 + 1] = _ptBase.y + _halfAxis.y
      posArr[v1 * 3 + 2] = _ptBase.z + _halfAxis.z
      nrmArr[v1 * 3]     = _nrm.x
      nrmArr[v1 * 3 + 1] = _nrm.y
      nrmArr[v1 * 3 + 2] = _nrm.z
    }

    posAttr.needsUpdate = true
    nrmAttr.needsUpdate = true
    geo.setDrawRange(0, SEGS * 6)
    geo.computeBoundingSphere()
  })

  return <mesh ref={meshRef} geometry={geo} material={mat} />
}
