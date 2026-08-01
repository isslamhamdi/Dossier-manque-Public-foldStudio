'use client'

import { useRef, useState, useCallback } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

// ── #376-385 : Simulation impression ──────────────────────────────────────────

type SimTab = 'cmyk' | 'dotgain' | 'overprint' | 'halftone' | 'steprepeat' | 'colorbars' | 'inktrap'

const TAB_LABELS: { id: SimTab; label: string }[] = [
  { id: 'cmyk',       label: 'CMYK' },
  { id: 'dotgain',    label: 'Dot Gain' },
  { id: 'overprint',  label: 'Surimpression' },
  { id: 'halftone',   label: 'Simili' },
  { id: 'steprepeat', label: 'Répétition' },
  { id: 'colorbars',  label: 'Barres coul.' },
  { id: 'inktrap',    label: 'Trapping' },
]

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

// ── canvas helpers ─────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

async function flattenLayers(layers: ImageLayer[], w: number, h: number, scale: number): Promise<ImageData | null> {
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  for (const l of layers) {
    if (!l.visible) continue
    try {
      const img = await loadImage(l.src)
      const lx = l.x * scale, ly = l.y * scale
      const lw = l.width * l.scale * scale, lh = l.height * l.scale * scale
      ctx.save()
      ctx.translate(lx + lw / 2, ly + lh / 2)
      ctx.rotate((l.rotation * Math.PI) / 180)
      ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh)
      ctx.restore()
    } catch { /* skip bad src */ }
  }
  return ctx.getImageData(0, 0, w, h)
}

function rgbToCmyk(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const k = 1 - Math.max(rn, gn, bn)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 1 }
  return {
    c: (1 - rn - k) / (1 - k),
    m: (1 - gn - k) / (1 - k),
    y: (1 - bn - k) / (1 - k),
    k,
  }
}

function cmykToRgb(c: number, m: number, y: number, k: number) {
  return {
    r: Math.round(255 * (1 - c) * (1 - k)),
    g: Math.round(255 * (1 - m) * (1 - k)),
    b: Math.round(255 * (1 - y) * (1 - k)),
  }
}

// Dot gain: darkens midtones by boosting cyan-equivalent density
function applyDotGain(px: Uint8ClampedArray, gain: number) {
  const out = new Uint8ClampedArray(px)
  const g = gain / 100
  for (let i = 0; i < out.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = out[i + c] / 255
      // Murray-Davies dot gain model: measured = nominal + gain * sin(π * nominal)
      const gained = v - g * Math.sin(Math.PI * v)
      out[i + c] = Math.round(Math.max(0, Math.min(1, gained)) * 255)
    }
  }
  return out
}

// Extract single CMYK channel as greyscale
function extractChannel(px: Uint8ClampedArray, ch: 'c' | 'm' | 'y' | 'k'): Uint8ClampedArray {
  const out = new Uint8ClampedArray(px.length)
  for (let i = 0; i < px.length; i += 4) {
    const { c, m, y, k } = rgbToCmyk(px[i], px[i + 1], px[i + 2])
    const vals = { c, m, y, k }
    const v = Math.round(vals[ch] * 255)
    out[i] = out[i + 1] = out[i + 2] = 255 - v
    out[i + 3] = px[i + 3]
  }
  return out
}

// Halftone: round dot screen at given angle and lpi
function halftoneScreen(
  px: Uint8ClampedArray, w: number, h: number,
  lpi: number, angleDeg: number, scale: number
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(px.length).fill(255)
  for (let i = 0; i < out.length; i += 4) out[i + 3] = 255
  const cellPx = scale / lpi * 25.4  // mm per inch → px per cell
  const ang = (angleDeg * Math.PI) / 180
  const cos = Math.cos(ang), sin = Math.sin(ang)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const grey = (0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2]) / 255
      const cx = x * cos + y * sin
      const cy = -x * sin + y * cos
      const fx = ((cx % cellPx) + cellPx) % cellPx - cellPx / 2
      const fy = ((cy % cellPx) + cellPx) % cellPx - cellPx / 2
      const dist = Math.sqrt(fx * fx + fy * fy)
      const radius = (cellPx / 2) * Math.sqrt(1 - grey)
      const v = dist < radius ? 0 : 255
      out[idx] = out[idx + 1] = out[idx + 2] = v
    }
  }
  return out
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const PREVIEW_W = 220
const PREVIEW_SCALE = 3  // px per mm

function usePreview(imageLayers: ImageLayer[], patronW: number, patronH: number) {
  const pw = Math.round(patronW * PREVIEW_SCALE)
  const ph = Math.round(patronH * PREVIEW_SCALE)
  return { pw, ph, scale: PREVIEW_SCALE, imageLayers }
}

function CMYKTab({ imageLayers, patronW, patronH }: { imageLayers: ImageLayer[]; patronW: number; patronH: number }) {
  const canvasRefs = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)]
  const [loading, setLoading] = useState(false)
  const { pw, ph, scale } = usePreview(imageLayers, patronW, patronH)
  const channels: ('c' | 'm' | 'y' | 'k')[] = ['c', 'm', 'y', 'k']
  const labels = ['Cyan', 'Magenta', 'Jaune', 'Noir']
  const colors = ['#00b0c8', '#e0006a', '#f0c800', '#333333']

  const handleSeparate = useCallback(async () => {
    setLoading(true)
    const data = await flattenLayers(imageLayers, pw, ph, scale)
    if (!data) { setLoading(false); return }
    channels.forEach((ch, i) => {
      const ref = canvasRefs[i].current
      if (!ref) return
      ref.width = pw; ref.height = ph
      const ctx = ref.getContext('2d')!
      const separated = extractChannel(data.data, ch)
      const id = new ImageData(new Uint8ClampedArray(separated.buffer as ArrayBuffer), pw, ph)
      ctx.putImageData(id, 0, 0)
    })
    setLoading(false)
  }, [imageLayers, pw, ph, scale])

  return (
    <div>
      <button onClick={handleSeparate} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Séparation...' : 'Séparer CMYK'}
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
        {channels.map((ch, i) => (
          <div key={ch}>
            <div style={{ fontSize: 9, fontWeight: 700, color: colors[i], marginBottom: 3, letterSpacing: 0.8 }}>{labels[i]}</div>
            <canvas ref={canvasRefs[i]} style={{ width: '100%', borderRadius: 3, border: '1px solid #e0e0e0', display: 'block' }} />
          </div>
        ))}
      </div>
      {!imageLayers.length && (
        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 8 }}>Aucun calque image</div>
      )}
    </div>
  )
}

function DotGainTab({ imageLayers, patronW, patronH }: { imageLayers: ImageLayer[]; patronW: number; patronH: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gain, setGain] = useState(15)
  const [loading, setLoading] = useState(false)
  const { pw, ph, scale } = usePreview(imageLayers, patronW, patronH)

  const handleApply = useCallback(async () => {
    setLoading(true)
    const data = await flattenLayers(imageLayers, pw, ph, scale)
    if (!data || !canvasRef.current) { setLoading(false); return }
    const gained = applyDotGain(data.data, gain)
    canvasRef.current.width = pw; canvasRef.current.height = ph
    canvasRef.current.getContext('2d')!.putImageData(new ImageData(gained, pw, ph), 0, 0)
    setLoading(false)
  }, [imageLayers, pw, ph, scale, gain])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>GAIN ({gain}%)</FieldLabel>
        <input type="range" min={0} max={30} value={gain} onChange={e => setGain(+e.target.value)}
          style={{ width: '100%', accentColor: '#1a1a1a' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#aaa' }}>
          <span>0% — offset</span><span>30% — journal</span>
        </div>
      </div>
      <button onClick={handleApply} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Simulation...' : 'Simuler dot gain'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 3, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

function OverprintTab({ imageLayers, patronW, patronH }: { imageLayers: ImageLayer[]; patronW: number; patronH: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'multiply' | 'darken' | 'color-burn'>('multiply')
  const { pw, ph, scale } = usePreview(imageLayers, patronW, patronH)

  const handleApply = useCallback(async () => {
    if (!canvasRef.current || imageLayers.length < 2) return
    setLoading(true)
    const cv = canvasRef.current
    cv.width = pw; cv.height = ph
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, pw, ph)
    for (const l of imageLayers) {
      if (!l.visible) continue
      try {
        const img = await loadImage(l.src)
        const lx = l.x * scale, ly = l.y * scale
        const lw = l.width * l.scale * scale, lh = l.height * l.scale * scale
        ctx.save()
        ctx.globalCompositeOperation = mode as GlobalCompositeOperation
        ctx.translate(lx + lw / 2, ly + lh / 2)
        ctx.rotate((l.rotation * Math.PI) / 180)
        ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh)
        ctx.restore()
      } catch { /* skip */ }
    }
    ctx.globalCompositeOperation = 'source-over'
    setLoading(false)
  }, [imageLayers, pw, ph, scale, mode])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>MODE</FieldLabel>
        <select value={mode} onChange={e => setMode(e.target.value as typeof mode)} style={inputStyle}>
          <option value="multiply">Multiply (encres opaques)</option>
          <option value="darken">Darken (knock-out)</option>
          <option value="color-burn">Color Burn (saturé)</option>
        </select>
      </div>
      <button onClick={handleApply} disabled={loading || imageLayers.length < 2}
        style={loading || imageLayers.length < 2 ? btnDisabled : btnPrimary}>
        {loading ? 'Simulation...' : 'Simuler surimpression'}
      </button>
      {imageLayers.length < 2 && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 6 }}>Nécessite ≥ 2 calques</div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 3, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

function HalftoneTab({ imageLayers, patronW, patronH }: { imageLayers: ImageLayer[]; patronW: number; patronH: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lpi, setLpi] = useState(150)
  const [angle, setAngle] = useState(45)
  const [loading, setLoading] = useState(false)
  const { pw, ph, scale } = usePreview(imageLayers, patronW, patronH)

  const handleApply = useCallback(async () => {
    setLoading(true)
    const data = await flattenLayers(imageLayers, pw, ph, scale)
    if (!data || !canvasRef.current) { setLoading(false); return }
    const screened = halftoneScreen(data.data, pw, ph, lpi, angle, scale)
    canvasRef.current.width = pw; canvasRef.current.height = ph
    canvasRef.current.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(screened.buffer as ArrayBuffer), pw, ph), 0, 0)
    setLoading(false)
  }, [imageLayers, pw, ph, scale, lpi, angle])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>LPI ({lpi})</FieldLabel>
          <input type="range" min={60} max={300} step={10} value={lpi} onChange={e => setLpi(+e.target.value)}
            style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
        <div>
          <FieldLabel>ANGLE ({angle}°)</FieldLabel>
          <input type="range" min={0} max={90} value={angle} onChange={e => setAngle(+e.target.value)}
            style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
      </div>
      <button onClick={handleApply} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Tramage...' : 'Simuler trame simili'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 3, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

function StepRepeatTab({ imageLayers, patronW, patronH, onAddLayer }: {
  imageLayers: ImageLayer[]
  patronW: number
  patronH: number
  onAddLayer: (l: ImageLayer) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cols, setCols] = useState(2)
  const [rows, setRows] = useState(2)
  const [gapH, setGapH] = useState(5)
  const [gapV, setGapV] = useState(5)
  const [loading, setLoading] = useState(false)
  const { pw, ph, scale } = usePreview(imageLayers, patronW, patronH)

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    const data = await flattenLayers(imageLayers, pw, ph, scale)
    if (!data || !canvasRef.current) { setLoading(false); return }

    const gapHpx = gapH * scale, gapVpx = gapV * scale
    const totalW = cols * pw + (cols - 1) * gapHpx
    const totalH = rows * ph + (rows - 1) * gapVpx

    const src = document.createElement('canvas')
    src.width = pw; src.height = ph
    src.getContext('2d')!.putImageData(data, 0, 0)

    const cv = canvasRef.current
    cv.width = totalW; cv.height = totalH
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, totalW, totalH)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * (pw + gapHpx)
        const y = r * (ph + gapVpx)
        ctx.drawImage(src, x, y)
      }
    }

    // Add as image layer
    const dataUrl = cv.toDataURL('image/png')
    onAddLayer({
      id: `steprepeat-${Date.now()}`,
      name: `Step & Repeat ${cols}×${rows}`,
      src: dataUrl,
      x: 0, y: 0,
      width: totalW / scale, height: totalH / scale,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'image',
    })
    setLoading(false)
  }, [imageLayers, pw, ph, scale, cols, rows, gapH, gapV, onAddLayer])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>COLONNES</FieldLabel>
          <input type="number" min={1} max={8} value={cols} onChange={e => setCols(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>LIGNES</FieldLabel>
          <input type="number" min={1} max={8} value={rows} onChange={e => setRows(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>ESPACE H (mm)</FieldLabel>
          <input type="number" min={0} max={50} value={gapH} onChange={e => setGapH(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>ESPACE V (mm)</FieldLabel>
          <input type="number" min={0} max={50} value={gapV} onChange={e => setGapV(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <button onClick={handleGenerate} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Génération...' : `Générer ${cols}×${rows} imposition`}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 3, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

// ── Color Bars CMJN ────────────────────────────────────────────────────────────
// Calibration strip: C/M/Y/K full patches + 10-step gray ramp + registration mark

function ColorBarsTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(520)
  const [barH, setBarH] = useState(18)
  const [showGrayRamp, setShowGrayRamp] = useState(true)
  const [showRegistration, setShowRegistration] = useState(true)

  const handleRender = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const PAD = 8
    const LABEL_W = 22
    const steps = 10

    const rows = 4 + (showGrayRamp ? 1 : 0)
    const H = PAD * 2 + rows * (barH + 3) + (showRegistration ? 24 : 0)
    cv.width = width; cv.height = H
    const ctx = cv.getContext('2d')!

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, H)

    const barW = width - PAD * 2 - LABEL_W
    const stepW = barW / steps

    const INKS = [
      { label: 'C', color: (v: number) => `rgb(0,${Math.round(255*(1-v))},${Math.round(255*(1-v))})` },
      { label: 'M', color: (v: number) => `rgb(${Math.round(255*(1-v))},0,${Math.round(255*(1-v))})` },
      { label: 'Y', color: (v: number) => `rgb(${Math.round(255*(1-v))},${Math.round(255*(1-v))},0)` },
      { label: 'K', color: (v: number) => `rgb(${Math.round(255*(1-v))},${Math.round(255*(1-v))},${Math.round(255*(1-v))})` },
    ]

    let y = PAD
    for (const ink of INKS) {
      // Label
      ctx.fillStyle = '#333'
      ctx.font = `bold ${barH * 0.6}px monospace`
      ctx.textAlign = 'left'
      ctx.fillText(ink.label, PAD, y + barH * 0.75)

      for (let s = 0; s < steps; s++) {
        const v = (s + 1) / steps
        ctx.fillStyle = ink.color(v)
        ctx.fillRect(PAD + LABEL_W + s * stepW, y, stepW - 1, barH)
        // % label on first and last
        if (s === 0 || s === steps - 1) {
          ctx.fillStyle = v < 0.5 ? '#666' : '#fff'
          ctx.font = `${barH * 0.5}px sans-serif`
          ctx.textAlign = 'center'
          ctx.fillText(`${Math.round(v * 100)}`, PAD + LABEL_W + s * stepW + stepW / 2, y + barH * 0.72)
        }
      }
      y += barH + 3
    }

    if (showGrayRamp) {
      ctx.fillStyle = '#333'
      ctx.font = `bold ${barH * 0.6}px monospace`
      ctx.textAlign = 'left'
      ctx.fillText('Gy', PAD, y + barH * 0.75)
      for (let s = 0; s < steps; s++) {
        const v = s / (steps - 1)
        const c = Math.round(255 * v)
        ctx.fillStyle = `rgb(${c},${c},${c})`
        ctx.fillRect(PAD + LABEL_W + s * stepW, y, stepW - 1, barH)
      }
      y += barH + 3
    }

    if (showRegistration) {
      // Registration cross for each channel
      const colors = ['#00ffff', '#ff00ff', '#ffff00', '#000000']
      const cx0 = PAD + LABEL_W + barW / 2 - 40
      for (let i = 0; i < 4; i++) {
        const cx = cx0 + i * 20
        const cy = y + 10
        ctx.strokeStyle = colors[i]
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke()
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.fillStyle = '#666'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText('Repères calage →', PAD, y + 14)
    }
  }, [width, barH, showGrayRamp, showRegistration])

  const handleExport = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const a = document.createElement('a')
    a.href = cv.toDataURL('image/png')
    a.download = 'barres-calibration-cmjn.png'
    a.click()
  }, [])

  return (
    <div>
      <div style={{ fontSize: 10, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>
        Génère une bande de calibration CMJN à 10 pas + rampe gris. À placer en marge de la feuille d&apos;impression.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>LARGEUR (px)</FieldLabel>
          <input type="number" min={200} max={1200} value={width} onChange={e => setWidth(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>HAUTEUR BARRE</FieldLabel>
          <input type="number" min={10} max={40} value={barH} onChange={e => setBarH(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={showGrayRamp} onChange={e => setShowGrayRamp(e.target.checked)} />
          Rampe gris
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={showRegistration} onChange={e => setShowRegistration(e.target.checked)} />
          Repères calage
        </label>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button onClick={handleRender} style={{ ...btnPrimary, flex: 1 }}>Générer</button>
        <button onClick={handleExport} style={{ ...btnPrimary, flex: 1, background: '#2d6a2d' }}>Exporter PNG</button>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

// ── Ink Trapping Zones ─────────────────────────────────────────────────────────
// Visualize where ink boundary overlaps (trapping zones) between adjacent color areas

function InkTrapTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [trapWidth, setTrapWidth] = useState(2)
  const [loading, setLoading] = useState(false)
  const [trapColor, setTrapColor] = useState('#ff6600')

  const handleAnalyze = useCallback(async () => {
    const cv = canvasRef.current
    if (!cv || !imageLayers.length) return
    setLoading(true)

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageLayers[0].src
    await new Promise(r => { img.onload = r; img.onerror = r })

    const W = Math.min(img.naturalWidth || 400, 400)
    const H = Math.round(W * ((img.naturalHeight || 300) / (img.naturalWidth || 400)))
    cv.width = W; cv.height = H

    const offscreen = document.createElement('canvas')
    offscreen.width = W; offscreen.height = H
    const octx = offscreen.getContext('2d')!
    octx.drawImage(img, 0, 0, W, H)
    const src = octx.getImageData(0, 0, W, H)

    const ctx = cv.getContext('2d')!
    ctx.drawImage(offscreen, 0, 0)

    // Detect color transitions: pixels where neighbor color changes significantly
    const out = ctx.getImageData(0, 0, W, H)
    const T = trapWidth

    for (let y = T; y < H - T; y++) {
      for (let x = T; x < W - T; x++) {
        const i = (y * W + x) * 4
        const r = src.data[i], g = src.data[i + 1], b = src.data[i + 2]
        let isTrap = false
        // Check neighbors at trapWidth distance
        for (let dy = -1; dy <= 1 && !isTrap; dy++) {
          for (let dx = -1; dx <= 1 && !isTrap; dx++) {
            if (dx === 0 && dy === 0) continue
            const ni = ((y + dy * T) * W + (x + dx * T)) * 4
            const nr = src.data[ni], ng = src.data[ni + 1], nb = src.data[ni + 2]
            const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb)
            if (diff > 80) isTrap = true
          }
        }
        if (isTrap) {
          // Highlight trap zone
          const hex = trapColor.replace('#', '')
          out.data[i] = parseInt(hex.slice(0, 2), 16)
          out.data[i + 1] = parseInt(hex.slice(2, 4), 16)
          out.data[i + 2] = parseInt(hex.slice(4, 6), 16)
          out.data[i + 3] = 200
        }
      }
    }
    ctx.putImageData(out, 0, 0)

    // Overlay legend
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, H - 22, W, 22)
    ctx.fillStyle = '#fff'
    ctx.font = '10px sans-serif'
    ctx.fillText(`Zones de trapping (±${trapWidth}px) — surligné en orange`, 6, H - 7)

    setLoading(false)
  }, [imageLayers, trapWidth, trapColor])

  return (
    <div>
      <div style={{ fontSize: 10, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>
        Visualise les zones de transition entre couleurs adjacentes. Ces zones doivent être élargies (trapping) pour éviter les halo blancs à l&apos;impression.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>LARGEUR TRAP (px)</FieldLabel>
          <input type="number" min={1} max={8} value={trapWidth} onChange={e => setTrapWidth(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>COULEUR HIGHLIGHT</FieldLabel>
          <input type="color" value={trapColor} onChange={e => setTrapColor(e.target.value)}
            style={{ ...inputStyle, height: 32, padding: 2 }} />
        </div>
      </div>
      <button onClick={handleAnalyze} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Analyse...' : 'Analyser zones de trapping'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
      {!imageLayers.length && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>Ajoutez des calques images d&apos;abord</div>
      )}
    </div>
  )
}

// ── Main section ───────────────────────────────────────────────────────────────

interface PrintSimSectionProps {
  imageLayers: ImageLayer[]
  patronWidth: number
  patronHeight: number
  onAddLayer: (l: ImageLayer) => void
}

export function PrintSimSection({ imageLayers, patronWidth, patronHeight, onAddLayer }: PrintSimSectionProps) {
  const [tab, setTab] = useState<SimTab>('cmyk')

  return (
    <CollapsibleSection label="SIMULATION IMPRESSION">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
        
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {TAB_LABELS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600,
            border: tab === t.id ? 'none' : '1px solid #d0d0d0',
            background: tab === t.id ? '#1a1a1a' : '#f5f5f5',
            color: tab === t.id ? '#fff' : '#555',
            cursor: 'pointer', letterSpacing: 0.4,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'cmyk'       && <CMYKTab imageLayers={imageLayers} patronW={patronWidth} patronH={patronHeight} />}
      {tab === 'dotgain'    && <DotGainTab imageLayers={imageLayers} patronW={patronWidth} patronH={patronHeight} />}
      {tab === 'overprint'  && <OverprintTab imageLayers={imageLayers} patronW={patronWidth} patronH={patronHeight} />}
      {tab === 'halftone'   && <HalftoneTab imageLayers={imageLayers} patronW={patronWidth} patronH={patronHeight} />}
      {tab === 'steprepeat' && <StepRepeatTab imageLayers={imageLayers} patronW={patronWidth} patronH={patronHeight} onAddLayer={onAddLayer} />}
      {tab === 'colorbars'  && <ColorBarsTab />}
      {tab === 'inktrap'    && <InkTrapTab imageLayers={imageLayers} />}
    </CollapsibleSection>
  )
}
