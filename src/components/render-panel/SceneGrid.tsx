'use client'

import type { RenderSceneKey } from '../ThreeScene'

interface SceneOption {
  key: RenderSceneKey
  label: string
  bg: string
  floor: string
}

const SCENES: SceneOption[] = [
  { key: 'studio_white',      label: 'Studio',       bg: '#f0f0f0', floor: '#e8e8e8' },
  { key: 'wooden_table',      label: 'Bois',         bg: '#c4a878', floor: '#7a5c3a' },
  { key: 'marble',            label: 'Marbre',       bg: '#e8e4e0', floor: '#ede9e5' },
  { key: 'dark',              label: 'Sombre',       bg: '#0e0e14', floor: '#18181f' },
  { key: 'outdoor',           label: 'Extérieur',    bg: '#b8d4e8', floor: '#b0a890' },
  { key: 'luxury',            label: 'Luxe',         bg: '#1a1210', floor: '#28201a' },
  { key: 'concrete',          label: 'Béton',        bg: '#b8b4b0', floor: '#9a9690' },
  { key: 'colored',           label: 'Coloré',       bg: '#2840b0', floor: '#2840b0' },
  { key: 'glass',             label: 'Verre',        bg: '#e8ecf4', floor: '#d0dce8' },
  { key: 'velvet',            label: 'Velours',      bg: '#180a20', floor: '#1a0a28' },
  { key: 'monochrome_studio', label: 'Mono',         bg: '#d8d8d8', floor: '#cccccc' },
  { key: 'brown_photostudio', label: 'Photo Brun',   bg: '#c8a880', floor: '#a08060' },
  { key: 'studio_small',      label: 'Mini Studio',  bg: '#f0ede8', floor: '#e8e4e0' },
]

export function SceneGrid({ renderScene, onSceneChange }: {
  renderScene: RenderSceneKey
  onSceneChange: (s: RenderSceneKey) => void
}) {
  const isCustom = renderScene === 'custom'

  return (
    <div style={{ padding: '12px 12px 0' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#999', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>SCÈNE</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
        {SCENES.map(scene => {
          const active = scene.key === renderScene
          return (
            <button
              key={scene.key}
              onClick={() => onSceneChange(scene.key)}
              style={{
                background: active ? '#1a1a1a' : '#e2deda',
                border: active ? '2px solid #1a1a1a' : '2px solid transparent',
                borderRadius: 7, padding: '6px 3px 5px',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#d5d0ca' }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#e2deda' }}
            >
              <div style={{ width: '100%', height: 28, borderRadius: 3, overflow: 'hidden', background: scene.bg, position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: scene.floor, borderTop: '1px solid rgba(0,0,0,0.1)' }} />
                <div style={{
                  position: 'absolute', bottom: '38%', left: '50%', transform: 'translateX(-50%)',
                  width: 9, height: 12, background: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
                  borderRadius: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                }} />
              </div>
              <span style={{
                fontSize: 7.5, fontWeight: 700, letterSpacing: 0.4,
                color: active ? '#fff' : '#666', textTransform: 'uppercase', lineHeight: 1, whiteSpace: 'nowrap',
              }}>{scene.label}</span>
            </button>
          )
        })}

        {/* Custom scene button */}
        <button
          onClick={() => onSceneChange('custom')}
          style={{
            background: isCustom ? '#1a1a1a' : '#e2deda',
            border: isCustom ? '2px solid #1a1a1a' : '2px dashed #bbb8b4',
            borderRadius: 7, padding: '6px 3px 5px',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (!isCustom) (e.currentTarget as HTMLElement).style.background = '#d5d0ca' }}
          onMouseLeave={e => { if (!isCustom) (e.currentTarget as HTMLElement).style.background = '#e2deda' }}
        >
          <div style={{
            width: '100%', height: 28, borderRadius: 3, overflow: 'hidden',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ffd93d 33%, #6bcb77 66%, #4d96ff 100%)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          </div>
          <span style={{
            fontSize: 7.5, fontWeight: 700, letterSpacing: 0.4,
            color: isCustom ? '#fff' : '#666', textTransform: 'uppercase', lineHeight: 1,
          }}>Custom</span>
        </button>
      </div>
    </div>
  )
}
