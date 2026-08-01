'use client'

import { useState } from 'react'
import { SectionLabel } from './ui'

// Official Pantone Color Bridge (coated) hex values — source: Pantone Color Bridge Guide
const PANTONE_SWATCHES = [
  // Rouges
  { name: 'PMS 485 C',  hex: '#DA291C', group: 'Rouges' },
  { name: 'PMS 186 C',  hex: '#C8102E', group: 'Rouges' },
  { name: 'PMS 199 C',  hex: '#CF0A2C', group: 'Rouges' },
  { name: 'PMS 032 C',  hex: '#EF3340', group: 'Rouges' },
  { name: 'PMS 1788 C', hex: '#FF3A21', group: 'Rouges' },
  { name: 'PMS 179 C',  hex: '#FF3B2F', group: 'Rouges' },
  // Oranges
  { name: 'PMS 021 C',  hex: '#FE5000', group: 'Oranges' },
  { name: 'PMS 151 C',  hex: '#FF8200', group: 'Oranges' },
  { name: 'PMS 1375 C', hex: '#FF8C00', group: 'Oranges' },
  { name: 'PMS 137 C',  hex: '#F2A900', group: 'Oranges' },
  { name: 'PMS 1505 C', hex: '#FF6A14', group: 'Oranges' },
  // Jaunes
  { name: 'PMS 109 C',  hex: '#FDD835', group: 'Jaunes' },
  { name: 'PMS 012 C',  hex: '#FFCD00', group: 'Jaunes' },
  { name: 'PMS Yellow C', hex: '#FEDD00', group: 'Jaunes' },
  { name: 'PMS 108 C',  hex: '#FFD100', group: 'Jaunes' },
  // Verts
  { name: 'PMS 354 C',  hex: '#00B140', group: 'Verts' },
  { name: 'PMS 356 C',  hex: '#007A33', group: 'Verts' },
  { name: 'PMS 375 C',  hex: '#78BE20', group: 'Verts' },
  { name: 'PMS 3395 C', hex: '#00B388', group: 'Verts' },
  { name: 'PMS 802 C',  hex: '#43B02A', group: 'Verts' },
  { name: 'PMS 347 C',  hex: '#009A44', group: 'Verts' },
  // Bleus
  { name: 'PMS 286 C',  hex: '#003DA5', group: 'Bleus' },
  { name: 'PMS 300 C',  hex: '#005EB8', group: 'Bleus' },
  { name: 'PMS 293 C',  hex: '#003087', group: 'Bleus' },
  { name: 'PMS 279 C',  hex: '#4F84C4', group: 'Bleus' },
  { name: 'PMS 2925 C', hex: '#009CDE', group: 'Bleus' },
  { name: 'PMS 306 C',  hex: '#00B5E2', group: 'Bleus' },
  { name: 'PMS 283 C',  hex: '#69B3E7', group: 'Bleus' },
  { name: 'PMS 801 C',  hex: '#009EC4', group: 'Bleus' },
  // Violets
  { name: 'PMS 268 C',  hex: '#5C2D91', group: 'Violets' },
  { name: 'PMS 2597 C', hex: '#7B2D8B', group: 'Violets' },
  { name: 'PMS 526 C',  hex: '#8B5196', group: 'Violets' },
  { name: 'PMS 520 C',  hex: '#4C3575', group: 'Violets' },
  { name: 'PMS 265 C',  hex: '#9063CD', group: 'Violets' },
  { name: 'PMS 258 C',  hex: '#7D4E9E', group: 'Violets' },
  // Roses & Magentas
  { name: 'PMS Magenta C', hex: '#E20074', group: 'Roses' },
  { name: 'PMS 812 C',  hex: '#FF48BA', group: 'Roses' },
  { name: 'PMS 806 C',  hex: '#FF48BA', group: 'Roses' },
  { name: 'PMS 215 C',  hex: '#C5006E', group: 'Roses' },
  { name: 'PMS 225 C',  hex: '#DD1C77', group: 'Roses' },
  // Marrons
  { name: 'PMS 476 C',  hex: '#5C3323', group: 'Marrons' },
  { name: 'PMS 469 C',  hex: '#643335', group: 'Marrons' },
  { name: 'PMS 729 C',  hex: '#A07850', group: 'Marrons' },
  { name: 'PMS 4625 C', hex: '#4E2A14', group: 'Marrons' },
  // Neutres & Gris
  { name: 'PMS Cool Gray 1 C',  hex: '#D9D9D6', group: 'Gris' },
  { name: 'PMS Cool Gray 4 C',  hex: '#BBBCBC', group: 'Gris' },
  { name: 'PMS Cool Gray 7 C',  hex: '#97999B', group: 'Gris' },
  { name: 'PMS Cool Gray 11 C', hex: '#54585A', group: 'Gris' },
  { name: 'PMS 427 C',  hex: '#C8C9C7', group: 'Gris' },
  { name: 'PMS Black C', hex: '#2B2B2C', group: 'Gris' },
  // Métalliques
  { name: 'PMS 871 C (Or)',    hex: '#84754E', group: 'Métalliques' },
  { name: 'PMS 877 C (Argent)', hex: '#8A8D8F', group: 'Métalliques' },
  { name: 'PMS 876 C (Bronze)', hex: '#A05C34', group: 'Métalliques' },
]

const GROUPS = Array.from(new Set(PANTONE_SWATCHES.map(s => s.group)))

export function PantoneSection({ onSelectColor }: { onSelectColor: (hex: string, name: string) => void }) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [lastSelected, setLastSelected] = useState<string | null>(null)

  const filtered = PANTONE_SWATCHES.filter(s => {
    if (search) return s.name.toLowerCase().includes(search.toLowerCase())
    if (activeGroup) return s.group === activeGroup
    return true
  })

  const handleSelect = (hex: string, name: string) => {
    setLastSelected(name)
    onSelectColor(hex, name)
  }

  return (
    <div style={{ borderTop: '1px solid #efefef', paddingTop: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel>Pantone</SectionLabel>
        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: '#999', padding: '2px 4px' }}>
          {open ? '▲ Masquer' : '▼ Afficher'}
        </button>
      </div>

      {open && (
        <>
          <input
            value={search} onChange={e => setSearch(e.target.value)} placeholder="PMS 485 C…"
            style={{ width: '100%', fontSize: 10, border: '1px solid #e0e0e0', borderRadius: 4, padding: '4px 8px', outline: 'none', marginBottom: 6, boxSizing: 'border-box', background: '#fafafa' }}
          />

          {!search && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 8 }}>
              <button onClick={() => setActiveGroup(null)}
                style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, border: `1px solid ${!activeGroup ? '#555' : '#e0e0e0'}`, background: !activeGroup ? '#333' : '#fff', color: !activeGroup ? '#fff' : '#555', cursor: 'pointer' }}>
                Tous
              </button>
              {GROUPS.map(g => (
                <button key={g} onClick={() => setActiveGroup(g === activeGroup ? null : g)}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, border: `1px solid ${activeGroup === g ? '#555' : '#e0e0e0'}`, background: activeGroup === g ? '#333' : '#fff', color: activeGroup === g ? '#fff' : '#555', cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
            {filtered.map(sw => (
              <button
                key={sw.name}
                title={`${sw.name}\n${sw.hex}`}
                onClick={() => handleSelect(sw.hex, sw.name)}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: 3, background: sw.hex,
                  border: lastSelected === sw.name ? '2px solid #333' : '1.5px solid rgba(0,0,0,0.12)',
                  cursor: 'pointer', padding: 0, outline: 'none',
                  transition: 'transform 0.1s',
                  boxShadow: lastSelected === sw.name ? '0 0 0 2px #fff inset' : 'none',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.18)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>

          {lastSelected && (
            <div style={{ marginTop: 6, fontSize: 9, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#999' }}>Sélectionné :</span>
              <strong>{lastSelected}</strong>
            </div>
          )}

          <div style={{ marginTop: 4, fontSize: 8, color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
            Valeurs Pantone Color Bridge (coated) — approximations sRGB
          </div>
        </>
      )}
    </div>
  )
}
