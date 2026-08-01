'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { c, fs, r } from '@/lib/tokens'
import { LOCALES } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

interface Collaborator { id: string; name: string; color: string }

interface NavActionsProps {
  onSave?: () => void
  onLoad?: () => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  lastSaved?: Date | null
  collaborators?: Collaborator[]
  onShowShortcuts?: () => void
  onToggleTheme?: () => void
  theme?: string
  onShowBrandKit?: () => void
  onShowBatch?: () => void
  onShowVersionCompare?: () => void
  onShowProjects?: () => void
  onToggleProofing?: () => void
  proofingMode?: boolean
  onShowVariantCompare?: () => void
  locale?: Locale
  onLocaleChange?: (l: Locale) => void
  onShowClientPortal?: () => void
  onShowStructuralEditor?: () => void
  onShowShopify?: () => void
  onShowPrintSubmit?: () => void
  onNewProject?: () => void
}

export function NavActions({
  onSave, onLoad, onUndo, onRedo, canUndo, canRedo, lastSaved,
  collaborators, onShowShortcuts, onToggleTheme, theme,
  onShowBrandKit, onShowBatch, onShowVersionCompare, onShowProjects,
  onToggleProofing, proofingMode, onShowVariantCompare,
  locale, onLocaleChange,
  onShowClientPortal, onShowStructuralEditor, onShowShopify, onShowPrintSubmit,
  onNewProject,
}: NavActionsProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!moreOpen) return
    const close = (e: MouseEvent) => { if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [moreOpen])

  const iconBtn = (disabled = false): React.CSSProperties => ({
    background: 'none', border: `1px solid ${disabled ? '#eee' : c.borderLight}`,
    color: disabled ? '#ccc' : '#666', fontSize: fs.md, cursor: disabled ? 'default' : 'pointer',
    borderRadius: r.md, padding: '4px 7px', display: 'flex', alignItems: 'center',
    WebkitAppRegion: 'no-drag', transition: 'color 0.12s, border-color 0.12s',
  } as React.CSSProperties)

  const menuItem = (label: string, icon: React.ReactNode, onClick: () => void, active = false) => (
    <button
      key={label}
      onClick={() => { onClick(); setMoreOpen(false) }}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: '7px 14px',
        background: active ? '#f0f0ff' : 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', fontSize: 12,
        color: active ? '#4455cc' : '#333', fontFamily: 'inherit',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#f5f5f5' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? '#f0f0ff' : 'none' }}
    >
      <span style={{ color: '#888', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      WebkitAppRegion: 'no-drag',
    } as React.CSSProperties}>

      {/* Undo / Redo */}
      {onUndo && (
        <div style={{ display: 'flex', gap: 2, marginRight: 2 }}>
          <button onClick={() => canUndo && onUndo()} title="Annuler (Ctrl+Z)" style={iconBtn(!canUndo)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6a4 4 0 1 1 .8 2.4"/><path d="M2 3v3h3"/>
            </svg>
          </button>
          <button onClick={() => canRedo && onRedo?.()} title="Rétablir (Ctrl+Y)" style={iconBtn(!canRedo)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 6a4 4 0 1 0-.8 2.4"/><path d="M10 3v3H7"/>
            </svg>
          </button>
        </div>
      )}


      {/* Collaborators */}
      {collaborators && collaborators.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginRight: 2 }}>
          {collaborators.slice(0, 3).map(col => (
            <div key={col.id} title={`${col.name} — en ligne`} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: col.color, border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700, color: '#fff',
            }}>
              {col.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {/* Separator */}
      <div style={{ width: 1, height: 16, background: '#e0dcd8', margin: '0 2px' }} />

      {/* Nouveau */}
      {onNewProject && (
        <button
          onClick={onNewProject}
          title="Nouveau projet"
          style={{
            background: 'none', border: `1px solid ${c.borderLight}`, color: '#666',
            fontSize: fs.md, cursor: 'pointer', fontFamily: 'inherit',
            borderRadius: r.lg, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5"/>
            <path d="M8.5 1.5v3M7 3h3"/>
          </svg>
          Nouveau
        </button>
      )}

      {/* Ouvrir */}
      {onLoad && (
        <button
          onClick={onLoad}
          title="Ouvrir un projet (.foldstudio)"
          style={{
            background: 'none', border: `1px solid ${c.borderLight}`, color: '#666',
            fontSize: fs.md, cursor: 'pointer', fontFamily: 'inherit',
            borderRadius: r.lg, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 3.5V9.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V4.5L8.5 1.5H3a1 1 0 0 0-1 1v1"/>
            <path d="M3 7.5h5M5.5 5.5v4"/>
          </svg>
          Ouvrir
        </button>
      )}

      {/* Sauvegarder */}
      {onSave && (
        <button
          onClick={onSave}
          title="Enregistrer (Ctrl+S)"
          style={{
            background: c.ink, border: 'none', color: c.white,
            fontSize: fs.md, cursor: 'pointer', fontFamily: 'inherit',
            borderRadius: r.lg, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4,
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="1" width="9" height="9" rx="1.2"/>
            <rect x="3" y="1" width="5" height="3" rx="0.5"/>
            <rect x="2.5" y="5.5" width="6" height="3.5" rx="0.5"/>
          </svg>
          Sauvegarder
        </button>
      )}

      {/* ··· More menu */}
      <div ref={moreRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMoreOpen(v => !v)}
          title="Plus d'options"
          style={{
            ...iconBtn(),
            background: moreOpen ? '#f0ede9' : 'none',
            fontWeight: 700, letterSpacing: 1,
          }}
        >···</button>

        {moreOpen && (
          <div style={{
            position: 'fixed', top: 42, right: 8, zIndex: 9999,
            background: '#fff', border: '1px solid #ddd8d2',
            borderRadius: 8, boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
            minWidth: 200, padding: '4px 0',
            overflow: 'hidden',
          }}>
            {/* Section: Outils */}
            <div style={{ padding: '6px 14px 3px', fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: 1.2, textTransform: 'uppercase' }}>Outils</div>

            {onShowProjects && menuItem('Projets', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M1 5h11v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V5z"/><path d="M1 5l1-2h4l1 2"/></svg>, onShowProjects)}
            {onShowBrandKit && menuItem('Brand Kit', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="3" cy="10" r="1.5"/><circle cx="6.5" cy="3" r="1.5"/><circle cx="10" cy="10" r="1.5"/><path d="M3 8.5L6.5 4.5M6.5 4.5L10 8.5" strokeLinecap="round"/></svg>, onShowBrandKit)}
            {onShowBatch && menuItem('Génération batch', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="4.5" height="4.5" rx="0.5"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="0.5"/><rect x="1" y="7.5" width="4.5" height="4.5" rx="0.5"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.5"/></svg>, onShowBatch)}
            {onShowVersionCompare && menuItem('Comparer versions', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="4.5" height="9" rx="0.5"/><rect x="7.5" y="2" width="4.5" height="9" rx="0.5"/><path d="M6 6.5h1" strokeLinecap="round"/></svg>, onShowVersionCompare)}
            {onShowVariantCompare && menuItem('Comparer variantes', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2" width="4.5" height="9" rx="0.5"/><rect x="7.5" y="3" width="4.5" height="7" rx="0.5"/></svg>, onShowVariantCompare)}
            {onShowClientPortal && menuItem('Portail client', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="4.5" r="2"/><path d="M2.5 11c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round"/></svg>, onShowClientPortal)}
            {onShowStructuralEditor && menuItem('Éditeur structurel', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="1" width="4.5" height="4.5"/><rect x="7.5" y="1" width="4.5" height="4.5"/><rect x="1" y="7.5" width="4.5" height="4.5"/><path d="M7.5 10h4M9.5 7.5v5" strokeLinecap="round"/></svg>, onShowStructuralEditor)}
            {onShowShopify && menuItem('Sync Shopify', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 2.5C8.9 2 8.5 1.7 8.1 1.7c-.4 0-.7.2-.8.5l-.2.5C6.7 2.5 6.3 2.7 6 2.8L5.8 2C5.7 1.6 5.3 1.3 4.9 1.3 4.4 1.3 4 1.7 3.8 2.1L3 10l7 1.3 1.5-6.3L9 2.5z" strokeLinejoin="round"/></svg>, onShowShopify)}
            {onShowPrintSubmit && menuItem('Soumettre à l\'imprimeur', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="2" y="4" width="9" height="6" rx="1"/><path d="M4 4V3h5v1M4 8v4h5V8" strokeLinecap="round"/></svg>, onShowPrintSubmit)}

            <div style={{ height: 1, background: '#f0ede9', margin: '4px 0' }} />

            {/* Section: Affichage */}
            <div style={{ padding: '6px 14px 3px', fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: 1.2, textTransform: 'uppercase' }}>Affichage</div>

            {onToggleProofing && menuItem(proofingMode ? 'Quitter relecture' : 'Mode relecture', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M6.5 4.5v2l1.5 1.5" strokeLinecap="round"/></svg>, onToggleProofing ?? (() => {}), proofingMode)}
            {onToggleTheme && menuItem(theme === 'dark' ? 'Mode clair' : 'Mode sombre', theme === 'dark'
              ? <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="6.5" cy="6.5" r="3"/><path d="M6.5 1v1M6.5 11v1M1 6.5h1M11 6.5h1" strokeLinecap="round"/></svg>
              : <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M10 7A4 4 0 1 1 5.5 2.5 3.5 3.5 0 0 0 10 7z"/></svg>,
              onToggleTheme ?? (() => {}))}

            {/* Locale selector */}
            {onLocaleChange && (
              <div style={{ padding: '4px 14px 6px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => { onLocaleChange(l.code); setMoreOpen(false) }}
                    style={{
                      fontSize: 10, padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${locale === l.code ? '#3b82f6' : '#e0e0e0'}`,
                      borderRadius: 4, background: locale === l.code ? '#eff6ff' : '#fff',
                      color: locale === l.code ? '#3b82f6' : '#555', fontWeight: locale === l.code ? 700 : 400,
                    }}
                  >{l.flag} {l.code.toUpperCase()}</button>
                ))}
              </div>
            )}

            <div style={{ height: 1, background: '#f0ede9', margin: '4px 0' }} />

            {onShowShortcuts && menuItem('Raccourcis clavier', <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="1" y="2.5" width="11" height="8" rx="1"/><path d="M3.5 5.5h1M5.5 5.5h1M7.5 5.5h1M9.5 5.5h1M3.5 8h6" strokeLinecap="round"/></svg>, onShowShortcuts)}

            <div style={{ padding: '4px 14px 6px' }}>
              <Link href="/changelog" prefetch style={{ fontSize: 11, color: '#aaa', textDecoration: 'none' }}>
                Changelog
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
