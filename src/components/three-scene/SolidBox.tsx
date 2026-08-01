'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ImageLayer, BoxParams, TemplateType } from '../../lib/types'
import { getDef, buildMaterial, buildHolographicMaterial, buildCorrugatedRimMaterial } from './materials'
import type { PBRTexSet } from './materials'
import { useFaceTextures, FACE_LIST } from './textureUtils'
import type { FaceName } from './textureUtils'

interface SolidBoxProps {
  w: number; h: number; d: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  imageLayers?: ImageLayer[]
  hoveredFace?: string | null
  onHoverFace?: (face: string | null) => void
  params?: BoxParams
  activeTemplate?: TemplateType
  pbrTextures?: Partial<Record<FaceName, PBRTexSet>>
  fluteType?: string
}

export function SolidBox({ w, h, d, extPreset = 'brillant', extColor = '#ffffff', intPreset = 'carton', intColor = '#e8e4dc', imageLayers, hoveredFace, onHoverFace, params, activeTemplate, pbrTextures, fluteType }: SolidBoxProps) {
  // BoxGeometry material index order: right, left, top, bottom, front, back
  const SOLID_ORDER: FaceName[] = ['right', 'left', 'top', 'bottom', 'front', 'back']
  const faceTextures = useFaceTextures(imageLayers, params, activeTemplate, extColor)
  const texByFace: Record<string, THREE.Texture | null> = {}
  FACE_LIST.forEach((f, i) => { texByFace[f] = faceTextures[i] })

  const intDef = getDef(intPreset)
  const solidHoloRef = useRef<THREE.ShaderMaterial[]>([])

  const materials = useMemo(() => {
    solidHoloRef.current = []
    return SOLID_ORDER.map(face => {
      const tex = texByFace[face]
      if (extPreset === 'holographique') {
        const mat = buildHolographicMaterial(THREE.FrontSide)
        solidHoloRef.current.push(mat)
        return mat
      }
      return buildMaterial(extPreset, extColor, THREE.FrontSide, tex ?? undefined, fluteType)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceTextures, extPreset, extColor])

  // Stable translucent overlay material — only color/opacity change, no rebuild
  const hoverOverlayMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#a8c8ff',
    transparent: true,
    opacity: 0.35,
    depthTest: true,
    side: THREE.FrontSide,
  }), [])
  useEffect(() => () => { hoverOverlayMat.dispose() }, [hoverOverlayMat])

  // Six face-sized plane positions for the overlay
  const hoverFaceIdx = hoveredFace ? SOLID_ORDER.indexOf(hoveredFace as FaceName) : -1

  useFrame((state) => {
    solidHoloRef.current.forEach(mat => {
      mat.uniforms.uCameraPos.value.copy(state.camera.position)
    })
  })

  useEffect(() => () => { materials.forEach(m => m.dispose()) }, [materials])

  useEffect(() => {
    if (!pbrTextures) return
    SOLID_ORDER.forEach((face, i) => {
      const pbr = pbrTextures[face]
      if (!pbr) return
      const mat = materials[i]
      if (!(mat instanceof THREE.MeshPhysicalMaterial)) return
      if (pbr.albedo)    { mat.map = pbr.albedo }
      if (pbr.normal)    { mat.normalMap = pbr.normal; mat.normalScale.set(1.5, 1.5) }
      if (pbr.roughness) { mat.roughnessMap = pbr.roughness }
      if (pbr.metallic)  { mat.metalnessMap = pbr.metallic; mat.metalness = 1.0 }
      mat.needsUpdate = true
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pbrTextures, materials])

  const intColor3 = intPreset === 'personnalise' ? intColor : intDef.color
  const innerMat = useMemo(() => {
    const m = buildMaterial(intPreset, intColor3, THREE.BackSide, undefined, fluteType)
    // Slightly softer normal on interior to avoid artifacts on BackSide
    if (m.normalMap) m.normalScale.set(1.2, 1.2)
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intColor3, fluteType])
  useEffect(() => () => { innerMat.dispose() }, [innerMat])

  const t = (params?.thickness ?? 1.6) / 100  // Three.js units


  return (
    <group>
      <mesh castShadow receiveShadow
        onPointerMove={e => {
          e.stopPropagation()
          if (e.face != null && onHoverFace) onHoverFace(SOLID_ORDER[e.face.materialIndex])
        }}
        onPointerLeave={() => onHoverFace?.(null)}
      >
        <boxGeometry args={[w, h, d]} />
        {materials.map((mat, i) => (
          <primitive key={i} object={mat} attach={`material-${i}`} />
        ))}
      </mesh>
      <mesh>
        <boxGeometry args={[
          w - t * 2,
          h - t * 2,
          d - t * 2,
        ]} />
        <primitive object={innerMat} attach="material" />
      </mesh>


      {/* Hover highlight — 6 stable plane meshes, only hovered face visible */}
      {([
        { pos: [w / 2 + 0.001, 0, 0] as [number,number,number], rot: [0, Math.PI / 2, 0] as [number,number,number], args: [d, h] as [number,number] },
        { pos: [-w / 2 - 0.001, 0, 0] as [number,number,number], rot: [0, -Math.PI / 2, 0] as [number,number,number], args: [d, h] as [number,number] },
        { pos: [0, h / 2 + 0.001, 0] as [number,number,number], rot: [-Math.PI / 2, 0, 0] as [number,number,number], args: [w, d] as [number,number] },
        { pos: [0, -h / 2 - 0.001, 0] as [number,number,number], rot: [Math.PI / 2, 0, 0] as [number,number,number], args: [w, d] as [number,number] },
        { pos: [0, 0, d / 2 + 0.001] as [number,number,number], rot: [0, 0, 0] as [number,number,number], args: [w, h] as [number,number] },
        { pos: [0, 0, -d / 2 - 0.001] as [number,number,number], rot: [0, Math.PI, 0] as [number,number,number], args: [w, h] as [number,number] },
      ] as const).map((cfg, i) => (
        <mesh key={`hover-${i}`} position={cfg.pos} rotation={cfg.rot} visible={hoverFaceIdx === i} renderOrder={2}>
          <planeGeometry args={cfg.args} />
          <primitive object={hoverOverlayMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}
