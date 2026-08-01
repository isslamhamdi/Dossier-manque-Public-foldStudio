import { describe, it, expect } from 'vitest'
import { GEOMETRY_PRESETS } from '../geometryPresets'

describe('GEOMETRY_PRESETS', () => {
  it('has 11 presets', () => {
    expect(GEOMETRY_PRESETS).toHaveLength(11)
  })

  it('each preset has id, label, obj', () => {
    GEOMETRY_PRESETS.forEach(p => {
      expect(typeof p.id).toBe('string')
      expect(typeof p.label).toBe('string')
      expect(typeof p.obj).toBe('string')
      expect(p.obj.length).toBeGreaterThan(0)
    })
  })

  it('preset ids are unique', () => {
    const ids = GEOMETRY_PRESETS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('each OBJ string has vertex and face definitions', () => {
    GEOMETRY_PRESETS.forEach(p => {
      expect(p.obj).toMatch(/^v /m)
      expect(p.obj).toMatch(/^f /m)
    })
  })

  it('cube preset has 8 vertices', () => {
    const cube = GEOMETRY_PRESETS.find(p => p.id === 'cube')!
    const vertexLines = cube.obj.split('\n').filter(l => l.startsWith('v '))
    expect(vertexLines).toHaveLength(8)
  })

  it('contains the cube preset', () => {
    expect(GEOMETRY_PRESETS.some(p => p.id === 'cube')).toBe(true)
  })
})
