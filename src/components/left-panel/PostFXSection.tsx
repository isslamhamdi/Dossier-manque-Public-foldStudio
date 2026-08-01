'use client'

// #143-155 Post-processing — panneau de contrôle

import type { PostFXConfig } from '@/components/three-scene/EffectsLayer'
import { POST_FX_DEFAULTS } from '@/lib/threeDefaults'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface PostFXSectionProps {
  config: PostFXConfig
  onChange: (c: PostFXConfig) => void
}

function Toggle({ label, checked, onToggle, children }: {
  label: string; checked: boolean; onToggle: () => void; children?: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', marginBottom: children && checked ? 6 : 0 }}>
        <input type="checkbox" checked={checked} onChange={onToggle} style={{ accentColor: '#e91e8c' }} />
        <span style={{ fontSize: fs.sm, color: c.textMed, flex: 1 }}>{label}</span>
      </label>
      {checked && children && (
        <div style={{ paddingLeft: 18, paddingTop: 4, paddingBottom: 2, borderLeft: `2px solid rgba(233,30,140,0.2)` }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 8, color: c.textGhost }}>{label}</span>
        <span style={{ fontSize: 8, fontWeight: 700, color: c.textMed }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#e91e8c', height: 3 }} />
    </div>
  )
}

export function PostFXSection({ config, onChange }: PostFXSectionProps) {
  const set = <K extends keyof PostFXConfig>(key: K, val: PostFXConfig[K]) =>
    onChange({ ...config, [key]: val })

  return (
    <CollapsibleSection label="Post-processing">
      <div style={{ fontSize: 9, color: c.textGhost, marginBottom: 10, padding: '4px 8px', background: 'rgba(233,30,140,0.05)', borderRadius: 7, border: '1px solid rgba(233,30,140,0.15)' }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" style={{ marginRight: 5, flexShrink: 0 }}><path d="M6 0 6.8 5.2 12 6 6.8 6.8 6 12 5.2 6.8 0 6 5.2 5.2z"/></svg>
        Effets appliqués en temps réel sur le rendu 3D
      </div>

      {/* #146 SMAA */}
      <Toggle label="Anti-aliasing SMAA" checked={config.smaa} onToggle={() => set('smaa', !config.smaa)} />

      {/* #155 Tone mapping */}
      <Toggle label="ACES Tone Mapping" checked={config.toneMapping} onToggle={() => set('toneMapping', !config.toneMapping)}>
        <select value={config.toneMappingMode} onChange={e => set('toneMappingMode', e.target.value as PostFXConfig['toneMappingMode'])}
          style={{ width: '100%', fontSize: 9, border: `1px solid ${c.borderLight}`, borderRadius: 6, padding: '3px 5px', fontFamily: 'inherit' }}>
          <option value="aces">ACES Filmic</option>
          <option value="reinhard">Reinhard</option>
          <option value="linear">Linéaire</option>
        </select>
      </Toggle>

      {/* #147 Bloom */}
      <Toggle label="Bloom / Halo" checked={config.bloom} onToggle={() => set('bloom', !config.bloom)}>
        <Slider label="Intensité" value={config.bloomStrength} min={0} max={2} step={0.05} onChange={v => set('bloomStrength', v)} />
        <Slider label="Seuil" value={config.bloomThreshold} min={0} max={1} step={0.01} onChange={v => set('bloomThreshold', v)} />
      </Toggle>

      {/* #148 Depth of Field */}
      <Toggle label="Profondeur de champ" checked={config.dof} onToggle={() => set('dof', !config.dof)}>
        <Slider label="Focus" value={config.dofFocus} min={0.5} max={10} step={0.1} onChange={v => set('dofFocus', v)} />
        <Slider label="Ouverture" value={config.dofAperture} min={0.001} max={0.1} step={0.001} onChange={v => set('dofAperture', v)} />
      </Toggle>

      {/* #150 Vignette */}
      <Toggle label="Vignette" checked={config.vignette} onToggle={() => set('vignette', !config.vignette)}>
        <Slider label="Offset" value={config.vignetteOffset} min={0} max={1} step={0.01} onChange={v => set('vignetteOffset', v)} />
        <Slider label="Intensité" value={config.vignetteDarkness} min={0} max={1} step={0.01} onChange={v => set('vignetteDarkness', v)} />
      </Toggle>

      {/* #151 Film grain */}
      <Toggle label="Grain filmique" checked={config.noise} onToggle={() => set('noise', !config.noise)}>
        <Slider label="Opacité" value={config.noiseOpacity} min={0.01} max={0.4} step={0.01} onChange={v => set('noiseOpacity', v)} />
      </Toggle>

      {/* #152 Chromatic aberration */}
      <Toggle label="Aberration chromatique" checked={config.chromaticAberration} onToggle={() => set('chromaticAberration', !config.chromaticAberration)}>
        <Slider label="Offset" value={config.chromaticOffset} min={0.001} max={0.02} step={0.0005} onChange={v => set('chromaticOffset', v)} />
      </Toggle>

      {/* #143 SSAO */}
      <Toggle label="Occlusion ambiante (SSAO)" checked={config.ssao} onToggle={() => set('ssao', !config.ssao)}>
        <Slider label="Intensité" value={config.ssaoIntensity} min={0.1} max={5} step={0.1} onChange={v => set('ssaoIntensity', v)} />
        <Slider label="Rayon" value={config.ssaoRadius} min={0.01} max={0.3} step={0.005} onChange={v => set('ssaoRadius', v)} />
      </Toggle>

      {/* #154 Outline */}
      <Toggle label="Contour (Outline)" checked={config.outline} onToggle={() => set('outline', !config.outline)}>
        <Slider label="Épaisseur" value={config.outlineThickness} min={0.5} max={5} step={0.5} onChange={v => set('outlineThickness', v)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span style={{ fontSize: 8, color: c.textGhost }}>Couleur</span>
          <label style={{ cursor: 'pointer' }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: config.outlineColor, border: `1px solid ${c.borderLight}` }} />
            <input type="color" value={config.outlineColor} onChange={e => set('outlineColor', e.target.value)} style={{ display: 'none' }} />
          </label>
        </div>
      </Toggle>

      <button onClick={() => onChange(POST_FX_DEFAULTS)}
        style={{ width: '100%', fontSize: 9, padding: '4px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textGhost, marginTop: 6 }}>
        Réinitialiser effets
      </button>
    </CollapsibleSection>
  )
}
