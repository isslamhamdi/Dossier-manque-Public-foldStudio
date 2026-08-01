'use client'

// #156-163 Typographie 3D — panneau de contrôle troika-three-text

import { useRef } from 'react'
import type { Text3DConfig } from '@/components/three-scene/Text3DLayer'
import { TEXT3D_DEFAULTS } from '@/lib/threeDefaults'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

const FONT_PRESETS = [
  { id: 'system', label: 'Système' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
  { id: 'rounded', label: 'Arrondi' },
]

interface Text3DSectionProps {
  config: Text3DConfig
  onChange: (c: Text3DConfig) => void
  enabled: boolean
  onToggle: () => void
}

export function Text3DSection({ config, onChange, enabled, onToggle }: Text3DSectionProps) {
  const set = <K extends keyof Text3DConfig>(key: K, val: Text3DConfig[K]) =>
    onChange({ ...config, [key]: val })
  const fontUploadRef = useRef<HTMLInputElement>(null)

  return (
    <CollapsibleSection label="Texte 3D sur boîte">
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={enabled} onChange={onToggle} style={{ accentColor: '#5A6BD4' }} />
        <span style={{ fontSize: fs.sm, fontWeight: 600, color: enabled ? '#5A6BD4' : c.textMed }}>
          {enabled ? 'Texte 3D activé' : 'Activer texte 3D'}
        </span>
      </label>

      {enabled && (
        <>
          {/* Text content */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Contenu</div>
            <textarea
              value={config.text}
              onChange={e => set('text', e.target.value)}
              rows={2}
              style={{ width: '100%', fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '5px 7px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {/* Mode */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {(['flat', 'extruded', 'path'] as const).map(mode => (
              <button key={mode} onClick={() => set('mode', mode)}
                style={{
                  flex: 1, fontSize: 9, padding: '4px 0', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${config.mode === mode ? '#5A6BD4' : c.borderLight}`,
                  background: config.mode === mode ? 'rgba(90,107,212,0.1)' : c.white,
                  color: config.mode === mode ? '#5A6BD4' : c.textMed,
                  fontWeight: config.mode === mode ? 700 : 400,
                }}>
                {mode === 'flat' ? 'Plat' : mode === 'extruded' ? '3D Relief' : 'Chemin'}
              </button>
            ))}
          </div>

          {/* Face */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Face</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {(['front', 'back', 'top', 'left', 'right'] as const).map(face => (
                <button key={face} onClick={() => set('face', face)}
                  style={{
                    fontSize: 9, padding: '3px 7px', borderRadius: 7, cursor: 'pointer',
                    border: `1px solid ${config.face === face ? '#5A6BD4' : c.borderLight}`,
                    background: config.face === face ? 'rgba(90,107,212,0.1)' : c.white,
                    color: config.face === face ? '#5A6BD4' : c.textMed,
                    fontWeight: config.face === face ? 700 : 400,
                  }}>
                  {face === 'front' ? 'Avant' : face === 'back' ? 'Arrière' : face === 'top' ? 'Haut' : face === 'left' ? 'Gauche' : 'Droite'}
                </button>
              ))}
            </div>
          </div>

          {/* Size & color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Taille</span>
              <input type="number" value={config.fontSize} min={0.05} max={0.5} step={0.01}
                onChange={e => set('fontSize', Number(e.target.value))}
                style={{ fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', fontFamily: 'inherit' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Espacement</span>
              <input type="number" value={config.letterSpacing} min={-0.1} max={0.3} step={0.01}
                onChange={e => set('letterSpacing', Number(e.target.value))}
                style={{ fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', fontFamily: 'inherit' }} />
            </label>
          </div>

          {/* Colors */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Texte</span>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: config.color, border: `1px solid ${c.borderLight}`, cursor: 'pointer' }} />
                <input type="color" value={config.color} onChange={e => set('color', e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Stroke</span>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: config.strokeColor, border: `1px solid ${c.borderLight}`, cursor: 'pointer' }} />
                <input type="color" value={config.strokeColor} onChange={e => set('strokeColor', e.target.value)}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Épaisseur stroke</span>
              <input type="number" value={config.strokeWidth} min={0} max={10} step={0.5}
                onChange={e => set('strokeWidth', Number(e.target.value))}
                style={{ fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', fontFamily: 'inherit', width: 50 }} />
            </label>
          </div>

          {/* #160 Police / variable font */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Police #160</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
              {FONT_PRESETS.map(f => (
                <button key={f.id} onClick={() => set('fontFamily' as keyof Text3DConfig, f.id as any)}
                  style={{
                    fontSize: 9, padding: '3px 7px', borderRadius: 7, cursor: 'pointer',
                    border: `1px solid ${(config as any).fontFamily === f.id ? '#5A6BD4' : c.borderLight}`,
                    background: (config as any).fontFamily === f.id ? 'rgba(90,107,212,0.1)' : c.white,
                    color: (config as any).fontFamily === f.id ? '#5A6BD4' : c.textMed,
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
            {/* #161 Upload police custom */}
            <button onClick={() => fontUploadRef.current?.click()}
              style={{ fontSize: 9, padding: '3px 8px', borderRadius: 7, cursor: 'pointer', border: `1px solid ${c.borderLight}`, background: c.white, color: c.textGhost }}>
              ↑ Police personnalisée (.ttf/.otf) #161
            </button>
            <input ref={fontUploadRef} type="file" accept=".ttf,.otf,.woff,.woff2" style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const url = URL.createObjectURL(file)
                set('fontFamily' as keyof Text3DConfig, `custom:${url}` as any)
                e.target.value = ''
              }} />
            {(config as any).fontFamily?.startsWith('custom:') && (
              <div style={{ fontSize: 8, color: '#5A6BD4', marginTop: 3 }}>✓ Police personnalisée chargée</div>
            )}
          </div>

          {/* RTL #158 */}
          <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.rtl} onChange={e => set('rtl', e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
            <span style={{ fontSize: fs.sm, color: c.textMed }}>RTL (arabe / hébreu) #158</span>
          </label>

          {/* #163 Outline only */}
          <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={config.outlineOnly} onChange={e => set('outlineOnly', e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
            <span style={{ fontSize: fs.sm, color: c.textMed }}>Contour seulement #163</span>
          </label>

          {config.mode === 'path' && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: c.textGhost, marginBottom: 4 }}>Rayon du chemin #162</div>
              <input type="range" min={0.3} max={2} step={0.05} value={config.pathRadius}
                onChange={e => set('pathRadius', Number(e.target.value))}
                style={{ width: '100%', accentColor: '#5A6BD4' }} />
            </div>
          )}

          <button onClick={() => onChange(TEXT3D_DEFAULTS)}
            style={{ width: '100%', fontSize: 9, padding: '4px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textGhost }}>
            Réinitialiser
          </button>
        </>
      )}
    </CollapsibleSection>
  )
}
