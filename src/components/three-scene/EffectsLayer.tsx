'use client'

// #143 SSAO (AmbientOcclusion)
// #146 SMAA anti-aliasing
// #147 Bloom / halo lumineux
// #148 Depth of Field
// #149 Color grading (tone mapping)
// #150 Vignette
// #151 Film grain / Noise
// #152 Chromatic Aberration
// #153 Motion Blur
// #154 Outline selection
// #155 ACES tone mapping

import { EffectComposer, Bloom, DepthOfField, Vignette, Noise, ChromaticAberration, SMAA, Outline, ToneMapping, SSAO } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

export interface PostFXConfig {
  bloom: boolean; bloomStrength: number; bloomRadius: number; bloomThreshold: number
  dof: boolean; dofFocus: number; dofAperture: number
  vignette: boolean; vignetteOffset: number; vignetteDarkness: number
  noise: boolean; noiseOpacity: number
  chromaticAberration: boolean; chromaticOffset: number
  smaa: boolean
  toneMapping: boolean; toneMappingMode: 'aces' | 'linear' | 'reinhard'
  ssao: boolean; ssaoIntensity: number; ssaoRadius: number
  outline: boolean; outlineThickness: number; outlineColor: string
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

function getToneMappingMode(mode: PostFXConfig['toneMappingMode']): ToneMappingMode {
  if (mode === 'aces') return ToneMappingMode.ACES_FILMIC
  if (mode === 'reinhard') return ToneMappingMode.REINHARD
  return ToneMappingMode.LINEAR
}

interface EffectsLayerProps {
  config: PostFXConfig
}

export function EffectsLayer({ config }: EffectsLayerProps) {
  const effects: React.ReactElement[] = []

  if (config.smaa) effects.push(<SMAA key="smaa" />)

  if (config.toneMapping) {
    effects.push(
      <ToneMapping key="tone" mode={getToneMappingMode(config.toneMappingMode)} />
    )
  }

  if (config.bloom) {
    effects.push(
      <Bloom key="bloom"
        intensity={config.bloomStrength}
        luminanceThreshold={config.bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    )
  }

  if (config.dof) {
    effects.push(
      <DepthOfField key="dof"
        focusDistance={config.dofFocus / 10}
        focalLength={0.02}
        bokehScale={config.dofAperture * 100}
      />
    )
  }

  if (config.vignette) {
    effects.push(
      <Vignette key="vignette"
        offset={config.vignetteOffset}
        darkness={config.vignetteDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
    )
  }

  if (config.noise) {
    effects.push(
      <Noise key="noise"
        opacity={config.noiseOpacity}
        blendFunction={BlendFunction.ADD}
      />
    )
  }

  if (config.chromaticAberration) {
    effects.push(
      <ChromaticAberration key="chroma"
        offset={new THREE.Vector2(config.chromaticOffset, config.chromaticOffset) as any}
        radialModulation={false}
        modulationOffset={0}
      />
    )
  }

  // #143 SSAO — Ambient Occlusion
  if (config.ssao) {
    effects.push(
      <SSAO key="ssao"
        intensity={config.ssaoIntensity}
        radius={config.ssaoRadius}
        luminanceInfluence={0.6}
        color={new THREE.Color(0, 0, 0) as any}
        worldDistanceThreshold={20}
        worldDistanceFalloff={5}
        worldProximityThreshold={0.4}
        worldProximityFalloff={0.1}
      />
    )
  }

  // #154 Outline selection
  if (config.outline) {
    effects.push(
      <Outline key="outline"
        edgeStrength={config.outlineThickness}
        visibleEdgeColor={new THREE.Color(config.outlineColor) as any}
        hiddenEdgeColor={new THREE.Color(config.outlineColor) as any}
        blendFunction={BlendFunction.ALPHA}
      />
    )
  }

  if (effects.length === 0) return null

  return <EffectComposer multisampling={0}>{effects}</EffectComposer>
}
