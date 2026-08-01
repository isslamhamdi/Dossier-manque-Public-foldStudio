'use client'

import { useState } from 'react'
import type { LayerVisibility } from '@/lib/types'
import { ResetIcon, SnapIcon } from './icons'
import { ExportMenu } from './ExportMenu'

interface DielineToolbarProps {
  mode: 'fold' | 'unfold'
  layers: LayerVisibility
  onLayerToggle?: (key: keyof LayerVisibility) => void
  onReset: () => void
  showExportMenu: boolean
  setShowExportMenu: (v: boolean | ((prev: boolean) => boolean)) => void
  handleDownloadPNG: () => void
  handleDownloadSVG: () => void
  handleDownloadPDF: () => void
  handleDownloadFold: () => void
  handleDownloadDxf?: () => void
  handleDownloadPrintPdf?: () => void
  snapEnabled?: boolean
  onSnapToggle?: () => void
  showBleedOverlay?: boolean
  onBleedOverlayToggle?: () => void
  showSafeZone?: boolean
  onSafeZoneToggle?: () => void
  dieineLocked?: boolean
  onDielineLockToggle?: () => void
  annotationMode?: boolean
  onAnnotationToggle?: () => void
  onAnnotationUndo?: () => void
  onAnnotationClear?: () => void
  penColor?: string
  onPenColorChange?: (c: string) => void
}

export function DielineToolbar({
  mode, layers, onLayerToggle, onReset,
  showExportMenu, setShowExportMenu,
  handleDownloadPNG, handleDownloadSVG, handleDownloadPDF, handleDownloadFold, handleDownloadDxf, handleDownloadPrintPdf,
  snapEnabled, onSnapToggle,
  showBleedOverlay, onBleedOverlayToggle,
  showSafeZone, onSafeZoneToggle,
  dieineLocked, onDielineLockToggle,
  annotationMode, onAnnotationToggle, onAnnotationUndo, onAnnotationClear,
  penColor = '#e91e8c', onPenColorChange,
}: DielineToolbarProps) {
  const [showPenMenu, setShowPenMenu] = useState(false)
  return (
    <div style={{
      height: 38, background: '#f0ede9', borderBottom: '1px solid #e4e0dc',
      display: 'flex', alignItems: 'center', padding: '0 10px', gap: 2,
      flexShrink: 0, userSelect: 'none',
    }}>
      {mode === 'unfold' ? (
        <span style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.4, textTransform: 'uppercase', marginRight: 8, whiteSpace: 'nowrap' }}>
          PATRON 2D DÉPLIÉ
        </span>
      ) : (
        <span style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.4, textTransform: 'uppercase', marginRight: 8, whiteSpace: 'nowrap' }}>
          PATRON 2D
        </span>
      )}

      {mode === 'fold' && onLayerToggle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
          {([
            { key: 'decoupe' as const, label: 'Découpe', color: '#e91e8c' },
            { key: 'pli' as const, label: 'Pli', color: '#4488ff' },
            { key: 'collage' as const, label: 'Collage', color: '#aaaaaa' },
            { key: 'fondPerdu' as const, label: 'Fond perdu', color: '#ff8800' },
          ]).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => onLayerToggle(key)}
              title={`Toggle ${label} layer`}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px 5px', borderRadius: 3,
                opacity: layers[key] ? 1 : 0.4, transition: 'opacity 0.1s',
              }}
            >
              <span style={{ width: 8, height: 8, background: color, borderRadius: 1, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {mode === 'unfold' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 4 }}>
          {([
            { label: 'Découpe', color: '#e91e8c' },
            { label: 'Pli', color: '#4488ff' },
            { label: 'Collage', color: '#aaaaaa' },
          ] as { label: string; color: string }[]).map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#555' }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: 1, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {mode === 'unfold' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
          {[{ label: 'Cut', color: '#e91e8c' }, { label: 'Fold', color: '#4488ff' }, { label: 'Bleed', color: '#ff8800' }].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#666' }}>
              <span style={{ width: 8, height: 8, background: color, borderRadius: 1, display: 'inline-block', flexShrink: 0 }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Bleed overlay toggle */}
      {mode === 'fold' && onBleedOverlayToggle && (
        <button onClick={onBleedOverlayToggle} title="Afficher zone fond perdu"
          style={{ display:'flex', alignItems:'center', gap:3, background: showBleedOverlay ? 'rgba(229,57,53,0.12)' : 'none', border:`1px solid ${showBleedOverlay ? 'rgba(229,57,53,0.4)' : 'transparent'}`, color: showBleedOverlay ? '#e53935' : '#888', cursor:'pointer', padding:'3px 7px', borderRadius:4, transition:'all 0.15s' }}>
          <svg width="11" height="11" viewBox="0 0 11 11"><rect x="1" y="1" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/></svg>
          <span style={{fontSize:10, fontWeight:500}}>Fond perdu</span>
        </button>
      )}

      {/* Safe zone toggle */}
      {mode === 'fold' && onSafeZoneToggle && (
        <button onClick={onSafeZoneToggle} title="Afficher zone de sécurité (3mm)"
          style={{ display:'flex', alignItems:'center', gap:3, background: showSafeZone ? 'rgba(33,150,243,0.12)' : 'none', border:`1px solid ${showSafeZone ? 'rgba(33,150,243,0.4)' : 'transparent'}`, color: showSafeZone ? '#2196f3' : '#888', cursor:'pointer', padding:'3px 7px', borderRadius:4, transition:'all 0.15s' }}>
          <svg width="11" height="11" viewBox="0 0 11 11"><rect x="2" y="2" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/></svg>
          <span style={{fontSize:10, fontWeight:500}}>Zone sécu</span>
        </button>
      )}

      {/* Dieline lock */}
      {mode === 'fold' && onDielineLockToggle && (
        <button onClick={onDielineLockToggle}
          title={dieineLocked ? 'Déverrouiller la structure' : 'Verrouiller la structure (empêche les modifications)'}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: dieineLocked ? 'rgba(239,68,68,0.1)' : 'none',
            border: `1px solid ${dieineLocked ? 'rgba(239,68,68,0.4)' : 'transparent'}`,
            color: dieineLocked ? '#ef4444' : '#888',
            cursor: 'pointer', padding: '3px 7px', borderRadius: 4, transition: 'all 0.15s',
          }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.3">
            {dieineLocked
              ? <><rect x="2" y="5" width="7" height="5" rx="1"/><path d="M3.5 5V3.5a2 2 0 0 1 4 0V5"/></>
              : <><rect x="2" y="5" width="7" height="5" rx="1"/><path d="M3.5 5V3a2.5 2.5 0 0 1 5 0" strokeDasharray="1 1"/></>
            }
          </svg>
          <span style={{ fontSize: 10, fontWeight: 500 }}>{dieineLocked ? 'Struct.' : 'Struct.'}</span>
        </button>
      )}

      {/* Snap toggle */}
      {mode === 'fold' && onSnapToggle && (
        <button
          onClick={onSnapToggle}
          title={snapEnabled ? 'Désactiver accrochage à la grille (1mm)' : 'Activer accrochage à la grille (1mm)'}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            background: snapEnabled ? 'rgba(233,30,140,0.1)' : 'none',
            border: `1px solid ${snapEnabled ? 'rgba(233,30,140,0.3)' : 'transparent'}`,
            color: snapEnabled ? '#e91e8c' : '#888',
            cursor: 'pointer', padding: '3px 7px', borderRadius: 4,
            transition: 'all 0.15s',
          }}
        >
          <SnapIcon />
          <span style={{ fontSize: 10, fontWeight: 500 }}>Snap</span>
        </button>
      )}

      {/* Annotation tools */}
      {onAnnotationToggle && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
          <button onClick={onAnnotationToggle} title={annotationMode ? 'Quitter le mode annotation' : 'Mode annotation (crayon libre)'}
            style={{ background: annotationMode ? 'rgba(233,30,140,0.1)' : 'none', border: `1px solid ${annotationMode ? 'rgba(233,30,140,0.4)' : 'transparent'}`, color: annotationMode ? '#e91e8c' : '#888', cursor: 'pointer', padding: '3px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 1.5l2 2L4 11l-2.5.5.5-2.5z"/>
            </svg>
          </button>
          {annotationMode && (
            <>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: penColor, border: '2px solid #fff', boxShadow: '0 0 0 1.5px #ccc', cursor: 'pointer' }}
                onClick={() => setShowPenMenu(v => !v)} title="Couleur du crayon" />
              {showPenMenu && (
                <div style={{ position: 'absolute', top: '110%', left: 0, background: '#fff', border: '1px solid #e8e8e8', borderRadius: 6, padding: 8, display: 'flex', gap: 5, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  onMouseLeave={() => setShowPenMenu(false)}>
                  {['#e91e8c', '#5A6BD4', '#e53935', '#ff9800', '#4caf50', '#000'].map(col => (
                    <div key={col} onClick={() => { onPenColorChange?.(col); setShowPenMenu(false) }}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: col, cursor: 'pointer', border: col === penColor ? '2px solid #333' : '2px solid transparent' }} />
                  ))}
                </div>
              )}
              <button onClick={onAnnotationUndo} title="Annuler dernier trait"
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '3px 5px', fontSize: 10 }}>↩</button>
              <button onClick={onAnnotationClear} title="Effacer toutes les annotations"
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '3px 5px', fontSize: 10 }}>⌫</button>
            </>
          )}
        </div>
      )}

      <button onClick={onReset} title="Reset view"
        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
        <ResetIcon />
      </button>

      <ExportMenu
        showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu}
        handleDownloadPNG={handleDownloadPNG} handleDownloadSVG={handleDownloadSVG}
        handleDownloadPDF={handleDownloadPDF} handleDownloadFold={handleDownloadFold}
        handleDownloadDxf={handleDownloadDxf}
        handleDownloadPrintPdf={handleDownloadPrintPdf}
      />
    </div>
  )
}
