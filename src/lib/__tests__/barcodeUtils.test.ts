import { describe, it, expect } from 'vitest'
import { BARCODE_TYPES } from '../barcodeUtils'

describe('BARCODE_TYPES', () => {
  it('has 5 barcode formats', () => {
    expect(BARCODE_TYPES).toHaveLength(5)
  })

  it('each type has id, label, placeholder', () => {
    BARCODE_TYPES.forEach(t => {
      expect(typeof t.id).toBe('string')
      expect(typeof t.label).toBe('string')
      expect(typeof t.placeholder).toBe('string')
      expect(t.id.length).toBeGreaterThan(0)
    })
  })

  it('includes CODE128', () => {
    expect(BARCODE_TYPES.some(t => t.id === 'CODE128')).toBe(true)
  })

  it('includes EAN13', () => {
    expect(BARCODE_TYPES.some(t => t.id === 'EAN13')).toBe(true)
  })

  it('ids are unique', () => {
    const ids = BARCODE_TYPES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
