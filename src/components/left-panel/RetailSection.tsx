'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { ImageLayer, BoxParams } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

// ── #411-416 : Retail & Marketing ─────────────────────────────────────────────

type RetailTab = 'shelf' | 'saliency' | 'abtest' | 'planogram'

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

// ── Shelf Impact Simulator ─────────────────────────────────────────────────────
// Shows current design repeated N times on a shelf against placeholder competitors

const SHELF_COLORS = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6']

function ShelfTab({ imageLayers, params }: { imageLayers: ImageLayer[]; params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [competitors, setCompetitors] = useState(4)
  const [yourCount, setYourCount] = useState(3)
  const [loading, setLoading] = useState(false)

  const handleRender = useCallback(async () => {
    const cv = canvasRef.current
    if (!cv) return
    setLoading(true)

    const SHELF_W = 520, SHELF_H = 220
    const BOX_W = 60, BOX_H = 100
    const SHELF_Y = SHELF_H - 30
    const GAP = 8

    cv.width = SHELF_W; cv.height = SHELF_H
    const ctx = cv.getContext('2d')!

    // Background - shop shelf
    ctx.fillStyle = '#f0ece8'
    ctx.fillRect(0, 0, SHELF_W, SHELF_H)

    // Shelf board
    ctx.fillStyle = '#c8a878'
    ctx.fillRect(0, SHELF_Y, SHELF_W, 14)
    ctx.fillStyle = '#b89868'
    ctx.fillRect(0, SHELF_Y, SHELF_W, 3)

    // Grid helper
    const totalBoxes = yourCount + competitors
    const startX = (SHELF_W - totalBoxes * (BOX_W + GAP)) / 2 + GAP / 2

    // Flatten our design to a mini canvas
    let ourDesignCanvas: HTMLCanvasElement | null = null
    if (imageLayers.length > 0) {
      const mc = document.createElement('canvas')
      mc.width = BOX_W; mc.height = BOX_H
      const mctx = mc.getContext('2d')!
      mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, BOX_W, BOX_H)
      const scaleX = BOX_W / (params.width || 80)
      const scaleY = BOX_H / (params.height || 120)
      for (const l of imageLayers.filter(l => l.visible)) {
        try {
          await new Promise<void>((res) => {
            const img = new Image()
            img.onload = () => {
              mctx.save()
              mctx.translate(l.x * scaleX + l.width * l.scale * scaleX / 2, l.y * scaleY + l.height * l.scale * scaleY / 2)
              mctx.rotate((l.rotation * Math.PI) / 180)
              mctx.drawImage(img, -l.width * l.scale * scaleX / 2, -l.height * l.scale * scaleY / 2, l.width * l.scale * scaleX, l.height * l.scale * scaleY)
              mctx.restore(); res()
            }
            img.onerror = () => res()
            img.src = l.src
          })
        } catch { /* skip */ }
      }
      ourDesignCanvas = mc
    }

    // Draw boxes
    let x = startX
    let ourDrawn = 0
    let compDrawn = 0

    // Interleave our boxes with competitors
    const slots = Array.from({ length: totalBoxes }, (_, i) => {
      if (i % Math.ceil(totalBoxes / yourCount) === 0 && ourDrawn < yourCount) {
        ourDrawn++; return 'our'
      }
      if (compDrawn < competitors) { compDrawn++; return 'comp' }
      ourDrawn++; return 'our'
    })

    for (let i = 0; i < slots.length; i++) {
      const bx = x + i * (BOX_W + GAP)
      const by = SHELF_Y - BOX_H

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.12)'
      ctx.fillRect(bx + 3, by + 4, BOX_W, BOX_H)

      if (slots[i] === 'our' && ourDesignCanvas) {
        // Our design
        ctx.drawImage(ourDesignCanvas, bx, by, BOX_W, BOX_H)
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.5
        ctx.strokeRect(bx, by, BOX_W, BOX_H)
        // "Notre produit" label
        ctx.fillStyle = '#1a1a1a'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('▲', bx + BOX_W / 2, SHELF_Y + 12)
      } else {
        // Competitor placeholder
        const ci = (compDrawn - 1 + i) % SHELF_COLORS.length
        const compColor = SHELF_COLORS[ci]
        ctx.fillStyle = compColor
        ctx.fillRect(bx, by, BOX_W, BOX_H)
        // Fake label
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('BRAND', bx + BOX_W / 2, by + BOX_H / 2 - 4)
        ctx.fillText(String.fromCharCode(65 + (i % 5)), bx + BOX_W / 2, by + BOX_H / 2 + 8)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5
        ctx.strokeRect(bx, by, BOX_W, BOX_H)
      }
    }

    // Price tags
    for (let i = 0; i < slots.length; i++) {
      const bx = x + i * (BOX_W + GAP)
      ctx.fillStyle = '#fff'
      ctx.fillRect(bx, SHELF_Y + 14, BOX_W, 12)
      ctx.fillStyle = '#555'; ctx.font = '7px sans-serif'; ctx.textAlign = 'center'
      const price = slots[i] === 'our' ? '9.99 €' : `${(3 + i * 1.5).toFixed(2)} €`
      ctx.fillText(price, bx + BOX_W / 2, SHELF_Y + 22)
    }

    setLoading(false)
  }, [imageLayers, params, competitors, yourCount])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>VOS PRODUITS</FieldLabel>
          <input type="number" min={1} max={6} value={yourCount} onChange={e => setYourCount(+e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>CONCURRENTS</FieldLabel>
          <input type="number" min={1} max={8} value={competitors} onChange={e => setCompetitors(+e.target.value)} style={inputStyle} />
        </div>
      </div>
      <button onClick={handleRender} disabled={loading} style={loading ? btnDisabled : btnPrimary}>
        {loading ? 'Rendu...' : 'Simuler rayon'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
      {imageLayers.length === 0 && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>Ajoutez des calques pour voir votre design sur rayon</div>
      )}
    </div>
  )
}

// ── Saliency / Eye-tracking prédictif ─────────────────────────────────────────
// Heuristique basée sur luminosité, contraste, edges — sans TensorFlow

function SaliencyTab({ imageLayers, params }: { imageLayers: ImageLayer[]; params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = useCallback(async () => {
    setLoading(true)
    const SCALE = 2
    const W = Math.round((params.width + 2 * params.depth) * SCALE)
    const H = Math.round((params.height + params.depth) * SCALE)

    // Flatten layers
    const src = document.createElement('canvas')
    src.width = W; src.height = H
    const sctx = src.getContext('2d')!
    sctx.fillStyle = '#fff'; sctx.fillRect(0, 0, W, H)

    for (const l of imageLayers.filter(l => l.visible)) {
      try {
        await new Promise<void>((res) => {
          const img = new Image()
          img.onload = () => {
            const lx = l.x * SCALE, ly = l.y * SCALE
            const lw = l.width * l.scale * SCALE, lh = l.height * l.scale * SCALE
            sctx.save()
            sctx.translate(lx + lw / 2, ly + lh / 2)
            sctx.rotate((l.rotation * Math.PI) / 180)
            sctx.drawImage(img, -lw / 2, -lh / 2, lw, lh)
            sctx.restore(); res()
          }
          img.onerror = () => res()
          img.src = l.src
        })
      } catch { /* skip */ }
    }

    const id = sctx.getImageData(0, 0, W, H)
    const px = id.data

    // Compute local contrast saliency (Itti-Koch inspired, simplified)
    // For each pixel: local RMS contrast vs 5x5 neighborhood
    const saliency = new Float32Array(W * H)
    const R = 8 // radius

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const ci = (y * W + x) * 4
        const lum = 0.299 * px[ci] + 0.587 * px[ci + 1] + 0.114 * px[ci + 2]
        let sumDiff = 0, count = 0
        for (let dy = -R; dy <= R; dy += 2) {
          for (let dx = -R; dx <= R; dx += 2) {
            const nx = Math.max(0, Math.min(W - 1, x + dx))
            const ny = Math.max(0, Math.min(H - 1, y + dy))
            const ni = (ny * W + nx) * 4
            const nlum = 0.299 * px[ni] + 0.587 * px[ni + 1] + 0.114 * px[ni + 2]
            sumDiff += (lum - nlum) ** 2
            count++
          }
        }
        saliency[y * W + x] = Math.sqrt(sumDiff / count)
      }
    }

    // Normalize
    const maxS = Math.max(...Array.from(saliency))
    if (maxS === 0) { setLoading(false); return }

    // Draw heatmap overlay
    const cv = canvasRef.current
    if (!cv) { setLoading(false); return }
    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!

    // Draw original dimmed
    ctx.globalAlpha = 0.4; ctx.drawImage(src, 0, 0); ctx.globalAlpha = 1

    // Overlay heatmap
    const heatData = ctx.getImageData(0, 0, W, H)
    const hp = heatData.data
    for (let i = 0; i < W * H; i++) {
      const s = saliency[i] / maxS
      if (s > 0.1) {
        hp[i * 4]     = Math.round(255 * Math.min(1, s * 2))       // R
        hp[i * 4 + 1] = Math.round(255 * Math.max(0, 1 - s * 2))   // G
        hp[i * 4 + 2] = 0                                            // B
        hp[i * 4 + 3] = Math.round(s * 200)                         // A
      }
    }
    ctx.putImageData(heatData, 0, 0)

    // Gaussian blur simulation via multiple draws (CSS filter)
    cv.style.filter = 'blur(3px)'
    setTimeout(() => { if (canvasRef.current) canvasRef.current.style.filter = 'none' }, 50)

    setLoading(false)
  }, [imageLayers, params])

  return (
    <div>
      <div style={{ fontSize: 10, color: '#777', marginBottom: 10, lineHeight: 1.5 }}>
        Prédit les zones d&apos;attraction visuelle (contraste local). Rouge = haute saillance, zones regardées en premier.
      </div>
      <button onClick={handleAnalyze} disabled={loading || !imageLayers.length}
        style={loading || !imageLayers.length ? btnDisabled : btnPrimary}>
        {loading ? 'Analyse...' : 'Analyser saillance visuelle'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', marginTop: 8, borderRadius: 4, border: '1px solid #e0e0e0', display: 'block' }} />
      {!imageLayers.length && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>Ajoutez des calques images pour l&apos;analyse</div>
      )}
    </div>
  )
}

// ── A/B Test Panel ─────────────────────────────────────────────────────────────

function ABTestTab() {
  const [variantA, setVariantA] = useState('Design actuel')
  const [variantB, setVariantB] = useState('Variante B')
  const [results, setResults] = useState<{ a: number; b: number } | null>(null)
  const [sessionId, setSessionId] = useState('')
  useEffect(() => { setSessionId(Math.random().toString(36).slice(2, 10).toUpperCase()) }, [])

  const handleSimulate = useCallback(() => {
    // Simulated preference based on description keywords
    const aScore = variantA.toLowerCase().includes('bold') ? 0.6 :
      variantA.toLowerCase().includes('minimal') ? 0.45 : 0.5
    const bScore = 1 - aScore + (Math.random() - 0.5) * 0.2
    const total = 100
    const aVotes = Math.round(total * aScore + (Math.random() - 0.5) * 10)
    setResults({ a: Math.max(1, Math.min(99, aVotes)), b: total - Math.max(1, Math.min(99, aVotes)) })
  }, [variantA, variantB])

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}?ab=${sessionId}&variant=B`
    navigator.clipboard.writeText(url).catch(() => { /* fallback */ })
  }, [sessionId])

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>SESSION ID</FieldLabel>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#1a1a1a', flex: 1, background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
            {sessionId}
          </span>
          <button onClick={handleCopyLink} style={{ fontSize: 10, background: 'none', border: '1px solid #d0d0d0', borderRadius: 3, padding: '3px 7px', cursor: 'pointer', color: '#555', whiteSpace: 'nowrap' }}>
            Copier lien
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>VARIANTE A (contrôle)</FieldLabel>
          <input type="text" value={variantA} onChange={e => setVariantA(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>VARIANTE B</FieldLabel>
          <input type="text" value={variantB} onChange={e => setVariantB(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <button onClick={handleSimulate} style={btnPrimary}>Simuler préférence consommateur</button>

      {results && (
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 6, fontSize: 10, color: '#555' }}>Résultats simulés (100 répondants)</div>
          {([
            { label: variantA, pct: results.a, color: '#3498db' },
            { label: variantB, pct: results.b, color: '#e74c3c' },
          ] as { label: string; pct: number; color: string }[]).map(v => (
            <div key={v.label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                <span style={{ color: '#333' }}>{v.label}</span>
                <span style={{ fontWeight: 700, color: v.color }}>{v.pct}%</span>
              </div>
              <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${v.pct}%`, background: v.color, borderRadius: 5, transition: 'width 0.4s' }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 9, color: '#aaa', marginTop: 4 }}>
            {results.a > results.b
              ? `✓ Variante A préférée (+${results.a - results.b} pts)`
              : `✓ Variante B préférée (+${results.b - results.a} pts)`}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Planogram Builder ─────────────────────────────────────────────────────────

interface PlanogramSlot {
  id: string
  row: number
  col: number
  label: string
  color: string
  isMine: boolean
}

function PlanogramTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(6)
  const [yourShare, setYourShare] = useState(2)
  const [shelfName, setShelfName] = useState('Rayon Cosmétique')

  const COMPETITOR_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#16a085', '#8e44ad']
  const COMPETITOR_LABELS = ['Brand A', 'Brand B', 'Brand C', 'Brand D', 'Brand E', 'Brand F', 'Brand G', 'Brand H']

  const buildSlots = useCallback((): PlanogramSlot[] => {
    const total = rows * cols
    const slots: PlanogramSlot[] = []
    const minePositions = new Set<number>()
    // Place "my" products spread out on the middle shelf
    const middleRow = Math.floor(rows / 2)
    for (let c = 0; c < Math.min(yourShare, cols); c++) {
      minePositions.add(middleRow * cols + c)
    }
    let compIdx = 0
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const pos = r * cols + c
        const isMine = minePositions.has(pos)
        slots.push({
          id: `${r}-${c}`,
          row: r, col: c,
          label: isMine ? (params.fluteType || 'Mon produit') : COMPETITOR_LABELS[compIdx % COMPETITOR_LABELS.length],
          color: isMine ? '#2d6a2d' : COMPETITOR_COLORS[compIdx % COMPETITOR_COLORS.length],
          isMine,
        })
        if (!isMine) compIdx++
      }
    }
    return slots
  }, [rows, cols, yourShare, params.fluteType])

  const handleRender = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const slots = buildSlots()

    const CELL_W = 72, CELL_H = 90
    const PAD_LEFT = 60, PAD_TOP = 50, PAD_BOTTOM = 30
    const W = PAD_LEFT + cols * CELL_W + 20
    const H = PAD_TOP + rows * CELL_H + PAD_BOTTOM

    cv.width = W; cv.height = H
    const ctx = cv.getContext('2d')!

    // Background
    ctx.fillStyle = '#f7f5f2'
    ctx.fillRect(0, 0, W, H)

    // Title
    ctx.fillStyle = '#333'
    ctx.font = 'bold 13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(shelfName, W / 2, 30)

    // Shelf backs
    for (let r = 0; r < rows; r++) {
      const sy = PAD_TOP + r * CELL_H
      ctx.fillStyle = '#d8c9b3'
      ctx.fillRect(PAD_LEFT, sy + CELL_H - 4, cols * CELL_W, 5)
      // Row label
      ctx.fillStyle = '#888'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`Niv. ${rows - r}`, PAD_LEFT - 6, sy + CELL_H / 2 + 4)
    }

    // Column labels
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = '#aaa'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${c + 1}`, PAD_LEFT + c * CELL_W + CELL_W / 2, PAD_TOP - 8)
    }

    // Slots
    for (const s of slots) {
      const x = PAD_LEFT + s.col * CELL_W
      const y = PAD_TOP + s.row * CELL_H

      // Box outline
      ctx.fillStyle = s.isMine ? '#e8f4e8' : `${s.color}22`
      ctx.fillRect(x + 3, y + 4, CELL_W - 6, CELL_H - 14)
      ctx.strokeStyle = s.isMine ? '#2d6a2d' : s.color
      ctx.lineWidth = s.isMine ? 2 : 1
      ctx.strokeRect(x + 3, y + 4, CELL_W - 6, CELL_H - 14)

      // Mini product face
      const bx = x + CELL_W / 2, by = y + CELL_H / 2 - 6
      ctx.fillStyle = s.color
      ctx.fillRect(bx - 18, by - 22, 36, 44)
      if (s.isMine) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 8px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('★', bx, by - 2)
      }

      // Label
      ctx.fillStyle = s.isMine ? '#2d6a2d' : '#555'
      ctx.font = s.isMine ? 'bold 8px sans-serif' : '8px sans-serif'
      ctx.textAlign = 'center'
      const lbl = s.label.length > 8 ? s.label.slice(0, 7) + '…' : s.label
      ctx.fillText(lbl, x + CELL_W / 2, y + CELL_H - 6)
    }

    // Legend
    const total = rows * cols
    const sharePct = Math.round((Math.min(yourShare, cols) / total) * 100)
    ctx.fillStyle = '#555'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`Part linéaire: ${sharePct}% (${Math.min(yourShare, cols)}/${total} empl.)`, PAD_LEFT, H - 8)
  }, [buildSlots, cols, rows, shelfName])

  useEffect(() => { handleRender() }, [handleRender])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div>
          <FieldLabel>RANGÉES</FieldLabel>
          <input type="number" min={1} max={6} value={rows} onChange={e => setRows(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>COLONNES</FieldLabel>
          <input type="number" min={1} max={12} value={cols} onChange={e => setCols(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>MES EMPLACEMENTS</FieldLabel>
          <input type="number" min={1} max={cols} value={yourShare} onChange={e => setYourShare(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>NOM DU RAYON</FieldLabel>
          <input type="text" value={shelfName} onChange={e => setShelfName(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 6, border: '1px solid #e0e0e0', display: 'block', marginBottom: 8 }} />
      <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center' }}>
        ★ = votre produit (vert) | Concurrents en couleur
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

const TABS: { id: RetailTab; label: string }[] = [
  { id: 'shelf',     label: 'Rayon' },
  { id: 'saliency',  label: 'Saillance' },
  { id: 'abtest',    label: 'A/B Test' },
  { id: 'planogram', label: 'Planogram' },
]

interface RetailSectionProps {
  imageLayers: ImageLayer[]
  params: BoxParams
}

export function RetailSection({ imageLayers, params }: RetailSectionProps) {
  const [tab, setTab] = useState<RetailTab>('shelf')

  return (
    <CollapsibleSection label="RETAIL & MARKETING">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
        
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600,
            border: tab === t.id ? 'none' : '1px solid #d0d0d0',
            background: tab === t.id ? '#1a1a1a' : '#f5f5f5',
            color: tab === t.id ? '#fff' : '#555',
            cursor: 'pointer', letterSpacing: 0.5,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'shelf'     && <ShelfTab imageLayers={imageLayers} params={params} />}
      {tab === 'saliency'  && <SaliencyTab imageLayers={imageLayers} params={params} />}
      {tab === 'abtest'    && <ABTestTab />}
      {tab === 'planogram' && <PlanogramTab params={params} />}
    </CollapsibleSection>
  )
}
