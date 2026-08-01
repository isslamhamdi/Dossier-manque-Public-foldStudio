'use client'

import type { ImageLayer } from '@/lib/types'
import { SliderRow } from './ui'

interface LayerInspectorProps {
  layer: ImageLayer
  onUpdateImageLayer: (id: string, updates: Partial<ImageLayer>) => void
}

const FACES = ['auto', 'front', 'back', 'left', 'right', 'top', 'bottom'] as const

export function LayerInspector({ layer, onUpdateImageLayer }: LayerInspectorProps) {
  const update = (updates: Partial<ImageLayer>) => onUpdateImageLayer(layer.id, updates)

  return (
    <div style={{ marginTop: 10, paddingTop: 4, borderTop: '1px solid #efefef' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {(['x', 'y'] as const).map(ax => (
          <div key={ax} style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{ax.toUpperCase()} (mm)</div>
            <input
              type="number" value={Math.round(layer[ax])} step={1}
              onChange={e => update({ [ax]: Number(e.target.value) })}
              className="fs-input"
              style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '4px 6px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      <SliderRow label="Scale" value={layer.scale} min={0.05} max={3} step={0.01} onChange={v => update({ scale: v })} />
      <SliderRow label="Rotation (°)" value={layer.rotation} min={-180} max={180} step={1} onChange={v => update({ rotation: v })} />
      <SliderRow label="Opacité" value={Math.round((layer.opacity ?? 1) * 100)} min={5} max={100} step={5} onChange={v => update({ opacity: v / 100 })} />

      {/* #31: Flip/mirror */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button title="Miroir horizontal" onClick={() => update({ flipH: !layer.flipH })}
          className="fs-btn-default"
          style={{ flex: 1, background: layer.flipH ? '#1a1a1a' : '#f5f5f5', border: `1px solid ${layer.flipH ? '#1a1a1a' : '#e0e0e0'}`, color: layer.flipH ? '#fff' : '#555', borderRadius: 4, padding: '5px 0', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ↔ Miroir H
        </button>
        <button title="Miroir vertical" onClick={() => update({ flipV: !layer.flipV })}
          className="fs-btn-default"
          style={{ flex: 1, background: layer.flipV ? '#1a1a1a' : '#f5f5f5', border: `1px solid ${layer.flipV ? '#1a1a1a' : '#e0e0e0'}`, color: layer.flipV ? '#fff' : '#555', borderRadius: 4, padding: '5px 0', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          ↕ Miroir V
        </button>
      </div>

      <div style={{ marginTop: 6, marginBottom: 2 }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 5, letterSpacing: 0.3 }}>FACE ASSIGNMENT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {FACES.map(face => (
            <button
              key={face}
              onClick={() => update({ faceAssignment: face })}
              className="fs-btn-tab"
              style={{
                background: layer.faceAssignment === face ? '#1a1a1a' : '#f5f5f5',
                color: layer.faceAssignment === face ? '#fff' : '#666',
                border: `1px solid ${layer.faceAssignment === face ? '#1a1a1a' : '#d8d8d8'}`,
                borderRadius: 3, padding: '3px 7px', fontSize: 9, fontWeight: 600,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4,
                fontFamily: 'inherit',
              }}
            >{face}</button>
          ))}
        </div>
      </div>

      {/* Clip mask #30 + Blend mode #33 */}
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 10, color: '#555' }}>
          <input type="checkbox" checked={layer.clipMask ?? false} onChange={e => update({ clipMask: e.target.checked })} style={{ cursor: 'pointer' }} />
          Masque découpe
        </label>
      </div>
      <div style={{ marginTop: 8, marginBottom: 6 }}>
        <div style={{ fontSize: 9, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>Mode fusion</div>
        <select value={layer.blendMode ?? 'normal'} onChange={e => update({ blendMode: e.target.value })}
          style={{ width: '100%', fontSize: 10, border: '1px solid #e0e0e0', borderRadius: 4, padding: '3px 6px', outline: 'none' }}>
          {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Pattern fill #26 */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 6, letterSpacing: 0.3 }}>MOTIF / RÉPÉTITION</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
          {(['none', 'repeat', 'stripes', 'dots', 'crosshatch'] as const).map(pt => (
            <button key={pt} onClick={() => update({ patternFill: { ...(layer.patternFill ?? { color: '#000000', size: 10, angle: 0, enabled: false }), type: pt, enabled: pt !== 'none' } })}
              style={{
                background: layer.patternFill?.type === pt ? '#1a1a1a' : '#f5f5f5',
                color: layer.patternFill?.type === pt ? '#fff' : '#666',
                border: `1px solid ${layer.patternFill?.type === pt ? '#1a1a1a' : '#d8d8d8'}`,
                borderRadius: 3, padding: '3px 6px', fontSize: 9, fontWeight: 600,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: 'inherit',
              }}>
              {pt === 'none' ? 'Aucun' : pt === 'repeat' ? 'Répéter' : pt === 'stripes' ? 'Rayures' : pt === 'dots' ? 'Points' : 'Croisé'}
            </button>
          ))}
        </div>
        {layer.patternFill?.enabled && (
          <>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: '#888', width: 44 }}>Couleur</div>
              <input type="color" value={layer.patternFill.color}
                onChange={e => update({ patternFill: { ...layer.patternFill!, color: e.target.value } })}
                style={{ width: 32, height: 22, border: 'none', padding: 0, cursor: 'pointer', borderRadius: 3 }} />
            </div>
            <SliderRow label="Taille (mm)" value={layer.patternFill.size} min={2} max={40} step={1} onChange={v => update({ patternFill: { ...layer.patternFill!, size: v } })} />
            <SliderRow label="Angle (°)" value={layer.patternFill.angle} min={0} max={180} step={5} onChange={v => update({ patternFill: { ...layer.patternFill!, angle: v } })} />
          </>
        )}
      </div>

      {/* Spot ink #28 */}
      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <div style={{ fontSize: 10, color: '#888', marginBottom: 6, letterSpacing: 0.3 }}>ENCRE SPÉCIALE</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {([
            { value: 'none', label: 'Aucune', style: { background: '#f5f5f5', color: '#666' } },
            { value: 'gold', label: 'Or', style: { background: 'linear-gradient(135deg,#c9a030,#f5dc80,#c9a030)', color: '#7a5600' } },
            { value: 'silver', label: 'Argent', style: { background: 'linear-gradient(135deg,#a0a8b0,#d8dde4,#a0a8b0)', color: '#404850' } },
            { value: 'varnish', label: 'Vernis', style: { background: 'rgba(200,220,255,0.5)', color: '#333', border: '1px dashed #90b0e8' } },
            { value: 'uv', label: 'UV', style: { background: 'linear-gradient(135deg,#c060f0,#6080ff)', color: '#fff' } },
            { value: 'emboss', label: 'Gaufrage', style: { background: '#e8e0d8', color: '#666', textShadow: '1px 1px 0 #fff' } },
          ] as const).map(({ value, label, style }) => (
            <button key={value} onClick={() => update({ spotInk: value })}
              style={{
                ...(style as object),
                border: (layer.spotInk ?? 'none') === value ? '2px solid #1a1a1a' : ('border' in style ? style.border : '1px solid #d8d8d8') as string,
                borderRadius: 3, padding: '4px 8px', fontSize: 9, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                outline: (layer.spotInk ?? 'none') === value ? '2px solid rgba(0,0,0,0.25)' : 'none',
                outlineOffset: 1,
              }}>
              {label}
            </button>
          ))}
        </div>
        {layer.spotInk && layer.spotInk !== 'none' && (
          <div style={{ marginTop: 6, fontSize: 9, color: '#888', background: '#f8f8f8', padding: '4px 8px', borderRadius: 4 }}>
            Calque marqué comme encre spéciale. Le patron SVG inclura une hachure indicative.
          </div>
        )}
      </div>

      <div style={{ fontSize: 9, color: '#bbb', marginTop: 6, fontStyle: 'italic' }}>
        Alt + déplacer = snap 5mm · Shift + rotation = 15°
      </div>
    </div>
  )
}
