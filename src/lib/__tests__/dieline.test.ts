import { describe, it, expect } from 'vitest'
import { mmToPx, computeDieline } from '../dieline'
import type { BoxParams } from '../types'

const BASE: BoxParams = { width: 100, height: 150, depth: 50, glueTab: 20, thickness: 0, bleed: 3 }

describe('mmToPx', () => {
  it('converts 0 to 0', () => {
    expect(mmToPx(0)).toBe(0)
  })

  it('converts 100mm to ~378px', () => {
    expect(mmToPx(100)).toBeCloseTo(377.95, 0)
  })

  it('is linear — doubling input doubles output', () => {
    expect(mmToPx(200)).toBeCloseTo(mmToPx(100) * 2, 10)
  })
})

describe('computeDieline', () => {
  it('returns required fields', () => {
    const d = computeDieline(BASE)
    expect(d).toHaveProperty('svgWidth')
    expect(d).toHaveProperty('svgHeight')
    expect(d).toHaveProperty('cutPath')
    expect(d).toHaveProperty('foldLines')
    expect(d).toHaveProperty('gluePaths')
    expect(d).toHaveProperty('bleedPath')
    expect(d).toHaveProperty('panels')
  })

  it('cutPath is a closed SVG path', () => {
    const { cutPath } = computeDieline(BASE)
    expect(cutPath).toMatch(/^M /)
    expect(cutPath).toContain('Z')
  })

  it('bleedPath is a closed SVG path', () => {
    const { bleedPath } = computeDieline(BASE)
    expect(bleedPath).toMatch(/^M /)
    expect(bleedPath).toContain('Z')
  })

  it('svgWidth grows when width increases', () => {
    const small = computeDieline({ ...BASE, width: 50 })
    const large = computeDieline({ ...BASE, width: 200 })
    expect(large.svgWidth).toBeGreaterThan(small.svgWidth)
  })

  it('svgHeight grows when height increases', () => {
    const small = computeDieline({ ...BASE, height: 50 })
    const large = computeDieline({ ...BASE, height: 300 })
    expect(large.svgHeight).toBeGreaterThan(small.svgHeight)
  })

  it('bleed enlarges svgWidth and svgHeight', () => {
    const noBleed = computeDieline({ ...BASE, bleed: 0 })
    const withBleed = computeDieline({ ...BASE, bleed: 15 })
    expect(withBleed.svgWidth).toBeGreaterThan(noBleed.svgWidth)
    expect(withBleed.svgHeight).toBeGreaterThan(noBleed.svgHeight)
  })

  it('foldLines is a non-empty array', () => {
    const { foldLines } = computeDieline(BASE)
    expect(Array.isArray(foldLines)).toBe(true)
    expect(foldLines.length).toBeGreaterThan(0)
    foldLines.forEach(line => expect(line).toMatch(/^M /))
  })

  it('box template returns 5 panels', () => {
    const { panels } = computeDieline(BASE, 'box')
    expect(panels).toHaveLength(5)
  })

  it('each panel has required fields', () => {
    computeDieline(BASE, 'box').panels.forEach(p => {
      expect(p).toHaveProperty('x')
      expect(p).toHaveProperty('y')
      expect(p).toHaveProperty('w')
      expect(p).toHaveProperty('h')
      expect(p).toHaveProperty('label')
    })
  })

  it('tuck-end returns valid dieline', () => {
    const d = computeDieline(BASE, 'tuck-end')
    expect(d.foldLines.length).toBeGreaterThan(0)
    expect(d.cutPath).toMatch(/^M /)
  })

  it('display template returns valid dieline', () => {
    const d = computeDieline(BASE, 'display')
    expect(d.svgWidth).toBeGreaterThan(0)
    expect(d.svgHeight).toBeGreaterThan(0)
  })

  it('seal-end template returns valid dieline', () => {
    const d = computeDieline(BASE, 'seal-end')
    expect(d.panels.length).toBeGreaterThan(0)
  })

  it('snap-lock template returns valid dieline', () => {
    const d = computeDieline(BASE, 'snap-lock')
    expect(d.foldLines.length).toBeGreaterThan(0)
  })

  it('falls back to box for unrecognised template', () => {
    const box = computeDieline(BASE, 'box')
    // eslint-disable-next-line
    const fallback = computeDieline(BASE, 'unknown' as never)
    expect(fallback.panels).toHaveLength(box.panels.length)
  })
})
