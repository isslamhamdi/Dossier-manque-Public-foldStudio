'use client'

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

type Tab = 'nfc' | 'ndef' | 'iot' | 'qr'

const NFC_TYPES = ['NFC NTAG213', 'NFC NTAG215', 'NFC NTAG216', 'RFID UHF', 'RFID HF']
const IOT_SENSORS = ['Thermomètre', 'Hygromètre', 'Accéléromètre', 'Gyroscope', 'GPS']
const IOT_EMOJIS: Record<string, string> = {
  'Thermomètre': '≡',
  'Hygromètre': '~',
  'Accéléromètre': '▦',
  'Gyroscope': '↻',
  'GPS': '◎',
}
const NDEF_TYPES = ['URI', 'Text', 'vCard']

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #d0d0d0', borderRadius: 4,
  padding: '5px 8px', fontSize: 11, outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: '#333',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }
const btnPrimary: React.CSSProperties = {
  width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}
const btnDisabled: React.CSSProperties = { ...btnPrimary, background: '#999', cursor: 'default' }

function svgToDataUrl(svgStr: string, w = 60, h = 60): Promise<string> {
  return new Promise(resolve => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = url
  })
}

function emojiToDataUrl(emoji: string): Promise<string> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    canvas.width = 60; canvas.height = 60
    const ctx = canvas.getContext('2d')!
    ctx.font = '42px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, 30, 32)
    resolve(canvas.toDataURL('image/png'))
  })
}

const NFC_SVG = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="none" stroke="#333" stroke-width="2"/>
  <path d="M12 20 q8-8 16 0" fill="none" stroke="#333" stroke-width="2"/>
  <circle cx="20" cy="20" r="3" fill="#333"/>
</svg>`

function NFCTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [chipType, setChipType] = useState(NFC_TYPES[0])
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    setLoading(true)
    const src = await svgToDataUrl(NFC_SVG)
    setLoading(false)
    onAddLayer({
      id: `nfc-${Date.now()}`, name: `NFC — ${chipType}`, src,
      x: 10, y: 10, width: 15, height: 15,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'picto',
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE DE PUCE</FieldLabel>
        <select value={chipType} onChange={e => setChipType(e.target.value)} style={selectStyle}>
          {NFC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <button onClick={handleAdd} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Ajout...' : '+ Ajouter sur patron'}
      </button>
    </div>
  )
}

function NDEFTab() {
  const [type, setType] = useState(NDEF_TYPES[0])
  const [value, setValue] = useState('')
  const [hex, setHex] = useState('')
  const [byteCount, setByteCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleEncode = async () => {
    if (!value.trim()) return
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ndefLib: any = await import('ndef')
      const lib = ndefLib.default ?? ndefLib
      let record: unknown
      if (type === 'URI') record = lib.uriRecord(value.trim())
      else if (type === 'Text') record = lib.textRecord(value.trim())
      else record = lib.textRecord(value.trim())
      const encoded: number[] = lib.encodeMessage([record])
      const bytes = Array.from(encoded as number[])
      const hexStr = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
      setHex(hexStr)
      setByteCount(bytes.length)
    } catch {
      setHex('Erreur encodage')
      setByteCount(0)
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(hex)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE</FieldLabel>
        <select value={type} onChange={e => setType(e.target.value)} style={selectStyle}>
          {NDEF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>{type === 'URI' ? 'URL' : type === 'vCard' ? 'DONNÉES VCARD' : 'TEXTE'}</FieldLabel>
        <input
          type="text" value={value} onChange={e => setValue(e.target.value)}
          placeholder={type === 'URI' ? 'https://...' : 'Valeur...'}
          style={inputStyle}
        />
      </div>
      <button onClick={handleEncode} disabled={loading || !value.trim()} style={(loading || !value.trim()) ? btnDisabled : btnPrimary}>
        {loading ? 'Encodage...' : 'Encoder NDEF'}
      </button>
      {hex && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <FieldLabel>HEX ({byteCount} octets)</FieldLabel>
            <button onClick={handleCopy} style={{ fontSize: 10, background: 'none', border: '1px solid #d0d0d0', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: '#555' }}>
              {copied ? 'Copié ✓' : 'Copier'}
            </button>
          </div>
          <textarea readOnly value={hex} rows={3} style={{ ...inputStyle, fontFamily: 'monospace', resize: 'none', fontSize: 10, color: '#1a6e1a' }} />
        </div>
      )}
    </div>
  )
}

function IoTTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [sensor, setSensor] = useState(IOT_SENSORS[0])
  const [loading, setLoading] = useState(false)

  const handlePlace = async () => {
    setLoading(true)
    const src = await emojiToDataUrl(IOT_EMOJIS[sensor])
    setLoading(false)
    onAddLayer({
      id: `iot-${Date.now()}`, name: `IoT — ${sensor}`, src,
      x: 10, y: 10, width: 15, height: 15,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'picto',
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE DE CAPTEUR</FieldLabel>
        <select value={sensor} onChange={e => setSensor(e.target.value)} style={selectStyle}>
          {IOT_SENSORS.map(s => <option key={s} value={s}>{IOT_EMOJIS[s]} {s}</option>)}
        </select>
      </div>
      <button onClick={handlePlace} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Ajout...' : '+ Placer sur patron'}
      </button>
    </div>
  )
}

function QRDynaTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [baseUrl, setBaseUrl] = useState('')
  const [productId, setProductId] = useState('')
  const [traceable, setTraceable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resolvedUrl, setResolvedUrl] = useState('')

  const getFullUrl = () => {
    const base = baseUrl.trim().replace(/\/$/, '')
    const pid = productId.trim()
    let url = pid ? `${base}/${pid}` : base
    if (traceable) url += `?track=1&ts=${Date.now()}`
    return url
  }

  const handleGenerate = async () => {
    const url = getFullUrl()
    if (!url) return
    setLoading(true)
    setResolvedUrl(url)
    try {
      const QRCode = (await import('qrcode')).default
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, url, { width: 180, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
      const src = canvas.toDataURL('image/png')
      onAddLayer({
        id: `qrdyna-${Date.now()}`, name: `QR Dyn: ${productId || 'produit'}`, src,
        x: 20, y: 20, width: 30, height: 30,
        scale: 1, rotation: 0, visible: true, locked: false,
        faceAssignment: 'auto', kind: 'qr',
      })
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>URL DE BASE</FieldLabel>
        <input type="text" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://brand.com/product/" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>IDENTIFIANT PRODUIT</FieldLabel>
        <input type="text" value={productId} onChange={e => setProductId(e.target.value)} placeholder="ABC-001" style={inputStyle} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, cursor: 'pointer', fontSize: 11, color: '#555' }}>
        <input type="checkbox" checked={traceable} onChange={e => setTraceable(e.target.checked)} />
        Traçabilité
      </label>
      <button onClick={handleGenerate} disabled={loading || !baseUrl.trim()} style={(loading || !baseUrl.trim()) ? btnDisabled : btnPrimary}>
        {loading ? 'Génération...' : 'Générer QR'}
      </button>
      {resolvedUrl && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#555', wordBreak: 'break-all', background: '#f5f5f5', borderRadius: 4, padding: '5px 7px' }}>
          {resolvedUrl}
        </div>
      )}
    </div>
  )
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'nfc', label: 'NFC' },
  { id: 'ndef', label: 'NDEF' },
  { id: 'iot', label: 'IoT' },
  { id: 'qr', label: 'QR Dyn' },
]

interface SmartPackagingSectionProps {
  onAddLayer: (layer: ImageLayer) => void
}

export function SmartPackagingSection({ onAddLayer }: SmartPackagingSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('nfc')

  return (
    <CollapsibleSection label="SMART PACKAGING">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
        
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
              border: activeTab === tab.id ? 'none' : '1px solid #d0d0d0',
              background: activeTab === tab.id ? '#1a1a1a' : '#f5f5f5',
              color: activeTab === tab.id ? '#fff' : '#555',
              cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'nfc' && <NFCTab onAddLayer={onAddLayer} />}
      {activeTab === 'ndef' && <NDEFTab />}
      {activeTab === 'iot' && <IoTTab onAddLayer={onAddLayer} />}
      {activeTab === 'qr' && <QRDynaTab onAddLayer={onAddLayer} />}
    </CollapsibleSection>
  )
}
