'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import { c, fs, fw, r } from '@/lib/tokens'

type Tab = 'stack' | 'gravity' | 'pallet' | 'truck' | 'facing'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stack',   label: 'Stack' },
  { id: 'gravity', label: 'Gravity' },
  { id: 'pallet',  label: 'Pallet' },
  { id: 'truck',   label: 'Truck' },
  { id: 'facing',  label: 'Facing' },
]

function numInput(label: string, value: number, onChange: (v: number) => void, min = 1, max = 99999, step = 1) {
  return (
    <div style={{ marginBottom: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', background: c.white, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
      />
    </div>
  )
}

function metricBox(label: string, value: string | number, color?: string) {
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.borderXLight}`, borderRadius: r.lg, padding: '6px 8px' }}>
      <div style={{ fontSize: fs.xs, color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: fw.heavy, color: color || c.ink }}>{value}</div>
    </div>
  )
}

function StackTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [weight, setWeight] = useState(0.5)
  const [bct, setBct] = useState(500)
  const [layers, setLayers] = useState(6)

  const safetyLimit = bct / 3
  const maxSafeLayers = Math.floor(safetyLimit / weight)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const boxW = Math.min(100, W - 40)
    const boxH = Math.max(8, Math.min(24, (H - 20) / Math.max(layers, 1) - 3))
    const startX = (W - boxW) / 2
    const totalH = layers * (boxH + 3)
    const startY = H - 10 - totalH

    for (let i = 0; i < layers; i++) {
      const load = (layers - i) * weight
      const ratio = load / bct
      let fill = '#10b981'
      let stroke = '#059669'
      if (ratio > 1) { fill = '#ef4444'; stroke = '#dc2626' }
      else if (ratio > 0.33) { fill = '#f59e0b'; stroke = '#d97706' }

      const y = startY + i * (boxH + 3)
      ctx.fillStyle = fill + '55'
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.roundRect(startX, y, boxW, boxH, 3)
      ctx.fill()
      ctx.stroke()

      if (i === layers - 1) {
        ctx.fillStyle = stroke
        ctx.font = `bold 8px sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(`${load.toFixed(1)} N`, startX + boxW / 2, y + boxH / 2 + 3)
      }
    }
  }, [layers, weight, bct, params])

  useEffect(() => { draw() }, [draw])

  const bottomLoad = layers * weight
  const overloaded = bottomLoad > bct / 3

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          {numInput('Box weight (kg)', weight, setWeight, 0.01, 100, 0.01)}
          {numInput('BCT (N)', bct, setBct, 1, 100000)}
        </div>
        <div>
          {numInput('Layers', layers, setLayers, 1, 30)}
        </div>
      </div>
      <canvas ref={canvasRef} width={220} height={160} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, background: c.surfaceAlt, display: 'block', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {metricBox('Bottom load', `${(bottomLoad).toFixed(1)} kg`)}
        {metricBox('Max safe layers', maxSafeLayers, maxSafeLayers >= layers ? '#059669' : '#dc2626')}
      </div>
      {overloaded ? (
        <div style={{ fontSize: fs.xs, color: '#dc2626', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: r.lg, padding: '5px 8px' }}>
          ⚠ Load exceeds BCT/3 safety factor ({(bct / 3).toFixed(0)} N max)
        </div>
      ) : (
        <div style={{ fontSize: fs.xs, color: '#059669', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: r.lg, padding: '5px 8px' }}>
          ✓ Stack within safe load limits
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: fs.xs, color: c.textGhost }}>
        <span style={{ color: '#10b981' }}>■</span> Safe &nbsp;
        <span style={{ color: '#f59e0b' }}>■</span> Marginal &nbsp;
        <span style={{ color: '#ef4444' }}>■</span> Failed
      </div>
    </div>
  )
}

function GravityTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fill, setFill] = useState(70)
  const [productWeight, setProductWeight] = useState(0.3)

  const { width: W, height: H, depth: D } = params
  const cgY = H * (0.5 - fill / 100 * 0.5 + fill / 100 * 0.75)
  const stable = cgY < H * 0.6

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cW = canvas.width
    const cH = canvas.height
    ctx.clearRect(0, 0, cW, cH)

    const scale = Math.min((cW - 40) / W, (cH - 30) / H)
    const bW = W * scale
    const bH = H * scale
    const bX = (cW - bW) / 2
    const bY = (cH - bH) / 2

    ctx.strokeStyle = c.ink
    ctx.lineWidth = 1.5
    ctx.strokeRect(bX, bY, bW, bH)

    const fillH = bH * (fill / 100)
    ctx.fillStyle = 'rgba(68,136,255,0.12)'
    ctx.fillRect(bX + 1, bY + bH - fillH, bW - 2, fillH)

    const cgPx = bX + bW / 2
    const cgPy = bY + bH - cgY * scale

    const cs = stable ? '#10b981' : '#ef4444'
    ctx.strokeStyle = cs
    ctx.lineWidth = 1.5
    const arm = 8
    ctx.beginPath()
    ctx.moveTo(cgPx - arm, cgPy)
    ctx.lineTo(cgPx + arm, cgPy)
    ctx.moveTo(cgPx, cgPy - arm)
    ctx.lineTo(cgPx, cgPy + arm)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cgPx, cgPy, 3, 0, Math.PI * 2)
    ctx.fillStyle = cs
    ctx.fill()

    ctx.fillStyle = cs
    ctx.font = 'bold 8px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`CG: ${cgY.toFixed(0)}mm`, cgPx + 12, cgPy + 3)

    ctx.strokeStyle = 'rgba(0,0,0,0.12)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(bX, bY + bH - H * 0.6 * scale)
    ctx.lineTo(bX + bW, bY + bH - H * 0.6 * scale)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = c.textGhost
    ctx.font = '7px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('60%', bX + bW - 2, bY + bH - H * 0.6 * scale - 2)
  }, [fill, productWeight, params, cgY, stable])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          {numInput('Fill level (%)', fill, setFill, 0, 100)}
        </div>
        <div>
          {numInput('Product weight (kg)', productWeight, setProductWeight, 0.01, 100, 0.01)}
        </div>
      </div>
      <canvas ref={canvasRef} width={220} height={160} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, background: c.surfaceAlt, display: 'block', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {metricBox('CG height', `${cgY.toFixed(1)} mm`)}
        {metricBox('Stability', stable ? 'Stable' : 'Unstable', stable ? '#059669' : '#dc2626')}
      </div>
      <div style={{ fontSize: fs.xs, color: c.textGhost, marginTop: 6 }}>Stable if CG &lt; 60% of height. Dashed line = 60% threshold.</div>
    </div>
  )
}

function PalletTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boxesPerLayer, setBoxesPerLayer] = useState(0)
  const [layers, setLayers] = useState(0)

  const PALLET_W = 800
  const PALLET_D = 1200
  const MAX_HEIGHT = 1800
  const { width: bW, depth: bD, height: bH } = params

  const colsA = bW > 0 ? Math.floor(PALLET_W / bW) : 0
  const rowsA = bD > 0 ? Math.floor(PALLET_D / bD) : 0
  const colsB = bD > 0 ? Math.floor(PALLET_W / bD) : 0
  const rowsB = bW > 0 ? Math.floor(PALLET_D / bW) : 0
  const layA = colsA * rowsA
  const layB = colsB * rowsB
  const useCols = colsA
  const useRows = rowsA
  const bpl = Math.max(layA, layB)
  const lpp = bH > 0 ? Math.floor(MAX_HEIGHT / bH) : 0
  const efficiency = bW > 0 && bD > 0 ? ((bpl * bW * bD) / (PALLET_W * PALLET_D) * 100).toFixed(1) : '0'

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cW = canvas.width
    const cH = canvas.height
    ctx.clearRect(0, 0, cW, cH)

    const pad = 10
    const scaleX = (cW - pad * 2) / PALLET_W
    const scaleY = (cH - pad * 2) / PALLET_D

    ctx.fillStyle = '#f0ece0'
    ctx.strokeStyle = '#c0aa80'
    ctx.lineWidth = 1.5
    ctx.fillRect(pad, pad, (cW - pad * 2), (cH - pad * 2))
    ctx.strokeRect(pad, pad, (cW - pad * 2), (cH - pad * 2))

    const cols = bW > 0 ? Math.floor(PALLET_W / bW) : 0
    const rows = bD > 0 ? Math.floor(PALLET_D / bD) : 0

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = pad + col * bW * scaleX
        const y = pad + row * bD * scaleY
        const w = bW * scaleX - 1
        const h = bD * scaleY - 1
        const even = (row + col) % 2 === 0
        ctx.fillStyle = even ? 'rgba(68,136,255,0.25)' : 'rgba(68,136,255,0.15)'
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = 'rgba(68,136,255,0.5)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, w, h)
      }
    }
  }, [params])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 8 }}>Pallet: 800 × 1200 mm (EUR) — Max 1.8m</div>
      <canvas ref={canvasRef} width={220} height={132} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, background: c.surfaceAlt, display: 'block', marginBottom: 8 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {metricBox('Boxes/layer', bpl)}
        {metricBox('Layers', lpp)}
        {metricBox('Total boxes', bpl * lpp)}
      </div>
      <div style={{ marginTop: 6 }}>
        {metricBox('Efficiency', `${efficiency}%`, parseFloat(efficiency) > 75 ? '#059669' : parseFloat(efficiency) > 50 ? '#d97706' : '#dc2626')}
      </div>
      {bW > PALLET_W || bD > PALLET_D ? (
        <div style={{ fontSize: fs.xs, color: '#dc2626', marginTop: 6 }}>⚠ Box dimensions exceed pallet footprint</div>
      ) : null}
    </div>
  )
}

type TruckType = 'van' | 'semi' | 'tautliner'

const TRUCK_SPECS: Record<TruckType, { label: string; length: number; width: number; height: number; maxWeight: number }> = {
  van:       { label: 'Delivery Van',  length: 4200,  width: 2000, height: 2000, maxWeight: 1500 },
  semi:      { label: 'Semi-trailer',  length: 13600, width: 2400, height: 2700, maxWeight: 24000 },
  tautliner: { label: 'Tautliner',     length: 13600, width: 2480, height: 2700, maxWeight: 24000 },
}

function TruckTab({ params }: { params: BoxParams }) {
  const [truckType, setTruckType] = useState<TruckType>('semi')
  const [weightPerBox, setWeightPerBox] = useState(0.5)

  const truck = TRUCK_SPECS[truckType]
  const { width: bW, depth: bD, height: bH } = params

  const colsW = bW > 0 ? Math.floor(truck.width / bW) : 0
  const rowsD = bD > 0 ? Math.floor(truck.length / bD) : 0
  const layersH = bH > 0 ? Math.floor(truck.height / bH) : 0
  const totalBoxes = colsW * rowsD * layersH
  const totalWeight = totalBoxes * weightPerBox
  const weightOk = totalWeight <= truck.maxWeight
  const fillPct = bW > 0 && bD > 0 && bH > 0
    ? ((totalBoxes * bW * bD * bH) / (truck.width * truck.length * truck.height) * 100).toFixed(1)
    : '0'

  return (
    <div>
      <FieldLabel>Truck type</FieldLabel>
      <select
        value={truckType}
        onChange={e => setTruckType(e.target.value as TruckType)}
        style={{ width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`, borderRadius: r.lg, padding: '4px 6px', background: c.white, fontFamily: 'inherit', marginBottom: 8 }}
      >
        {(Object.keys(TRUCK_SPECS) as TruckType[]).map(k => (
          <option key={k} value={k}>{TRUCK_SPECS[k].label} ({(TRUCK_SPECS[k].length / 1000).toFixed(1)}m)</option>
        ))}
      </select>
      {numInput('Weight per box (kg)', weightPerBox, setWeightPerBox, 0.01, 1000, 0.01)}
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '8px 10px', marginBottom: 8 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 4 }}>Truck: {truck.width}×{truck.length}×{truck.height} mm — Max {truck.maxWeight.toLocaleString()} kg</div>
        {[
          ['Boxes wide', colsW],
          ['Rows deep', rowsD],
          ['Layers high', layersH],
        ].map(([l, v]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: `1px solid ${c.borderXLight}` }}>
            <span style={{ fontSize: fs.sm, color: c.textMuted }}>{l}</span>
            <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.ink }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {metricBox('Total boxes', totalBoxes.toLocaleString())}
        {metricBox('Total weight', `${totalWeight.toFixed(0)} kg`, weightOk ? c.ink : '#dc2626')}
        {metricBox('Fill rate', `${fillPct}%`)}
      </div>
      {!weightOk && (
        <div style={{ fontSize: fs.xs, color: '#dc2626', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: r.lg, padding: '5px 8px', marginTop: 8 }}>
          ⚠ Total weight ({totalWeight.toFixed(0)} kg) exceeds {truck.maxWeight.toLocaleString()} kg limit
        </div>
      )}
    </div>
  )
}

function FacingTab({ params }: { params: BoxParams }) {
  const { width: bW, depth: bD, height: bH } = params

  const SHELF_W = 1200
  const SHELF_D = 400
  const SHELF_H = 200
  const NUM_SHELVES = 5

  const facingsWide = bW > 0 ? Math.floor(SHELF_W / bW) : 0
  const facingsDeep = bD > 0 ? Math.floor(SHELF_D / bD) : 0
  const facingsHigh = bH > 0 ? Math.floor((NUM_SHELVES * SHELF_H) / bH) : 0
  const totalUnits = facingsWide * facingsDeep * facingsHigh
  const shelfEfficiency = bW > 0 ? ((facingsWide * bW) / SHELF_W * 100).toFixed(1) : '0'

  const svgW = 220
  const svgH = 130
  const pad = 10
  const shelfSvgH = (svgH - pad * 2) / NUM_SHELVES
  const scaleX = (svgW - pad * 2) / SHELF_W

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 8 }}>Shelf: {SHELF_W}mm wide × {SHELF_D}mm deep, {NUM_SHELVES} shelves × {SHELF_H}mm</div>
      <svg width={svgW} height={svgH} style={{ border: `1px solid ${c.borderXLight}`, borderRadius: r.lg, background: c.surfaceAlt, display: 'block', width: '100%', marginBottom: 8 }}>
        {Array.from({ length: NUM_SHELVES }).map((_, si) => {
          const shelfY = pad + si * shelfSvgH
          const facings = bW > 0 ? Math.floor(SHELF_W / bW) : 0
          const boxSvgH = bH > 0 ? Math.min(shelfSvgH - 4, bH * scaleX) : shelfSvgH - 4
          const boxSvgW = bW * scaleX

          return (
            <g key={si}>
              <rect x={pad} y={shelfY + shelfSvgH - 3} width={svgW - pad * 2} height={3} fill="#c8a870" />
              {Array.from({ length: facings }).map((_, fi) => (
                <rect
                  key={fi}
                  x={pad + fi * boxSvgW + 1}
                  y={shelfY + shelfSvgH - 3 - boxSvgH}
                  width={Math.max(0, boxSvgW - 2)}
                  height={boxSvgH}
                  fill={`rgba(68,136,255,${0.15 + (fi % 2) * 0.1})`}
                  stroke="rgba(68,136,255,0.5)"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 6 }}>
        {metricBox('Wide', facingsWide)}
        {metricBox('Deep', facingsDeep)}
        {metricBox('High', facingsHigh)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {metricBox('Total units', totalUnits.toLocaleString())}
        {metricBox('Shelf fill', `${shelfEfficiency}%`, parseFloat(shelfEfficiency) > 80 ? '#059669' : '#d97706')}
      </div>
    </div>
  )
}

export function LogisticsSection({ params }: { params: BoxParams }) {
  const [tab, setTab] = useState<Tab>('stack')

  return (
    <CollapsibleSection label="Logistics">
      <div style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: fs.xs, padding: '3px 8px', borderRadius: r.pill, cursor: 'pointer',
              border: `1px solid ${tab === t.id ? c.accent : c.borderLight}`,
              background: tab === t.id ? c.accentBg : c.surface,
              color: tab === t.id ? c.accent : c.textMed,
              fontWeight: tab === t.id ? fw.bold : fw.normal,
            }}
          >{t.label}</button>
        ))}
      </div>
      {tab === 'stack'   && <StackTab params={params} />}
      {tab === 'gravity' && <GravityTab params={params} />}
      {tab === 'pallet'  && <PalletTab params={params} />}
      {tab === 'truck'   && <TruckTab params={params} />}
      {tab === 'facing'  && <FacingTab params={params} />}
    </CollapsibleSection>
  )
}
