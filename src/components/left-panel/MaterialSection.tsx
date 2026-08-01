'use client'

import { useState } from 'react'
import type { MaterialColors } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { ColorSwatch } from './ColorSwatch'
import { PantoneSection } from './PantoneSection'
import { Select } from '@/components/ui/select'

const PRESETS = [
  { label: 'Carton blanc', ext: '#ffffff', int: '#f0ede8' },
  { label: 'Kraft',        ext: '#c4984e', int: '#b8855a' },
  { label: 'Carton gris',  ext: '#8a8a8a', int: '#767676' },
  { label: 'Noir',         ext: '#1a1a1a', int: '#2a2a2a' },
  { label: 'Couché 350g',  ext: '#e8e4dc', int: '#d8d0c4' },
  { label: 'Microflute',   ext: '#f5f2ec', int: '#ebe7df' },
]

export function MaterialSection({ materialColors, onMaterialColorsChange }: {
  materialColors: MaterialColors
  onMaterialColorsChange: (c: MaterialColors) => void
}) {
  const [pantoneTarget, setPantoneTarget] = useState<'exterior' | 'interior'>('exterior')
  const ext = materialColors.exterior.toLowerCase()
  const int = materialColors.interior.toLowerCase()
  const current = PRESETS.find(p => p.ext === ext && p.int === int)

  const setColor = (key: keyof MaterialColors) => (v: string) =>
    onMaterialColorsChange({ ...materialColors, [key]: v })

  return (
    <CollapsibleSection label="Matière">

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Type de matière</div>
        <Select
          value={current?.label ?? '__custom__'}
          options={[
            ...(!current ? [{ value: '__custom__', label: 'Custom' }] : []),
            ...PRESETS.map(p => ({ value: p.label, label: p.label })),
          ]}
          onChange={v => {
            const p = PRESETS.find(x => x.label === v)
            if (p) onMaterialColorsChange({ exterior: p.ext, interior: p.int })
          }}
        />
      </div>

      <ColorSwatch label="Couleur extérieure" value={materialColors.exterior} onChange={setColor('exterior')} />
      <ColorSwatch label="Couleur intérieure" value={materialColors.interior} onChange={setColor('interior')} />

      {/* Pantone target selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {(['exterior', 'interior'] as const).map(k => (
          <button key={k} onClick={() => setPantoneTarget(k)}
            style={{ flex: 1, fontSize: 9, padding: '3px 0', border: `1px solid ${pantoneTarget === k ? '#888' : '#e0e0e0'}`, borderRadius: 3, background: pantoneTarget === k ? '#f0f0f0' : '#fff', cursor: 'pointer', color: '#555' }}>
            {k === 'exterior' ? 'Ext.' : 'Int.'}
          </button>
        ))}
      </div>
      <PantoneSection onSelectColor={(hex) => setColor(pantoneTarget)(hex)} />
    </CollapsibleSection>
  )
}
