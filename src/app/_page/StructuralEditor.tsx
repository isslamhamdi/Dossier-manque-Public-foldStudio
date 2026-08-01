'use client'

import { useMemo, useState } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { MM_TO_PX } from '@/lib/dieline/helpers'
import type { Panel } from '@/lib/dieline/helpers'

interface StructuralEditorProps {
  params: BoxParams
  activeTemplate: TemplateType
  onParamChange: (key: keyof BoxParams, value: number) => void
  onClose: () => void
}

// #55: Structural panel editor — visual SVG editor to tweak individual panel dims
export function StructuralEditor({ params, activeTemplate, onParamChange, onClose }: StructuralEditorProps) {
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [editKey, setEditKey] = useState<keyof BoxParams | null>(null)
  const [editVal, setEditVal] = useState('')

  const dieline = useMemo(() => {
    try { return computeDieline(params, activeTemplate) } catch { return null }
  }, [activeTemplate, params])

  if (!dieline) {
    return (
      <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div style={panelStyle}>
          <button onClick={onClose} style={closeBtn}>×</button>
          <div style={{ padding: 24, color: '#888', fontSize: 13 }}>Patron non disponible pour ce template.</div>
        </div>
      </div>
    )
  }

  const scale = Math.min(520 / dieline.svgWidth, 360 / dieline.svgHeight, 1)
  const vw = dieline.svgWidth * scale
  const vh = dieline.svgHeight * scale

  const panelToParam = (label: string): keyof BoxParams | null => {
    const l = label.toLowerCase()
    if (l.includes('front') || l.includes('back') || l.includes('avant') || l.includes('face')) return 'width'
    if (l.includes('side') || l.includes('lat') || l.includes('côté')) return 'depth'
    if (l.includes('top') || l.includes('bottom') || l.includes('haut') || l.includes('bas')) return 'height'
    if (l.includes('glue') || l.includes('colle')) return 'glueTab'
    return null
  }

  const handlePanelClick = (p: Panel) => {
    setSelectedPanel(p.label)
    const key = panelToParam(p.label)
    if (key) {
      setEditKey(key)
      setEditVal(String(params[key]))
    } else {
      setEditKey(null)
    }
  }

  const handleApply = () => {
    if (editKey && editVal) {
      const v = parseFloat(editVal)
      if (!isNaN(v) && v > 0) onParamChange(editKey, v)
    }
    setSelectedPanel(null)
    setEditKey(null)
  }

  return (
    <div style={overlayStyle} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={panelStyle}>
        <button onClick={onClose} style={closeBtn}>×</button>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#5A6BD4', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 4 }}>Éditeur structurel</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#222', marginBottom: 4 }}>Modifier les panneaux</div>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>Cliquez sur un panneau pour ajuster ses dimensions.</div>

        {/* SVG dieline preview with interactive panels */}
        <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden' }}>
          <svg
            width={vw} height={vh}
            viewBox={`0 0 ${dieline.svgWidth} ${dieline.svgHeight}`}
            style={{ display: 'block' }}
          >
            {/* Panel fills */}
            {dieline.panels.map((p: Panel) => {
              const isSelected = selectedPanel === p.label
              const isHov = hovered === p.label
              return (
                <g key={p.label} onClick={() => handlePanelClick(p)} onMouseEnter={() => setHovered(p.label)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
                  <rect
                    x={p.x * MM_TO_PX} y={p.y * MM_TO_PX}
                    width={p.w * MM_TO_PX} height={p.h * MM_TO_PX}
                    fill={isSelected ? 'rgba(90,107,212,0.18)' : isHov ? 'rgba(90,107,212,0.08)' : 'rgba(255,255,255,0.6)'}
                    stroke={isSelected ? '#5A6BD4' : isHov ? '#8899e8' : '#d0ccc8'}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />
                  <text
                    x={(p.x + p.w / 2) * MM_TO_PX}
                    y={(p.y + p.h / 2) * MM_TO_PX}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.min(p.w, p.h) * MM_TO_PX * 0.18}
                    fill={isSelected ? '#5A6BD4' : '#888'}
                    fontWeight={isSelected ? 700 : 400}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {p.label}
                  </text>
                  {/* Dimension labels */}
                  <text x={(p.x + p.w / 2) * MM_TO_PX} y={(p.y + p.h * 0.7) * MM_TO_PX}
                    textAnchor="middle" fontSize={Math.min(p.w, p.h) * MM_TO_PX * 0.14}
                    fill="#aaa" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {p.w.toFixed(0)}×{p.h.toFixed(0)}mm
                  </text>
                </g>
              )
            })}

            {/* Cut lines */}
            <path d={dieline.cutPath} fill="none" stroke="#e53e3e" strokeWidth={0.8} opacity={0.7} />

            {/* Fold lines */}
            {dieline.foldLines.map((fl: string, i: number) => (
              <path key={i} d={fl} fill="none" stroke="#5A6BD4" strokeWidth={0.5} strokeDasharray="4 3" opacity={0.6} />
            ))}
          </svg>
        </div>

        {/* Panel edit controls */}
        {selectedPanel && (
          <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#333', marginBottom: 10 }}>
              Panneau sélectionné : <span style={{ color: '#5A6BD4' }}>{selectedPanel}</span>
            </div>
            {editKey ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, color: '#666', fontWeight: 600, minWidth: 100 }}>
                  {editKey === 'width' ? 'Largeur (mm)' : editKey === 'height' ? 'Hauteur (mm)' : editKey === 'depth' ? 'Profondeur (mm)' : 'Rabat colle (mm)'}
                </label>
                <input
                  type="number" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApply()}
                  min={5} max={500} step={0.5}
                  style={{ width: 80, padding: '5px 8px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12 }}
                />
                <button onClick={handleApply} style={{ padding: '5px 14px', background: '#5A6BD4', color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Appliquer
                </button>
                <button onClick={() => { setSelectedPanel(null); setEditKey(null) }} style={{ padding: '5px 10px', background: '#f0f0f0', color: '#555', border: 'none', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#888' }}>Ce panneau est calculé automatiquement depuis les dimensions principales.</div>
            )}
          </div>
        )}

        {/* Current dimensions summary */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {(['width', 'height', 'depth'] as const).map(key => (
            <div key={key} style={{ flex: 1, background: '#f5f5f5', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{key === 'width' ? 'L' : key === 'height' ? 'H' : 'P'}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{params[key]}</div>
              <div style={{ fontSize: 9, color: '#aaa' }}>mm</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  backdropFilter: 'blur(3px)',
}
const panelStyle: React.CSSProperties = {
  background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  width: 620, maxHeight: '92vh', overflowY: 'auto', padding: '24px 24px 20px', position: 'relative', fontFamily: 'inherit',
}
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
  fontSize: 20, cursor: 'pointer', color: '#aaa', lineHeight: 1,
}
