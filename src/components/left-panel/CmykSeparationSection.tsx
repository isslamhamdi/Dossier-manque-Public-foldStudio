'use client'

import { useState, useMemo } from 'react'
import { CollapsibleSection } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

// ICC profile simulation — each profile applies a gamut compensation matrix
const ICC_PROFILES = [
  { id: 'fogra39',   label: 'FOGRA39',       desc: 'Offset papier couché (ISO 12647-2)',    ticLimit: 330, kBoost: 0,    gamutW: 0.95 },
  { id: 'fogra47',   label: 'FOGRA47',        desc: 'Offset non couché (ISO 12647-2)',        ticLimit: 300, kBoost: 5,    gamutW: 0.88 },
  { id: 'gracol',    label: 'GRACoL 2006',    desc: 'Impression commerciale USA',             ticLimit: 340, kBoost: -3,   gamutW: 0.97 },
  { id: 'swop',      label: 'SWOP',           desc: 'Rotative publicitaire USA',              ticLimit: 300, kBoost: 2,    gamutW: 0.90 },
  { id: 'isonp4',    label: 'ISO News (NP4)', desc: 'Journal non couché',                    ticLimit: 240, kBoost: 8,    gamutW: 0.78 },
  { id: 'pso-unco',  label: 'PSO Uncoated',   desc: 'Offset non couché EU (ISO 12647-2)',    ticLimit: 300, kBoost: 4,    gamutW: 0.86 },
  { id: 'srgb',      label: 'sRGB (écran)',   desc: 'Référence écran — simulation uniquement', ticLimit: 400, kBoost: -5,  gamutW: 1.0 },
] as const

type ProfileId = typeof ICC_PROFILES[number]['id']

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function hexToCmykWithProfile(hex: string, profile: typeof ICC_PROFILES[number]): [number, number, number, number] {
  const [rRaw, gRaw, bRaw] = hexToRgb(hex).map(v => v / 255)

  // Apply gamut compression (simulate how ICC profile remaps out-of-gamut colors)
  const gw = profile.gamutW
  const rn = 0.5 + (rRaw - 0.5) * gw
  const gn = 0.5 + (gRaw - 0.5) * gw
  const bn = 0.5 + (bRaw - 0.5) * gw

  const k = Math.max(0, 1 - Math.max(rn, gn, bn))
  if (k >= 1) return [0, 0, 0, Math.min(100, 100 + profile.kBoost)]

  const denom = 1 - k
  const C = Math.round(Math.max(0, ((1 - rn - k) / denom)) * 100)
  const M = Math.round(Math.max(0, ((1 - gn - k) / denom)) * 100)
  const Y = Math.round(Math.max(0, ((1 - bn - k) / denom)) * 100)
  const K = Math.min(100, Math.round(k * 100) + profile.kBoost)
  return [C, M, Y, Math.max(0, K)]
}

function channelColor(channel: 'C' | 'M' | 'Y' | 'K', value: number): string {
  const v = 1 - value / 100
  const i = Math.round(v * 255)
  if (channel === 'C') return `rgb(${i},255,255)`
  if (channel === 'M') return `rgb(255,${i},255)`
  if (channel === 'Y') return `rgb(255,255,${i})`
  return `rgb(${i},${i},${i})`
}

const CHANNEL_META = [
  { key: 'C' as const, label: 'Cyan',    accent: '#00b4d8' },
  { key: 'M' as const, label: 'Magenta', accent: '#e91e8c' },
  { key: 'Y' as const, label: 'Jaune',   accent: '#d97706' },
  { key: 'K' as const, label: 'Noir',    accent: '#333'    },
]

interface Props {
  exteriorColor: string
  interiorColor: string
}

export function CmykSeparationSection({ exteriorColor, interiorColor }: Props) {
  const [target, setTarget] = useState<'exterior' | 'interior'>('exterior')
  const [profileId, setProfileId] = useState<ProfileId>('fogra39')

  const hex = target === 'exterior' ? exteriorColor : interiorColor
  const profile = ICC_PROFILES.find(p => p.id === profileId) ?? ICC_PROFILES[0]
  const [C, M, Y, K] = useMemo(() => hexToCmykWithProfile(hex, profile), [hex, profile])
  const values: Record<string, number> = { C, M, Y, K }
  const tic = C + M + Y + K
  const ticOver = tic > profile.ticLimit

  const exportCmykTxt = () => {
    const txt = `Fold Studio — Séparations CMJN\nProfil ICC: ${profile.label}\nCouleur: ${hex.toUpperCase()}\n\nC: ${C}%\nM: ${M}%\nY: ${Y}%\nK: ${K}%\nTIC: ${tic}% (limite ${profile.ticLimit}%)\n`
    const blob = new Blob([txt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `cmyk-${hex.replace('#', '')}-${profile.id}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <CollapsibleSection label="Séparations CMJN + ICC">
      {/* Target selector */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(['exterior', 'interior'] as const).map(t => (
          <button key={t} onClick={() => setTarget(t)} style={{
            flex: 1, padding: '4px 0', fontSize: 10, fontWeight: fw.medium,
            borderRadius: r.md, border: `1px solid ${target === t ? '#7c3aed' : c.borderLight}`,
            background: target === t ? '#fdf4ff' : c.white,
            color: target === t ? '#7c3aed' : '#888', cursor: 'pointer',
          }}>
            {t === 'exterior' ? 'Extérieur' : 'Intérieur'}
          </button>
        ))}
      </div>

      {/* ICC Profile selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 8, color: c.textGhost, marginBottom: 4, fontWeight: fw.bold, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          Profil ICC
        </div>
        <select
          value={profileId}
          onChange={e => setProfileId(e.target.value as ProfileId)}
          style={{ width: '100%', fontSize: 10, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', fontFamily: 'inherit', background: c.white, color: c.ink }}
        >
          {ICC_PROFILES.map(p => (
            <option key={p.id} value={p.id}>{p.label} — {p.desc}</option>
          ))}
        </select>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
          <span style={{ fontSize: 8, color: c.textGhost }}>{profile.desc}</span>
          <span style={{ fontSize: 8, fontWeight: fw.bold, color: ticOver ? '#b45309' : '#059669' }}>
            TIC max: {profile.ticLimit}%
          </span>
        </div>
      </div>

      {/* Source color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: r.md, background: hex, border: `1px solid ${c.borderLight}`, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: '#333' }}>{hex.toUpperCase()}</div>
          <div style={{ fontSize: 9, color: ticOver ? '#b45309' : '#666' }}>
            TIC: {tic}%{ticOver ? ` — dépasse ${profile.ticLimit}%` : ''}
          </div>
        </div>
        <button onClick={exportCmykTxt} title="Exporter valeurs CMJN"
          style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '3px 6px', cursor: 'pointer', color: c.textGhost, fontSize: 9 }}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M6 2v6M3 6l3 3 3-3"/><path d="M2 10h8"/>
          </svg>
        </button>
      </div>

      {/* 4-channel grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {CHANNEL_META.map(({ key, label, accent }) => (
          <div key={key} style={{ borderRadius: r.md, border: `1px solid ${c.borderLight}`, overflow: 'hidden' }}>
            <div style={{ height: 32, background: channelColor(key, values[key]) }} />
            <div style={{ padding: '4px 6px', background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: accent }}>{label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{values[key]}%</span>
              </div>
              <div style={{ height: 3, background: '#eee', borderRadius: 2, marginTop: 3 }}>
                <div style={{ height: 3, width: `${values[key]}%`, background: accent, borderRadius: 2, transition: 'width 0.2s' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TIC warning */}
      {ticOver && (
        <div style={{
          padding: '6px 8px', borderRadius: r.md,
          background: '#fff8e1', border: '1px solid #ffe082',
          fontSize: 9, color: '#b45309', lineHeight: 1.4, marginBottom: 6,
        }}>
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" style={{ marginRight: 4, verticalAlign: 'middle' }}><path d="M6 2v5"/><circle cx="6" cy="9.5" r="0.8" fill="currentColor"/></svg>
          TIC {tic}% dépasse la limite {profile.label} ({profile.ticLimit}%) — risque séchage insuffisant et maculage
        </div>
      )}

      {/* Gamut info */}
      <div style={{ fontSize: 8, color: c.textGhost, padding: '4px 6px', background: '#fafafa', borderRadius: r.md, border: `1px solid ${c.borderLight}` }}>
        Gamut {profile.label} : {Math.round(profile.gamutW * 100)}% de sRGB — simulation basée sur profil colorimétrique standard
      </div>
    </CollapsibleSection>
  )
}
