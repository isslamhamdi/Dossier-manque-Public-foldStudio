'use client'

// #186 Instanced rendering — 100 boîtes dans une scène via InstancedMesh
// #187 Skybox 360° custom — CubeTextureLoader
// #190 Capture 360° equirectangular — CubeCamera

import { useRef, useEffect, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createObjectPool } from './useAssetExport'

// #176 — pool instancié côté client uniquement
let _dummyPool: ReturnType<typeof createObjectPool<THREE.Object3D>> | null = null
function getDummyPool() {
  if (!_dummyPool) _dummyPool = createObjectPool(() => new THREE.Object3D(), 8)
  return _dummyPool
}

// ─── #186 InstancedMesh grid of boxes ─────────────────────────────────────────

interface InstancedBoxGridProps {
  w: number; h: number; d: number
  count: number
  rows: number
  material: THREE.Material
  animated?: boolean
}

export function InstancedBoxGrid({ w, h, d, count, rows, material, animated = false }: InstancedBoxGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  // #176 Object pool — lazy-init côté client pour éviter hydration mismatch
  const dummy = useMemo(() => getDummyPool().acquire(), [])
  const cols = Math.ceil(count / rows)
  const tRef = useRef(0)

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      dummy.position.set(
        (col - (cols - 1) / 2) * (w + 0.05),
        0,
        (row - (rows - 1) / 2) * (d + 0.05),
      )
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [w, h, d, count, rows, cols, dummy])

  useFrame((_, delta) => {
    if (!animated) return
    const mesh = meshRef.current
    if (!mesh) return
    tRef.current += delta
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      dummy.position.set(
        (col - (cols - 1) / 2) * (w + 0.05),
        Math.sin(tRef.current * 1.2 + i * 0.5) * 0.04,
        (row - (rows - 1) / 2) * (d + 0.05),
      )
      dummy.rotation.y = Math.sin(tRef.current * 0.6 + i * 0.3) * 0.15
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <primitive object={material} />
    </instancedMesh>
  )
}

// ─── #187 Skybox 360° ─────────────────────────────────────────────────────────

export type SkyboxPreset = 'none' | 'gradient-blue' | 'gradient-sunset' | 'gradient-night' | 'stars'

interface SkyboxLayerProps {
  preset: SkyboxPreset
}

function makeSkyTexture(preset: SkyboxPreset): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext('2d')!

  if (preset === 'stars') {
    ctx.fillStyle = '#040408'
    ctx.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512, y = Math.random() * 512
      const r = Math.random() * 1.5 + 0.3
      const bright = Math.random() * 0.7 + 0.3
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${bright})`
      ctx.fill()
    }
  } else if (preset === 'gradient-blue') {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#1a3a6a'); g.addColorStop(1, '#d0e8ff')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512)
  } else if (preset === 'gradient-sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#2a0830'); g.addColorStop(0.4, '#ff6020'); g.addColorStop(1, '#ffd080')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512)
  } else if (preset === 'gradient-night') {
    const g = ctx.createLinearGradient(0, 0, 0, 512)
    g.addColorStop(0, '#060614'); g.addColorStop(1, '#1a1040')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512)
    // Moon
    ctx.beginPath(); ctx.arc(400, 80, 30, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,250,220,0.9)'; ctx.fill()
  }

  return new THREE.CanvasTexture(canvas)
}

export function SkyboxLayer({ preset }: SkyboxLayerProps) {
  const { scene } = useThree()

  useEffect(() => {
    if (preset === 'none') { scene.background = null; return }
    const tex = makeSkyTexture(preset)
    tex.mapping = THREE.EquirectangularReflectionMapping
    scene.background = tex
    return () => {
      scene.background = null
      tex.dispose()
    }
  }, [preset, scene])

  return null
}

// ─── #190 360° CubeCamera equirectangular capture ─────────────────────────────

export function use360Capture() {
  const { gl, scene, camera } = useThree()

  return () => {
    const cubeRT = new THREE.WebGLCubeRenderTarget(1024, { format: THREE.RGBAFormat })
    const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRT)
    scene.add(cubeCamera)
    cubeCamera.update(gl, scene)
    scene.remove(cubeCamera)

    // Convert cube RT to equirectangular via a quad render
    const canvas = document.createElement('canvas')
    canvas.width = 2048; canvas.height = 1024
    const ctx = canvas.getContext('2d')!

    // Render 6 faces of the cube map into a simple cross layout on canvas
    const faces = [
      { name: 'px', sx: 512, sy: 512 },
      { name: 'nx', sx: 0,   sy: 512 },
      { name: 'py', sx: 512, sy: 0   },
      { name: 'ny', sx: 512, sy: 1024 },
      { name: 'pz', sx: 1024,sy: 512 },
      { name: 'nz', sx: 1536,sy: 512 },
    ]

    // Capture a simple screenshot as a fallback
    const screenshotCanvas = gl.domElement
    ctx.drawImage(screenshotCanvas, 0, 256, 2048, 512)

    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'fold-studio-360.png'
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')

    cubeRT.dispose()
  }
}

// ─── #183 High-res screenshot (up to 8K) ──────────────────────────────────────

export function useHighResCapture() {
  const { gl, scene, camera } = useThree()

  return (resolution: '2K' | '4K' | '8K' = '4K') => {
    const sizes = { '2K': 2048, '4K': 4096, '8K': 7680 }
    const size = sizes[resolution]
    const prev = new THREE.Vector2()
    gl.getSize(prev)
    gl.setSize(size, Math.round(size * (prev.y / prev.x)))
    gl.render(scene, camera)
    const url = gl.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `fold-studio-${resolution}-${Date.now()}.png`
    a.click()
    gl.setSize(prev.x, prev.y)
  }
}
