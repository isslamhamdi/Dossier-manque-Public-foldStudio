'use client'

import { useRef, useState, useEffect } from 'react'
import type { BoxParams } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'carbon' | 'biodeg' | 'pcr' | 'compost' | 'ocean'

// ─── Static data ──────────────────────────────────────────────────────────────

const CO2_MATERIALS = [
  { id: 'kraft',      label: 'Kraft',       co2e: 1.1  },
  { id: 'sbs',        label: 'SBS',         co2e: 2.0  },
  { id: 'corrugated', label: 'Ondulé',      co2e: 0.8  },
  { id: 'pet',        label: 'PET',         co2e: 3.5  },
  { id: 'pe',         label: 'PE',          co2e: 1.9  },
  { id: 'aluminum',   label: 'Aluminium',   co2e: 8.2  },
  { id: 'glass',      label: 'Verre',       co2e: 0.9  },
]

const BIODEG_DAYS: { id: string; label: string; days: number; color: string }[] = [
  { id: 'cellulose',  label: 'Cellulose',   days: 30,      color: '#43a047' },
  { id: 'kraft',      label: 'Kraft',       days: 90,      color: '#66bb6a' },
  { id: 'pla',        label: 'PLA',         days: 180,     color: '#8bc34a' },
  { id: 'sbs',        label: 'SBS',         days: 120,     color: '#a5d6a7' },
  { id: 'pe',         label: 'PE',          days: 100000,  color: '#ef9a9a' },
  { id: 'pet',        label: 'PET',         days: 140000,  color: '#e57373' },
  { id: 'aluminum',   label: 'Aluminium',   days: 500000,  color: '#ef5350' },
  { id: 'glass',      label: 'Verre',       days: 1000000, color: '#b71c1c' },
]

const OCEAN_CERTS = [
  { id: 'obp',  label: 'Ocean Bound Plastic'   },
  { id: 'zpo',  label: 'Zero Plastic Oceans'   },
  { id: 'pop',  label: 'Prevented Ocean Plastic'},
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${c.border}`,
  borderRadius: r.md,
  padding: '5px 8px',
  fontSize: fs.md,
  outline: 'none',
  boxSizing: 'border-box',
  background: c.white,
  color: c.ink,
  fontFamily: 'inherit',
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  background: c.ink,
  color: c.white,
  border: 'none',
  borderRadius: r.lg,
  padding: '7px 0',
  fontSize: fs.md,
  fontWeight: fw.bold,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

// ─── Tab: Carbon Badge ─────────────────────────────────────────────────

function CarbonTab() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [matId, setMatId]   = useState('kraft')
  const [weightG, setWeightG] = useState(50)
  const [generated, setGenerated] = useState(false)

  const mat    = CO2_MATERIALS.find(m => m.id === matId)!
  const co2g   = (weightG / 1000) * mat.co2e * 1000
  const badgeColor = co2g < 10 ? '#43a047' : co2g < 50 ? '#f57c00' : '#e53935'

  const drawBadge = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = 140
    canvas.height = 140
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 140, 140)
    const cx = 70, cy = 70, rad = 64

    const grad = ctx.createRadialGradient(cx - 20, cy - 20, 8, cx, cy, rad)
    grad.addColorStop(0, badgeColor + 'dd')
    grad.addColorStop(1, badgeColor)
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const valStr = co2g < 1000 ? `${co2g.toFixed(1)}g` : `${(co2g / 1000).toFixed(2)}kg`
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText(valStr, cx, cy - 8)
    ctx.font = '11px sans-serif'
    ctx.fillText('CO₂e', cx, cy + 12)
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('Carbon Footprint', cx, cy + 28)
    setGenerated(true)
  }

  const handleExport = () => {
    if (!canvasRef.current || !generated) return
    const a = document.createElement('a')
    a.href     = canvasRef.current.toDataURL('image/png')
    a.download = 'carbon-badge.png'
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Matière</FieldLabel>
        <select value={matId} onChange={e => setMatId(e.target.value)} style={inputStyle}>
          {CO2_MATERIALS.map(m => (
            <option key={m.id} value={m.id}>{m.label} — {m.co2e} kg CO₂e/kg</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Poids (grammes)</FieldLabel>
        <input type="number" min={1} value={weightG}
          onChange={e => setWeightG(Number(e.target.value))} style={inputStyle} />
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: c.surface, borderRadius: r.md, padding: '8px 12px',
      }}>
        <span style={{ fontSize: fs.sm, color: c.textMuted }}>CO₂e estimé</span>
        <span style={{ fontSize: 16, fontWeight: fw.heavy, color: badgeColor }}>
          {co2g.toFixed(2)} g CO₂e
        </span>
      </div>

      <button onClick={drawBadge} style={btnPrimary}>Générer badge</button>

      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto', borderRadius: '50%', width: 100, height: 100 }} />

      {generated && (
        <button onClick={handleExport} style={{ ...btnPrimary, background: '#1565c0' }}>
          Exporter PNG
        </button>
      )}
    </div>
  )
}

// ─── Tab: Biodegradation ───────────────────────────────────────────────

function BiodegTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width  = 240
    const H = canvas.height = BIODEG_DAYS.length * 24 + 30
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, W, H)

    const logMax   = Math.log10(1000001)
    const barStart = 70
    const barW     = W - barStart - 10

    ctx.font      = 'bold 9px sans-serif'
    ctx.fillStyle = '#888'
    ctx.fillText('Durée de biodégradation (échelle log)', 2, 12)

    BIODEG_DAYS.forEach((mat, i) => {
      const y    = 24 + i * 24
      const logD = Math.log10(Math.max(1, mat.days))
      const w    = (logD / logMax) * barW

      ctx.fillStyle = '#555'
      ctx.font      = '9px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(mat.label, 2, y + 10)

      ctx.fillStyle = mat.color
      ctx.beginPath()
      ctx.roundRect(barStart, y, w, 14, 3)
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.font      = 'bold 8px sans-serif'
      ctx.textAlign = 'left'
      const label = mat.days >= 1000 ? `${(mat.days / 365).toFixed(0)} ans` : `${mat.days} j`
      ctx.fillText(label, barStart + w + 3, y + 10)
    })

    // Kraft reference line
    const kraftLog = Math.log10(90)
    const refX     = barStart + (kraftLog / logMax) * barW
    ctx.strokeStyle = '#1565c0'
    ctx.lineWidth   = 1
    ctx.setLineDash([3, 2])
    ctx.beginPath()
    ctx.moveTo(refX, 20)
    ctx.lineTo(refX, H - 5)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle  = '#1565c0'
    ctx.font       = '8px sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText('Kraft réf.', refX, H - 2)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: fs.sm, color: c.textMuted }}>Durée de biodégradation (échelle logarithmique)</div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto' }} />
    </div>
  )
}

// ─── Tab: PCR Tracker ──────────────────────────────────────────────────

function PCRTab() {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const [total, setTotal] = useState(100)
  const [pcr, setPcr]     = useState(60)

  const pct   = total > 0 ? Math.min(100, (pcr / total) * 100) : 0
  const grade =
    pct >= 100 ? { label: 'Excellent', color: '#2e7d32' } :
    pct >= 50  ? { label: 'Good — GRS ✓', color: '#43a047' } :
    pct >= 30  ? { label: 'Acceptable', color: '#f57c00' } :
                 { label: 'Low', color: '#e53935' }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 100, 100)
    const cx = 50, cy = 50, rad = 40
    const start = -Math.PI / 2
    const end   = start + (pct / 100) * Math.PI * 2

    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.strokeStyle = c.borderLight
    ctx.lineWidth   = 10
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, rad, start, end)
    ctx.strokeStyle = grade.color
    ctx.lineWidth   = 10
    ctx.lineCap     = 'round'
    ctx.stroke()

    ctx.fillStyle   = grade.color
    ctx.font        = 'bold 18px sans-serif'
    ctx.textAlign   = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${Math.round(pct)}%`, cx, cy - 4)
    ctx.font        = '9px sans-serif'
    ctx.fillStyle   = '#888'
    ctx.fillText('PCR', cx, cy + 12)
  }, [pct, grade.color])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Poids total (g)</FieldLabel>
        <input type="number" min={1} value={total}
          onChange={e => setTotal(Number(e.target.value))} style={inputStyle} />
      </div>
      <div>
        <FieldLabel>Poids PCR (g)</FieldLabel>
        <input type="number" min={0} max={total} value={pcr}
          onChange={e => setPcr(Math.min(total, Number(e.target.value)))} style={inputStyle} />
      </div>

      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto', width: 80, height: 80 }} />

      <div style={{
        background: grade.color + '22',
        border: `1px solid ${grade.color}55`,
        borderRadius: r.md,
        padding: '7px 12px',
        textAlign: 'center',
        fontSize: fs.md,
        fontWeight: fw.bold,
        color: grade.color,
      }}>
        {grade.label}
      </div>

      <div style={{ fontSize: fs.sm, color: c.textMuted }}>
        Seuil GRS (Global Recycled Standard) : 50%
      </div>
    </div>
  )
}

// ─── Tab: Compostability ───────────────────────────────────────────────

const COMPOST_CRITERIA = [
  { id: 'material',       label: 'Matière OK (sans métaux lourds, sans halogènes)' },
  { id: 'disintegration', label: 'Désintégration > 90% en 12 semaines' },
  { id: 'biodegradation', label: 'Biodégradation > 90% (carbone → CO₂)' },
  { id: 'ecotoxicity',    label: 'Éco-toxicité OK (norme EN 13432)' },
]

function CompostTab() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  const allOk  = COMPOST_CRITERIA.every(cr => checked[cr.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: fs.sm, color: c.textMuted }}>Checklist EN 13432 — compostabilité industrielle</div>

      {COMPOST_CRITERIA.map(cr => (
        <label key={cr.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          fontSize: fs.md, color: c.textMed, cursor: 'pointer',
          padding: '5px 8px',
          background: checked[cr.id] ? '#e8f5e9' : c.surface,
          borderRadius: r.md,
          border: `1px solid ${checked[cr.id] ? '#a5d6a7' : c.borderLight}`,
          transition: 'background 0.15s',
        }}>
          <input
            type="checkbox"
            checked={!!checked[cr.id]}
            onChange={() => toggle(cr.id)}
            style={{ marginTop: 1, accentColor: '#43a047' }}
          />
          <span>{cr.label}</span>
        </label>
      ))}

      <div style={{
        borderRadius: r.md,
        border: `2px solid ${allOk ? '#43a047' : '#e53935'}`,
        padding: '12px',
        textAlign: 'center',
        background: allOk ? '#e8f5e9' : '#ffebee',
      }}>
        <CompostLogoSVG ok={allOk} />
        <div style={{ fontSize: 13, fontWeight: fw.heavy, color: allOk ? '#2e7d32' : '#c62828', marginTop: 6 }}>
          {allOk ? 'Compostable EN 13432' : 'Non Compostable'}
        </div>
        <div style={{ fontSize: fs.sm, color: c.textMuted, marginTop: 2 }}>
          {allOk ? 'Tous les critères sont satisfaits.' : `${COMPOST_CRITERIA.filter(cr => !checked[cr.id]).length} critère(s) manquant(s)`}
        </div>
      </div>
    </div>
  )
}

function CompostLogoSVG({ ok }: { ok: boolean }) {
  const col = ok ? '#43a047' : '#e53935'
  return (
    <svg width={48} height={48} viewBox="0 0 48 48" style={{ display: 'block', margin: '0 auto' }}>
      <circle cx={24} cy={24} r={22} fill="none" stroke={col} strokeWidth={2} />
      {/* Seedling */}
      <path d="M24 34 L24 22" stroke={col} strokeWidth={2} strokeLinecap="round" />
      <path d="M24 26 Q18 20 18 14 Q24 14 24 22" fill={col} opacity={0.7} />
      <path d="M24 28 Q30 22 30 14 Q24 14 24 22" fill={col} opacity={0.5} />
      {/* OK check or X */}
      {ok ? (
        <path d="M14 26 L19 32 L33 17" fill="none" stroke={col} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <line x1={16} y1={16} x2={32} y2={32} stroke={col} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={32} y1={16} x2={16} y2={32} stroke={col} strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

// ─── Tab: Ocean Plastic ────────────────────────────────────────────────

function OceanTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pct, setPct]       = useState(30)
  const [supplier, setSupplier] = useState('')
  const [cert, setCert]     = useState('obp')
  const [generated, setGenerated] = useState(false)

  const drawBadge = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = 160
    canvas.height = 160
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 160, 160)
    const cx = 80, cy = 80, rad = 72

    const grad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, rad)
    grad.addColorStop(0, '#29b6f6')
    grad.addColorStop(1, '#01579b')
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#0277bd'
    ctx.lineWidth = 2
    ctx.stroke()

    // Wave
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth   = 2
    for (let x = 0; x <= 160; x += 1) {
      const y = 95 + 5 * Math.sin((x / 30) * Math.PI)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Anchor icon (simple)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth   = 2
    ctx.fillStyle   = '#fff'
    ctx.beginPath()
    ctx.arc(cx, 52, 6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, 58)
    ctx.lineTo(cx, 76)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 10, 62)
    ctx.lineTo(cx + 10, 62)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx - 10, 62)
    ctx.arc(cx - 10, 71, 9, -Math.PI / 2, Math.PI / 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx + 10, 62)
    ctx.arc(cx + 10, 71, 9, Math.PI / 2, -Math.PI / 2)
    ctx.stroke()

    ctx.fillStyle    = '#fff'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.font         = 'bold 20px sans-serif'
    ctx.fillText(`${pct}%`, cx, cy + 18)
    ctx.font         = '10px sans-serif'
    ctx.fillText('Ocean Plastic', cx, cy + 35)

    setGenerated(true)
  }

  const handleExport = () => {
    if (!canvasRef.current || !generated) return
    const a = document.createElement('a')
    a.href     = canvasRef.current.toDataURL('image/png')
    a.download = 'ocean-plastic-badge.png'
    a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Teneur plastique océan (%)</FieldLabel>
        <input type="range" min={0} max={100} step={1} value={pct}
          onChange={e => setPct(Number(e.target.value))} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.sm, color: c.textMuted }}>
          <span>0%</span>
          <span style={{ fontWeight: fw.bold, color: '#01579b' }}>{pct}%</span>
          <span>100%</span>
        </div>
      </div>

      <div>
        <FieldLabel>Fournisseur</FieldLabel>
        <input
          type="text" value={supplier} placeholder="Nom du fournisseur"
          onChange={e => setSupplier(e.target.value)} style={inputStyle}
        />
      </div>

      <div>
        <FieldLabel>Certification</FieldLabel>
        <select value={cert} onChange={e => setCert(e.target.value)} style={inputStyle}>
          {OCEAN_CERTS.map(oc => (
            <option key={oc.id} value={oc.id}>{oc.label}</option>
          ))}
        </select>
      </div>

      {supplier && (
        <div style={{
          fontSize: fs.sm, color: c.textMuted,
          padding: '5px 8px', background: c.surface, borderRadius: r.md,
        }}>
          Certifié {OCEAN_CERTS.find(o => o.id === cert)?.label} — {supplier}
        </div>
      )}

      <button onClick={drawBadge} style={{ ...btnPrimary, background: '#01579b' }}>
        Générer badge
      </button>

      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto', borderRadius: '50%', width: 110, height: 110 }} />

      {generated && (
        <button onClick={handleExport} style={{ ...btnPrimary, background: '#0277bd' }}>
          Exporter PNG
        </button>
      )}
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'carbon',  label: 'Carbone' },
  { id: 'biodeg',  label: 'Biodég.' },
  { id: 'pcr',     label: 'PCR'     },
  { id: 'compost', label: 'Compost' },
  { id: 'ocean',   label: 'Océan'   },
]

export function EcoExtendedSection({ params: _params }: { params: BoxParams }) {
  const [activeTab, setActiveTab] = useState<TabId>('carbon')

  return (
    <CollapsibleSection label="Éco — #440-444">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: fs.sm,
              fontWeight: activeTab === tab.id ? fw.bold : fw.normal,
              background: activeTab === tab.id ? c.ink : c.surface,
              color: activeTab === tab.id ? c.white : c.textMed,
              border: `1px solid ${activeTab === tab.id ? c.ink : c.border}`,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'carbon'  && <CarbonTab />}
      {activeTab === 'biodeg'  && <BiodegTab />}
      {activeTab === 'pcr'     && <PCRTab />}
      {activeTab === 'compost' && <CompostTab />}
      {activeTab === 'ocean'   && <OceanTab />}
    </CollapsibleSection>
  )
}
