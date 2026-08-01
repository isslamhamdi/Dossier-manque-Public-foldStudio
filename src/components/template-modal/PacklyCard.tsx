'use client'

import { useRef, useState } from 'react'
import type { TemplateType } from '@/lib/types'
import type { PacklyArticle } from '@/lib/packlyData'
import { PACKLY_CATEGORY_NAMES } from '@/lib/packlyData'
import type { PacklyDims } from '../TemplateModal'

interface PacklyCardProps {
  article: PacklyArticle
  current: TemplateType
  onSelect: (t: TemplateType, dims?: { width: number; height: number; depth: number } | PacklyDims) => void
  onClose: () => void
}

const CAT_COLORS: Record<string, string> = {
  RF: '#4a90d9', TL: '#7b5ea7', SF: '#e67e22',
  AB: '#27ae60', AC: '#95a5a6', DB: '#e91e8c', '123B': '#c0392b',
}

export function PacklyCard({ article, current, onSelect, onClose }: PacklyCardProps) {
  const isActive = current === article.template
  const cardRef = useRef<HTMLButtonElement>(null)
  const [imgErr, setImgErr] = useState(false)

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
    card.style.transform = 'perspective(500px) rotateY(0deg) rotateX(0deg) scale(1)'
  }

  const handleClick = () => {
    onSelect(article.template, {
      width: article.defaultA,
      height: article.defaultH,
      depth: article.defaultB,
      packlyCode: article.code,
    })
    onClose()
  }

  return (
    <button
      ref={cardRef}
      onClick={handleClick}
      className="fs-card-3d"
      style={{
        background: isActive ? '#fff5fa' : '#ffffff',
        border: `1.5px solid ${isActive ? '#e91e8c' : '#e8e8e8'}`,
        borderRadius: 8,
        padding: '12px 10px 10px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = '#d0d0d0' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail */}
      <div style={{
        background: '#f7f7f7',
        borderRadius: 5,
        width: 84, height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {article.mockup && !imgErr ? (
          <img
            src={article.mockup}
            alt={article.title}
            onError={() => setImgErr(true)}
            style={{ width: 64, height: 56, objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: 20 }}>📦</span>
        )}
      </div>

      {/* Title */}
      <span style={{
        fontSize: 10.5, fontWeight: 600,
        color: isActive ? '#e91e8c' : '#333',
        textAlign: 'center', lineHeight: 1.35,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', width: '100%',
      }}>
        {article.title}
      </span>

      {/* Code + categories */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
        <span style={{
          fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
          background: '#f0f0f0', color: '#666', borderRadius: 3, padding: '1px 5px',
        }}>
          {article.code}
        </span>
        {article.categories.map(cat => (
          <span key={cat} style={{
            fontSize: 9, fontWeight: 700,
            background: (CAT_COLORS[cat] ?? '#aaa') + '22',
            color: CAT_COLORS[cat] ?? '#aaa',
            borderRadius: 3, padding: '1px 5px',
          }}>
            {cat}
          </span>
        ))}
        {article.corrugated && (
          <span style={{
            fontSize: 9, fontWeight: 600,
            background: '#e8f5e9', color: '#388e3c',
            borderRadius: 3, padding: '1px 5px',
          }}>
            corr
          </span>
        )}
      </div>
    </button>
  )
}
