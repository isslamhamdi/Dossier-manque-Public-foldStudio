'use client'
import { useRef, useEffect, useState } from 'react'

type CertId = 'fsc' | 'pefc' | 'eu-ecolabel' | 'recyclable' | 'iso14001' | 'nf-env' | 'c2c' | 'carbon-neutral'

interface CertConfig {
  id: CertId
  label: string
  color: string
  bgColor: string
}

const CERTS: CertConfig[] = [
  { id: 'fsc', label: 'FSC', color: '#2d6a2d', bgColor: '#e8f4e8' },
  { id: 'pefc', label: 'PEFC', color: '#1a5c2a', bgColor: '#e6f2e9' },
  { id: 'eu-ecolabel', label: 'EU Ecolabel', color: '#0054a6', bgColor: '#e0ecff' },
  { id: 'recyclable', label: 'Recyclable', color: '#1e88e5', bgColor: '#e3f2fd' },
  { id: 'iso14001', label: 'ISO 14001', color: '#5c6bc0', bgColor: '#ede7f6' },
  { id: 'nf-env', label: 'NF Env', color: '#00796b', bgColor: '#e0f2f1' },
  { id: 'c2c', label: 'Cradle to Cradle', color: '#f57c00', bgColor: '#fff3e0' },
  { id: 'carbon-neutral', label: 'Carbon Neutral', color: '#424242', bgColor: '#f5f5f5' },
]

function drawFSC(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  ctx.font = `bold ${s * 0.35}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('FSC', x, y + s * 0.15)
  ctx.font = `${s * 0.13}px sans-serif`
  ctx.fillText('Mix Credit', x, y + s * 0.32)
  // Tree silhouette
  ctx.beginPath()
  ctx.moveTo(x, y - s * 0.5)
  ctx.lineTo(x + s * 0.25, y - s * 0.15)
  ctx.lineTo(x + s * 0.15, y - s * 0.15)
  ctx.lineTo(x + s * 0.2, y + s * 0.05)
  ctx.lineTo(x - s * 0.2, y + s * 0.05)
  ctx.lineTo(x - s * 0.15, y - s * 0.15)
  ctx.lineTo(x - s * 0.25, y - s * 0.15)
  ctx.closePath()
  ctx.fill()
}

function drawPEFC(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  // Two trees
  for (let t = -1; t <= 1; t += 2) {
    ctx.beginPath()
    ctx.moveTo(x + t * s * 0.15, y - s * 0.45)
    ctx.lineTo(x + t * s * 0.35, y - s * 0.1)
    ctx.lineTo(x + t * s * 0.22, y - s * 0.1)
    ctx.lineTo(x + t * s * 0.25, y + s * 0.08)
    ctx.lineTo(x + t * s * 0.05, y + s * 0.08)
    ctx.lineTo(x + t * s * 0.07, y - s * 0.1)
    ctx.lineTo(x, y - s * 0.1)
    ctx.closePath()
    ctx.fill()
  }
  ctx.font = `bold ${s * 0.22}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('PEFC', x, y + s * 0.35)
  ctx.font = `${s * 0.12}px sans-serif`
  ctx.fillText('Certified', x, y + s * 0.5)
}

function drawEUEcolabel(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = s * 0.04
  // EU flower: center circle
  ctx.beginPath()
  ctx.arc(x, y - s * 0.05, s * 0.12, 0, Math.PI * 2)
  ctx.fill()
  // Petals
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const px = x + Math.cos(a) * s * 0.28
    const py = (y - s * 0.05) + Math.sin(a) * s * 0.28
    ctx.beginPath()
    ctx.arc(px, py, s * 0.1, 0, Math.PI * 2)
    ctx.fill()
  }
  // E letter
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${s * 0.22}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('€', x, y + s * 0.02)
  ctx.fillStyle = color
  ctx.font = `${s * 0.13}px sans-serif`
  ctx.fillText('EU Ecolabel', x, y + s * 0.38)
}

function drawRecyclable(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.07
  ctx.lineCap = 'round'
  // 3 arrows forming recycling triangle
  const r = s * 0.32
  for (let i = 0; i < 3; i++) {
    const a0 = (i / 3) * Math.PI * 2 - Math.PI / 2
    const a1 = ((i + 0.8) / 3) * Math.PI * 2 - Math.PI / 2
    ctx.beginPath()
    ctx.arc(x, y - s * 0.04, r, a0, a1)
    ctx.stroke()
    // arrowhead
    const ax = x + Math.cos(a1) * r
    const ay = (y - s * 0.04) + Math.sin(a1) * r
    const ta = a1 + Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.lineTo(ax + Math.cos(ta - 0.5) * s * 0.1, ay + Math.sin(ta - 0.5) * s * 0.1)
    ctx.lineTo(ax + Math.cos(ta + 0.5) * s * 0.1, ay + Math.sin(ta + 0.5) * s * 0.1)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.font = `${s * 0.13}px sans-serif`
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText('Recyclable', x, y + s * 0.44)
}

function drawISO14001(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.04
  ctx.beginPath()
  ctx.arc(x, y - s * 0.1, s * 0.35, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = `bold ${s * 0.22}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('ISO', x, y - s * 0.18)
  ctx.font = `bold ${s * 0.18}px sans-serif`
  ctx.fillText('14001', x, y + s * 0.02)
  ctx.font = `${s * 0.11}px sans-serif`
  ctx.fillText('Environmental', x, y + s * 0.37)
  ctx.fillText('Management', x, y + s * 0.5)
}

function drawNFEnv(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  // Hexagon
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.05
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6
    const px = x + Math.cos(a) * s * 0.38
    const py = (y - s * 0.05) + Math.sin(a) * s * 0.38
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = color
  ctx.font = `bold ${s * 0.28}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('NF', x, y - s * 0.08)
  ctx.font = `${s * 0.16}px sans-serif`
  ctx.fillText('Environnement', x, y + s * 0.45)
}

function drawC2C(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  // Two overlapping circles (cradle metaphor)
  ctx.beginPath()
  ctx.arc(x - s * 0.12, y - s * 0.1, s * 0.28, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x + s * 0.12, y - s * 0.1, s * 0.28, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.04
  ctx.stroke()
  ctx.font = `bold ${s * 0.16}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('C2C', x, y - s * 0.06)
  ctx.font = `${s * 0.12}px sans-serif`
  ctx.fillText('Cradle to Cradle', x, y + s * 0.35)
  ctx.fillText('Certified™', x, y + s * 0.48)
}

function drawCarbonNeutral(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color
  // Circle
  ctx.beginPath()
  ctx.arc(x, y - s * 0.12, s * 0.35, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.lineWidth = s * 0.04
  ctx.stroke()
  // Leaf
  ctx.beginPath()
  ctx.moveTo(x, y - s * 0.38)
  ctx.bezierCurveTo(x + s * 0.25, y - s * 0.25, x + s * 0.25, y + s * 0.06, x, y + s * 0.06)
  ctx.bezierCurveTo(x - s * 0.25, y + s * 0.06, x - s * 0.25, y - s * 0.25, x, y - s * 0.38)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${s * 0.14}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('CO₂', x, y - s * 0.06)
  ctx.fillStyle = color
  ctx.font = `${s * 0.13}px sans-serif`
  ctx.fillText('Carbon Neutral', x, y + s * 0.42)
}

function drawCert(ctx: CanvasRenderingContext2D, id: CertId, x: number, y: number, s: number, color: string) {
  ctx.save()
  switch (id) {
    case 'fsc': drawFSC(ctx, x, y, s, color); break
    case 'pefc': drawPEFC(ctx, x, y, s, color); break
    case 'eu-ecolabel': drawEUEcolabel(ctx, x, y, s, color); break
    case 'recyclable': drawRecyclable(ctx, x, y, s, color); break
    case 'iso14001': drawISO14001(ctx, x, y, s, color); break
    case 'nf-env': drawNFEnv(ctx, x, y, s, color); break
    case 'c2c': drawC2C(ctx, x, y, s, color); break
    case 'carbon-neutral': drawCarbonNeutral(ctx, x, y, s, color); break
  }
  ctx.restore()
}

function CertBadge({ cert, selected, onSelect }: { cert: CertConfig; selected: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const S = 70

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, S, S)
    drawCert(ctx, cert.id, S / 2, S / 2, S * 0.75, cert.color)
  }, [cert])

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
        padding: 6, borderRadius: 8,
        border: `2px solid ${selected ? cert.color : 'transparent'}`,
        background: selected ? cert.bgColor : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <canvas ref={ref} width={S} height={S} style={{ borderRadius: 6 }} />
      <span style={{ fontSize: 10, color: '#666', textAlign: 'center', lineHeight: 1.2 }}>{cert.label}</span>
    </div>
  )
}

function BadgePreview({ cert, size, showLabel }: { cert: CertConfig; size: number; showLabel: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, size, size)
    if (showLabel) {
      ctx.fillStyle = cert.bgColor
      ctx.beginPath()
      ctx.roundRect(0, 0, size, size, size * 0.08)
      ctx.fill()
    }
    drawCert(ctx, cert.id, size / 2, size / 2, size * 0.75, cert.color)
  }, [cert, size, showLabel])

  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: 8, border: '1px solid #eee' }} />
}

export function CertificationSection() {
  const [selected, setSelected] = useState<CertId>('fsc')
  const [size, setSize] = useState(80)
  const [showLabel, setShowLabel] = useState(true)

  const cert = CERTS.find(c => c.id === selected)!

  const handleExport = () => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    if (showLabel) {
      ctx.fillStyle = cert.bgColor
      ctx.beginPath()
      ctx.roundRect(0, 0, size, size, size * 0.08)
      ctx.fill()
    }
    drawCert(ctx, cert.id, size / 2, size / 2, size * 0.75, cert.color)
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `cert-${cert.id}-${size}px.png`
    a.click()
  }

  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '0 12px', fontSize: 11, color: '#888' }}>
        Logos de certification éco-responsable générés procéduralement. Cliquez pour sélectionner, puis exportez en PNG.
      </div>

      {/* Grid */}
      <div style={{ padding: '0 8px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {CERTS.map(c => (
          <CertBadge key={c.id} cert={c} selected={selected === c.id} onSelect={() => setSelected(c.id)} />
        ))}
      </div>

      {/* Preview + options */}
      <div style={{ padding: '0 12px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <BadgePreview cert={cert} size={120} showLabel={showLabel} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: '#888', display: 'block', marginBottom: 4 }}>Taille export: {size}px</label>
            <input
              type="range" min={40} max={200} value={size} onChange={e => setSize(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={showLabel} onChange={e => setShowLabel(e.target.checked)} />
            Fond coloré
          </label>

          <button
            onClick={handleExport}
            style={{
              background: cert.color, color: '#fff', border: 'none', borderRadius: 6,
              padding: '7px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Exporter PNG
          </button>
        </div>
      </div>
    </div>
  )
}
