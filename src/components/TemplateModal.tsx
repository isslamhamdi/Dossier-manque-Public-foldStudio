'use client'

import { useState, useEffect, useMemo } from 'react'
import type { TemplateType } from '@/lib/types'
import { TEMPLATES } from '@/lib/templates'
import { FEFCO_CATALOG, FEFCO_SERIES } from '@/lib/fefco'
import { PACKLY_CATALOG, PACKLY_CATEGORY_NAMES } from '@/lib/packlyData'
import { TemplateCard } from './template-modal/TemplateCard'
import { FefcoCard } from './template-modal/FefcoCard'
import { PacklyCard } from './template-modal/PacklyCard'

export interface PacklyDims {
  width: number; height: number; depth: number; packlyCode: string
}

interface TemplateModalProps {
  open: boolean
  onClose: () => void
  onSelect: (t: TemplateType, dims?: { width: number; height: number; depth: number } | PacklyDims) => void
  current: TemplateType
}

const ANIM_MS = 180

export default function TemplateModal({ open, onClose, onSelect, current }: TemplateModalProps) {
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const [tab, setTab] = useState<'templates' | 'fefco' | 'packly'>('templates')
  const [search, setSearch] = useState('')
  const [activeSeries, setActiveSeries] = useState<string | null>(null)
  const [activePacklyCat, setActivePacklyCat] = useState<string | null>(null)
  const [tabSwitching, setTabSwitching] = useState(false)

  useEffect(() => {
    if (open) {
      setClosing(false)
      setMounted(true)
    } else if (mounted) {
      setClosing(true)
      const id = setTimeout(() => setMounted(false), ANIM_MS)
      return () => clearTimeout(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const filteredFefco = useMemo(() => {
    let list = FEFCO_CATALOG
    if (activeSeries) list = list.filter(e => e.series === activeSeries)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.code.toLowerCase().includes(q) ||
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activeSeries])

  const filteredPackly = useMemo(() => {
    let list = PACKLY_CATALOG
    if (activePacklyCat) list = list.filter(a => a.categories.includes(activePacklyCat))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.code.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q)
      )
    }
    return list
  }, [search, activePacklyCat])

  if (!mounted) return null

  const chipStyle = (active: boolean) => ({
    padding: '3px 9px', borderRadius: 12, fontSize: 10, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3,
    border: `1px solid ${active ? '#e91e8c' : '#e0e0e0'}`,
    background: active ? '#fff0f7' : '#fafafa',
    color: active ? '#e91e8c' : '#666',
  } as React.CSSProperties)

  return (
    <div
      className={`fs-modal-overlay${closing ? ' closing' : ''}`}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.72)',
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`fs-modal-card${closing ? ' closing' : ''}`}
        style={{
          background: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: 10,
          width: 648,
          maxHeight: '86vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid #f0f0f0',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>Template Library</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 3, lineHeight: 1.4, maxWidth: 440 }}>
              {tab === 'templates'
                ? 'Select a base shape for your packaging. Dimensions can be adjusted afterwards in the studio.'
                : tab === 'packly'
                  ? '76 articles from the Packly catalog — loads the matching template with Packly default dimensions.'
                  : "Référentiel international d'emballages — cliquez pour ouvrir dans le studio."}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#aaa',
            fontSize: 20, cursor: 'pointer', padding: '2px 6px', lineHeight: 1,
          }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #f0f0f0',
          padding: '0 22px', flexShrink: 0,
        }}>
          {(['templates', 'fefco', 'packly'] as const).map(t => (
            <button
              key={t}
              onClick={e => { e.stopPropagation(); setTab(t); setSearch(''); setTabSwitching(true); setTimeout(() => setTabSwitching(false), 200) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '9px 14px 8px', fontFamily: 'inherit',
                fontSize: 12, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#e91e8c' : '#888',
                borderBottom: `2px solid ${tab === t ? '#e91e8c' : 'transparent'}`,
                marginBottom: -1, letterSpacing: 0.2,
              }}
            >
              {t === 'templates' ? 'Templates' : t === 'fefco' ? 'Bibliothèque FEFCO' : 'Packly Catalog'}
            </button>
          ))}
        </div>

        {/* Packly: search + category filter */}
        {tab === 'packly' && (
          <div style={{ padding: '10px 20px 8px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Search by name or code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #e8e8e8', borderRadius: 6,
                padding: '7px 10px', fontSize: 12, color: '#333',
                outline: 'none', marginBottom: 8, fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button onClick={() => setActivePacklyCat(null)} style={chipStyle(activePacklyCat === null)}>All</button>
              {Object.entries(PACKLY_CATEGORY_NAMES).map(([code, name]) => (
                <button key={code} onClick={() => setActivePacklyCat(activePacklyCat === code ? null : code)} style={chipStyle(activePacklyCat === code)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FEFCO: search + series filter */}
        {tab === 'fefco' && (
          <div style={{ padding: '10px 20px 8px', borderBottom: '1px solid #f5f5f5', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Rechercher… (code, nom, description)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1px solid #e8e8e8', borderRadius: 6,
                padding: '7px 10px', fontSize: 12, color: '#333',
                outline: 'none', marginBottom: 8, fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveSeries(null)} style={chipStyle(activeSeries === null)}>
                Tous
              </button>
              {FEFCO_SERIES.map(s => (
                <button key={s} onClick={() => setActiveSeries(activeSeries === s ? null : s)} style={chipStyle(activeSeries === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scrollable grid */}
        <div style={{
          overflowY: 'auto', flex: 1,
          padding: '16px 20px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          alignContent: 'start',
          pointerEvents: tabSwitching ? 'none' : 'auto',
        }}>
          {tab === 'templates'
            ? TEMPLATES.map(tmpl => (
                <TemplateCard key={tmpl.id} tmpl={tmpl} current={current} onSelect={onSelect} onClose={onClose} />
              ))
            : tab === 'packly'
              ? filteredPackly.length > 0
                ? filteredPackly.map(article => (
                    <PacklyCard key={article.code} article={article} current={current} onSelect={onSelect} onClose={onClose} />
                  ))
                : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: '#aaa', fontSize: 12 }}>
                    No results for &ldquo;{search}&rdquo;
                  </div>
                )
              : filteredFefco.length > 0
                ? filteredFefco.map(entry => (
                    <FefcoCard key={entry.code} entry={entry} onSelect={onSelect} onClose={onClose} />
                  ))
                : (
                  <div style={{
                    gridColumn: '1 / -1', textAlign: 'center',
                    padding: '40px 0', color: '#aaa', fontSize: 12,
                  }}>
                    Aucun résultat pour &ldquo;{search}&rdquo;
                  </div>
                )
          }
        </div>
      </div>
    </div>
  )
}
