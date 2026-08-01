'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { FONT_OPTIONS, PATH_PRESETS, generateTextDataUrl, generateTextOnPathDataUrl } from '@/lib/textUtils'
import { Toggle, ColorPicker, FieldLabel, CollapsibleSection } from './ui'
import { Select } from '@/components/ui/select'
import { c, fs, fw, r } from '@/lib/tokens'

export function TextSection({ onAddLayer }: { onAddLayer: (layer: ImageLayer) => void }) {
  const [text, setText] = useState('')
  const [font, setFont] = useState('Arial')
  const [sizePt, setSizePt] = useState(24)
  const [color, setColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [hasBg, setHasBg] = useState(false)
  const [bold, setBold] = useState(false)
  const [italic, setItalic] = useState(false)
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center')
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [textOnPath, setTextOnPath] = useState(false)
  const [pathPreset, setPathPreset] = useState('arc-top')
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    const v = text.trim()
    if (!v) { setError('Entrez du texte'); return }
    let result
    if (textOnPath) {
      result = generateTextOnPathDataUrl(v, font, sizePt, color, bold, pathPreset)
    } else {
      result = generateTextDataUrl(v, font, sizePt, color, bold, italic, align, hasBg ? bgColor : undefined, letterSpacing)
    }
    if (!result) { setError('Erreur de génération'); return }
    setError(null)
    const { src, widthMm, heightMm } = result
    onAddLayer({
      id: `txt-${Date.now()}`, name: `Texte: ${v.slice(0, 20)}${v.length > 20 ? '…' : ''}`,
      src, x: 20, y: 20, width: widthMm, height: heightMm,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', opacity: 1, kind: 'text',
    })
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: 28, height: 24, border: `1px solid ${active ? c.ink : c.border}`,
    background: active ? c.ink : c.white, color: active ? c.white : c.textMed,
    borderRadius: r.sm, cursor: 'pointer', fontSize: fs.md, fontWeight: fw.heavy, fontFamily: 'inherit',
  })

  return (
    <CollapsibleSection label="Texte">
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TEXTE</FieldLabel>
        <textarea value={text} rows={3} placeholder={"Votre texte ici…\n(Entrée = nouvelle ligne)"}
          onChange={e => { setText(e.target.value); setError(null) }}
          className="fs-input"
          style={{ width: '100%', border: `1px solid ${error ? c.danger : c.border}`, borderRadius: r.md, padding: '5px 8px', fontSize: fs.md, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', color: '#333', background: c.white }} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>POLICE</FieldLabel>
        <Select
          value={font}
          options={FONT_OPTIONS.map(f => ({ value: f.id, label: f.label }))}
          onChange={setFont}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>TAILLE (pt)</FieldLabel>
          <input type="number" value={sizePt} min={6} max={200} step={2}
            onChange={e => setSizePt(Number(e.target.value))}
            className="fs-input" style={{ width: '100%', border: `1px solid ${c.border}`, borderRadius: r.md, padding: '5px 6px', fontSize: fs.md, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <ColorPicker label="COULEUR" value={color} onChange={setColor} />
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <button onClick={() => setBold(v => !v)} className="fs-btn-tab" style={{ ...btnStyle(bold), fontWeight: 700 }} title="Gras">G</button>
        <button onClick={() => setItalic(v => !v)} className="fs-btn-tab" style={{ ...btnStyle(italic), fontStyle: 'italic' }} title="Italique">I</button>
        <div style={{ flex: 1 }} />
        {(['left', 'center', 'right'] as const).map(a => (
          <button key={a} onClick={() => setAlign(a)} className="fs-btn-tab" style={btnStyle(align === a)} title={a}>
            {a === 'left' ? '⇤' : a === 'center' ? '≡' : '⇥'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>ESPACEMENT</FieldLabel>
          <input type="number" value={letterSpacing} min={-5} max={30} step={0.5}
            onChange={e => setLetterSpacing(Number(e.target.value))}
            className="fs-input" style={{ width: '100%', border: `1px solid ${c.border}`, borderRadius: r.md, padding: '5px 6px', fontSize: fs.md, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <Toggle on={hasBg} onToggle={() => setHasBg(v => !v)} label="FOND" />
        {hasBg && <ColorPicker label="COULEUR FOND" value={bgColor} onChange={setBgColor} />}
      </div>

      {/* Text on path #27 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Toggle on={textOnPath} onToggle={() => setTextOnPath(v => !v)} label="TEXTE SUR CHEMIN" />
      </div>
      {textOnPath && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>FORME DU CHEMIN</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {PATH_PRESETS.map(p => (
              <button key={p.id} onClick={() => setPathPreset(p.id)} className="fs-btn-tab"
                style={{
                  padding: '4px 8px', fontSize: 10, borderRadius: r.sm, fontFamily: 'inherit', cursor: 'pointer',
                  background: pathPreset === p.id ? c.ink : c.white,
                  color: pathPreset === p.id ? c.white : c.textMed,
                  border: `1px solid ${pathPreset === p.id ? c.ink : c.border}`,
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: fs.sm, color: c.danger, marginBottom: 6 }}>{error}</div>}
      <button onClick={handleAdd} className="fs-btn-primary" style={{
        width: '100%', background: c.ink, color: c.white, border: 'none',
        borderRadius: r.lg, padding: '8px 0', fontSize: fs.md, fontWeight: fw.bold, cursor: 'pointer',
      }}>+ Ajouter le texte</button>
    </CollapsibleSection>
  )
}
