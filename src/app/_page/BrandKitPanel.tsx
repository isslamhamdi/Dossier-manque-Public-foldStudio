'use client'

import { useRef } from 'react'
import type { useBrandKit } from './useBrandKit'

type BrandKitHook = ReturnType<typeof useBrandKit>

const FONT_OPTIONS = [
  'system-ui, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  '"Helvetica Neue", Arial, sans-serif',
  '"Times New Roman", serif',
  'Verdana, Geneva, sans-serif',
]

export function BrandKitPanel({
  brandKit, onApplyColor, onClose,
}: {
  brandKit: BrandKitHook
  onApplyColor: (hex: string) => void
  onClose: () => void
}) {
  const { kit, setKit, addPrimaryColor, addSecondaryColor, removeColor } = brandKit
  const logoInputRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setKit({ logoSrc: ev.target?.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9997, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 420, maxWidth: '96vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Brand Kit</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>
        </div>

        {/* Brand name */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Nom de la marque</div>
          <input value={kit.name} onChange={e => setKit({ name: e.target.value })}
            style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 5, padding: '6px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Logo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {kit.logoSrc ? (
              <img src={kit.logoSrc} alt="logo" style={{ height: 40, maxWidth: 80, objectFit: 'contain', border: '1px solid #e0e0e0', borderRadius: 4, padding: 4 }} />
            ) : (
              <div style={{ width: 80, height: 40, border: '1.5px dashed #d0d0d0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#bbb' }}>PNG/SVG</div>
            )}
            <button onClick={() => logoInputRef.current?.click()}
              style={{ fontSize: 10, padding: '5px 10px', border: '1px solid #e0e0e0', borderRadius: 4, cursor: 'pointer', background: '#fafafa' }}>
              {kit.logoSrc ? 'Changer' : 'Importer'}
            </button>
            {kit.logoSrc && <button onClick={() => setKit({ logoSrc: null })} style={{ fontSize: 10, color: '#e53935', background: 'none', border: 'none', cursor: 'pointer' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>}
            <input ref={logoInputRef} type="file" accept="image/*,.svg" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </div>
        </div>

        {/* Primary colors */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Couleurs principales</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {kit.primaryColors.map(col => (
              <button key={col} title={`Appliquer ${col}`} onClick={() => onApplyColor(col)}
                style={{ width: 28, height: 28, borderRadius: 4, background: col, border: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer', position: 'relative' }}
                onContextMenu={e => { e.preventDefault(); removeColor(col, 'primary') }}>
              </button>
            ))}
            <input type="color" onChange={e => addPrimaryColor(e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 4, border: '1.5px dashed #d0d0d0', cursor: 'pointer', padding: 2 }} title="Ajouter couleur principale" />
          </div>
          <div style={{ fontSize: 8, color: '#bbb', marginTop: 3 }}>Clic = appliquer · Clic droit = supprimer</div>
        </div>

        {/* Secondary colors */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Couleurs secondaires</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {kit.secondaryColors.map(col => (
              <button key={col} title={`Appliquer ${col}`} onClick={() => onApplyColor(col)}
                style={{ width: 28, height: 28, borderRadius: 4, background: col, border: '1.5px solid rgba(0,0,0,0.12)', cursor: 'pointer' }}
                onContextMenu={e => { e.preventDefault(); removeColor(col, 'secondary') }} />
            ))}
            <input type="color" onChange={e => addSecondaryColor(e.target.value)}
              style={{ width: 28, height: 28, borderRadius: 4, border: '1.5px dashed #d0d0d0', cursor: 'pointer', padding: 2 }} title="Ajouter couleur secondaire" />
          </div>
        </div>

        {/* Font */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>Police de caractères</div>
          <select value={kit.fontFamily} onChange={e => setKit({ fontFamily: e.target.value })}
            style={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 5, padding: '5px 8px', fontSize: 12, fontFamily: kit.fontFamily, outline: 'none' }}>
            {FONT_OPTIONS.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f.split(',')[0].replace(/"/g, '')}</option>
            ))}
          </select>
          <div style={{ marginTop: 6, padding: '8px 10px', background: '#f9f9f9', borderRadius: 4, fontFamily: kit.fontFamily, fontSize: 14, color: '#333' }}>
            {kit.name} — Packaging Design
          </div>
        </div>

        <button onClick={onClose}
          style={{ width: '100%', padding: '10px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Fermer
        </button>
      </div>
    </div>
  )
}
