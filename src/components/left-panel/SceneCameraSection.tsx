'use client'

// Particules (confetti/paillettes)
// Caméra cinématique CatmullRomCurve3
// Multi-caméra (front/side/top/persp)
// Screenshot haute résolution (8K)
// Instanced rendering
// Skybox 360°
// #188 Brouillard (via LightingSection)
// Mirror floor
// Capture 360°

import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'
import type { ParticlePreset } from '@/components/three-scene/ParticleSystem'
import type { CameraPathConfig } from '@/components/three-scene/ParticleSystem'
import type { SkyboxPreset } from '../three-scene/InstancedScene'

export type { SkyboxPreset }

export interface SceneCameraConfig {
  cameraView: 'perspective' | 'front' | 'top' | 'side' | 'iso'
  particles: ParticlePreset
  particleCount: number
  cameraPath: CameraPathConfig
  instancedCount: number
  instancedEnabled: boolean
  skybox: SkyboxPreset
  mirrorFloor: boolean
  highResMode: '2K' | '4K' | '8K'
}

export const SCENE_CAMERA_DEFAULTS: SceneCameraConfig = {
  cameraView: 'perspective',
  particles: 'off',
  particleCount: 200,
  cameraPath: { enabled: false, speed: 1, loop: true },
  instancedCount: 12,
  instancedEnabled: false,
  skybox: 'none',
  mirrorFloor: false,
  highResMode: '4K',
}

const CAMERA_VIEWS: { id: SceneCameraConfig['cameraView']; label: string; pos: [number, number, number] }[] = [
  { id: 'perspective', label: 'Perspective', pos: [3, 2, 4] },
  { id: 'front',       label: 'Face',        pos: [0, 0, 5] },
  { id: 'top',         label: 'Haut',        pos: [0, 6, 0.01] },
  { id: 'side',        label: 'Côté',        pos: [5, 0, 0] },
  { id: 'iso',         label: 'Isométrique', pos: [3.5, 3.5, 3.5] },
]

const PARTICLE_PRESETS: { id: ParticlePreset; label: string }[] = [
  { id: 'off',       label: 'Désactivé' },
  { id: 'confetti',  label: 'Confetti' },
  { id: 'sparkles',  label: 'Paillettes' },
  { id: 'dust',      label: 'Poussière' },
  { id: 'snow',      label: 'Neige' },
]

const SKYBOX_PRESETS: { id: SkyboxPreset; label: string }[] = [
  { id: 'none',             label: 'Aucun' },
  { id: 'gradient-blue',    label: 'Ciel bleu' },
  { id: 'gradient-sunset',  label: 'Coucher' },
  { id: 'gradient-night',   label: 'Nuit' },
  { id: 'stars',            label: 'Étoiles' },
]

interface SceneCameraSectionProps {
  config: SceneCameraConfig
  onChange: (c: SceneCameraConfig) => void
  onSetCamera: (pos: [number, number, number]) => void
  onHighResCapture: (res: '2K' | '4K' | '8K') => void
  on360Capture: () => void
}

export function SceneCameraSection({ config, onChange, onSetCamera, onHighResCapture, on360Capture }: SceneCameraSectionProps) {
  const set = <K extends keyof SceneCameraConfig>(key: K, val: SceneCameraConfig[K]) =>
    onChange({ ...config, [key]: val })

  return (
    <CollapsibleSection label="Scène & Caméra avancée">
      {/* Multi-camera views */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Vue caméra</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {CAMERA_VIEWS.map(v => (
            <button key={v.id} onClick={() => {
              set('cameraView', v.id)
              onSetCamera(v.pos)
            }}
              style={{
                fontSize: 9, padding: '3px 7px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${config.cameraView === v.id ? '#5A6BD4' : c.borderLight}`,
                background: config.cameraView === v.id ? 'rgba(90,107,212,0.1)' : c.white,
                color: config.cameraView === v.id ? '#5A6BD4' : c.textMed,
                fontWeight: config.cameraView === v.id ? 700 : 400,
              }}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera path */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={config.cameraPath.enabled}
            onChange={e => set('cameraPath', { ...config.cameraPath, enabled: e.target.checked })}
            style={{ accentColor: '#5A6BD4' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>Caméra cinématique</span>
        </label>
        {config.cameraPath.enabled && (
          <div style={{ paddingLeft: 14, borderLeft: `2px solid rgba(90,107,212,0.2)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Vitesse</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: c.textMed }}>{config.cameraPath.speed.toFixed(1)}×</span>
            </div>
            <input type="range" min={0.1} max={3} step={0.1} value={config.cameraPath.speed}
              onChange={e => set('cameraPath', { ...config.cameraPath, speed: Number(e.target.value) })}
              style={{ width: '100%', accentColor: '#5A6BD4' }} />
          </div>
        )}
      </div>

      {/* Particles */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Particules</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {PARTICLE_PRESETS.map(p => (
            <button key={p.id} onClick={() => set('particles', p.id)}
              style={{
                fontSize: 9, padding: '3px 6px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${config.particles === p.id ? '#e91e8c' : c.borderLight}`,
                background: config.particles === p.id ? 'rgba(233,30,140,0.08)' : c.white,
                color: config.particles === p.id ? '#e91e8c' : c.textMed,
                fontWeight: config.particles === p.id ? 700 : 400,
              }}>
              {p.label}
            </button>
          ))}
        </div>
        {config.particles !== 'off' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Nombre</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: c.textMed }}>{config.particleCount}</span>
            </div>
            <input type="range" min={50} max={500} step={50} value={config.particleCount}
              onChange={e => set('particleCount', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#e91e8c' }} />
          </div>
        )}
      </div>

      {/* Skybox */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Skybox</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {SKYBOX_PRESETS.map(p => (
            <button key={p.id} onClick={() => set('skybox', p.id)}
              style={{
                fontSize: 9, padding: '3px 6px', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${config.skybox === p.id ? '#5A6BD4' : c.borderLight}`,
                background: config.skybox === p.id ? 'rgba(90,107,212,0.1)' : c.white,
                color: config.skybox === p.id ? '#5A6BD4' : c.textMed,
                fontWeight: config.skybox === p.id ? 700 : 400,
              }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Instanced */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={config.instancedEnabled}
            onChange={e => set('instancedEnabled', e.target.checked)}
            style={{ accentColor: '#5A6BD4' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>100 boîtes instanciées</span>
        </label>
        {config.instancedEnabled && (
          <div style={{ paddingLeft: 14, borderLeft: `2px solid rgba(90,107,212,0.2)` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: c.textGhost }}>Nombre</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: c.textMed }}>{config.instancedCount}</span>
            </div>
            <input type="range" min={4} max={100} step={4} value={config.instancedCount}
              onChange={e => set('instancedCount', Number(e.target.value))}
              style={{ width: '100%', accentColor: '#5A6BD4' }} />
          </div>
        )}
      </div>

      {/* Mirror floor */}
      <label style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={config.mirrorFloor} onChange={e => set('mirrorFloor', e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
        <span style={{ fontSize: fs.sm, color: c.textMed }}>Sol miroir (MeshReflectorMaterial)</span>
      </label>

      {/* High-res capture */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Capture haute résolution</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['2K', '4K', '8K'] as const).map(res => (
            <button key={res} onClick={() => onHighResCapture(res)}
              style={{
                flex: 1, fontSize: 9, padding: '5px 0', borderRadius: 7, cursor: 'pointer',
                border: `1px solid ${c.borderLight}`, background: c.white, color: c.textMed, fontWeight: 600,
              }}>
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* 360° capture */}
      <button onClick={on360Capture}
        style={{ width: '100%', fontSize: fs.sm, fontWeight: 600, padding: '6px 0', borderRadius: r.md, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 5h2l1.5-2h5L11 5h2v7H1z"/><circle cx="6.5" cy="8.5" r="2"/></svg>
        Capture 360°
      </button>

      {/* GSAP animation trigger */}
      <button onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:gsap-animate'))}
        style={{ width: '100%', fontSize: fs.sm, fontWeight: 600, padding: '6px 0', borderRadius: r.md, border: `1px solid #5A6BD4`, background: 'rgba(90,107,212,0.08)', color: '#5A6BD4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M2.5 9.5l1.4-1.4M8.1 3.9l1.4-1.4"/></svg>
        Animer boîte (GSAP)
      </button>
    </CollapsibleSection>
  )
}
