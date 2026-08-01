// #298 Tests unitaires — threeDefaults SSR-safe values

import { describe, it, expect } from 'vitest'
import {
  LIGHTING_DEFAULTS,
  POST_FX_DEFAULTS,
  TEXT3D_DEFAULTS,
  SCENE_CAMERA_DEFAULTS,
} from '@/lib/threeDefaults'

describe('LIGHTING_DEFAULTS', () => {
  it('has required fields', () => {
    expect(LIGHTING_DEFAULTS.preset).toBe('three-point')
    expect(LIGHTING_DEFAULTS.intensity).toBe(1.0)
    expect(typeof LIGHTING_DEFAULTS.keyColor).toBe('string')
    expect(LIGHTING_DEFAULTS.fogEnabled).toBe(false)
  })
})

describe('POST_FX_DEFAULTS', () => {
  it('bloom is disabled by default', () => {
    expect(POST_FX_DEFAULTS.bloom).toBe(false)
    expect(POST_FX_DEFAULTS.smaa).toBe(true)
    expect(POST_FX_DEFAULTS.toneMapping).toBe(true)
    expect(POST_FX_DEFAULTS.toneMappingMode).toBe('aces')
  })

  it('ssao and outline disabled by default', () => {
    expect(POST_FX_DEFAULTS.ssao).toBe(false)
    expect(POST_FX_DEFAULTS.outline).toBe(false)
    expect(POST_FX_DEFAULTS.outlineColor).toBe('#ffffff')
  })

  it('has valid numeric ranges', () => {
    expect(POST_FX_DEFAULTS.bloomStrength).toBeGreaterThan(0)
    expect(POST_FX_DEFAULTS.ssaoRadius).toBeGreaterThan(0)
    expect(POST_FX_DEFAULTS.ssaoRadius).toBeLessThan(1)
  })
})

describe('TEXT3D_DEFAULTS', () => {
  it('has valid text config', () => {
    expect(TEXT3D_DEFAULTS.text).toBe('Fold Studio')
    expect(TEXT3D_DEFAULTS.face).toBe('front')
    expect(TEXT3D_DEFAULTS.mode).toBe('flat')
    expect(TEXT3D_DEFAULTS.fontSize).toBeGreaterThan(0)
    expect(TEXT3D_DEFAULTS.rtl).toBe(false)
    expect(TEXT3D_DEFAULTS.outlineOnly).toBe(false)
  })
})

describe('SCENE_CAMERA_DEFAULTS', () => {
  it('has valid camera config', () => {
    expect(SCENE_CAMERA_DEFAULTS.cameraView).toBe('perspective')
    expect(SCENE_CAMERA_DEFAULTS.particles).toBe('off')
    expect(SCENE_CAMERA_DEFAULTS.skybox).toBe('none')
    expect(SCENE_CAMERA_DEFAULTS.mirrorFloor).toBe(false)
    expect(SCENE_CAMERA_DEFAULTS.highResMode).toBe('4K')
    expect(SCENE_CAMERA_DEFAULTS.instancedEnabled).toBe(false)
  })

  it('cameraPath is disabled by default', () => {
    expect(SCENE_CAMERA_DEFAULTS.cameraPath.enabled).toBe(false)
    expect(SCENE_CAMERA_DEFAULTS.cameraPath.speed).toBe(1)
    expect(SCENE_CAMERA_DEFAULTS.cameraPath.loop).toBe(true)
  })
})
