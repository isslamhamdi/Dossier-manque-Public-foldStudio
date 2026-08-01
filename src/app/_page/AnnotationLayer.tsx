'use client'

import { useState, useCallback } from 'react'

export interface Annotation {
  id: string
  x: number   // fraction 0–1 of container width
  y: number   // fraction 0–1 of container height
  text: string
  author: string
  createdAt: Date
  resolved: boolean
  color: string
}

const COLORS = ['#e91e8c', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b']

interface Props {
  enabled: boolean
  annotations: Annotation[]
  onAdd: (a: Annotation) => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
}

export function AnnotationLayer({ enabled, annotations, onAdd, onResolve, onDelete }: Props) {
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enabled) return
    if ((e.target as HTMLElement).closest('[data-annotation]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    setDraft({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height })
    setDraftText('')
  }, [enabled])

  const submitDraft = () => {
    if (!draft || !draftText.trim()) { setDraft(null); return }
    onAdd({
      id: `ann-${Date.now()}`,
      x: draft.x, y: draft.y,
      text: draftText.trim(),
      author: 'Moi',
      createdAt: new Date(),
      resolved: false,
      color: COLORS[annotations.length % COLORS.length],
    })
    setDraft(null)
    setDraftText('')
  }

  return (
    <div
      onClick={handleContainerClick}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        cursor: enabled ? 'crosshair' : 'default',
        pointerEvents: enabled ? 'auto' : 'none',
      }}
    >
      {/* Existing annotations */}
      {annotations.map((ann, i) => (
        <div key={ann.id} data-annotation="1"
          style={{
            position: 'absolute',
            left: `${ann.x * 100}%`, top: `${ann.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 40,
          }}
        >
          <div
            onClick={e => { e.stopPropagation(); setOpenId(openId === ann.id ? null : ann.id) }}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: ann.resolved ? '#ccc' : ann.color,
              color: '#fff', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              border: '2px solid #fff',
              opacity: ann.resolved ? 0.5 : 1,
            }}
          >{i + 1}</div>

          {openId === ann.id && (
            <div style={{
              position: 'absolute', left: 28, top: -8, zIndex: 50,
              background: '#fff', border: `1px solid ${ann.color}`,
              borderRadius: 8, padding: '8px 10px', minWidth: 180,
              boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
            }}>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>
                {ann.author} · {ann.createdAt instanceof Date ? ann.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </div>
              <div style={{ fontSize: 12, color: '#222', marginBottom: 8, lineHeight: 1.4 }}>{ann.text}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); onResolve(ann.id); setOpenId(null) }}
                  style={{ flex: 1, fontSize: 10, padding: '3px 0', borderRadius: 4, border: '1px solid #10b981', background: ann.resolved ? '#f0fdf4' : '#fff', color: '#10b981', cursor: 'pointer' }}>
                  {ann.resolved ? '✓ Résolu' : 'Résoudre'}
                </button>
                <button onClick={e => { e.stopPropagation(); onDelete(ann.id); setOpenId(null) }}
                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Draft input */}
      {draft && (
        <div
          data-annotation="1"
          style={{
            position: 'absolute',
            left: `${draft.x * 100}%`, top: `${draft.y * 100}%`,
            transform: 'translate(8px, -50%)', zIndex: 50,
            background: '#fff', border: '1px solid #e91e8c',
            borderRadius: 8, padding: '8px 10px', width: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <textarea
            autoFocus rows={2} value={draftText}
            onChange={e => setDraftText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDraft() } if (e.key === 'Escape') setDraft(null) }}
            placeholder="Entrez un commentaire…"
            style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 4, padding: '4px 6px', fontSize: 11, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button onClick={submitDraft} style={{ flex: 1, fontSize: 10, padding: '3px 0', borderRadius: 4, border: 'none', background: '#e91e8c', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
              Ajouter
            </button>
            <button onClick={() => setDraft(null)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, border: '1px solid #e0e0e0', background: '#fff', color: '#666', cursor: 'pointer' }}>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
