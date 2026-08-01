'use client'

import { useState, useMemo } from 'react'
import { CollapsibleSection } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import { FEFCO_CATALOG, FEFCO_SERIES } from '@/lib/fefco'
import type { FEFCOEntry } from '@/lib/fefco'
import type { TemplateType } from '@/lib/types'
import type { BoxParams } from '@/lib/types'

interface Props {
  onSelectTemplate: (template: TemplateType, params?: Partial<BoxParams>) => void
  activeTemplate: TemplateType
}

const SERIES_COLORS: Record<string, string> = {
  '02 Découpés': '#3b82f6',
  '03 Bliss':    '#10b981',
  '04 Folder':   '#f59e0b',
  '05 Plateau':  '#ef4444',
  '06 Spéciaux': '#8b5cf6',
  '07 Porteurs': '#e91e8c',
  'Flexibles':   '#6b7280',
}

export function FEFCOSection({ onSelectTemplate, activeTemplate }: Props) {
  const [search, setSearch] = useState('')
  const [activeSeries, setActiveSeries] = useState<string | null>(null)
  const [selected, setSelected] = useState<FEFCOEntry | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return FEFCO_CATALOG.filter(e => {
      const matchSeries = !activeSeries || e.series === activeSeries
      const matchSearch = !q || e.code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      return matchSeries && matchSearch
    })
  }, [search, activeSeries])

  const handleSelect = (entry: FEFCOEntry) => {
    setSelected(entry)
    onSelectTemplate(entry.template, entry.defaultParams)
  }

  return (
    <CollapsibleSection label="Bibliothèque FEFCO">
      <div style={{ fontSize: 9, color: c.textGhost, marginBottom: 8, padding: '4px 8px', background: 'rgba(59,130,246,0.06)', borderRadius: 7, border: '1px solid rgba(59,130,246,0.15)', lineHeight: 1.4 }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#3b82f6" strokeWidth="1.4" style={{ marginRight: 4, flexShrink: 0, verticalAlign: 'middle' }}><rect x="1" y="3" width="10" height="7" rx="1"/><path d="M4 3V2a2 2 0 0 1 4 0v1" strokeLinecap="round"/></svg>
        {FEFCO_CATALOG.length} codes FEFCO — cliquez pour appliquer le gabarit
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke={c.textGhost} strokeWidth="1.4" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="5" cy="5" r="3.5"/><path d="M8 8l2.5 2.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Rechercher code ou type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '5px 8px 5px 24px',
            fontSize: fs.sm, border: `1px solid ${c.borderLight}`,
            borderRadius: r.md, outline: 'none', fontFamily: 'inherit',
            background: c.white, color: c.ink,
          }}
        />
      </div>

      {/* Series filter pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
        <button
          onClick={() => setActiveSeries(null)}
          style={{
            fontSize: 8, padding: '2px 7px', borderRadius: 10,
            border: `1px solid ${!activeSeries ? '#3b82f6' : c.borderLight}`,
            background: !activeSeries ? '#eff6ff' : c.white,
            color: !activeSeries ? '#3b82f6' : c.textGhost,
            cursor: 'pointer', fontWeight: fw.bold,
          }}
        >Tous</button>
        {FEFCO_SERIES.map(s => (
          <button
            key={s}
            onClick={() => setActiveSeries(activeSeries === s ? null : s)}
            style={{
              fontSize: 8, padding: '2px 7px', borderRadius: 10,
              border: `1px solid ${activeSeries === s ? SERIES_COLORS[s] : c.borderLight}`,
              background: activeSeries === s ? `${SERIES_COLORS[s]}15` : c.white,
              color: activeSeries === s ? SERIES_COLORS[s] : c.textGhost,
              cursor: 'pointer', fontWeight: fw.bold,
            }}
          >{s.replace(/^\d+ /, '')}</button>
        ))}
      </div>

      {/* Results count */}
      <div style={{ fontSize: 8, color: c.textGhost, marginBottom: 6 }}>
        {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Template list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map(entry => {
          const isActive = activeTemplate === entry.template
          const isSelected = selected?.code === entry.code
          const seriesColor = SERIES_COLORS[entry.series] ?? '#666'
          return (
            <button
              key={entry.code}
              onClick={() => handleSelect(entry)}
              title={entry.description}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '7px 8px',
                borderRadius: r.md,
                border: `1px solid ${isSelected ? seriesColor : isActive ? `${seriesColor}60` : c.borderLight}`,
                background: isSelected ? `${seriesColor}12` : isActive ? `${seriesColor}06` : c.white,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.1s',
              }}
            >
              {/* Code badge */}
              <div style={{
                flexShrink: 0, minWidth: 36, height: 22,
                background: isSelected ? seriesColor : `${seriesColor}20`,
                borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 7.5, fontWeight: fw.heavy, color: isSelected ? '#fff' : seriesColor, letterSpacing: 0.2 }}>{entry.code}</span>
              </div>

              {/* Name + description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: isSelected ? seriesColor : c.ink }}>{entry.name}</span>
                  {entry.isStandard && (
                    <span style={{ fontSize: 7, padding: '0 4px', borderRadius: 3, background: `${seriesColor}20`, color: seriesColor, fontWeight: fw.heavy }}>ISO</span>
                  )}
                </div>
                <div style={{ fontSize: 8, color: c.textGhost, lineHeight: 1.3, marginTop: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                  {entry.description}
                </div>
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ padding: '16px 0', textAlign: 'center', color: c.textGhost, fontSize: 11 }}>
            Aucun résultat pour &quot;{search}&quot;
          </div>
        )}
      </div>

      {/* Selected info */}
      {selected && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: r.md, background: `${SERIES_COLORS[selected.series] ?? '#666'}08`, border: `1px solid ${SERIES_COLORS[selected.series] ?? '#666'}30` }}>
          <div style={{ fontSize: 9, fontWeight: fw.heavy, color: SERIES_COLORS[selected.series] ?? '#666', marginBottom: 3 }}>
            {selected.code} — {selected.name}
          </div>
          <div style={{ fontSize: 9, color: '#555', lineHeight: 1.4 }}>{selected.description}</div>
          {selected.defaultParams && (
            <div style={{ fontSize: 8, color: c.textGhost, marginTop: 4 }}>
              Dim. par défaut : {selected.defaultParams.width}×{selected.defaultParams.height}×{selected.defaultParams.depth} mm
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  )
}
