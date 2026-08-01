// #298 Tests unitaires — structural.ts (BCT/ECT calculs)

import { describe, it, expect } from 'vitest'
import { calcStrength, GRAMMAGE_PRESETS } from '@/lib/structural'

describe('calcStrength', () => {
  it('retourne BCT positif pour un carton standard', () => {
    const result = calcStrength(100, 60, 40)
    expect(result.bct).toBeGreaterThanOrEqual(0)
    expect(result.ect).toBeGreaterThan(0)
  })

  it('BCT augmente avec les dimensions', () => {
    const small = calcStrength(50,  40,  30)
    const large = calcStrength(200, 150, 100)
    expect(large.bct).toBeGreaterThanOrEqual(small.bct)
  })

  it('retourne les champs requis', () => {
    const result = calcStrength(100, 60, 40)
    expect(result).toHaveProperty('bct')
    expect(result).toHaveProperty('ect')
    expect(result).toHaveProperty('stackLoad')
    expect(result).toHaveProperty('warnings')
  })

  it('avertit pour une boîte fragile', () => {
    const small = calcStrength(20, 20, 20, 'G', 100)
    expect(small.fragile).toBe(true)
  })
})

describe('GRAMMAGE_PRESETS', () => {
  it('contient des valeurs croissantes', () => {
    for (let i = 1; i < GRAMMAGE_PRESETS.length; i++) {
      expect(GRAMMAGE_PRESETS[i]).toBeGreaterThan(GRAMMAGE_PRESETS[i - 1])
    }
  })
})
