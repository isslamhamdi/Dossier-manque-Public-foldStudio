import { describe, it, expect } from 'vitest'
import { TEMPLATES } from '../templates'

describe('TEMPLATES', () => {
  it('has at least 9 templates', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(9)
  })

  it('each template has id, name, description', () => {
    TEMPLATES.forEach(t => {
      expect(t).toHaveProperty('id')
      expect(t).toHaveProperty('name')
      expect(t).toHaveProperty('description')
      expect(typeof t.id).toBe('string')
      expect(typeof t.name).toBe('string')
      expect(typeof t.description).toBe('string')
    })
  })

  it('template ids are unique', () => {
    const ids = TEMPLATES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('contains the box template', () => {
    expect(TEMPLATES.some(t => t.id === 'box')).toBe(true)
  })

  it('contains the mailer template', () => {
    expect(TEMPLATES.some(t => t.id === 'mailer')).toBe(true)
  })
})
