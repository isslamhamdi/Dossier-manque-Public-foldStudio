'use client'

import { useState } from 'react'
import type { VideoExportOptions } from './useVideoExport'

interface ThreeToolbarProps {
  showGrid: boolean
  setShowGrid: (v: boolean | ((p: boolean) => boolean)) => void
  wireframe: boolean
  setWireframe: (v: boolean | ((p: boolean) => boolean)) => void
  onExportAllAngles?: () => void
  isExportingAngles?: boolean
  showMaterialsPanel: boolean
  setShowMaterialsPanel: (v: boolean | ((p: boolean) => boolean)) => void
  showMatControls?: boolean
  setShowMatControls?: (v: boolean | ((p: boolean) => boolean)) => void
  autoRotate: boolean
  setAutoRotate: (v: boolean | ((p: boolean) => boolean)) => void
  onExportVideo?: (opts: VideoExportOptions) => void
  isExporting?: boolean
  showReflection?: boolean
  setShowReflection?: (v: boolean | ((p: boolean) => boolean)) => void
  showDOF?: boolean
  setShowDOF?: (v: boolean | ((p: boolean) => boolean)) => void
  shelfLayout?: 'none' | 'shelf' | 'stack' | 'scattered'
  setShelfLayout?: (v: 'none' | 'shelf' | 'stack' | 'scattered') => void
  shelfCount?: number
  setShelfCount?: (v: number) => void
  showProductInside?: boolean
  setShowProductInside?: (v: boolean | ((p: boolean) => boolean)) => void
}

export function ThreeToolbar({
  showGrid, setShowGrid, wireframe, setWireframe,
  showMaterialsPanel, setShowMaterialsPanel,
  showMatControls, setShowMatControls,
  autoRotate, setAutoRotate,
  onExportVideo, isExporting,
  onExportAllAngles, isExportingAngles,
  showReflection, setShowReflection,
  showDOF, setShowDOF,
  shelfLayout = 'none', setShelfLayout,
  shelfCount = 3, setShelfCount,
  showProductInside = false, setShowProductInside,
}: ThreeToolbarProps) {
  const [showMore, setShowMore] = useState(false)

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: 32, height: 32, borderRadius: '50%',
    background: active ? '#5A6BD4' : 'rgba(190,185,178,0.82)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    border: 'none',
    color: active ? '#fff' : '#3a3830',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s, transform 0.1s',
    boxShadow: active ? '0 2px 10px rgba(90,107,212,0.4)' : '0 1px 4px rgba(0,0,0,0.14)',
    flexShrink: 0,
  })

  const menuRow = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
    padding: '6px 10px', border: 'none', borderRadius: 7, cursor: 'pointer',
    background: active ? 'rgba(90,107,212,0.1)' : 'transparent',
    color: active ? '#5A6BD4' : '#333',
    fontFamily: 'inherit', fontSize: 11, fontWeight: active ? 700 : 400, textAlign: 'left',
  })

  const menuLabel = (text: string) => (
    <div style={{ fontSize: 8, fontWeight: 700, color: '#bbb', letterSpacing: 1.2, textTransform: 'uppercase', padding: '6px 10px 3px' }}>
      {text}
    </div>
  )

  const menuDivider = () => (
    <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
  )

  const CoreBtn = ({ title, label, active, onClick, icon }: {
    title: string; label: string; active: boolean; onClick: () => void; icon: React.ReactNode
  }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <button title={title} onClick={onClick} style={btnStyle(active)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >{icon}</button>
      <span style={{ fontSize: 7, color: active ? '#5A6BD4' : '#777', letterSpacing: 0.2, userSelect: 'none', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )

  const spinnerSvg = (
    <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <path d="M9 2a7 7 0 1 1 0 14A7 7 0 0 1 9 2z" strokeOpacity="0.3"/>
      <path d="M9 2a7 7 0 0 1 7 7" strokeLinecap="round"/>
    </svg>
  )

  const shelfLayouts = [
    { label: 'Unitaire', value: 'none' as const, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="2" y="2" width="10" height="10" rx="1.5"/></svg> },
    { label: 'Rayon', value: 'shelf' as const, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="1" y="3" width="3.5" height="8" rx="0.8"/><rect x="5.25" y="3" width="3.5" height="8" rx="0.8"/><rect x="9.5" y="3" width="3.5" height="8" rx="0.8"/></svg> },
    { label: 'Colonne', value: 'stack' as const, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="2" y="1.5" width="10" height="3" rx="0.8"/><rect x="2" y="5.5" width="10" height="3" rx="0.8"/><rect x="2" y="9.5" width="10" height="3" rx="0.8"/></svg> },
    { label: 'Dispersé', value: 'scattered' as const, icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"><rect x="1" y="1" width="5" height="5" rx="0.8"/><rect x="8" y="2" width="4" height="4" rx="0.8"/><rect x="2" y="8.5" width="4" height="4" rx="0.8"/><rect x="8" y="8" width="5" height="5" rx="0.8"/></svg> },
  ]

  return (
    <div data-toolbar="" style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', gap: 6, zIndex: 10, alignItems: 'flex-end' }}>

      {/* 1. Grille */}
      <CoreBtn title="Grille" label="Grille" active={showGrid} onClick={() => setShowGrid(v => !v)}
        icon={<svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 6.5h16M1 11.5h16M6.5 1v16M11.5 1v16" strokeLinecap="round"/></svg>}
      />

      {/* 2. Matériaux */}
      <CoreBtn title="Matériaux" label="Mat." active={showMaterialsPanel} onClick={() => setShowMaterialsPanel(v => !v)}
        icon={<svg width="14" height="14" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 2a7 7 0 0 1 0 14z" fill="currentColor" opacity="0.5"/></svg>}
      />

      {/* 3. Recentrer */}
      <CoreBtn title="Recentrer" label="Centre" active={false}
        onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:reset-camera'))}
        icon={<svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6V2h4M12 2h4v4M2 12v4h4M12 16h4v-4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="9" r="2.5" strokeWidth="1.4"/></svg>}
      />

      {/* 4. Rotation */}
      <CoreBtn title="Rotation automatique" label="Rotat." active={autoRotate} onClick={() => setAutoRotate(v => !v)}
        icon={<svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M15 9A6 6 0 1 1 9 3" strokeLinecap="round"/><path d="M9 1l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      />

      {/* 5. ··· overflow */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <button
          title="Plus d'options"
          onClick={() => setShowMore(v => !v)}
          style={{ ...btnStyle(showMore), fontSize: 13, letterSpacing: 1, fontWeight: 700 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
        >···</button>
        <span style={{ fontSize: 7, color: '#777', letterSpacing: 0.2, userSelect: 'none' }}>Plus</span>

        {showMore && (
          <div
            style={{
              position: 'absolute', bottom: 'calc(100% + 10px)', right: 0,
              background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12,
              boxShadow: '0 8px 28px rgba(0,0,0,0.16)', padding: '6px 0', zIndex: 20,
              width: 210,
            }}
            onMouseLeave={() => setShowMore(false)}
          >
            {/* VUE */}
            {menuLabel('Vue')}
            <button style={menuRow(wireframe)} onClick={() => setWireframe(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="9" height="9" rx="0.5"/><path d="M2 5L5 2H14V11L11 14" strokeLinejoin="round"/><path d="M11 5V14M2 5H11" strokeDasharray="2 1.5"/></svg>
              Wireframe
            </button>
            {setShowReflection && (
              <button style={menuRow(!!showReflection)} onClick={() => setShowReflection(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="14" height="7" rx="1"/><path d="M9 9v7M5 13l4 3 4-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Réflexion sol
              </button>
            )}
            {setShowDOF && (
              <button style={menuRow(!!showDOF)} onClick={() => setShowDOF(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="3"/><circle cx="9" cy="9" r="6.5" strokeOpacity="0.35"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/></svg>
                Profondeur de champ
              </button>
            )}

            {menuDivider()}

            {/* MATÉRIAUX */}
            {menuLabel('Matériaux')}
            {setShowMatControls && (
              <button style={menuRow(!!showMatControls)} onClick={() => setShowMatControls(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 5h12M3 9h8M3 13h10" strokeLinecap="round"/><circle cx="13" cy="5" r="1.8" fill="currentColor" stroke="none"/><circle cx="9" cy="9" r="1.8" fill="currentColor" stroke="none"/><circle cx="11" cy="13" r="1.8" fill="currentColor" stroke="none"/></svg>
                Contrôles matériau
              </button>
            )}
            {setShowProductInside && (
              <button style={menuRow(showProductInside)} onClick={() => setShowProductInside(v => !v)}>
                <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="6" width="12" height="9" rx="1"/><path d="M6 6V4a3 3 0 0 1 6 0v2" strokeLinecap="round"/><rect x="6" y="9" width="6" height="4" rx="0.5" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1"/></svg>
                Produit intérieur
              </button>
            )}

            {menuDivider()}

            {/* ÉTALAGE */}
            {setShelfLayout && (
              <>
                {menuLabel('Étalage')}
                <div style={{ display: 'flex', gap: 4, padding: '4px 10px 6px' }}>
                  {shelfLayouts.map(({ label, value, icon }) => (
                    <button key={value} onClick={() => setShelfLayout(value)} title={label}
                      style={{
                        flex: 1, padding: '5px 0', border: `1px solid ${shelfLayout === value ? '#5A6BD4' : '#e0e0e0'}`,
                        borderRadius: 7, background: shelfLayout === value ? 'rgba(90,107,212,0.1)' : '#fafafa',
                        cursor: 'pointer', color: shelfLayout === value ? '#5A6BD4' : '#666',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                      {icon}
                    </button>
                  ))}
                </div>
                {shelfLayout !== 'none' && setShelfCount && (
                  <div style={{ padding: '0 10px 6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: '#888' }}>Nb. éléments</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#555' }}>{shelfCount}</span>
                    </div>
                    <input type="range" min={2} max={8} value={shelfCount}
                      onChange={e => setShelfCount(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#5A6BD4', height: 3 }} />
                  </div>
                )}
                {menuDivider()}
              </>
            )}

            {/* EXPORT */}
            {menuLabel('Export')}
            <button style={menuRow(false)} onClick={() => {
              const cv = document.querySelector('canvas') as HTMLCanvasElement | null
              if (!cv) return
              const a = document.createElement('a')
              a.href = cv.toDataURL('image/png')
              a.download = `fold-studio-3d-${Date.now()}.png`
              a.click()
              setShowMore(false)
            }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="14" height="11" rx="1.5"/><circle cx="9" cy="10" r="2.8"/><path d="M7 4l1-2h4l1 2" strokeLinejoin="round"/></svg>
              Capture PNG
            </button>
            <button style={menuRow(false)} onClick={() => { window.dispatchEvent(new CustomEvent('fold-studio:export-glb')); setShowMore(false) }}>
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2L4 5.2V11.8L9 15l5-3.2V5.2L9 2z" strokeLinejoin="round"/><path d="M9 2v13M4 5.2l5 3.2 5-3.2" strokeLinecap="round"/></svg>
              Exporter GLB
            </button>

            {/* Vidéo sub-options inline */}
            {onExportVideo && (
              <>
                <div style={{ padding: '4px 10px 2px', fontSize: 9, color: '#aaa', fontWeight: 600 }}>Vidéo animation</div>
                {([
                  { label: 'Aller-retour', dir: 'open-close' as const },
                  { label: 'Ouverture', dir: 'open' as const },
                  { label: 'Fermeture', dir: 'close' as const },
                ]).map(({ label, dir }) => (
                  <button key={dir} style={{ ...menuRow(false), paddingLeft: 22, fontSize: 10, color: '#555' }}
                    onClick={() => { onExportVideo({ direction: dir, durationMs: 2000 }); setShowMore(false) }}>
                    <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="12" height="10" rx="1.5"/><path d="M13 7.5l4-2.5v8l-4-2.5" strokeLinejoin="round"/></svg>
                    {isExporting ? spinnerSvg : label}
                  </button>
                ))}
              </>
            )}

            {onExportAllAngles && (
              <button style={menuRow(false)} onClick={() => { if (!isExportingAngles) onExportAllAngles(); setShowMore(false) }}>
                {isExportingAngles ? spinnerSvg : (
                  <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="7" height="7" rx="1"/><rect x="10" y="1" width="7" height="7" rx="1"/><rect x="1" y="10" width="7" height="7" rx="1"/><rect x="10" y="10" width="7" height="7" rx="1"/></svg>
                )}
                6 angles (planche PNG)
              </button>
            )}

            <div style={{ height: 4 }} />
          </div>
        )}
      </div>
    </div>
  )
}
