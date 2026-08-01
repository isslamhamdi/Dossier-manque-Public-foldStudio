'use client'

import { useRef } from 'react'
import type { TemplateType } from '@/lib/types'
import { TemplateSVG } from './TemplateSVG'

interface Template {
  id: TemplateType
  name: string
}

interface TemplateCardProps {
  tmpl: Template
  current: TemplateType
  onSelect: (t: TemplateType) => void
  onClose: () => void
}

export function TemplateCard({ tmpl, current, onSelect, onClose }: TemplateCardProps) {
  const isActive = current === tmpl.id
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
    if (!isActive) card.style.borderColor = '#e8e8e8'
    card.style.transform = 'perspective(500px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  return (
    <button
      ref={cardRef}
      onClick={() => { onSelect(tmpl.id); onClose() }}
      className="fs-card-3d"
      style={{
        background: isActive ? '#fff5fa' : '#ffffff',
        border: `1.5px solid ${isActive ? '#e91e8c' : '#e8e8e8'}`,
        borderRadius: 8,
        padding: '16px 12px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
      onMouseEnter={e => {
        if (!isActive) e.currentTarget.style.borderColor = '#d0d0d0'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{
        background: '#fafafa',
        borderRadius: 5,
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 84,
        height: 68,
      }}>
        <TemplateSVG id={tmpl.id} />
      </div>
      <span style={{
        fontSize: 11,
        color: isActive ? '#e91e8c' : '#444',
        fontWeight: isActive ? 600 : 500,
        textAlign: 'center',
      }}>
        {tmpl.name}
      </span>
    </button>
  )
}
