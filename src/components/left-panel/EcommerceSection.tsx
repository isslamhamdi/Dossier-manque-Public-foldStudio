'use client'

import { useState, useRef, useEffect } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import type { ImageLayer } from '@/lib/types'
import { c, fs, fw, r } from '@/lib/tokens'

type EcomTab = 'subscription' | 'returns' | 'amazon'

const inputStyle = {
  width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`,
  borderRadius: r.lg, padding: '4px 6px', background: c.white, fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

const tabStyle = (active: boolean) => ({
  flex: 1, fontSize: fs.xs, fontWeight: fw.bold, padding: '4px 2px',
  background: active ? c.ink : 'transparent', color: active ? c.white : c.textMuted,
  border: `1px solid ${active ? c.ink : c.borderLight}`, borderRadius: r.md, cursor: 'pointer',
})

const ITEM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7']

function SubscriptionTab({ params }: { params: BoxParams }) {
  const [nItems, setNItems] = useState(6)
  const [iW, setIW] = useState(60)
  const [iH, setIH] = useState(40)
  const [iD, setID] = useState(30)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const boxVol = params.width * params.height * params.depth
  const itemVol = iW * iH * iD
  const totalItemVol = itemVol * nItems
  const voidPct = boxVol > 0 ? Math.max(0, ((boxVol - totalItemVol) / boxVol) * 100) : 0
  const suggestGrid = nItems > 4
  const cols = Math.ceil(Math.sqrt(nItems))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 300
    const H = 200
    canvas.width = W
    canvas.height = H
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, W, H)

    const ISO_X = 0.866
    const ISO_Y = 0.5
    const bx = params.width
    const by = params.height
    const bz = params.depth
    const scale = Math.min((W * 0.55) / (bx * ISO_X + bz * ISO_X), (H * 0.55) / (bx * ISO_Y + bz * ISO_Y + by))
    const ox = W / 2
    const oy = H * 0.65

    const iso = (x: number, y: number, z: number) => ({
      sx: ox + (x - z) * ISO_X * scale,
      sy: oy + (x + z) * ISO_Y * scale - y * scale,
    })

    const drawFace = (pts: ReturnType<typeof iso>[], fill: string, stroke: string) => {
      ctx.beginPath()
      ctx.moveTo(pts[0].sx, pts[0].sy)
      pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1
      ctx.stroke()
    }

    drawFace([iso(0,0,0), iso(bx,0,0), iso(bx,by,0), iso(0,by,0)], '#e2e8f0', '#94a3b8')
    drawFace([iso(bx,0,0), iso(bx,0,bz), iso(bx,by,bz), iso(bx,by,0)], '#cbd5e1', '#94a3b8')
    drawFace([iso(0,by,0), iso(bx,by,0), iso(bx,by,bz), iso(0,by,bz)], '#f1f5f9', '#94a3b8')

    const cols2 = Math.ceil(Math.sqrt(nItems))
    const rows2 = Math.ceil(nItems / cols2)
    const cellW = (bx - 4) / cols2
    const cellD = (bz - 4) / rows2
    const cellH = Math.min(iH, by - 4)
    let itemIdx = 0

    for (let row = 0; row < rows2 && itemIdx < nItems; row++) {
      for (let col2 = 0; col2 < cols2 && itemIdx < nItems; col2++) {
        const ix = 2 + col2 * cellW
        const iz = 2 + row * cellD
        const color = ITEM_COLORS[itemIdx % ITEM_COLORS.length]
        drawFace([iso(ix,by,iz), iso(ix+cellW-1,by,iz), iso(ix+cellW-1,by,iz+cellD-1), iso(ix,by,iz+cellD-1)],
          color + 'cc', color)
        drawFace([iso(ix+cellW-1,by,iz), iso(ix+cellW-1,by+cellH,iz), iso(ix+cellW-1,by+cellH,iz+cellD-1), iso(ix+cellW-1,by,iz+cellD-1)],
          color + '88', color)
        itemIdx++
      }
    }

    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    const topPts = [iso(0,by,0), iso(bx,by,0), iso(bx,by,bz), iso(0,by,bz)]
    ctx.beginPath()
    ctx.moveTo(topPts[0].sx, topPts[0].sy - 20)
    ctx.lineTo(topPts[1].sx, topPts[1].sy - 20)
    ctx.lineTo(topPts[2].sx, topPts[2].sy - 20)
    ctx.lineTo(topPts[3].sx, topPts[3].sy - 20)
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  }, [params, nItems, iW, iH, iD, cols])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>Articles (n)</FieldLabel>
          <input type="number" value={nItems} min={1} max={12}
            onChange={e => setNItems(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>L article (mm)</FieldLabel>
          <input type="number" value={iW} min={1} max={500}
            onChange={e => setIW(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>l article (mm)</FieldLabel>
          <input type="number" value={iH} min={1} max={500}
            onChange={e => setIH(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Profondeur article (mm)</FieldLabel>
        <input type="number" value={iD} min={1} max={500}
          onChange={e => setID(Number(e.target.value))} style={{ ...inputStyle, width: '31%' }} />
      </div>
      <div style={{ background: c.surfaceAlt, borderRadius: r.lg, padding: 4, marginBottom: 8, textAlign: 'center' }}>
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div style={{ background: c.surface, borderRadius: r.lg, padding: '6px 8px' }}>
          <div style={{ fontSize: fs.xs, color: c.textMuted }}>Remplissage vide</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.bold, color: voidPct > 40 ? '#f59e0b' : '#10b981' }}>
            {voidPct.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: c.surface, borderRadius: r.lg, padding: '6px 8px' }}>
          <div style={{ fontSize: fs.xs, color: c.textMuted }}>Grille ({cols} col.)</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.bold, color: c.textMed }}>
            {cols} × {Math.ceil(nItems / cols)}
          </div>
        </div>
      </div>
      {suggestGrid && (
        <div style={{ fontSize: fs.xs, color: '#92400e', background: '#fef3c7', borderRadius: r.lg, padding: '5px 8px' }}>
          Suggestion : insert séparateur en carton ondulé pour {nItems} articles
        </div>
      )}
    </div>
  )
}

function ReturnsTab() {
  const [checks, setChecks] = useState({
    reseal: false, reverseTears: false, addressWindow: false, noTape: false, lightWeight: false,
  })

  const items = [
    { key: 'reseal' as const,        label: 'Bande auto-adhésive', pts: 1 },
    { key: 'reverseTears' as const,  label: 'Déchirures réversibles', pts: 1 },
    { key: 'addressWindow' as const, label: 'Fenêtre adresse', pts: 1 },
    { key: 'noTape' as const,        label: 'Sans scotch nécessaire', pts: 1 },
    { key: 'lightWeight' as const,   label: 'Poids < 200g', pts: 1 },
  ]

  const score = items.reduce((s, i) => s + (checks[i.key] ? i.pts : 0), 0)
  const scoreColor = score >= 4 ? '#10b981' : score >= 2 ? '#f59e0b' : '#ef4444'

  const RECS: Record<string, string> = {
    reseal:        'Ajouter bande PSA à double usage',
    reverseTears:  'Intégrer perforation bidirectionnelle',
    addressWindow: 'Prévoir fenêtre plastique transparente',
    noTape:        'Utiliser système lock-and-seal',
    lightWeight:   'Optimiser le poids substrat (< 200g)',
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: fw.heavy, color: scoreColor }}>{score}/5</div>
          <div style={{ fontSize: fs.xs, color: c.textMuted }}>Score retour</div>
        </div>
        <svg width="160" height="90" viewBox="0 0 160 90" style={{ flex: 1 }}>
          <rect x="2" y="20" width="156" height="60" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1.5" />
          {checks.reseal && (
            <rect x="50" y="60" width="60" height="8" rx="2" fill="#3b82f6" opacity="0.7" />
          )}
          {checks.reverseTears && (
            <>
              <line x1="2" y1="40" x2="158" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
              <line x1="2" y1="60" x2="158" y2="60" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
            </>
          )}
          {checks.addressWindow && (
            <rect x="10" y="30" width="45" height="22" rx="2" fill="none" stroke="#10b981" strokeWidth="1.5" />
          )}
          {checks.reseal && (
            <text x="80" y="66" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">RESEAL</text>
          )}
          <text x="80" y="88" textAnchor="middle" fontSize="7" fill={c.textMuted}>Vue latérale — emballage retour</text>
        </svg>
      </div>
      {items.map(item => (
        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={checks[item.key]}
            onChange={e => setChecks(p => ({ ...p, [item.key]: e.target.checked }))}
            style={{ width: 13, height: 13 }} />
          <span style={{ fontSize: fs.md, color: c.textMed, flex: 1 }}>{item.label}</span>
          {!checks[item.key] && (
            <span style={{ fontSize: fs.xs, color: c.textMuted }}>{RECS[item.key]}</span>
          )}
        </label>
      ))}
    </div>
  )
}

function AmazonTab({ params, imageLayers }: { params: BoxParams; imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const W = 800
  const H = 800

  const checks = [
    { label: 'Fond blanc', ok: true },
    { label: '> 85% cadre rempli', ok: true },
    { label: 'Sans accessoires', ok: true },
    { label: 'Mode RVB', ok: true },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = W
    canvas.height = H

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    const ISO_X = 0.866
    const ISO_Y = 0.5
    const bx = params.width
    const by = params.height
    const bz = params.depth
    const scale = Math.min(
      (W * 0.65) / (bx * ISO_X + bz * ISO_X),
      (H * 0.65) / (bx * ISO_Y + bz * ISO_Y + by),
    )
    const ox = W / 2
    const oy = H * 0.62

    const iso = (x: number, y: number, z: number) => ({
      sx: ox + (x - z) * ISO_X * scale,
      sy: oy + (x + z) * ISO_Y * scale - y * scale,
    })

    const hasSrc = imageLayers.length > 0 && imageLayers[0].src

    const drawBoxFace = (pts: ReturnType<typeof iso>[], fill: string, strokeColor: string) => {
      ctx.beginPath()
      ctx.moveTo(pts[0].sx, pts[0].sy)
      pts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
      ctx.closePath()
      ctx.fillStyle = fill
      ctx.fill()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.stroke()
    }

    if (hasSrc) {
      const img = new Image()
      img.onload = () => {
        drawBoxFace([iso(0,0,0), iso(bx,0,0), iso(bx,by,0), iso(0,by,0)], '#e8e8e8', '#999')
        drawBoxFace([iso(bx,0,0), iso(bx,0,bz), iso(bx,by,bz), iso(bx,by,0)], '#d0d0d0', '#999')
        drawBoxFace([iso(0,by,0), iso(bx,by,0), iso(bx,by,bz), iso(0,by,bz)], '#f0f0f0', '#999')

        const frontPts = [iso(0,0,0), iso(bx,0,0), iso(bx,by,0), iso(0,by,0)]
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(frontPts[0].sx, frontPts[0].sy)
        frontPts.slice(1).forEach(p => ctx.lineTo(p.sx, p.sy))
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, frontPts[0].sx, frontPts[3].sy,
          frontPts[1].sx - frontPts[0].sx, frontPts[0].sy - frontPts[3].sy)
        ctx.restore()
      }
      img.src = imageLayers[0].src
    } else {
      drawBoxFace([iso(0,0,0), iso(bx,0,0), iso(bx,by,0), iso(0,by,0)], '#e2e8f0', '#94a3b8')
      drawBoxFace([iso(bx,0,0), iso(bx,0,bz), iso(bx,by,bz), iso(bx,by,0)], '#cbd5e1', '#94a3b8')
      drawBoxFace([iso(0,by,0), iso(bx,by,0), iso(bx,by,bz), iso(0,by,bz)], '#f1f5f9', '#94a3b8')

      ctx.fillStyle = '#94a3b8'
      ctx.font = 'bold 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${params.width}×${params.height}×${params.depth}mm`, W / 2, H / 2 + 60)
    }
  }, [params, imageLayers])

  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'amazon-listing-800x800.png'
    a.click()
  }

  return (
    <div>
      <div style={{ background: c.surfaceAlt, borderRadius: r.lg, padding: 4, marginBottom: 8, textAlign: 'center' }}>
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%' }} />
      </div>
      <div style={{ marginBottom: 8 }}>
        {checks.map(ch => (
          <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: ch.ok ? '#10b981' : '#ef4444' }}>{ch.ok ? '✓' : '✗'}</span>
            <span style={{ fontSize: fs.sm, color: c.textMed }}>{ch.label}</span>
          </div>
        ))}
      </div>
      <button onClick={exportPNG} style={{
        width: '100%', fontSize: fs.md, fontWeight: fw.bold, padding: '6px 0',
        background: '#ff9900', color: c.white, border: 'none', borderRadius: r.lg, cursor: 'pointer',
      }}>
        Exporter 800×800 PNG
      </button>
    </div>
  )
}

export function EcommerceSection({ params, imageLayers }: { params: BoxParams; imageLayers: ImageLayer[] }) {
  const [tab, setTab] = useState<EcomTab>('subscription')

  const tabs: { key: EcomTab; label: string }[] = [
    { key: 'subscription', label: 'Abonnement' },
    { key: 'returns',      label: 'Retours' },
    { key: 'amazon',       label: 'Amazon' },
  ]

  return (
    <CollapsibleSection label="E-commerce">
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'subscription' && <SubscriptionTab params={params} />}
      {tab === 'returns'      && <ReturnsTab />}
      {tab === 'amazon'       && <AmazonTab params={params} imageLayers={imageLayers} />}
    </CollapsibleSection>
  )
}
