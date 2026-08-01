'use client'

import { useState, useRef, useEffect } from 'react'
import { c } from '@/lib/tokens'
import { NavLogo } from './nav/NavLogo'
import { NavTabs } from './nav/NavTabs'
import { NavActions } from './nav/NavActions'
import type { Locale } from '@/lib/i18n'

interface Collaborator { id: string; name: string; color: string }

interface NavProps {
  activeTab: 'fold' | 'unfold'
  onTabChange: (tab: 'fold' | 'unfold') => void
  onSave?: () => void
  onLoad?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  lastSaved?: Date | null
  collaborators?: Collaborator[]
  projectTitle?: string
  onShowShortcuts?: () => void
  onToggleTheme?: () => void
  onShowBrandKit?: () => void
  onShowBatch?: () => void
  onShowVersionCompare?: () => void
  onShowProjects?: () => void
  onToggleProofing?: () => void
  proofingMode?: boolean
  onShowVariantCompare?: () => void
  locale?: Locale
  onLocaleChange?: (l: Locale) => void
  theme?: string
  onShowClientPortal?: () => void
  onShowStructuralEditor?: () => void
  onShowShopify?: () => void
  onShowPrintSubmit?: () => void
  onNewProject?: () => void
  onShowRender?: () => void
}

const EXPORT_FORMATS = [
  { label: 'SVG', format: 'SVG' },
  { label: 'PDF', format: 'PDF' },
  { label: 'DXF', format: 'DXF' },
  { label: 'PNG', format: 'PNG' },
] as const

function NavQuickActions({ onShowPrintSubmit, onShowRender }: {
  onShowPrintSubmit?: () => void
  onShowRender?: () => void
}) {
  const [exportOpen, setExportOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!exportOpen) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setExportOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [exportOpen])

  const btnBase: React.CSSProperties = {
    height: 26, border: '1px solid #ddd8d2', borderRadius: 5, cursor: 'pointer',
    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
    padding: '0 10px', background: '#fff', color: '#333', fontFamily: 'inherit',
    transition: 'background 0.1s, border-color 0.1s',
    WebkitAppRegion: 'no-drag',
  } as React.CSSProperties

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 16, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <div style={{ width: 1, height: 18, background: '#e0dcd8', marginRight: 4 }} />

      {/* Export — formats directs PDF · SVG · PNG + DXF via ↓ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {(['PDF', 'SVG', 'PNG'] as const).map(fmt => (
          <button key={fmt}
            onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:export', { detail: { format: fmt } }))}
            title={`Exporter ${fmt}`}
            style={{ ...btnBase, padding: '0 8px', fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 0.3 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f4f2' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
          >{fmt}</button>
        ))}
        <div ref={ref} style={{ position: 'relative' }}>
          <button
            onClick={() => setExportOpen(v => !v)}
            title="Plus de formats (DXF…)"
            style={{ ...btnBase, padding: '0 7px', fontSize: 12, color: '#888', borderColor: exportOpen ? '#bbb' : '#ddd8d2', background: exportOpen ? '#f0ede9' : '#fff' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f4f2' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = exportOpen ? '#f0ede9' : '#fff' }}
          >
            <svg width="7" height="5" viewBox="0 0 7 5" fill="none">
              <path d="M1 1l2.5 2.5L6 1" stroke="#999" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </button>
          {exportOpen && (
            <div style={{ position: 'fixed', top: 42, zIndex: 9999, background: '#fff', border: '1px solid #ddd8d2', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '4px 0', minWidth: 110 }}>
              {EXPORT_FORMATS.filter(f => !['PDF','SVG','PNG'].includes(f.format)).map(({ label, format }) => (
                <button key={format}
                  onClick={() => { window.dispatchEvent(new CustomEvent('fold-studio:export', { detail: { format } })); setExportOpen(false) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 12, color: '#333', fontFamily: 'inherit' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
                >↓ {label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print button */}
      {onShowPrintSubmit && (
        <button
          onClick={onShowPrintSubmit}
          title="Soumettre à l'imprimeur"
          style={btnBase}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f4f2' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M3 4V2h6v2"/>
            <rect x="1" y="4" width="10" height="5" rx="1"/>
            <path d="M3 7h6v4H3z"/>
            <path d="M3.5 6h1"/>
          </svg>
          Print
        </button>
      )}

      {/* Render button */}
      {onShowRender && (
        <button
          onClick={onShowRender}
          title="Ouvrir le panneau Render (scènes + export HD)"
          style={{
            ...btnBase,
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            border: 'none', color: '#fff',
            boxShadow: '0 1px 6px rgba(99,102,241,0.35)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="6" cy="6" r="4.5"/>
            <path d="M4 6.5C4 5 5 4 6.5 4"/>
            <path d="M8 6c0 1-0.8 2-2 2.2"/>
          </svg>
          Render
        </button>
      )}
    </div>
  )
}

export default function Nav({ activeTab, onTabChange, onSave, onLoad, onUndo, onRedo, canUndo, canRedo, lastSaved, collaborators, onShowShortcuts, onToggleTheme, theme, onShowBrandKit, onShowBatch, onShowVersionCompare, onShowProjects, onToggleProofing, proofingMode, onShowVariantCompare, locale, onLocaleChange, onShowClientPortal, onShowStructuralEditor, onShowShopify, onShowPrintSubmit, onNewProject, onShowRender }: NavProps) {
  return (
    <nav style={{
      height: 40,
      background: c.white,
      borderBottom: `1px solid ${c.borderSep}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      flexShrink: 0,
      userSelect: 'none',
      WebkitAppRegion: 'drag',
    } as React.CSSProperties}>
      <NavLogo />
      <NavTabs activeTab={activeTab} onTabChange={onTabChange} />
      <NavQuickActions onShowPrintSubmit={onShowPrintSubmit} onShowRender={onShowRender} />
      <div style={{ flex: 1 }} />
      <NavActions
        onSave={onSave} onLoad={onLoad} onUndo={onUndo} onRedo={onRedo}
        canUndo={canUndo} canRedo={canRedo} lastSaved={lastSaved} collaborators={collaborators}
        onShowShortcuts={onShowShortcuts} onToggleTheme={onToggleTheme} theme={theme}
        onShowBrandKit={onShowBrandKit} onShowBatch={onShowBatch} onShowVersionCompare={onShowVersionCompare}
        onShowProjects={onShowProjects} onToggleProofing={onToggleProofing} proofingMode={proofingMode}
        onShowVariantCompare={onShowVariantCompare}
        locale={locale} onLocaleChange={onLocaleChange}
        onShowClientPortal={onShowClientPortal}
        onShowStructuralEditor={onShowStructuralEditor}
        onShowShopify={onShowShopify}
        onShowPrintSubmit={onShowPrintSubmit}
        onNewProject={onNewProject}
      />
    </nav>
  )
}
