'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { c, fs, r } from '@/lib/tokens'

interface LayerRowProps {
  layer: ImageLayer
  idx: number
  totalCount: number
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onSelectLayer: (id: string | null) => void
  onUpdateImageLayer: (id: string, updates: Partial<ImageLayer>) => void
  onDeleteImageLayer: (id: string) => void
  onDuplicateImageLayer?: (id: string) => void
  onReorderLayer?: (id: string, direction: 'up' | 'down') => void
}

const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1,
}

export function LayerRow({
  layer, idx, totalCount,
  selectedLayerId, selectedLayerIds,
  onSelectLayer, onUpdateImageLayer, onDeleteImageLayer,
  onDuplicateImageLayer, onReorderLayer,
}: LayerRowProps) {
  const isSelected = layer.id === selectedLayerId
  const isMulti = selectedLayerIds.includes(layer.id)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const displayName = layer.name.replace(/\.[^.]+$/, '')

  const commitRename = () => {
    if (editValue.trim()) onUpdateImageLayer(layer.id, { name: editValue.trim() })
    setEditing(false)
  }

  return (
    <div
      onClick={() => !editing && onSelectLayer(isSelected ? null : layer.id)}
      className="fs-row"
      data-state={isSelected ? 'selected' : isMulti ? 'multi' : 'default'}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 6px', borderRadius: r.md, marginBottom: 2,
        ...(isSelected ? { background: '#f0f0f0' } : isMulti ? { background: c.accentBg } : {}),
        cursor: 'pointer', userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); onReorderLayer?.(layer.id, 'up') }}
          disabled={idx === 0}
          className="fs-btn-ghost" style={{ ...ghostBtn, cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? c.borderLight : c.textFaint, fontSize: fs.micro }}
          title="Monter"
        >▲</button>
        <button
          onClick={e => { e.stopPropagation(); onReorderLayer?.(layer.id, 'down') }}
          disabled={idx === totalCount - 1}
          className="fs-btn-ghost" style={{ ...ghostBtn, cursor: idx === totalCount - 1 ? 'default' : 'pointer', color: idx === totalCount - 1 ? c.borderLight : c.textFaint, fontSize: fs.micro }}
          title="Descendre"
        >▼</button>
      </div>

      <button
        onClick={e => { e.stopPropagation(); onUpdateImageLayer(layer.id, { visible: !layer.visible }) }}
        className="fs-btn-ghost" style={{ ...ghostBtn, color: layer.visible ? c.textMed : c.textGhost, flexShrink: 0 }}
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M1 6.5C1 6.5 3 2.5 6.5 2.5S12 6.5 12 6.5 10 10.5 6.5 10.5 1 6.5 1 6.5Z"/>
          <circle cx="6.5" cy="6.5" r="1.8" fill="currentColor" stroke="none"/>
        </svg>
      </button>

      {layer.kind === 'text' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="1.1" style={{ flexShrink: 0 }}>
          <path d="M2 2h8M6 2v8M4 10h4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : layer.kind === 'picto' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="1.1" style={{ flexShrink: 0 }}>
          <circle cx="6" cy="6" r="4.5"/><path d="M6 3v3l2 1.5" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#999" strokeWidth="1.1" style={{ flexShrink: 0 }}>
          <rect x="1" y="2" width="10" height="8" rx="1"/>
          <path d="M1 8l2.5-3 2 2.5L8 5.5l3 4.5" strokeLinejoin="round"/>
        </svg>
      )}

      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') setEditing(false)
          }}
          onClick={e => e.stopPropagation()}
          style={{ flex: 1, fontSize: fs.md, border: `1px solid ${c.textFaint}`, borderRadius: r.sm, padding: '1px 4px', outline: 'none', color: c.ink, background: c.white }}
        />
      ) : (
        <span
          onDoubleClick={e => { e.stopPropagation(); setEditValue(displayName); setEditing(true) }}
          title="Double-clic pour renommer"
          style={{
            fontSize: fs.md, color: isSelected ? c.ink : c.textMed,
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontWeight: isSelected ? 500 : 400,
          }}
        >
          {displayName}
        </span>
      )}

      <button
        onClick={e => { e.stopPropagation(); onUpdateImageLayer(layer.id, { locked: !layer.locked }) }}
        className="fs-btn-ghost" style={{ ...ghostBtn, color: c.textFaint, flexShrink: 0 }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
          {layer.locked
            ? <><rect x="2" y="5" width="7" height="5" rx="1"/><path d="M3.5 5V3.5a2 2 0 0 1 4 0V5"/></>
            : <><rect x="2" y="5" width="7" height="5" rx="1"/><path d="M3.5 5V3.5a2 2 0 0 1 4 0" opacity="0.4"/></>
          }
        </svg>
      </button>

      <button
        onClick={e => { e.stopPropagation(); onDuplicateImageLayer?.(layer.id) }}
        className="fs-btn-ghost" style={{ ...ghostBtn, color: c.textFaint, flexShrink: 0 }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="3" y="3" width="6" height="7" rx="1"/>
          <path d="M2 7.5V2a1 1 0 0 1 1-1h5.5"/>
        </svg>
      </button>

      <button
        onClick={e => { e.stopPropagation(); onDeleteImageLayer(layer.id) }}
        className="fs-btn-ghost" style={{ ...ghostBtn, color: c.textFaint, flexShrink: 0 }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M2 3h7M4 3V2h3v1M4.5 5v3.5M6.5 5v3.5" strokeLinecap="round"/>
          <rect x="2.5" y="3" width="6" height="6.5" rx="0.8"/>
        </svg>
      </button>
    </div>
  )
}
