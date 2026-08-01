'use client'

import type { CustomSceneConfig } from '../ThreeScene'

export function CustomSceneBuilder({ customScene, onCustomSceneChange }: {
  customScene: CustomSceneConfig
  onCustomSceneChange: (c: CustomSceneConfig) => void
}) {
  const labelStyle: React.CSSProperties = {
    fontSize: 8, color: '#aaa', fontWeight: 600, letterSpacing: 0.6,
    textTransform: 'uppercase', marginBottom: 4,
  }

  return (
    <div style={{ padding: '12px 12px 0', borderTop: '1px solid #e0dcd8', marginTop: 12 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#999', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
        SCÈNE PERSONNALISÉE
      </div>

      {/* Bg + Floor colors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {([
          { key: 'bg' as const, label: 'Fond', value: customScene.bg },
          { key: 'floorColor' as const, label: 'Sol', value: customScene.floorColor },
        ]).map(({ key, label, value }) => (
          <div key={key}>
            <div style={labelStyle}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ position: 'relative', width: 28, height: 28, borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }}>
                <div style={{ width: '100%', height: '100%', background: value }} />
                <input
                  type="color" value={value}
                  onChange={e => onCustomSceneChange({ ...customScene, [key]: e.target.value })}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
                />
              </label>
              <input
                type="text" value={value}
                onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) onCustomSceneChange({ ...customScene, [key]: e.target.value }) }}
                style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', border: '1px solid #d8d4d0', borderRadius: 4, padding: '3px 5px', background: '#f5f3f0', color: '#444', outline: 'none' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Roughness */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 8, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Rugosité</span>
          <span style={{ fontSize: 8, color: '#999' }}>{Math.round(customScene.floorRoughness * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 7.5, color: '#bbb', whiteSpace: 'nowrap' }}>Brillant</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={customScene.floorRoughness}
            onChange={e => onCustomSceneChange({ ...customScene, floorRoughness: parseFloat(e.target.value) })}
            style={{ flex: 1, height: 3, accentColor: '#555' }}
          />
          <span style={{ fontSize: 7.5, color: '#bbb', whiteSpace: 'nowrap' }}>Mat</span>
        </div>
      </div>

      {/* Metalness */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 8, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6 }}>Métal</span>
          <span style={{ fontSize: 8, color: '#999' }}>{Math.round(customScene.floorMetalness * 100)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 7.5, color: '#bbb', whiteSpace: 'nowrap' }}>Plastique</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={customScene.floorMetalness}
            onChange={e => onCustomSceneChange({ ...customScene, floorMetalness: parseFloat(e.target.value) })}
            style={{ flex: 1, height: 3, accentColor: '#555' }}
          />
          <span style={{ fontSize: 7.5, color: '#bbb', whiteSpace: 'nowrap' }}>Chrome</span>
        </div>
      </div>

      {/* Light temperature */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 8, color: '#aaa', fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Lumière</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['warm', 'neutral', 'cool'] as const).map(temp => {
            const labels = { warm: 'Chaude', neutral: 'Neutre', cool: 'Froide' }
            const active = customScene.lightTemp === temp
            return (
              <button
                key={temp}
                onClick={() => onCustomSceneChange({ ...customScene, lightTemp: temp })}
                style={{
                  flex: 1, padding: '5px 2px', fontSize: 8.5, fontWeight: 600,
                  border: active ? '1.5px solid #333' : '1.5px solid #d0ccc8',
                  borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? '#1a1a1a' : '#ebe7e3',
                  color: active ? '#fff' : '#777',
                  transition: 'all 0.1s',
                }}
              >
                {labels[temp]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
