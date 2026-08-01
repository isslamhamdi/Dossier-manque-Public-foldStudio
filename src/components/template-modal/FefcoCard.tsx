'use client'

import { useRef } from 'react'
import type { FEFCOEntry } from '@/lib/fefco'
import type { TemplateType } from '@/lib/types'
import { TemplateSVG } from './TemplateSVG'

interface FefcoCardProps {
  entry: FEFCOEntry
  onSelect: (t: TemplateType) => void
  onClose: () => void
}

export function FefcoCard({ entry, onSelect, onClose }: FefcoCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    card.style.transform = `perspective(500px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = e.currentTarget
    card.style.borderColor = '#e8e8e8'
    card.style.transform = 'perspective(500px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  return (
    <button
      ref={cardRef}
      title={entry.description}
      onClick={() => { onSelect(entry.template); onClose() }}
      className="fs-card-3d"
      style={{
        background: '#ffffff',
        border: '1.5px solid #e8e8e8',
        borderRadius: 8,
        padding: '14px 10px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d0d0d0' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        position: 'absolute', top: 7, right: 7,
        fontSize: 7, fontWeight: 700, letterSpacing: 0.4,
        padding: '2px 5px', borderRadius: 3,
        textTransform: 'uppercase',
        background: entry.isStandard ? '#dcfce7' : '#f3f4f6',
        color: entry.isStandard ? '#16a34a' : '#9ca3af',
      }}>
        {entry.isStandard ? 'Disponible' : 'Approx.'}
      </div>

      <div style={{
        fontSize: 15, fontWeight: 800, color: '#e91e8c',
        letterSpacing: 0.5, lineHeight: 1,
      }}>
        {entry.code}
      </div>

      <div style={{
        background: '#fafafa', borderRadius: 5, padding: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 68, height: 58, overflow: 'hidden',
      }}>
        <TemplateSVG id={entry.template} />
      </div>

      <span style={{
        fontSize: 10, color: '#444', fontWeight: 600,
        textAlign: 'center', lineHeight: 1.3,
      }}>
        {entry.name}
      </span>
    </button>
  )
}
