import { describe, it, expect } from 'vitest'
import { MATERIAL_PRESETS } from '../types'

describe('MATERIAL_PRESETS', () => {
  it('has at least 10 presets', () => {
    expect(MATERIAL_PRESETS.length).toBeGreaterThanOrEqual(10)
  })

  it('each preset has required fields', () => {
    MATERIAL_PRESETS.forEach(p => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.name).toBe('string')
      expect(typeof p.color).toBe('string')
      expect(typeof p.roughness).toBe('number')
      expect(typeof p.metalness).toBe('number')
    })
  })

  it('roughness is between 0 and 1', () => {
    MATERIAL_PRESETS.forEach(p => {
      expect(p.roughness).toBeGreaterThanOrEqual(0)
      expect(p.roughness).toBeLessThanOrEqual(1)
    })
  })

  it('metalness is between 0 and 1', () => {
    MATERIAL_PRESETS.forEach(p => {
      expect(p.metalness).toBeGreaterThanOrEqual(0)
      expect(p.metalness).toBeLessThanOrEqual(1)
    })
  })

  it('color values are valid hex strings', () => {
    MATERIAL_PRESETS.forEach(p => {
      expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    })
  })

  it('preset ids are unique', () => {
    const ids = MATERIAL_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains carton and kraft presets', () => {
    expect(MATERIAL_PRESETS.some(p => p.id === 'carton')).toBe(true)
    expect(MATERIAL_PRESETS.some(p => p.id === 'kraft')).toBe(true)
  })
})
