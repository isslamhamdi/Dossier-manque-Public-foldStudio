'use client'

export type { MatControls } from '../../lib/matControls'
export { DEFAULT_MAT_CONTROLS } from '../../lib/matControls'
import type { MatControls } from '../../lib/matControls'
import { DEFAULT_MAT_CONTROLS } from '../../lib/matControls'

interface Props {
  controls: MatControls
  onChange: (c: MatControls) => void
  onClose: () => void
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; format?: (v: number) => string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
      <span style={{ fontSize: 9, color: '#777', width: 88, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: '#5A6BD4', height: 3, cursor: 'pointer' }}
      />
      <span style={{ fontSize: 9, color: '#5A6BD4', width: 28, textAlign: 'right', fontWeight: 700, flexShrink: 0 }}>
        {format ? format(value) : value.toFixed(2)}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: '#bbb', letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 4 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export function MatControlsPanel({ controls, onChange, onClose }: Props) {
  const set = (key: keyof MatControls) => (v: number) => onChange({ ...controls, [key]: v })

  return (
    <div style={{
      position: 'absolute', top: 10, right: 10, zIndex: 30,
      background: '#f2ede7', borderRadius: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
      padding: '10px 12px 8px', width: 240,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>Contrôles matériau</span>
        <button onClick={onClose} style={{
          border: 'none', background: 'rgba(0,0,0,0.08)', borderRadius: 6,
          width: 18, height: 18, cursor: 'pointer', fontSize: 12, color: '#555',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>×</button>
      </div>

      <Section title="Tiling UV">
        <Slider label="Tiling" value={controls.tiling} min={0.1} max={8} step={0.1} onChange={set('tiling')} format={v => `${v.toFixed(1)}×`} />
      </Section>

      <Section title="Géométrie">
        <Slider label="Displacement" value={controls.displacementScale} min={0} max={3} step={0.05} onChange={set('displacementScale')} />
        <Slider label="Normal Scale" value={controls.normalScale} min={0} max={3} step={0.05} onChange={set('normalScale')} />
      </Section>

      <Section title="Matériau">
        <Slider label="Roughness" value={controls.roughnessMult} min={0} max={2} step={0.05} onChange={set('roughnessMult')} />
        <Slider label="Metalness" value={controls.metalnessMult} min={0} max={2} step={0.05} onChange={set('metalnessMult')} />
      </Section>

      <Section title="Éclairage">
        <Slider label="Env. Intensity" value={controls.envIntensity} min={0} max={3} step={0.05} onChange={set('envIntensity')} />
        <Slider label="Soleil" value={controls.sunIntensity} min={0} max={3} step={0.05} onChange={set('sunIntensity')} />
      </Section>

      <Section title="Vernis Spot UV">
        <div style={{ fontSize: 8.5, color: '#888', marginBottom: 5, lineHeight: 1.4 }}>
          Brillance sélective sur les zones imprimées
        </div>
        <Slider
          label="Intensité vernis"
          value={controls.varnishIntensity}
          min={0} max={1} step={0.01}
          onChange={set('varnishIntensity')}
          format={v => v === 0 ? 'off' : `${Math.round(v * 100)}%`}
        />
      </Section>

      <button onClick={() => onChange(DEFAULT_MAT_CONTROLS)} style={{
        width: '100%', padding: '5px 0', borderRadius: 7,
        border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.7)',
        fontSize: 9, color: '#888', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2,
      }}>
        Réinitialiser
      </button>
    </div>
  )
}
