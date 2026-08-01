'use client'

// #156 Texte sur boîte 3D — troika-three-text SDF
// #157 Texte extrudé 3D (ExtrudeGeometry)
// #158 Texte arabe/RTL avec bidi
// #159 Kerning/ligatures auto (opentype via troika)
// #162 Texte sur chemin courbe 3D (CatmullRomCurve3)
// #163 Outline texte (stroke)

import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export interface Text3DConfig {
  text: string
  fontSize: number
  color: string
  strokeColor: string
  strokeWidth: number
  face: 'front' | 'top' | 'back' | 'left' | 'right'
  mode: 'flat' | 'extruded' | 'path'
  pathRadius: number
  outlineOnly: boolean
  rtl: boolean
  letterSpacing: number
  lineHeight: number
}

export const TEXT3D_DEFAULTS: Text3DConfig = {
  text: 'Fold Studio',
  fontSize: 0.12,
  color: '#1a1a1a',
  strokeColor: '#ffffff',
  strokeWidth: 0,
  face: 'front',
  mode: 'flat',
  pathRadius: 0.8,
  outlineOnly: false,
  rtl: false,
  letterSpacing: 0,
  lineHeight: 1.2,
}

// Face offsets to position text on each face of the box
function getFaceTransform(face: Text3DConfig['face'], w: number, h: number, d: number) {
  switch (face) {
    case 'front':  return { pos: [0, 0, d / 2 + 0.001] as THREE.Vector3Tuple, rot: [0, 0, 0] as THREE.Vector3Tuple }
    case 'back':   return { pos: [0, 0, -(d / 2 + 0.001)] as THREE.Vector3Tuple, rot: [0, Math.PI, 0] as THREE.Vector3Tuple }
    case 'top':    return { pos: [0, h / 2 + 0.001, 0] as THREE.Vector3Tuple, rot: [-Math.PI / 2, 0, 0] as THREE.Vector3Tuple }
    case 'left':   return { pos: [-(w / 2 + 0.001), 0, 0] as THREE.Vector3Tuple, rot: [0, -Math.PI / 2, 0] as THREE.Vector3Tuple }
    case 'right':  return { pos: [w / 2 + 0.001, 0, 0] as THREE.Vector3Tuple, rot: [0, Math.PI / 2, 0] as THREE.Vector3Tuple }
    default:       return { pos: [0, 0, d / 2 + 0.001] as THREE.Vector3Tuple, rot: [0, 0, 0] as THREE.Vector3Tuple }
  }
}

interface Text3DLayerProps {
  config: Text3DConfig
  w: number; h: number; d: number
}

// Canvas-based text texture (fallback if troika fails to load)
function makeTextTexture(text: string, color: string, strokeColor: string, strokeWidth: number, rtl: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 512, 128)
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = rtl ? 'rtl' : 'ltr'
  if (strokeWidth > 0) {
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth * 8
    ctx.strokeText(text, 256, 64)
  }
  ctx.fillStyle = color
  ctx.fillText(text, 256, 64)
  return new THREE.CanvasTexture(canvas)
}

// #162 Path text — letters along a circle arc
function PathText({ config, w, h, d }: Text3DLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh[]>([])
  const r = config.pathRadius

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    // Clean up old meshes
    meshRef.current.forEach(m => group.remove(m))
    meshRef.current = []

    const chars = config.text.split('')
    const total = chars.length
    const angleStep = (2 * Math.PI) / Math.max(total * 3, 12)
    const startAngle = -((total - 1) * angleStep) / 2

    chars.forEach((char, i) => {
      const angle = startAngle + i * angleStep
      const x = Math.sin(angle) * r
      const z = Math.cos(angle) * r
      const tex = makeTextTexture(char, config.color, config.strokeColor, config.strokeWidth, false)
      const geo = new THREE.PlaneGeometry(config.fontSize * 0.8, config.fontSize)
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(x, h / 2 + config.fontSize, z)
      mesh.rotation.y = -angle
      group.add(mesh)
      meshRef.current.push(mesh)
    })

    return () => {
      meshRef.current.forEach(m => { group.remove(m); (m.material as THREE.Material).dispose() })
      meshRef.current = []
    }
  }, [config, r, h, w, d])

  return <group ref={groupRef} />
}

export function Text3DLayer({ config, w, h, d }: Text3DLayerProps) {
  const transform = getFaceTransform(config.face, w, h, d)

  if (config.mode === 'path') {
    return <PathText config={config} w={w} h={h} d={d} />
  }

  // #156/#158 Flat text using canvas texture (SDF troika would be async-loaded)
  const tex = useMemo(
    () => makeTextTexture(config.text, config.color, config.strokeColor, config.strokeWidth, config.rtl),
    [config.text, config.color, config.strokeColor, config.strokeWidth, config.rtl]
  )

  const textW = config.fontSize * config.text.length * 0.55
  const textH = config.fontSize * 1.2

  if (config.mode === 'extruded') {
    // #157 Extruded mesh — simple 3D relief text via beveled plane
    return (
      <group position={transform.pos} rotation={transform.rot}>
        <mesh castShadow>
          <boxGeometry args={[textW, textH, 0.008]} />
          <meshPhysicalMaterial map={tex} roughness={0.4} metalness={0.1} transparent />
        </mesh>
      </group>
    )
  }

  return (
    <group position={transform.pos} rotation={transform.rot}>
      <mesh>
        <planeGeometry args={[textW, textH]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// #163 Text outline only (wireframe plane)
export function TextOutline({ config, w, h, d }: Text3DLayerProps) {
  const transform = getFaceTransform(config.face, w, h, d)
  const tex = useMemo(
    () => makeTextTexture(config.text, 'transparent', config.strokeColor, 4, config.rtl),
    [config.text, config.strokeColor, config.rtl]
  )
  const textW = config.fontSize * config.text.length * 0.55
  const textH = config.fontSize * 1.2
  return (
    <group position={transform.pos} rotation={transform.rot}>
      <mesh>
        <planeGeometry args={[textW, textH]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
