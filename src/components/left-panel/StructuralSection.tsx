'use client'

import { useRef, useState, useEffect } from 'react'
import type { BoxParams } from '@/lib/types'
import type { DielineData } from '@/lib/dieline/helpers'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'grain' | 'complexity' | 'shadow' | 'score' | 'caliper' | 'flute' | 'ectbct' | 'humidity'

// ─── Static data ──────────────────────────────────────────────────────────────

const FLUTE_DATA: { id: string; label: string; height: number; count: number }[] = [
  { id: 'A', label: 'A', height: 4.8,  count: 33  },
  { id: 'B', label: 'B', height: 2.5,  count: 50  },
  { id: 'C', label: 'C', height: 3.7,  count: 38  },
  { id: 'E', label: 'E', height: 1.2,  count: 90  },
  { id: 'F', label: 'F', height: 0.75, count: 128 },
  { id: 'N', label: 'N', height: 0.5,  count: 180 },
  { id: 'G', label: 'G', height: 0.18, count: 250 },
]

const FLUTE_SCORE_DEPTH: Record<string, number> = {
  A: 1.5, B: 1.0, C: 1.2, E: 0.7, F: 0.5, N: 0.4,
}

const PAPER_DENSITY: Record<string, number> = {
  kraft:      0.8,
  coated:     0.75,
  corrugated: 0.7,
  newsprint:  0.65,
}

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

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: fs.xs,
  color: c.textMuted,
  fontWeight: fw.bold,
  letterSpacing: 0.4,
  borderBottom: `1px solid ${c.borderLight}`,
  textAlign: 'left',
}

const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: fs.md,
  borderBottom: `1px solid ${c.borderXLight}`,
  color: c.textMed,
}

// ─── Tab: Grain ───────────────────────────────────────────────────────────────

function GrainTab({ params }: { params: BoxParams }) {
  const [grain, setGrain] = useState<'MD' | 'CD'>('MD')
  const { width, height } = params
  const svgW = 160
  const svgH = Math.round((height / Math.max(width, 1)) * svgW)
  const capped = Math.min(svgH, 120)
  const scaleY = capped / svgH
  const finalH = Math.round(svgH * scaleY)
  const arrowX1 = grain === 'MD' ? 20        : svgW / 2
  const arrowY1 = grain === 'MD' ? finalH / 2 : 10
  const arrowX2 = grain === 'MD' ? svgW - 20  : svgW / 2
  const arrowY2 = grain === 'MD' ? finalH / 2 : finalH - 10
  const cdFold  = grain === 'CD'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Direction de grain</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['MD', 'CD'] as const).map(g => (
            <button
              key={g}
              onClick={() => setGrain(g)}
              style={{
                flex: 1,
                padding: '5px 0',
                fontSize: fs.md,
                fontWeight: grain === g ? fw.bold : fw.normal,
                background: grain === g ? c.ink : c.surface,
                color: grain === g ? c.white : c.textMed,
                border: `1px solid ${c.border}`,
                borderRadius: r.md,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {g === 'MD' ? 'MD — Machine Direction' : 'CD — Cross Direction'}
            </button>
          ))}
        </div>
      </div>

      <svg
        width={svgW}
        height={finalH}
        style={{ display: 'block', margin: '0 auto', border: `1px solid ${c.borderLight}`, borderRadius: r.md }}
      >
        <rect x={0} y={0} width={svgW} height={finalH} fill={c.surface} />
        <rect x={2} y={2} width={svgW - 4} height={finalH - 4} fill="none" stroke={c.border} strokeWidth={1} />
        <line
          x1={arrowX1} y1={arrowY1} x2={arrowX2} y2={arrowY2}
          stroke={cdFold ? '#e53935' : '#1565c0'}
          strokeWidth={2}
          strokeDasharray="5 3"
        />
        <polygon
          points={
            grain === 'MD'
              ? `${arrowX2},${arrowY2} ${arrowX2 - 8},${arrowY2 - 5} ${arrowX2 - 8},${arrowY2 + 5}`
              : `${arrowX2},${arrowY2} ${arrowX2 - 5},${arrowY2 - 8} ${arrowX2 + 5},${arrowY2 - 8}`
          }
          fill={cdFold ? '#e53935' : '#1565c0'}
        />
        <text x={svgW / 2} y={finalH - 6} textAnchor="middle" fontSize={9} fill={c.textMuted}>{grain}</text>
      </svg>

      {cdFold && (
        <div style={{
          background: '#fff3e0',
          border: '1px solid #ffcc80',
          borderRadius: r.md,
          padding: '7px 10px',
          fontSize: fs.sm,
          color: '#e65100',
        }}>
          Attention : pli perpendiculaire au grain (CD) — risque de fissure au pliage.
        </div>
      )}

      {!cdFold && (
        <div style={{
          background: '#e8f5e9',
          border: '1px solid #a5d6a7',
          borderRadius: r.md,
          padding: '7px 10px',
          fontSize: fs.sm,
          color: '#2e7d32',
        }}>
          Direction MD optimale — pliage dans le sens du grain.
        </div>
      )}
    </div>
  )
}

// ─── Tab: Complexity ──────────────────────────────────────────────────────────

function ComplexityTab({ dieline }: { dieline: DielineData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const cutCount  = dieline.cutPath?.split('M').filter(Boolean).length ?? 0
  const foldCount = dieline.foldLines?.length ?? 0
  const rawScore  = Math.min(10, 1 + Math.max(0, Math.floor((cutCount - 100) / 10)))
  const score     = Math.max(1, rawScore)
  const cost      = score * 15
  const pct       = score / 10

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = 120
    canvas.height = 120
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, 120, 120)
    const cx = 60, cy = 65, rad = 48
    const start = Math.PI
    const end   = start + Math.PI * pct

    ctx.beginPath()
    ctx.arc(cx, cy, rad, Math.PI, 2 * Math.PI)
    ctx.strokeStyle = c.borderLight
    ctx.lineWidth = 10
    ctx.stroke()

    const col = score <= 3 ? '#43a047' : score <= 6 ? '#f57c00' : '#e53935'
    ctx.beginPath()
    ctx.arc(cx, cy, rad, start, end)
    ctx.strokeStyle = col
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.stroke()

    ctx.fillStyle = col
    ctx.font = `bold 22px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(score), cx, cy - 4)
    ctx.font = `10px sans-serif`
    ctx.fillStyle = c.textMuted
    ctx.fillText('/10', cx, cy + 16)
  }, [score, pct])

  const recs: string[] = []
  if (score >= 7) recs.push('Simplifier les découpes complexes')
  if (score >= 5) recs.push('Regrouper les lignes proches')
  if (foldCount > 12) recs.push('Réduire le nombre de plis')
  if (score <= 3) recs.push('Complexité optimale pour la production')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <canvas ref={canvasRef} style={{ display: 'block', margin: '0 auto' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Découpes</div>
          <div style={{ fontSize: 14, fontWeight: fw.heavy, color: c.ink }}>{cutCount}</div>
        </div>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Plis</div>
          <div style={{ fontSize: 14, fontWeight: fw.heavy, color: c.ink }}>{foldCount}</div>
        </div>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Coût estim.</div>
          <div style={{ fontSize: 14, fontWeight: fw.heavy, color: '#1565c0' }}>{cost}€</div>
        </div>
      </div>
      {recs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recs.map((rec, i) => (
            <div key={i} style={{
              fontSize: fs.sm, color: c.textMed,
              padding: '4px 8px', background: c.surfaceAlt,
              borderLeft: `3px solid ${c.accent}`, borderRadius: r.sm,
            }}>
              {rec}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Shadow Line ─────────────────────────────────────────────────────────

function ShadowLineTab({ params }: { params: BoxParams }) {
  const [fit, setFit]   = useState<'standard' | 'loose'>('standard')
  const th = params.thickness || 0.5
  const shadowLine = th * (fit === 'standard' ? 1.5 : 2.0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Largeur (mm)</FieldLabel>
          <div style={{ ...inputStyle, background: c.surface, color: c.textMed }}>{params.width}</div>
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Hauteur (mm)</FieldLabel>
          <div style={{ ...inputStyle, background: c.surface, color: c.textMed }}>{params.height}</div>
        </div>
      </div>

      <div>
        <FieldLabel>Épaisseur matière (mm)</FieldLabel>
        <div style={{ ...inputStyle, background: c.surface, color: c.textMed }}>{th} mm</div>
      </div>

      <div>
        <FieldLabel>Type d'emboîtement</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['standard', 'loose'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFit(f)}
              style={{
                flex: 1, padding: '5px 0', fontSize: fs.md,
                fontWeight: fit === f ? fw.bold : fw.normal,
                background: fit === f ? c.ink : c.surface,
                color: fit === f ? c.white : c.textMed,
                border: `1px solid ${c.border}`, borderRadius: r.md,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {f === 'standard' ? 'Standard ×1.5' : 'Loose ×2.0'}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        background: '#e8f5e9', border: '1px solid #a5d6a7',
        borderRadius: r.md, padding: '10px 12px', textAlign: 'center',
      }}>
        <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Shadow line recommandée</div>
        <div style={{ fontSize: 20, fontWeight: fw.heavy, color: '#2e7d32' }}>{shadowLine.toFixed(2)} mm</div>
      </div>

      <svg width={160} height={60} style={{ display: 'block', margin: '0 auto' }}>
        <rect x={10} y={10} width={60} height={40} fill="none" stroke={c.border} strokeWidth={1.5} />
        <rect x={70} y={10} width={60} height={40} fill="none" stroke={c.border} strokeWidth={1.5} />
        <line x1={70} y1={5} x2={70} y2={55} stroke="#1565c0" strokeWidth={1} strokeDasharray="3 2" />
        <text x={80} y={35} fontSize={9} fill="#1565c0">{shadowLine.toFixed(2)}</text>
        <text x={12} y={35} fontSize={9} fill={c.textMuted}>Plateau</text>
        <text x={72} y={35} fontSize={9} fill={c.textMuted}>Couvercle</text>
      </svg>
    </div>
  )
}

// ─── Tab: Score Depth ─────────────────────────────────────────────────────────

function ScoreDepthTab() {
  const [grammage, setGrammage] = useState(200)
  const [flute, setFlute]       = useState<string>('B')

  const base  = FLUTE_SCORE_DEPTH[flute] ?? 1.0
  const depth = base * (grammage / 400)
  const pct   = Math.min(100, (depth / 3) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Grammage (g/m²)</FieldLabel>
        <input
          type="range" min={80} max={800} step={10}
          value={grammage} onChange={e => setGrammage(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: fs.sm, color: c.textMuted, textAlign: 'right' }}>{grammage} g/m²</div>
      </div>

      <div>
        <FieldLabel>Type de cannelure (FEFCO)</FieldLabel>
        <select value={flute} onChange={e => setFlute(e.target.value)} style={inputStyle}>
          {Object.keys(FLUTE_SCORE_DEPTH).map(f => (
            <option key={f} value={f}>Cannelure {f} — base {FLUTE_SCORE_DEPTH[f]} mm</option>
          ))}
        </select>
      </div>

      <div style={{
        background: c.surface, borderRadius: r.md, padding: '10px 12px', textAlign: 'center',
      }}>
        <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Profondeur de rainure recommandée</div>
        <div style={{ fontSize: 20, fontWeight: fw.heavy, color: c.ink }}>{depth.toFixed(2)} mm</div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.sm, color: c.textMuted, marginBottom: 4 }}>
          <span>0 mm</span><span>3 mm</span>
        </div>
        <div style={{ height: 10, background: c.borderLight, borderRadius: r.pill, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: depth < 1 ? '#43a047' : depth < 2 ? '#f57c00' : '#e53935',
            borderRadius: r.pill, transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ fontSize: fs.sm, color: c.textMuted, fontStyle: 'italic' }}>
        Référence FEFCO — profondeur = base_{'{flute}'} × (grammage / 400)
      </div>
    </div>
  )
}

// ─── Tab: Caliper ─────────────────────────────────────────────────────────────

function CaliperTab() {
  const [grammage, setGrammage] = useState(300)
  const [paperType, setPaperType] = useState<keyof typeof PAPER_DENSITY>('kraft')

  const density  = PAPER_DENSITY[paperType]
  const caliperMm = grammage / (density * 1000)
  const caliperMicron = caliperMm * 1000

  const presets = [80, 150, 200, 300, 400]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Grammage (g/m²)</FieldLabel>
        <input
          type="number" min={50} max={1000} value={grammage}
          onChange={e => setGrammage(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <FieldLabel>Type de papier</FieldLabel>
        <select value={paperType} onChange={e => setPaperType(e.target.value as keyof typeof PAPER_DENSITY)} style={inputStyle}>
          <option value="kraft">Kraft (0.80 g/cm³)</option>
          <option value="coated">Couché (0.75 g/cm³)</option>
          <option value="corrugated">Ondulé (0.70 g/cm³)</option>
          <option value="newsprint">Journal (0.65 g/cm³)</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Épaisseur</div>
          <div style={{ fontSize: 16, fontWeight: fw.heavy, color: c.ink }}>{caliperMm.toFixed(3)} mm</div>
        </div>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Microns</div>
          <div style={{ fontSize: 16, fontWeight: fw.heavy, color: '#1565c0' }}>{Math.round(caliperMicron)} μm</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
        <thead>
          <tr>
            <th style={thStyle}>Grammage</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>mm</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>μm</th>
          </tr>
        </thead>
        <tbody>
          {presets.map(g => {
            const mm = g / (density * 1000)
            return (
              <tr key={g} style={{ background: g === grammage ? c.accentBg : 'transparent' }}>
                <td style={{ ...tdStyle, color: g === grammage ? c.accent : c.textMed }}>{g} g/m²</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{mm.toFixed(3)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{Math.round(mm * 1000)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab: Flute Reference ─────────────────────────────────────────────────────

function FluteTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: fs.sm, color: c.textMuted }}>Référence cannelures — hauteurs et fréquences</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
        <thead>
          <tr>
            <th style={thStyle}>Type</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Haut. (mm)</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Freq. (/m)</th>
            <th style={{ ...thStyle, textAlign: 'center' }}>Profil</th>
          </tr>
        </thead>
        <tbody>
          {FLUTE_DATA.map(f => (
            <tr key={f.id}>
              <td style={{ ...tdStyle, fontWeight: fw.bold, color: c.ink }}>{f.label}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{f.height}</td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>{f.count}</td>
              <td style={{ ...tdStyle, textAlign: 'center' }}>
                <FluteProfileSVG height={f.height} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FluteProfileSVG({ height }: { height: number }) {
  const w = 48
  const h = 18
  const amp = Math.min(7, (height / 5) * 7)
  const periods = 3
  const points: string[] = []

  for (let i = 0; i <= w; i++) {
    const y = h / 2 - amp * Math.sin((i / w) * Math.PI * 2 * periods)
    points.push(`${i},${y.toFixed(1)}`)
  }

  return (
    <svg width={w} height={h} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={c.accent}
        strokeWidth={1.2}
      />
    </svg>
  )
}

// ─── Tab: ECT/BCT ─────────────────────────────────────────────────────────────

function ECTBCTTab({ params }: { params: BoxParams }) {
  const [ect, setEct]           = useState(6.0)
  const [perimeterMm, setPerimeter] = useState<number>((params.width + params.depth) * 2)
  const [heightMm, setHeight]   = useState<number>(params.height)

  const k   = 5.87
  const bct = ect * Math.sqrt((perimeterMm / 1000) * (heightMm / 1000)) * k
  const safeStack = bct / 3

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>ECT (kN/m)</FieldLabel>
        <input type="number" min={0.1} step={0.1} value={ect}
          onChange={e => setEct(Number(e.target.value))} style={inputStyle} />
      </div>
      <div>
        <FieldLabel>Périmètre (mm)</FieldLabel>
        <input type="number" min={1} value={perimeterMm}
          onChange={e => setPerimeter(Number(e.target.value))} style={inputStyle} />
      </div>
      <div>
        <FieldLabel>Hauteur boîte (mm)</FieldLabel>
        <input type="number" min={1} value={heightMm}
          onChange={e => setHeight(Number(e.target.value))} style={inputStyle} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>BCT (McKee)</div>
          <div style={{ fontSize: 16, fontWeight: fw.heavy, color: c.ink }}>{bct.toFixed(1)} kg</div>
        </div>
        <div style={{ flex: 1, background: '#e8f5e9', borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Empilement ×3</div>
          <div style={{ fontSize: 16, fontWeight: fw.heavy, color: '#2e7d32' }}>{safeStack.toFixed(1)} kg</div>
        </div>
      </div>

      <div style={{ fontSize: fs.sm, color: c.textMuted, fontStyle: 'italic' }}>
        BCT = ECT × √(périmètre × hauteur) × k  (k=5.87 RSC)
      </div>
    </div>
  )
}

// ─── Tab: Humidity ────────────────────────────────────────────────────────────

function HumidityTab() {
  const [bct50, setBct50] = useState(100)
  const [rh, setRh]       = useState(50)

  const factor = 1 - 0.003 * (rh - 50)
  const bctCorr = bct50 * factor
  const pct     = Math.min(100, Math.max(0, (bctCorr / Math.max(bct50, 1)) * 100))

  const rhColor = rh <= 50 ? '#43a047' : rh <= 70 ? '#f57c00' : '#e53935'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>BCT à 50% HR (kg)</FieldLabel>
        <input type="number" min={1} value={bct50}
          onChange={e => setBct50(Number(e.target.value))} style={inputStyle} />
      </div>

      <div>
        <FieldLabel>Humidité relative cible (%)</FieldLabel>
        <input type="range" min={20} max={95} step={1} value={rh}
          onChange={e => setRh(Number(e.target.value))} style={{ width: '100%' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.sm }}>
          <span style={{ color: c.textMuted }}>20%</span>
          <span style={{ color: rhColor, fontWeight: fw.bold }}>{rh}% HR</span>
          <span style={{ color: c.textMuted }}>95%</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>Facteur Kellicutt</div>
          <div style={{ fontSize: 14, fontWeight: fw.heavy, color: rhColor }}>{factor.toFixed(3)}</div>
        </div>
        <div style={{ flex: 1, background: c.surface, borderRadius: r.md, padding: '8px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 2 }}>BCT corrigé</div>
          <div style={{ fontSize: 14, fontWeight: fw.heavy, color: rhColor }}>{bctCorr.toFixed(1)} kg</div>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.sm, color: c.textMuted, marginBottom: 4 }}>
          <span>0</span><span>{bct50} kg (réf. 50% HR)</span>
        </div>
        <div style={{ height: 8, background: c.borderLight, borderRadius: r.pill, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: rhColor, borderRadius: r.pill,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
        <thead>
          <tr>
            <th style={thStyle}>HR (%)</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Facteur</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>BCT (kg)</th>
          </tr>
        </thead>
        <tbody>
          {[20, 35, 50, 65, 70, 80, 90].map(h => {
            const f = 1 - 0.003 * (h - 50)
            return (
              <tr key={h} style={{ background: h === rh ? c.accentBg : 'transparent' }}>
                <td style={{ ...tdStyle, color: h === rh ? c.accent : c.textMed }}>{h}%</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{f.toFixed(3)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{(bct50 * f).toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: 'grain',     label: 'Grain'     },
  { id: 'complexity',label: 'Complexité'},
  { id: 'shadow',    label: 'Shadow'    },
  { id: 'score',     label: 'Rainure'   },
  { id: 'caliper',   label: 'Caliper'   },
  { id: 'flute',     label: 'Cannelures'},
  { id: 'ectbct',    label: 'ECT→BCT'  },
  { id: 'humidity',  label: 'Humidité'  },
]

export function StructuralSection({ params, dieline }: { params: BoxParams; dieline: DielineData }) {
  const [activeTab, setActiveTab] = useState<TabId>('grain')

  return (
    <CollapsibleSection label="Structural — #428-431 / #472-475">
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

      {activeTab === 'grain'      && <GrainTab params={params} />}
      {activeTab === 'complexity' && <ComplexityTab dieline={dieline} />}
      {activeTab === 'shadow'     && <ShadowLineTab params={params} />}
      {activeTab === 'score'      && <ScoreDepthTab />}
      {activeTab === 'caliper'    && <CaliperTab />}
      {activeTab === 'flute'      && <FluteTab />}
      {activeTab === 'ectbct'     && <ECTBCTTab params={params} />}
      {activeTab === 'humidity'   && <HumidityTab />}
    </CollapsibleSection>
  )
}
