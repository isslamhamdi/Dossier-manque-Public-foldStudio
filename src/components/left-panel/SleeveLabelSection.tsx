'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import type { BoxParams } from '@/lib/types'

type Tab = 'roll' | 'shrink' | 'labelwrap' | 'tolerance'

const TAB_LABELS: Record<Tab, string> = {
  roll: 'Roll',
  shrink: 'Shrink',
  labelwrap: 'Wrap',
  tolerance: 'Tolerance',
}

function TabPills({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
      {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '3px 8px',
            borderRadius: 20,
            fontSize: 9,
            fontWeight: 600,
            border: active === t ? 'none' : `1px solid ${c.borderLight}`,
            background: active === t ? c.ink : c.white,
            color: active === t ? c.white : c.textMuted,
            cursor: 'pointer',
          }}
        >
          {TAB_LABELS[t]}
        </button>
      ))}
    </div>
  )
}

function NumInput({ label, value, onChange, unit, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; unit?: string; step?: number
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <FieldLabel>{label}{unit ? ` (${unit})` : ''}</FieldLabel>
      <input
        type="number"
        value={value}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`,
          borderRadius: r.md, fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: c.surface, borderRadius: r.lg, padding: '8px 10px',
      border: `1px solid ${c.borderXLight}`, marginTop: 10,
    }}>
      {children}
    </div>
  )
}

function ResultRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
      <span style={{ fontSize: fs.xs, color: c.textMuted }}>{label}</span>
      <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: warn ? '#e65c00' : c.ink }}>{value}</span>
    </div>
  )
}

function RollTab() {
  const [labelW, setLabelW] = useState(80)
  const [labelH, setLabelH] = useState(120)
  const [gap, setGap] = useState(3)
  const [coreDiam, setCoreDiam] = useState(76)
  const [outerDiam, setOuterDiam] = useState(300)
  const [thicknessUm, setThicknessUm] = useState(90)

  const thicknessMm = thicknessUm / 1000
  const usableLength = thicknessUm > 0
    ? (Math.PI * (outerDiam ** 2 - coreDiam ** 2)) / (4 * thicknessMm)
    : 0
  const labelsPerRoll = labelH + gap > 0 ? Math.floor(usableLength / (labelH + gap)) : 0
  const wastePercent = usableLength > 0 ? (gap * labelsPerRoll) / usableLength * 100 : 0
  const rollWeightG = thicknessUm > 0
    ? (Math.PI / 4 * (outerDiam ** 2 - coreDiam ** 2) * thicknessMm * 1.4 * (labelW / 1000)) / 1000
    : 0

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #486 — Roll Label Efficiency
      </div>
      <NumInput label="Largeur étiquette" value={labelW} onChange={setLabelW} unit="mm" />
      <NumInput label="Hauteur étiquette" value={labelH} onChange={setLabelH} unit="mm" />
      <NumInput label="Gap entre étiquettes" value={gap} onChange={setGap} unit="mm" />
      <NumInput label="Diamètre mandrin (core)" value={coreDiam} onChange={setCoreDiam} unit="mm" />
      <NumInput label="Diamètre extérieur rouleau" value={outerDiam} onChange={setOuterDiam} unit="mm" />
      <NumInput label="Épaisseur matière" value={thicknessUm} onChange={setThicknessUm} unit="μm" />
      <ResultCard>
        <ResultRow label="Longueur utile" value={`${(usableLength / 1000).toFixed(1)} m`} />
        <ResultRow label="Étiquettes / rouleau" value={`${labelsPerRoll.toLocaleString()}`} />
        <ResultRow label="Déchets" value={`${wastePercent.toFixed(1)} %`} warn={wastePercent > 10} />
        <ResultRow label="Poids estimé" value={`${rollWeightG.toFixed(0)} g`} />
      </ResultCard>
    </div>
  )
}

const SHRINK_RANGES: Record<string, [number, number]> = {
  PVC: [40, 50],
  PET: [50, 75],
  OPS: [60, 75],
}

function ShrinkTab() {
  const [containerW, setContainerW] = useState(80)
  const [sleeveW, setSleeveW] = useState(120)
  const [tunnelTemp, setTunnelTemp] = useState(90)
  const [material, setMaterial] = useState<'PVC' | 'PET' | 'OPS'>('PVC')

  const shrinkRatio = sleeveW > 0 ? ((sleeveW - containerW) / sleeveW) * 100 : 0
  const [minR, maxR] = SHRINK_RANGES[material]
  const inRange = shrinkRatio >= minR && shrinkRatio <= maxR
  const tempEffect = tunnelTemp < 70 ? 'Trop froid — retrait insuffisant' : tunnelTemp > 130 ? 'Trop chaud — risque déformation' : 'Température OK'
  const tempWarn = tunnelTemp < 70 || tunnelTemp > 130

  const requiredSleeveW = containerW > 0 ? (containerW / (1 - (minR + maxR) / 2 / 100)) : 0

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #487 — Shrink Ratio Calculator
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Matière</FieldLabel>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['PVC', 'PET', 'OPS'] as const).map(m => (
            <button key={m} onClick={() => setMaterial(m)} style={{
              padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
              border: material === m ? 'none' : `1px solid ${c.borderLight}`,
              background: material === m ? '#5a6bd4' : c.white,
              color: material === m ? c.white : c.textMuted,
            }}>{m}</button>
          ))}
        </div>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginTop: 4 }}>
          Plage: {minR}–{maxR}%
        </div>
      </div>
      <NumInput label="Largeur conteneur (max)" value={containerW} onChange={setContainerW} unit="mm" />
      <NumInput label="Largeur sleeve avant retrait" value={sleeveW} onChange={setSleeveW} unit="mm" />
      <NumInput label="Température tunnel" value={tunnelTemp} onChange={setTunnelTemp} unit="°C" />
      <ResultCard>
        <ResultRow label="Taux de retrait" value={`${shrinkRatio.toFixed(1)} %`} warn={!inRange} />
        <div style={{
          fontSize: fs.xs, padding: '3px 6px', borderRadius: r.sm, marginBottom: 6,
          background: inRange ? 'rgba(0,180,0,0.08)' : 'rgba(230,92,0,0.08)',
          color: inRange ? '#1a7a1a' : '#e65c00',
        }}>
          {inRange ? `✓ Dans la plage ${material} (${minR}–${maxR}%)` : `⚠ Hors plage ${material} (${minR}–${maxR}%)`}
        </div>
        <ResultRow label="Effet température" value={tempEffect} warn={tempWarn} />
        <ResultRow label="Sleeve recommandée (milieu plage)" value={`${requiredSleeveW.toFixed(1)} mm`} />
      </ResultCard>
    </div>
  )
}

function LabelWrapTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerType, setContainerType] = useState<'bottle' | 'box' | 'cylinder'>('cylinder')
  const [containerW, setContainerW] = useState(80)
  const [containerH, setContainerH] = useState(150)
  const [labelW, setLabelW] = useState(220)
  const [labelH, setLabelH] = useState(100)
  const [overlap, setOverlap] = useState(5)

  const circumference = containerType === 'cylinder' ? Math.PI * containerW : containerW * 2 + 20
  const coveragePercent = circumference > 0 ? (labelW / circumference) * 100 : 0
  const overlapOk = overlap >= 3 && overlap <= 15

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 300, 200)

    const scaleX = 120 / Math.max(containerW, 1)
    const scaleY = 140 / Math.max(containerH, 1)
    const scale = Math.min(scaleX, scaleY, 1)
    const cW = containerW * scale
    const cH = containerH * scale
    const cx = 150
    const cy = 100
    const left = cx - cW / 2
    const top = cy - cH / 2

    if (containerType === 'cylinder') {
      ctx.fillStyle = '#ddd'
      ctx.beginPath()
      ctx.ellipse(cx, top, cW / 2, cW / 8, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#e8e8e8'
      ctx.fillRect(left, top, cW, cH)
      ctx.strokeStyle = '#bbb'
      ctx.strokeRect(left, top, cW, cH)
      ctx.fillStyle = '#ddd'
      ctx.beginPath()
      ctx.ellipse(cx, top + cH, cW / 2, cW / 8, 0, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = '#e8e8e8'
      ctx.fillRect(left, top, cW, cH)
      ctx.strokeStyle = '#bbb'
      ctx.strokeRect(left, top, cW, cH)
    }

    const lW = Math.min(labelW * scale, cW)
    const lH = labelH * scale
    const lTop = cy - lH / 2
    ctx.fillStyle = coveragePercent > 100 ? 'rgba(230,92,0,0.35)' : 'rgba(68,136,255,0.30)'
    ctx.fillRect(left, lTop, lW, lH)
    ctx.strokeStyle = coveragePercent > 100 ? '#e65c00' : '#4488ff'
    ctx.lineWidth = 1.5
    ctx.strokeRect(left, lTop, lW, lH)

    if (containerType === 'cylinder') {
      ctx.strokeStyle = '#4488ff'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(left + lW, lTop)
      ctx.lineTo(left + lW + 12, lTop - 8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(left + lW, lTop + lH)
      ctx.lineTo(left + lW + 12, lTop + lH + 8)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#4488ff'
      ctx.font = '8px sans-serif'
      ctx.fillText('wrap', left + lW + 14, lTop + lH / 2 + 3)
    }
  }, [containerType, containerW, containerH, labelW, labelH, overlap, coveragePercent])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #488 — Label Wrap Simulation
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Type conteneur</FieldLabel>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['cylinder', 'bottle', 'box'] as const).map(t => (
            <button key={t} onClick={() => setContainerType(t)} style={{
              padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
              border: containerType === t ? 'none' : `1px solid ${c.borderLight}`,
              background: containerType === t ? c.ink : c.white,
              color: containerType === t ? c.white : c.textMuted,
            }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <NumInput label="Conteneur L" value={containerW} onChange={setContainerW} unit="mm" />
        <NumInput label="Conteneur H" value={containerH} onChange={setContainerH} unit="mm" />
        <NumInput label="Étiquette L" value={labelW} onChange={setLabelW} unit="mm" />
        <NumInput label="Étiquette H" value={labelH} onChange={setLabelH} unit="mm" />
      </div>
      <NumInput label="Recouvrement" value={overlap} onChange={setOverlap} unit="mm" />
      <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, marginTop: 8, display: 'block' }} />
      <ResultCard>
        <ResultRow label="Circonférence" value={`${circumference.toFixed(1)} mm`} />
        <ResultRow label="Couverture" value={`${coveragePercent.toFixed(1)} %`} warn={coveragePercent > 100} />
        {coveragePercent > 100 && (
          <div style={{ fontSize: fs.xs, color: '#e65c00', marginTop: 4 }}>⚠ Étiquette trop large — réduire la largeur</div>
        )}
        <ResultRow label="Recouvrement" value={`${overlap} mm`} warn={!overlapOk} />
      </ResultCard>
    </div>
  )
}

type TrafficLight = 'green' | 'yellow' | 'red'

function TrafficDot({ status }: { status: TrafficLight }) {
  const colors: Record<TrafficLight, string> = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444' }
  return (
    <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[status], flexShrink: 0 }} />
  )
}

function ToleranceTab() {
  const [sleeveDiam, setSleeveDiam] = useState(80)
  const [sleeveHeight, setSleeveHeight] = useState(150)
  const [perforations, setPerforations] = useState(2)

  function check(val: number, min: number, max: number): TrafficLight {
    if (val < min || val > max) return 'red'
    const margin = (max - min) * 0.1
    if (val < min + margin || val > max - margin) return 'yellow'
    return 'green'
  }

  const diamStatus = check(sleeveDiam, 40, 200)
  const heightStatus = check(sleeveHeight, 40, 500)
  const perfStatus = check(perforations, 1, 6)

  const rows: Array<{ label: string; value: string; status: TrafficLight; note: string }> = [
    { label: 'Diamètre sleeve', value: `${sleeveDiam} mm`, status: diamStatus, note: 'Krones/Sacmi/Fuji: 40–200 mm' },
    { label: 'Hauteur sleeve', value: `${sleeveHeight} mm`, status: heightStatus, note: 'Min 40 mm, max 500 mm' },
    { label: 'Perforations', value: `${perforations} / 360°`, status: perfStatus, note: '1–6 perforations' },
  ]

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #489 — Sleeving Machine Tolerance Check
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 10 }}>
        Standard: Krones / Sacmi / Fuji — 36 000 pc/h max
      </div>
      <NumInput label="Diamètre sleeve" value={sleeveDiam} onChange={setSleeveDiam} unit="mm" />
      <NumInput label="Hauteur sleeve" value={sleeveHeight} onChange={setSleeveHeight} unit="mm" />
      <NumInput label="Perforations (1–6)" value={perforations} onChange={v => setPerforations(Math.min(6, Math.max(1, Math.round(v))))} unit="/360°" />
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(row => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
            borderRadius: r.md, background: c.surface, border: `1px solid ${c.borderXLight}`,
          }}>
            <TrafficDot status={row.status} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: fs.sm, color: c.ink, fontWeight: fw.medium }}>{row.label} — {row.value}</div>
              <div style={{ fontSize: 8, color: c.textMuted }}>{row.note}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginTop: 10 }}>
        Vitesse max: <strong>36 000 pc/h</strong>
      </div>
    </div>
  )
}

export function SleeveLabelSection({ params }: { params: BoxParams }) {
  const [tab, setTab] = useState<Tab>('roll')
  return (
    <CollapsibleSection label="Sleeve & Label">
      <TabPills active={tab} onChange={setTab} />
      {tab === 'roll' && <RollTab />}
      {tab === 'shrink' && <ShrinkTab />}
      {tab === 'labelwrap' && <LabelWrapTab />}
      {tab === 'tolerance' && <ToleranceTab />}
    </CollapsibleSection>
  )
}
