'use client'

import { CollapsibleSection } from './ui'

export interface FinishingParams {
  laminate: 0 | 1 | 2              // 0=none, 1=matte, 2=gloss
  varnishAmt: number               // 0-1
  inkDensity: [number, number, number, number]  // C, M, Y, K
  imageMix: number                 // 0=KM simulation, 1=raw image
}

interface Props {
  value: FinishingParams
  onChange: (v: FinishingParams) => void
}

const LAMINATE_LABELS: [string, string][] = [
  ['Aucun', ''],
  ['Mat', 'OPP matte'],
  ['Brillant', 'OPP gloss'],
]

const SLIDER_STYLE = {
  WebkitAppearance: 'none' as const,
  width: '100%', height: 3, borderRadius: 2,
  background: '#e0e0e0', outline: 'none', cursor: 'pointer',
}

export function FinishingSection({ value, onChange }: Props) {
  const set = (patch: Partial<FinishingParams>) => onChange({ ...value, ...patch })
  const [C, M, Y, K] = value.inkDensity

  const setInk = (idx: number, v: number) => {
    const next = [...value.inkDensity] as [number, number, number, number]
    next[idx] = v
    set({ inkDensity: next })
  }

  return (
    <CollapsibleSection label="Finition & Impression">

      {/* Laminate selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Pelliculage</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {LAMINATE_LABELS.map(([label, sub], i) => (
            <button key={label}
              onClick={() => set({ laminate: i as 0 | 1 | 2 })}
              title={sub}
              style={{
                flex: 1, fontSize: 10, padding: '5px 2px', borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${value.laminate === i ? '#333' : '#e0e0e0'}`,
                background: value.laminate === i ? '#222' : '#fafafa',
                color: value.laminate === i ? '#fff' : '#555',
                fontWeight: value.laminate === i ? 600 : 400,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Spot UV varnish */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>Vernis UV sélectif</span>
          <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>{Math.round(value.varnishAmt * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={Math.round(value.varnishAmt * 100)}
          onChange={e => set({ varnishAmt: Number(e.target.value) / 100 })}
          style={SLIDER_STYLE} />
      </div>

      {/* Image / KM blend */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>Simulation KM ↔ Image</span>
          <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>{Math.round(value.imageMix * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={Math.round(value.imageMix * 100)}
          onChange={e => set({ imageMix: Number(e.target.value) / 100 })}
          style={SLIDER_STYLE} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#bbb', marginTop: 2 }}>
          <span>KM pur</span><span>Image brute</span>
        </div>
      </div>

      {/* CMYK ink densities */}
      <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Densités CMJN</div>
      {(['C', 'M', 'Y', 'K'] as const).map((ch, i) => {
        const val = value.inkDensity[i]
        const colors = ['#00bcd4', '#e91e8c', '#fbc02d', '#333']
        return (
          <div key={ch} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <div style={{ width: 16, fontSize: 10, fontWeight: 700, color: colors[i], flexShrink: 0 }}>{ch}</div>
            <input type="range" min={0} max={100} step={1} value={Math.round(val * 100)}
              onChange={e => setInk(i, Number(e.target.value) / 100)}
              style={{ ...SLIDER_STYLE, background: `linear-gradient(to right, ${colors[i]} 0%, ${colors[i]} ${val * 100}%, #e0e0e0 ${val * 100}%, #e0e0e0 100%)` }} />
            <div style={{ width: 28, fontSize: 10, color: '#555', textAlign: 'right', flexShrink: 0 }}>
              {Math.round(val * 100)}%
            </div>
          </div>
        )
      })}

      <div style={{ marginTop: 8, fontSize: 8, color: '#bbb', lineHeight: 1.5 }}>
        Simulation Kubelka-Munk: absorption CMJN sur substrat. Pour résultats précis, calibrer les densités sur épreuve Ugra/Fogra.
      </div>
    </CollapsibleSection>
  )
}
