'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

// ── #466-471 : Print QA ────────────────────────────────────────────────────────

type QATab = 'macro' | 'defects' | 'registration' | 'moire' | 'scumming'

const TAB_LABELS: { id: QATab; label: string }[] = [
  { id: 'macro',        label: 'Macro' },
  { id: 'defects',      label: 'Défauts' },
  { id: 'registration', label: 'Repérage' },
  { id: 'moire',        label: 'Moiré' },
  { id: 'scumming',     label: 'Scumming' },
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => res(img)
    img.onerror = rej
    img.src = src
  })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

// ── #466 MacroTab ──────────────────────────────────────────────────────────────

function MacroTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [zoom, setZoom] = useState<2 | 4 | 8>(4)
  const [dpi, setDpi] = useState(300)
  const [loading, setLoading] = useState(false)

  const dpiLabel = dpi < 150
    ? { text: 'ATTENTION : pixellisation à l\'impression', color: '#d32f2f' }
    : dpi <= 300
      ? { text: 'Acceptable offset', color: '#f57c00' }
      : { text: 'HD offset', color: '#2e7d32' }

  const handleRender = useCallback(async () => {
    const cv = canvasRef.current
    if (!cv) return
    setLoading(true)

    const W = 300, H = 200
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, W, H)

    if (imageLayers.length > 0) {
      try {
        const img = await loadImage(imageLayers[0].src)
        const srcW = img.naturalWidth || img.width
        const srcH = img.naturalHeight || img.height
        const regionW = 200 / zoom
        const regionH = 200 / zoom
        const srcX = Math.max(0, (srcW - regionW) / 2)
        const srcY = Math.max(0, (srcH - regionH) / 2)
        const inset = (W - 200) / 2
        ctx.drawImage(img, srcX, srcY, regionW, regionH, inset, 0, 200, 200)

        // crosshair
        ctx.strokeStyle = 'rgba(255,0,0,0.7)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(inset + 100, 0); ctx.lineTo(inset + 100, 200); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(inset, 100); ctx.lineTo(inset + 200, 100); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,0,0,0.5)'
        ctx.beginPath(); ctx.arc(inset + 100, 100, 20, 0, Math.PI * 2); ctx.stroke()
      } catch {
        ctx.fillStyle = '#ccc'
        ctx.fillRect(50, 0, 200, 200)
        ctx.fillStyle = '#888'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('Erreur chargement', 150, 105)
      }
    } else {
      // test pattern
      for (let y = 0; y < 200; y += 10) {
        for (let x = 50; x < 250; x += 10) {
          ctx.fillStyle = (x + y) % 20 === 0 ? '#bbb' : '#e8e8e8'
          ctx.fillRect(x, y, 10, 10)
        }
      }
      ctx.strokeStyle = 'rgba(200,50,50,0.6)'
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(150, 200); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(50, 100); ctx.lineTo(250, 100); ctx.stroke()
    }

    // zoom badge
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, 42, 20)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${zoom}×`, 6, 14)

    setLoading(false)
  }, [imageLayers, zoom])

  useEffect(() => { handleRender() }, [handleRender])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>ZOOM</FieldLabel>
          <select value={zoom} onChange={e => setZoom(+e.target.value as 2 | 4 | 8)} style={inputStyle}>
            <option value={2}>2×</option>
            <option value={4}>4×</option>
            <option value={8}>8×</option>
          </select>
        </div>
        <div>
          <FieldLabel>DPI FICHIER</FieldLabel>
          <input type="number" min={72} max={1200} value={dpi} onChange={e => setDpi(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderRadius: 5, background: dpi < 150 ? '#fdecea' : dpi <= 300 ? '#fff3e0' : '#e8f5e9', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: dpiLabel.color }}>{dpiLabel.text}</span>
        <span style={{ fontSize: 9, color: '#888', marginLeft: 6 }}>{dpi} dpi</span>
      </div>
      <button onClick={handleRender} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Rendu...' : 'Aperçu macro texture'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
      {!imageLayers.length && (
        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 4 }}>Aucun calque — rendu test pattern</div>
      )}
    </div>
  )
}

// ── #467 DefectsTab ────────────────────────────────────────────────────────────

type DefectType = 'registration' | 'ghosting' | 'hickey' | 'smearing' | 'backtrap'

const DEFECT_LABELS: { id: DefectType; label: string }[] = [
  { id: 'registration', label: 'Repérage' },
  { id: 'ghosting',     label: 'Fantôme' },
  { id: 'hickey',       label: 'Hickey' },
  { id: 'smearing',     label: 'Brossage' },
  { id: 'backtrap',     label: 'Backtrap' },
]

function DefectsTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [defect, setDefect] = useState<DefectType>('ghosting')
  const [intensity, setIntensity] = useState(50)
  const [loading, setLoading] = useState(false)

  const W = 300, H = 200

  const handleApply = useCallback(async () => {
    const cv = canvasRef.current
    if (!cv) return
    setLoading(true)
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, W, H)

    const alpha = intensity / 100

    if (imageLayers.length > 0) {
      try {
        const img = await loadImage(imageLayers[0].src)
        ctx.drawImage(img, 0, 0, W, H)
      } catch { /* draw test pattern below */ }
    } else {
      // test pattern: gradient bars
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, '#e00')
      grad.addColorStop(0.33, '#0a0')
      grad.addColorStop(0.66, '#00c')
      grad.addColorStop(1, '#000')
      ctx.fillStyle = grad
      ctx.fillRect(0, 40, W, 120)
      ctx.fillStyle = '#ccc'
      ctx.fillRect(0, 0, W, 40)
      ctx.fillRect(0, 160, W, 40)
    }

    if (defect === 'registration') {
      const off = Math.round(alpha * 8)
      ctx.globalAlpha = 0.4 * alpha
      ctx.fillStyle = 'rgba(0,255,255,0.5)'
      ctx.fillRect(off, off, W, H)
      ctx.fillStyle = 'rgba(255,0,255,0.5)'
      ctx.fillRect(-off, 0, W, H)
      ctx.fillStyle = 'rgba(255,255,0,0.5)'
      ctx.fillRect(0, -off, W, H)
      ctx.globalAlpha = 1
    } else if (defect === 'ghosting') {
      ctx.globalAlpha = 0.15 * alpha
      ctx.drawImage(cv, Math.round(20 * alpha), Math.round(15 * alpha), W, H)
      ctx.globalAlpha = 1
    } else if (defect === 'hickey') {
      const count = Math.round(1 + alpha * 5)
      for (let i = 0; i < count; i++) {
        const cx = 40 + (i * 60) % (W - 60)
        const cy = 30 + (i * 50) % (H - 60)
        const r = 6 + i * 2
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'; ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.stroke()
      }
    } else if (defect === 'smearing') {
      const blurPx = Math.round(alpha * 12)
      const id = ctx.getImageData(0, 0, W, H)
      const out = new Uint8ClampedArray(id.data)
      for (let y = 0; y < H; y++) {
        for (let x = blurPx; x < W; x++) {
          const i = (y * W + x) * 4
          for (let c = 0; c < 3; c++) {
            let sum = 0
            for (let dx = 0; dx <= blurPx; dx++) sum += id.data[(y * W + x - dx) * 4 + c]
            out[i + c] = Math.round(sum / (blurPx + 1))
          }
        }
      }
      ctx.putImageData(new ImageData(out, W, H), 0, 0)
    } else if (defect === 'backtrap') {
      ctx.globalAlpha = 0.08 + 0.2 * alpha
      ctx.fillStyle = '#7a5c2a'
      ctx.fillRect(0, H - Math.round(H * 0.3 * alpha), W, Math.round(H * 0.3 * alpha))
      ctx.globalAlpha = 1
    }

    // label
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, H - 18, W, 18)
    ctx.fillStyle = '#fff'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Défaut: ${DEFECT_LABELS.find(d => d.id === defect)?.label} — intensité ${intensity}%`, 5, H - 5)

    setLoading(false)
  }, [imageLayers, defect, intensity])

  useEffect(() => { handleApply() }, [handleApply])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>TYPE DÉFAUT</FieldLabel>
          <select value={defect} onChange={e => setDefect(e.target.value as DefectType)} style={inputStyle}>
            {DEFECT_LABELS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>INTENSITÉ ({intensity}%)</FieldLabel>
          <input type="range" min={0} max={100} value={intensity} onChange={e => setIntensity(+e.target.value)}
            style={{ width: '100%', accentColor: '#1a1a1a' }} />
        </div>
      </div>
      <button onClick={handleApply} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Simulation...' : 'Simuler défaut'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

// ── #468 RegistrationTab ───────────────────────────────────────────────────────

function RegistrationTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [offC, setOffC] = useState(0.1)
  const [offM, setOffM] = useState(-0.05)
  const [offY, setOffY] = useState(0.08)

  const W = 300, H = 200
  const PX_PER_MM = 96 / 25.4

  const totalError = Math.sqrt(offC ** 2 + offM ** 2 + offY ** 2) * 1000
  const errorLabel = totalError < 100
    ? { text: `Bon repérage (${totalError.toFixed(0)} μm)`, color: '#2e7d32' }
    : totalError < 200
      ? { text: `Acceptable (${totalError.toFixed(0)} μm)`, color: '#f57c00' }
      : { text: `Hors tolérance (${totalError.toFixed(0)} μm)`, color: '#d32f2f' }

  const handleRender = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, W, H)

    const cx = W / 2, cy = H / 2
    const offsets = [
      { dx: offC * PX_PER_MM, dy: offC * PX_PER_MM, color: 'rgba(0,200,230,0.7)', label: 'C' },
      { dx: offM * PX_PER_MM, dy: offM * PX_PER_MM, color: 'rgba(220,0,100,0.7)', label: 'M' },
      { dx: offY * PX_PER_MM, dy: 0,                 color: 'rgba(220,200,0,0.7)', label: 'Y' },
      { dx: 0,                dy: 0,                  color: 'rgba(20,20,20,0.9)',  label: 'K' },
    ]

    for (const o of offsets) {
      const ox = cx + o.dx, oy = cy + o.dy
      ctx.strokeStyle = o.color
      ctx.lineWidth = 1.5
      // crosshair
      ctx.beginPath(); ctx.moveTo(ox - 30, oy); ctx.lineTo(ox + 30, oy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(ox, oy - 30); ctx.lineTo(ox, oy + 30); ctx.stroke()
      // circle
      ctx.beginPath(); ctx.arc(ox, oy, 15, 0, Math.PI * 2); ctx.stroke()
      // box
      ctx.strokeRect(ox - 25, oy - 20, 50, 40)
      // label
      ctx.fillStyle = o.color
      ctx.font = 'bold 9px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(o.label, ox + 18, oy - 4)
    }

    // legend
    ctx.fillStyle = '#f8f8f8'
    ctx.fillRect(0, H - 22, W, 22)
    ctx.fillStyle = '#666'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`C: ${offC > 0 ? '+' : ''}${offC.toFixed(2)}mm   M: ${offM > 0 ? '+' : ''}${offM.toFixed(2)}mm   Y: ${offY > 0 ? '+' : ''}${offY.toFixed(2)}mm   K: 0`, 6, H - 7)
  }, [offC, offM, offY, PX_PER_MM])

  useEffect(() => { handleRender() }, [handleRender])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div>
          <FieldLabel>OFFSET C (mm)</FieldLabel>
          <input type="number" step={0.01} min={-0.5} max={0.5} value={offC}
            onChange={e => setOffC(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>OFFSET M (mm)</FieldLabel>
          <input type="number" step={0.01} min={-0.5} max={0.5} value={offM}
            onChange={e => setOffM(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>OFFSET Y (mm)</FieldLabel>
          <input type="number" step={0.01} min={-0.5} max={0.5} value={offY}
            onChange={e => setOffY(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ padding: '6px 10px', borderRadius: 5, marginBottom: 10,
        background: totalError < 100 ? '#e8f5e9' : totalError < 200 ? '#fff3e0' : '#fdecea' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: errorLabel.color }}>{errorLabel.text}</span>
        <span style={{ fontSize: 9, color: '#999', marginLeft: 6 }}>Réf: ±0.1mm offset</span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

// ── #469 MoireTab ──────────────────────────────────────────────────────────────

function MoireTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [lpi1, setLpi1] = useState(150)
  const [angle1, setAngle1] = useState(45)
  const [lpi2, setLpi2] = useState(150)
  const [angle2, setAngle2] = useState(75)

  const W = 300, H = 160
  const SCALE = 3

  const angleDiff = Math.abs(((angle2 - angle1 + 180) % 180))
  const normalizedDiff = angleDiff > 90 ? 180 - angleDiff : angleDiff
  const isMoire = normalizedDiff < 15 || normalizedDiff > 45
  const risk = isMoire ? 'RISQUE MOIRÉ' : 'OK'
  const riskColor = isMoire ? '#d32f2f' : '#2e7d32'

  const STANDARD = [
    { label: 'C=15°', angle: 15 },
    { label: 'M=75°', angle: 75 },
    { label: 'Y=90°', angle: 90 },
    { label: 'K=45°', angle: 45 },
  ]

  const drawHalftoneLine = useCallback((ctx: CanvasRenderingContext2D, lpi: number, angleDeg: number, color: string, alpha: number) => {
    const cellPx = SCALE / lpi * 25.4
    const ang = (angleDeg * Math.PI) / 180
    const cos = Math.cos(ang), sin = Math.sin(ang)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = 0.8
    for (let i = -W; i < W * 2; i += cellPx) {
      ctx.beginPath()
      const x0 = cos * i - sin * -H
      const y0 = sin * i + cos * -H
      const x1 = cos * i - sin * H * 2
      const y1 = sin * i + cos * H * 2
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke()
    }
    ctx.restore()
  }, [SCALE])

  const handleRender = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, W, H)

    drawHalftoneLine(ctx, lpi1, angle1, '#1a1a1a', 0.55)
    drawHalftoneLine(ctx, lpi2, angle2, '#cc2222', 0.45)

    // risk overlay
    if (isMoire) {
      ctx.fillStyle = 'rgba(211,47,47,0.07)'
      ctx.fillRect(0, 0, W, H)
    }

    // footer
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.fillRect(0, H - 20, W, 20)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 9px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Δangle = ${normalizedDiff.toFixed(1)}° — ${risk}`, 6, H - 6)
    ctx.fillStyle = '#aaa'
    ctx.font = '9px sans-serif'
    ctx.fillText(`Trame 1 (noir)  Trame 2 (rouge)`, W - 6, H - 6)
    ctx.textAlign = 'right'
  }, [lpi1, angle1, lpi2, angle2, isMoire, normalizedDiff, risk, drawHalftoneLine])

  useEffect(() => { handleRender() }, [handleRender])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>TRAME 1 — LPI</FieldLabel>
          <input type="number" min={60} max={300} value={lpi1} onChange={e => setLpi1(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>TRAME 1 — ANGLE (°)</FieldLabel>
          <input type="number" min={0} max={180} value={angle1} onChange={e => setAngle1(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>TRAME 2 — LPI</FieldLabel>
          <input type="number" min={60} max={300} value={lpi2} onChange={e => setLpi2(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>TRAME 2 — ANGLE (°)</FieldLabel>
          <input type="number" min={0} max={180} value={angle2} onChange={e => setAngle2(+e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
        {STANDARD.map(s => (
          <button key={s.label} onClick={() => setAngle1(s.angle)} style={{
            padding: '2px 7px', borderRadius: 20, fontSize: 9, fontWeight: 600,
            border: '1px solid #d0d0d0', background: angle1 === s.angle ? '#1a1a1a' : '#f5f5f5',
            color: angle1 === s.angle ? '#fff' : '#555', cursor: 'pointer',
          }}>{s.label}</button>
        ))}
      </div>

      <div style={{
        padding: '6px 10px', borderRadius: 5, marginBottom: 10,
        background: isMoire ? '#fdecea' : '#e8f5e9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: riskColor }}>{risk}</span>
        <span style={{ fontSize: 9, color: '#888' }}>Δ{normalizedDiff.toFixed(1)}° — seuil: 15° à 45°</span>
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
    </div>
  )
}

// ── #471 ScummingTab ───────────────────────────────────────────────────────────

function ScummingTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{ safe: number; warn: number; risk: number } | null>(null)

  const W = 300, H = 200

  const handleAnalyze = useCallback(async () => {
    const cv = canvasRef.current
    if (!cv) return
    setLoading(true)
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!

    let srcData: ImageData

    if (imageLayers.length > 0) {
      try {
        const img = await loadImage(imageLayers[0].src)
        const tmp = document.createElement('canvas')
        tmp.width = W; tmp.height = H
        tmp.getContext('2d')!.drawImage(img, 0, 0, W, H)
        srcData = tmp.getContext('2d')!.getImageData(0, 0, W, H)
      } catch {
        srcData = buildTestPattern(W, H)
      }
    } else {
      srcData = buildTestPattern(W, H)
    }

    // Draw original underneath
    ctx.putImageData(srcData, 0, 0)

    // Compute per-pixel TAC and draw heatmap overlay
    const heat = new Uint8ClampedArray(W * H * 4)
    let safe = 0, warn = 0, risk = 0
    for (let i = 0; i < srcData.data.length; i += 4) {
      const r = srcData.data[i], g = srcData.data[i + 1], b = srcData.data[i + 2]
      // Approximate CMYK from RGB: TAC = C+M+Y+K
      const nr = r / 255, ng = g / 255, nb = b / 255
      const k = 1 - Math.max(nr, ng, nb)
      const c = k === 1 ? 0 : (1 - nr - k) / (1 - k)
      const m = k === 1 ? 0 : (1 - ng - k) / (1 - k)
      const y = k === 1 ? 0 : (1 - nb - k) / (1 - k)
      const tac = (c + m + y + k) * 100

      const pi = i
      if (tac > 300) {
        heat[pi] = 220; heat[pi + 1] = 20; heat[pi + 2] = 20; heat[pi + 3] = 160
        risk++
      } else if (tac > 200) {
        heat[pi] = 255; heat[pi + 1] = 180; heat[pi + 2] = 0; heat[pi + 3] = 130
        warn++
      } else {
        heat[pi] = 30; heat[pi + 1] = 180; heat[pi + 2] = 60; heat[pi + 3] = 60
        safe++
      }
    }

    const heatCanvas = document.createElement('canvas')
    heatCanvas.width = W; heatCanvas.height = H
    heatCanvas.getContext('2d')!.putImageData(new ImageData(heat, W, H), 0, 0)
    ctx.drawImage(heatCanvas, 0, 0)

    // Legend
    const total = safe + warn + risk
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.fillRect(0, H - 26, W, 26)
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillStyle = '#2e7d32'
    ctx.fillText(`Sûr ${((safe / total) * 100).toFixed(0)}%`, 6, H - 14)
    ctx.fillStyle = '#e65c00'
    ctx.fillText(`Avert. ${((warn / total) * 100).toFixed(0)}%`, 70, H - 14)
    ctx.fillStyle = '#d32f2f'
    ctx.fillText(`Risque TAC>300% ${((risk / total) * 100).toFixed(0)}%`, 140, H - 14)
    ctx.fillStyle = '#888'
    ctx.font = '8px sans-serif'
    ctx.fillText('Vert: <200% — Jaune: 200-300% — Rouge: >300% TAC', 6, H - 4)

    setStats({ safe, warn, risk })
    setLoading(false)
  }, [imageLayers])

  return (
    <div>
      <div style={{ fontSize: 10, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>
        Heatmap couverture d&apos;encre. Rouge = risque scumming (TAC &gt; 300%).
      </div>
      <button onClick={handleAnalyze} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Analyse...' : 'Analyser heatmap scumming'}
      </button>
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 8 }}>
          {[
            { label: 'Sûr', val: stats.safe, color: '#2e7d32', bg: '#e8f5e9' },
            { label: 'Avert.', val: stats.warn, color: '#e65c00', bg: '#fff3e0' },
            { label: 'Risque', val: stats.risk, color: '#d32f2f', bg: '#fdecea' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 4, padding: '4px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: s.color, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 10, color: '#444' }}>{((s.val / (stats.safe + stats.warn + stats.risk)) * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
      {!imageLayers.length && (
        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 4 }}>Aucun calque — démo patches synthétiques</div>
      )}
    </div>
  )
}

function buildTestPattern(W: number, H: number): ImageData {
  const data = new Uint8ClampedArray(W * H * 4)
  const patches = [
    { x: 0,         y: 0,        w: W / 3,     h: H / 2,     r: 255, g: 50,  b: 50 },
    { x: W / 3,     y: 0,        w: W / 3,     h: H / 2,     r: 0,   g: 200, b: 50 },
    { x: W * 2 / 3, y: 0,        w: W / 3,     h: H / 2,     r: 30,  g: 30,  b: 220 },
    { x: 0,         y: H / 2,    w: W / 2,     h: H / 2,     r: 0,   g: 0,   b: 0 },
    { x: W / 2,     y: H / 2,    w: W / 2,     h: H / 2,     r: 240, g: 230, b: 0 },
  ]
  for (const p of patches) {
    for (let py = Math.round(p.y); py < Math.round(p.y + p.h); py++) {
      for (let px = Math.round(p.x); px < Math.round(p.x + p.w); px++) {
        const i = (py * W + px) * 4
        data[i] = p.r; data[i + 1] = p.g; data[i + 2] = p.b; data[i + 3] = 255
      }
    }
  }
  return new ImageData(data, W, H)
}

// ── Main section ───────────────────────────────────────────────────────────────

export function PrintQASection({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const [tab, setTab] = useState<QATab>('macro')

  return (
    <CollapsibleSection label="CONTRÔLE QUALITÉ IMPRESSION">
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

      {tab === 'macro'        && <MacroTab imageLayers={imageLayers} />}
      {tab === 'defects'      && <DefectsTab imageLayers={imageLayers} />}
      {tab === 'registration' && <RegistrationTab />}
      {tab === 'moire'        && <MoireTab />}
      {tab === 'scumming'     && <ScummingTab imageLayers={imageLayers} />}
    </CollapsibleSection>
  )
}
