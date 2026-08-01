'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { PICTOS, pictoToDataUrl } from '@/lib/pictograms'
import type { Picto } from '@/lib/pictograms'
import { Toggle, ColorPicker, FieldLabel, CollapsibleSection } from './ui'
import { PictogramGuide } from './PictogramGuide'

export function PictogramSection({ onAddLayer }: { onAddLayer: (layer: ImageLayer) => void }) {
  const [color, setColor] = useState('#000000')
  const [withFrame, setWithFrame] = useState(false)
  const [transparentBg, setTransparentBg] = useState(true)
  const [sizeMm, setSizeMm] = useState(30)
  const [showGuide, setShowGuide] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleAdd = (picto: Picto) => {
    const bg = transparentBg ? 'none' : '#ffffff'
    const src = pictoToDataUrl(picto, color, withFrame, bg)
    onAddLayer({
      id: `picto-${Date.now()}`,
      name: picto.label,
      src,
      x: 20, y: 20,
      width: sizeMm, height: sizeMm,
      scale: 1, rotation: 0,
      visible: true, locked: false,
      faceAssignment: 'auto',
      opacity: 1, kind: 'picto',
      pictoId: picto.id,
      pictoColor: color,
      pictoBg: bg,
    })
  }

  const guideBtn = (
    <button onClick={() => setShowGuide(true)} title="Guide des pictogrammes" style={{
      background: 'none', border: '1px solid #e0e0e0', borderRadius: '50%',
      width: 16, height: 16, cursor: 'pointer', color: '#aaa', fontSize: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>?</button>
  )

  return (
    <>
      {showGuide && <PictogramGuide onClose={() => setShowGuide(false)} />}
      <CollapsibleSection label="Pictogrammes" right={guideBtn}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 10 }}>
          {PICTOS.map(picto => (
            <button
              key={picto.id}
              title={picto.label}
              onClick={() => handleAdd(picto)}
              onMouseEnter={() => setHoveredId(picto.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: hoveredId === picto.id ? '#efefef' : '#f8f8f8',
                border: '1px solid #e0e0e0', borderRadius: 5, padding: 4, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}
            >
              <div
                style={{ width: 36, height: 36, pointerEvents: 'none' }}
                dangerouslySetInnerHTML={{
                  __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36"><rect width="100" height="100" fill="white"/><g>${picto.paths.replace(/currentColor/g, color)}</g></svg>`
                }}
              />
              <span style={{ fontSize: 8, color: '#888', lineHeight: 1.2, textAlign: 'center' }}>{picto.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
          <ColorPicker label="COULEUR" value={color} onChange={setColor} />
          <Toggle on={withFrame} onToggle={() => setWithFrame(v => !v)} label="CADRE" />
          <Toggle on={transparentBg} onToggle={() => setTransparentBg(v => !v)} label="TRANSP." />
          <div style={{ flex: 1 }}>
            <FieldLabel>TAILLE (mm)</FieldLabel>
            <input type="number" value={sizeMm} min={10} max={100} step={5}
              onChange={e => setSizeMm(Number(e.target.value))}
              style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 6px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
        <p style={{ fontSize: 9, color: '#aaa', margin: '0 0 4px', fontStyle: 'italic' }}>
          Cliquez pour ajouter sur la boîte
        </p>
      </CollapsibleSection>
    </>
  )
}
