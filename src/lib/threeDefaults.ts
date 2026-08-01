// SSR-safe defaults — no WebGL/Three.js imports.
// Import from here instead of three-scene modules in page.tsx and UI panels.

import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { LightingConfig } from '@/components/three-scene/AdvancedLighting'
import type { PostFXConfig } from '@/components/three-scene/EffectsLayer'
import type { Text3DConfig } from '@/components/three-scene/Text3DLayer'
import type { SceneCameraConfig } from '@/components/left-panel/SceneCameraSection'

export const LIGHTING_DEFAULTS: LightingConfig = {
  preset: 'three-point',
  intensity: 1.0,
  keyColor: '#ffffff',
  fillColor: '#e8f0ff',
  rimColor: '#ffd0a0',
  spotColor: '#ffffff',
  envIntensity: 0.5,
  showLensflare: false,
  fogEnabled: false,
  fogColor: '#c8d8e8',
  fogDensity: 0.08,
}

export const POST_FX_DEFAULTS: PostFXConfig = {
  bloom: false, bloomStrength: 0.4, bloomRadius: 0.3, bloomThreshold: 0.85,
  dof: false, dofFocus: 2.5, dofAperture: 0.025,
  vignette: false, vignetteOffset: 0.5, vignetteDarkness: 0.6,
  noise: false, noiseOpacity: 0.06,
  chromaticAberration: false, chromaticOffset: 0.003,
  smaa: true,
  toneMapping: true, toneMappingMode: 'aces',
  ssao: false, ssaoIntensity: 1.5, ssaoRadius: 0.05,
  outline: false, outlineThickness: 1.5, outlineColor: '#ffffff',
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

export const SCENE_CAMERA_DEFAULTS: SceneCameraConfig = {
  cameraView: 'perspective',
  particles: 'off',
  particleCount: 200,
  cameraPath: { enabled: false, speed: 1, loop: true },
  instancedCount: 12,
  instancedEnabled: false,
  skybox: 'none',
  mirrorFloor: false,
  highResMode: '4K',
}

export function useScrollFold(
  containerRef: RefObject<HTMLElement | null>,
  onDelta: (delta: number) => void,
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      onDelta(e.deltaY / 600)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [containerRef, onDelta])
}
