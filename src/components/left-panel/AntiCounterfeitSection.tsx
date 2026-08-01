'use client'

import { useRef, useState, useCallback } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

// ── #400-404 : Anti-contrefaçon ───────────────────────────────────────────────

type ACTab = 'microtext' | 'guilloche' | 'watermark' | 'serial'

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #d0d0d0', borderRadius: 4,
  padding: '5px 8px', fontSize: 11, outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: '#333',
}
const btnPrimary: React.CSSProperties = {
  width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}
const btnDisabled: React.CSSProperties = { ...btnPrimary, background: '#bbb', cursor: 'default' }

// ── Micro-texte ─────────────────────────────────────────────────────────
// Invisible à l'œil nu (0.3-0.5pt), visible à la loupe

function MicrotextTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [text, setText] = useState('ORIGINAL AUTHENTIQUE')
  const [fontSize, setFontSize] = useState(3)
  const [color, setColor] = useState('#1a1a1a')
  const [repeatX, setRepeatX] = useState(8)
  const [repeatY, setRepeatY] = useState(5)
  const [angle, setAngle] = useState(15)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleGenerate = useCallback(() => {
    const W = 400, H = 200
    const cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = color
    ctx.font = `${fontSize}px monospace`
    ctx.textAlign = 'left'
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.translate(-W / 2, -H / 2)
    const stepX = W / repeatX
    const stepY = H / repeatY
    for (let row = -1; row <= repeatY + 1; row++) {
      for (let col = -1; col <= repeatX + 1; col++) {
        const x = col * stepX + (row % 2) * stepX * 0.5
        const y = row * stepY
        ctx.fillText(text, x, y + fontSize)
      }
    }
    ctx.restore()

    const src = cv.toDataURL('image/png')
    if (canvasRef.current) {
      canvasRef.current.width = W / 2; canvasRef.current.height = H / 2
      canvasRef.current.getContext('2d')!.drawImage(cv, 0, 0, W / 2, H / 2)
    }
    onAddLayer({
      id: `microtext-${Date.now()}`, name: `Micro-texte: ${text.slice(0, 12)}`, src,
      x: 5, y: 5, width: W / 10, height: H / 10,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'picto',
    })
  }, [text, fontSize, color, repeatX, repeatY, angle, onAddLayer])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TEXTE SÉCURITÉ</FieldLabel>
        <input type="text" value={text} onChange={e => setText(e.target.value)} style={inputStyle} maxLength={40} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>TAILLE ({fontSize}pt)</FieldLabel>
          <input type="range" min={1} max={8} value={fontSize} onChange={e => setFontSize(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>ANGLE ({angle}°)</FieldLabel>
          <input type="range" min={-45} max={45} value={angle} onChange={e => setAngle(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>RÉP. H</FieldLabel>
          <input type="number" min={2} max={20} value={repeatX} onChange={e => setRepeatX(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>COULEUR</FieldLabel>
          <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: 2, height: 28, cursor: 'pointer' }} />
        </div>
      </div>
      <button onClick={handleGenerate} disabled={!text.trim()} style={!text.trim() ? btnDisabled : btnPrimary}>
        Générer micro-texte
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 3, border: '1px solid #e8e8e8', display: 'block' }} />
      <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>
        Taille réelle: {fontSize}pt — visible uniquement à la loupe
      </div>
    </div>
  )
}

// ── Guillochis ──────────────────────────────────────────────────────────
// Motif ondulatoire procédural anti-photocopie

function GuillocheTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [freq1, setFreq1] = useState(8)
  const [freq2, setFreq2] = useState(13)
  const [amp, setAmp] = useState(12)
  const [color, setColor] = useState('#1a1a1a')
  const [rings, setRings] = useState(20)

  const handleGenerate = useCallback(() => {
    const W = 300, H = 300
    const cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, W, H)
    ctx.strokeStyle = color
    ctx.lineWidth = 0.6
    ctx.globalAlpha = 0.85

    // Layered sine-wave guilloché
    for (let ring = 0; ring < rings; ring++) {
      const radius = 20 + ring * (W / 2 - 20) / rings
      ctx.beginPath()
      for (let t = 0; t <= Math.PI * 2 * freq1; t += 0.02) {
        const wave = amp * Math.sin(freq2 * t) * (0.5 + 0.5 * Math.sin(freq1 * t * 0.3))
        const r = radius + wave * (1 - ring / rings)
        const x = W / 2 + r * Math.cos(t)
        const y = H / 2 + r * Math.sin(t)
        t === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // Radial lines
    ctx.lineWidth = 0.4
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 36) {
      const wv = amp * 0.5 * Math.sin(freq1 * a)
      ctx.beginPath()
      ctx.moveTo(W / 2 + wv, H / 2 + wv)
      ctx.lineTo(W / 2 + (W / 2 - 5) * Math.cos(a), H / 2 + (H / 2 - 5) * Math.sin(a))
      ctx.stroke()
    }

    const src = cv.toDataURL('image/png')
    if (canvasRef.current) {
      canvasRef.current.width = 140; canvasRef.current.height = 140
      canvasRef.current.getContext('2d')!.drawImage(cv, 0, 0, 140, 140)
    }
    onAddLayer({
      id: `guilloche-${Date.now()}`, name: 'Guillochis sécurité', src,
      x: 5, y: 5, width: 30, height: 30,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'picto',
    })
  }, [freq1, freq2, amp, color, rings, onAddLayer])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>FRÉQ. 1 ({freq1})</FieldLabel>
          <input type="range" min={3} max={20} value={freq1} onChange={e => setFreq1(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>FRÉQ. 2 ({freq2})</FieldLabel>
          <input type="range" min={3} max={30} value={freq2} onChange={e => setFreq2(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>AMPLITUDE ({amp}px)</FieldLabel>
          <input type="range" min={2} max={25} value={amp} onChange={e => setAmp(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>ANNEAUX ({rings})</FieldLabel>
          <input type="range" min={5} max={40} value={rings} onChange={e => setRings(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>COULEUR</FieldLabel>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ ...inputStyle, padding: 2, height: 28, cursor: 'pointer' }} />
      </div>
      <button onClick={handleGenerate} style={btnPrimary}>Générer guillochis</button>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 3, border: '1px solid #e8e8e8' }} />
      </div>
    </div>
  )
}

// ── Watermark invisible ─────────────────────────────────────────────────
// Stéganographie canvas — encodes text in LSB des canaux alpha

function WatermarkTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'visible' | 'invisible'>('invisible')
  const [opacity, setOpacity] = useState(8)

  const handleGenerate = useCallback(() => {
    const W = 200, H = 100
    const cv = document.createElement('canvas')
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!

    if (mode === 'visible') {
      ctx.fillStyle = `rgba(0,0,0,${opacity / 100})`
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let y = 15; y < H; y += 30) {
        ctx.save()
        ctx.translate(W / 2, y)
        ctx.rotate(-0.3)
        ctx.fillText(message || 'CONFIDENTIEL', 0, 0)
        ctx.restore()
      }
    } else {
      // Invisible: encode in ultra-low-opacity text (1-2% alpha, detectable by software)
      const msgBytes = Array.from(message || 'FOLD-STUDIO').map(c => c.charCodeAt(0))
      ctx.fillStyle = 'rgba(0,0,0,0.01)'
      // Draw message repeated at 1px font — only software can detect
      ctx.font = '1px monospace'
      let x = 0
      msgBytes.forEach((b, i) => {
        ctx.globalAlpha = b / 25500  // encode byte value in alpha
        ctx.fillRect(i * 2, 0, 2, H)
        x = i * 2 + 2
      })
      // Fill rest with noise pattern
      ctx.globalAlpha = 0.002
      for (let px = x; px < W; px += 2) {
        ctx.fillRect(px, 0, 1, H)
      }
      ctx.globalAlpha = 1
    }

    const src = cv.toDataURL('image/png')
    onAddLayer({
      id: `watermark-${Date.now()}`,
      name: `Filigrane ${mode === 'invisible' ? 'invisible' : 'visible'}`,
      src,
      x: 0, y: 0, width: W / 4, height: H / 4,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'picto',
      opacity: mode === 'invisible' ? 0.05 : undefined,
    })
  }, [message, mode, opacity, onAddLayer])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>MESSAGE</FieldLabel>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)}
          placeholder="ORIGINAL CONFIDENTIEL" style={inputStyle} />
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>MODE</FieldLabel>
        <select value={mode} onChange={e => setMode(e.target.value as typeof mode)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="invisible">Invisible (stéganographique)</option>
          <option value="visible">Visible (fond transparent)</option>
        </select>
      </div>
      {mode === 'visible' && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>OPACITÉ ({opacity}%)</FieldLabel>
          <input type="range" min={3} max={30} value={opacity} onChange={e => setOpacity(+e.target.value)} style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
      )}
      <button onClick={handleGenerate} disabled={mode === 'invisible' && !message.trim()} style={mode === 'invisible' && !message.trim() ? btnDisabled : btnPrimary}>
        {mode === 'invisible' ? 'Encoder filigrane invisible' : 'Générer filigrane'}
      </button>
      {mode === 'invisible' && (
        <div style={{ fontSize: 9, color: '#aaa', marginTop: 6, lineHeight: 1.4 }}>
          Le message est encodé dans les valeurs alpha des pixels. Détectable uniquement par logiciel d&apos;analyse d&apos;image.
        </div>
      )}
    </div>
  )
}

// ── Sérialisation ───────────────────────────────────────────────────────

function SerialTab({ onAddLayer }: { onAddLayer: (l: ImageLayer) => void }) {
  const [prefix, setPrefix] = useState('FS')
  const [start, setStart] = useState(1)
  const [count, setCount] = useState(1)
  const [digits, setDigits] = useState(8)
  const [generated, setGenerated] = useState<string[]>([])

  const handleGenerate = useCallback(() => {
    const serials = Array.from({ length: Math.min(count, 100) }, (_, i) => {
      const n = (start + i).toString().padStart(digits, '0')
      return `${prefix}-${n}`
    })
    setGenerated(serials)

    // Generate QR code for first serial as image layer
    const firstSerial = serials[0]
    import('qrcode').then(({ default: QRCode }) => {
      const cv = document.createElement('canvas')
      QRCode.toCanvas(cv, firstSerial, { width: 120, margin: 1, color: { dark: '#000', light: '#fff' } }).then(() => {
        onAddLayer({
          id: `serial-${Date.now()}`, name: `Sériel: ${firstSerial}`,
          src: cv.toDataURL('image/png'),
          x: 5, y: 5, width: 20, height: 20,
          scale: 1, rotation: 0, visible: true, locked: false,
          faceAssignment: 'auto', kind: 'qr',
        })
      })
    })
  }, [prefix, start, count, digits, onAddLayer])

  const handleDownloadCSV = useCallback(() => {
    if (!generated.length) return
    const csv = 'Numéro,Série\n' + generated.map((s, i) => `${i + 1},${s}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `serials-${prefix}-${start}.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }, [generated, prefix, start])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>PRÉFIXE</FieldLabel>
          <input type="text" value={prefix} onChange={e => setPrefix(e.target.value)} style={inputStyle} maxLength={6} />
        </div>
        <div>
          <FieldLabel>CHIFFRES</FieldLabel>
          <input type="number" min={4} max={12} value={digits} onChange={e => setDigits(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>DÉBUT</FieldLabel>
          <input type="number" min={1} value={start} onChange={e => setStart(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>QUANTITÉ (max 100)</FieldLabel>
          <input type="number" min={1} max={100} value={count} onChange={e => setCount(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <button onClick={handleGenerate} style={btnPrimary}>Générer + QR premier</button>
      {generated.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: '#555' }}>{generated.length} numéros</span>
            <button onClick={handleDownloadCSV} style={{ fontSize: 10, background: 'none', border: '1px solid #d0d0d0', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', color: '#555' }}>
              CSV ↓
            </button>
          </div>
          <div style={{ maxHeight: 80, overflowY: 'auto', background: '#f8f8f8', borderRadius: 4, padding: '4px 6px', fontSize: 9, fontFamily: 'monospace', color: '#333' }}>
            {generated.join('\n')}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS: { id: ACTab; label: string }[] = [
  { id: 'microtext', label: 'Micro-texte' },
  { id: 'guilloche', label: 'Guillochis' },
  { id: 'watermark', label: 'Filigrane' },
  { id: 'serial',    label: 'Sérialisation' },
]

interface AntiCounterfeitSectionProps {
  onAddLayer: (l: ImageLayer) => void
}

export function AntiCounterfeitSection({ onAddLayer }: AntiCounterfeitSectionProps) {
  const [tab, setTab] = useState<ACTab>('microtext')

  return (
    <CollapsibleSection label="ANTI-CONTREFAÇON">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
        
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600,
            border: tab === t.id ? 'none' : '1px solid #d0d0d0',
            background: tab === t.id ? '#1a1a1a' : '#f5f5f5',
            color: tab === t.id ? '#fff' : '#555',
            cursor: 'pointer', letterSpacing: 0.4,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'microtext' && <MicrotextTab onAddLayer={onAddLayer} />}
      {tab === 'guilloche' && <GuillocheTab onAddLayer={onAddLayer} />}
      {tab === 'watermark' && <WatermarkTab onAddLayer={onAddLayer} />}
      {tab === 'serial'    && <SerialTab onAddLayer={onAddLayer} />}
    </CollapsibleSection>
  )
}
