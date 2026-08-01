'use client'

// #136-145 Éclairage avancé — panneau de contrôle

import { useState } from 'react'
import type { LightingConfig } from '@/components/three-scene/AdvancedLighting'
import { LIGHTING_DEFAULTS } from '@/lib/threeDefaults'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface LightingSectionProps {
  config: LightingConfig
  onChange: (c: LightingConfig) => void
}

const PRESETS: { id: LightingConfig['preset']; label: string; desc: string }[] = [
  { id: 'studio',      label: 'Studio',      desc: 'RectAreaLight soft-box #136' },
  { id: 'three-point', label: '3 Points',    desc: 'Key + Fill + Rim #139' },
  { id: 'natural',     label: 'Naturelle',   desc: 'HemiLight + Sun' },
  { id: 'neon',        label: 'Néon',        desc: 'Émissif coloré #144' },
  { id: 'dramatic',    label: 'Dramatique',  desc: 'SpotLight seul #145' },
]

function Slider({ label, value, min, max, step, unit, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: c.textMuted }}>{label}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: c.textMed }}>{value.toFixed(step < 0.01 ? 3 : 2)}{unit ?? ''}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#5A6BD4', height: 4 }} />
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 9, color: c.textMuted, flex: 1 }}>{label}</span>
      <label style={{ cursor: 'pointer' }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: value, border: `1px solid ${c.borderLight}` }} />
        <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ display: 'none' }} />
      </label>
    </div>
  )
}

export function LightingSection({ config, onChange }: LightingSectionProps) {
  const set = <K extends keyof LightingConfig>(key: K, val: LightingConfig[K]) =>
    onChange({ ...config, [key]: val })

  return (
    <CollapsibleSection label="Éclairage avancé">
      {/* Preset chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {PRESETS.map(p => (
          <button key={p.id} onClick={() => set('preset', p.id)}
            title={p.desc}
            style={{
              fontSize: 9, padding: '3px 8px', borderRadius: 8, cursor: 'pointer',
              border: `1px solid ${config.preset === p.id ? '#5A6BD4' : c.borderLight}`,
              background: config.preset === p.id ? 'rgba(90,107,212,0.12)' : c.white,
              color: config.preset === p.id ? '#5A6BD4' : c.textMed,
              fontWeight: config.preset === p.id ? 700 : 400,
            }}>
            {p.label}
          </button>
        ))}
      </div>

      <Slider label="Intensité globale" value={config.intensity} min={0} max={3} step={0.05} onChange={v => set('intensity', v)} />

      {/* Colors */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Couleurs</div>
        <ColorRow label="Key light" value={config.keyColor} onChange={v => set('keyColor', v)} />
        <ColorRow label="Fill light" value={config.fillColor} onChange={v => set('fillColor', v)} />
        <ColorRow label="Rim light" value={config.rimColor} onChange={v => set('rimColor', v)} />
        {config.preset === 'dramatic' && (
          <ColorRow label="Spot color" value={config.spotColor} onChange={v => set('spotColor', v)} />
        )}
      </div>

      {/* Options */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={config.showLensflare} onChange={e => set('showLensflare', e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>Lens flare</span>
        </label>
        <label style={{ display: 'flex', gap: 7, alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={config.fogEnabled} onChange={e => set('fogEnabled', e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>Brouillard</span>
        </label>
      </div>

      {config.fogEnabled && (
        <div style={{ paddingLeft: 14, borderLeft: `2px solid rgba(90,107,212,0.2)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 9, color: c.textGhost }}>Couleur brouillard</span>
            <label style={{ cursor: 'pointer' }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: config.fogColor, border: `1px solid ${c.borderLight}` }} />
              <input type="color" value={config.fogColor} onChange={e => set('fogColor', e.target.value)} style={{ display: 'none' }} />
            </label>
          </div>
          <Slider label="Densité" value={config.fogDensity} min={0.01} max={0.5} step={0.005} onChange={v => set('fogDensity', v)} />
        </div>
      )}

      <button
        onClick={() => onChange(LIGHTING_DEFAULTS)}
        style={{ width: '100%', fontSize: 9, padding: '4px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textGhost, marginTop: 4 }}>
        Réinitialiser
      </button>
    </CollapsibleSection>
  )
}
