'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoxParams } from '../../lib/types'
import { buildMaterial, buildHolographicMaterial, getDef } from './materials'
import { BOX_MODELS, buildBoxGLTF } from '../../lib/knife2gltf'

interface PacdoraBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  params?: BoxParams
  template?: string
}

// Cache GLTFs by model+dimension key
const gltfCache = new Map<string, THREE.Group>()
const pendingCache = new Map<string, Promise<THREE.Group>>()

function parseGLTF(gltfJson: string): THREE.Group {
  const data = JSON.parse(gltfJson)
  const group = new THREE.Group()

  // Decode base64 buffer
  const bufferData = data.buffers?.[0]?.uri ?? ''
  let binData: ArrayBuffer | null = null
  if (bufferData.startsWith('data:application/octet-stream;base64,')) {
    const b64 = bufferData.slice('data:application/octet-stream;base64,'.length)
    const bin = atob(b64)
    binData = new ArrayBuffer(bin.length)
    const view = new Uint8Array(binData)
    for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i)
  }

  if (!binData) return group

  const getAccessor = (idx: number) => {
    const acc  = data.accessors[idx]
    const bv   = data.bufferViews[acc.bufferView]
    const byteOffset = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
    const count = acc.count
    const type  = acc.type // SCALAR | VEC2 | VEC3 | VEC4
    const comps = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[type] ?? 1
    const ctype = acc.componentType  // 5120=int8 5121=uint8 5122=int16 5123=uint16 5125=uint32 5126=float32
    let TypedArray: any
    if      (ctype === 5126) TypedArray = Float32Array
    else if (ctype === 5123) TypedArray = Uint16Array
    else if (ctype === 5125) TypedArray = Uint32Array
    else if (ctype === 5121) TypedArray = Uint8Array
    else TypedArray = Float32Array
    return new TypedArray(binData!, byteOffset, count * comps)
  }

  for (const mesh of (data.meshes ?? [])) {
    const name = mesh.name ?? ''
    // Skip inner/collapse meshes for the static display
    if (name.includes('collapse')) continue

    for (const prim of (mesh.primitives ?? [])) {
      const geo = new THREE.BufferGeometry()
      const attrs = prim.attributes ?? {}

      if (attrs.POSITION !== undefined) {
        const pos = getAccessor(attrs.POSITION) as Float32Array
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      }
      if (attrs.NORMAL !== undefined) {
        const norm = getAccessor(attrs.NORMAL) as Float32Array
        geo.setAttribute('normal', new THREE.BufferAttribute(norm, 3))
      }
      if (attrs.TEXCOORD_0 !== undefined) {
        const uv = getAccessor(attrs.TEXCOORD_0) as Float32Array
        geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
      }
      if (prim.indices !== undefined) {
        const idx = getAccessor(prim.indices)
        geo.setIndex(new THREE.BufferAttribute(idx as Uint16Array | Uint32Array, 1))
      }
      geo.computeVertexNormals()

      const meshObj = new THREE.Mesh(geo)
      meshObj.name = name
      meshObj.castShadow = true
      meshObj.receiveShadow = true
      group.add(meshObj)
    }
  }

  return group
}

export function PacdoraBox({
  w, h, d,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton',   intColor = '#e8e4dc',
  params, template = 'box',
}: PacdoraBoxProps) {
  const t = (params?.thickness ?? 0.5) * 2 / 100
  const groupRef = useRef<THREE.Group>(null)
  const [loadedGroup, setLoadedGroup] = useState<THREE.Group | null>(null)
  const [error, setError] = useState(false)

  // Dimensions in mm
  const wMM = Math.round(w * 100)
  const hMM = Math.round(h * 100)
  const dMM = Math.round(d * 100)
  const modelId = BOX_MODELS[template] ?? BOX_MODELS['box']
  const cacheKey = `${modelId}_${wMM}x${hMM}x${dMM}`

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (gltfCache.has(cacheKey)) {
        if (!cancelled) setLoadedGroup(gltfCache.get(cacheKey)!.clone())
        return
      }
      if (pendingCache.has(cacheKey)) {
        const g = await pendingCache.get(cacheKey)!
        if (!cancelled) setLoadedGroup(g.clone())
        return
      }

      const promise = buildBoxGLTF({ width: wMM, height: hMM, depth: dMM, modelId })
        .then(gltfJson => {
          const g = parseGLTF(gltfJson)
          gltfCache.set(cacheKey, g)
          return g
        })
      pendingCache.set(cacheKey, promise)

      try {
        const g = await promise
        if (!cancelled) setLoadedGroup(g.clone())
      } catch (e) {
        console.warn('[PacdoraBox] GLTF generation failed:', e)
        if (!cancelled) setError(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [cacheKey, modelId, wMM, hMM, dMM])

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

  // Apply materials to loaded GLTF meshes
  useEffect(() => {
    if (!loadedGroup) return
    loadedGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const name = mesh.name
      if (name.includes('inner')) {
        mesh.material = intMat
      } else {
        mesh.material = extMat
        mesh.castShadow = true
      }
    })
  }, [loadedGroup, extMat, intMat])

  // Scale the GLTF (Pacdora units are mm) to our scene units (cm → divide by 100 already in parent)
  // The GLTF is in mm: 305mm = 3.05 in our scale
  const scale = 1 / 100

  if (error) return null

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {loadedGroup && <primitive object={loadedGroup} />}
    </group>
  )
}
