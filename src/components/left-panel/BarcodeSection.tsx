'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { BARCODE_TYPES, generateBarcodeDataUrl } from '@/lib/barcodeUtils'
import { Toggle, ColorPicker, FieldLabel, CollapsibleSection } from './ui'
import { Select } from '@/components/ui/select'

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fff', border: '1px solid #d0d0d0',
  color: '#333', borderRadius: 4, padding: '5px 8px', fontSize: 11,
  outline: 'none', boxSizing: 'border-box',
}

export function BarcodeSection({ onAddLayer }: { onAddLayer: (layer: ImageLayer) => void }) {
  const [type, setType] = useState('CODE128')
  const [value, setValue] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [showText, setShowText] = useState(true)
  const [widthMm, setWidthMm] = useState(45)
  const [heightMm, setHeightMm] = useState(20)
  const [error, setError] = useState<string | null>(null)

  const current = BARCODE_TYPES.find(t => t.id === type) ?? BARCODE_TYPES[0]

  // #35 — Barcode validation
  const validateBarcode = (t: string, v: string): string | null => {
    if (!v) return null
    if (t === 'EAN13') {
      if (!/^\d{12,13}$/.test(v)) return 'EAN-13 : 12 ou 13 chiffres requis'
      if (v.length === 13) {
        const sum = v.split('').slice(0, 12).reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
        const check = (10 - (sum % 10)) % 10
        if (check !== Number(v[12])) return `Clé de contrôle EAN-13 invalide (attendu: ${check})`
      }
    }
    if (t === 'UPC') {
      if (!/^\d{11,12}$/.test(v)) return 'UPC-A : 11 ou 12 chiffres requis'
    }
    if (t === 'ITF14') {
      if (!/^\d{14}$/.test(v)) return 'ITF-14 : exactement 14 chiffres requis'
    }
    if (t === 'CODE39') {
      if (!/^[A-Z0-9 \-.$/+%*]+$/.test(v.toUpperCase())) return 'Code 39 : uniquement A-Z, 0-9 et -./+%*$ autorisés'
    }
    return null
  }

  const validationMsg = validateBarcode(type, value.trim())

  const handleAdd = () => {
    const v = value.trim()
    if (!v) { setError('Entrez une valeur'); return }
    const vError = validateBarcode(type, v)
    if (vError) { setError(vError); return }
    const src = generateBarcodeDataUrl(type, v, fgColor, widthMm, heightMm, showText)
    if (!src) { setError(`Valeur invalide pour ${current.label}`); return }
    setError(null)
    onAddLayer({
      id: `bc-${Date.now()}`, name: `${current.label}: ${v}`, src,
      x: 20, y: 20, width: widthMm, height: heightMm,
      scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto',
    })
  }

  return (
    <CollapsibleSection label="Codes-barres">
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE</FieldLabel>
        <Select
          value={type}
          options={BARCODE_TYPES.map(t => ({ value: t.id, label: t.label }))}
          onChange={v => { setType(v); setError(null) }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>VALEUR</FieldLabel>
        <input type="text" value={value} placeholder={current.placeholder}
          onChange={e => { setValue(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          className="fs-input" style={{ ...inputStyle, border: `1px solid ${error ? '#e53935' : '#d0d0d0'}` }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-end' }}>
        <ColorPicker label="COULEUR" value={fgColor} onChange={setFgColor} />
        <Toggle on={showText} onToggle={() => setShowText(v => !v)} label="TEXTE" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {([['LARG. (mm)', widthMm, setWidthMm, 20, 200] as const, ['HAUT. (mm)', heightMm, setHeightMm, 10, 100] as const]).map(([lbl, val, setter, min, max]) => (
          <div key={lbl} style={{ flex: 1 }}>
            <FieldLabel>{lbl}</FieldLabel>
            <input type="number" value={val} min={min} max={max} step={5}
              onChange={e => setter(Number(e.target.value))}
              className="fs-input" style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 6px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}
      </div>

      {/* Live validation feedback #35 */}
      {value && !error && validationMsg && (
        <div style={{ fontSize: 10, color: '#b45309', marginBottom: 6, padding: '4px 8px', background: '#fff8e1', borderRadius: 4, border: '1px solid #ffe082' }}>
          ⚠ {validationMsg}
        </div>
      )}
      {value && !validationMsg && !error && (
        <div style={{ fontSize: 10, color: '#059669', marginBottom: 6, padding: '4px 8px', background: '#f0fdf4', borderRadius: 4, border: '1px solid #a7f3d0' }}>
          ✓ Format valide
        </div>
      )}
      {error && <div style={{ fontSize: 10, color: '#e53935', marginBottom: 6 }}>{error}</div>}
      <button onClick={handleAdd} className="fs-btn-primary" style={{
        width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
      }}>+ Ajouter le code-barre</button>
    </CollapsibleSection>
  )
}
