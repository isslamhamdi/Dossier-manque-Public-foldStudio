'use client'

import type { BoxParams, TemplateType } from '@/lib/types'

interface Props {
  params: BoxParams
  activeTemplate: TemplateType
  exteriorColor: string
  interiorColor: string
  onExit: () => void
}

export function ProofingModeOverlay({ params, activeTemplate, exteriorColor, interiorColor, onExit }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', flexDirection: 'column',
      pointerEvents: 'none',
    }}>
      {/* Top banner */}
      <div style={{
        pointerEvents: 'auto',
        background: '#1a1a1a', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>MODE RELECTURE</span>
          <span style={{ fontSize: 11, color: '#888' }}>Lecture seule — aucune modification n&apos;est possible</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Spec summary */}
          <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
            <div>{params.width} × {params.height} × {params.depth} mm</div>
            <div>{activeTemplate}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div title={`Extérieur: ${exteriorColor}`} style={{ width: 18, height: 18, borderRadius: 3, background: exteriorColor, border: '1px solid rgba(255,255,255,0.3)' }} />
            <div title={`Intérieur: ${interiorColor}`} style={{ width: 18, height: 18, borderRadius: 3, background: interiorColor, border: '1px solid rgba(255,255,255,0.3)' }} />
          </div>
          <button onClick={onExit} style={{
            padding: '5px 14px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)',
            color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
          }}>
            Quitter la relecture
          </button>
        </div>
      </div>

      {/* Overlay that blocks interaction */}
      <div style={{
        flex: 1, pointerEvents: 'auto',
        outline: '3px solid #f59e0b',
        cursor: 'not-allowed',
      }} onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()} />
    </div>
  )
}
