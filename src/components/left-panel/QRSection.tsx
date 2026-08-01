'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { ColorPicker, FieldLabel, CollapsibleSection } from './ui'

async function generateQRDataUrl(text: string, sizeMm: number, fgColor: string): Promise<string | null> {
  try {
    const QRCode = (await import('qrcode')).default
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, text, { width: Math.round(sizeMm * 6), margin: 2, color: { dark: fgColor, light: '#ffffff' } })
    return canvas.toDataURL('image/png')
  } catch { return null }
}

export function QRSection({ onAddLayer }: { onAddLayer: (layer: ImageLayer) => void }) {
  const [text, setText] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [sizeMm, setSizeMm] = useState(30)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    const v = text.trim()
    if (!v) { setError('Entrez un texte ou une URL'); return }
    setLoading(true)
    const src = await generateQRDataUrl(v, sizeMm, fgColor)
    setLoading(false)
    if (!src) { setError('Erreur de génération QR'); return }
    setError(null)
    onAddLayer({
      id: `qr-${Date.now()}`,
      name: `QR: ${v.slice(0, 20)}${v.length > 20 ? '…' : ''}`,
      src, x: 20, y: 20, width: sizeMm, height: sizeMm,
      scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto',
    })
  }

  return (
    <CollapsibleSection label="QR Code">
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TEXTE OU URL</FieldLabel>
        <input type="text" value={text} placeholder="https://... ou n'importe quel texte"
          onChange={e => { setText(e.target.value); setError(null) }}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          className="fs-input"
          style={{
            width: '100%', background: '#fff', border: `1px solid ${error ? '#e53935' : '#d0d0d0'}`,
            color: '#333', borderRadius: 4, padding: '5px 8px', fontSize: 11,
            outline: 'none', boxSizing: 'border-box',
          }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <ColorPicker label="COULEUR" value={fgColor} onChange={setFgColor} />
        <div style={{ flex: 1 }}>
          <FieldLabel>TAILLE (mm)</FieldLabel>
          <input type="number" value={sizeMm} min={15} max={100} step={5}
            onChange={e => setSizeMm(Number(e.target.value))}
            className="fs-input" style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 6px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {error && <div style={{ fontSize: 10, color: '#e53935', marginBottom: 6 }}>{error}</div>}
      <button onClick={handleAdd} disabled={loading} className="fs-btn-primary" style={{
        width: '100%', background: loading ? '#999' : '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
      }}>{loading ? 'Génération...' : '+ Ajouter le QR Code'}</button>
    </CollapsibleSection>
  )
}
