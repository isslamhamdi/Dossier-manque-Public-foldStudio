'use client'

import { useState, useEffect } from 'react'
import * as THREE from 'three'
import type { FaceName } from './textureUtils'
import { FACE_LIST } from './textureUtils'
import type { PBRTexSet } from './materials'

export function usePBRTextures() {
  const [pbrTextures, setPbrTextures] = useState<Partial<Record<FaceName, PBRTexSet>>>({})

  useEffect(() => {
    const loader = new THREE.TextureLoader()
    const handler = (e: Event) => {
      const { face, albedo, normal, roughness, metallic } = (e as CustomEvent).detail as {
        face: FaceName | 'all', albedo?: string, normal?: string, roughness?: string, metallic?: string
      }
      const texSet: PBRTexSet = {
        albedo:    albedo    ? loader.load(albedo)    : null,
        normal:    normal    ? loader.load(normal)    : null,
        roughness: roughness ? loader.load(roughness) : null,
        metallic:  metallic  ? loader.load(metallic)  : null,
      }
      const faces: FaceName[] = face === 'all' ? [...FACE_LIST] : [face]
      setPbrTextures(prev => {
        const next = { ...prev }
        faces.forEach(f => { next[f] = texSet })
        return next
      })
    }
    window.addEventListener('fold-studio:apply-pbr', handler)
    return () => window.removeEventListener('fold-studio:apply-pbr', handler)
  }, [])

  return pbrTextures
}
