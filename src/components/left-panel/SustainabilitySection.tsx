'use client'

import { useRef, useState } from 'react'
import type { ImageLayer, BoxParams } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SustainabilitySectionProps {
  params: BoxParams
  onAddLayer: (l: ImageLayer) => void
}

interface LCAResult {
  co2PerUnit: number   // grams CO2e
  co2Batch: number     // kg CO2e
  kmEquiv: number      // km en voiture
}

// ─── Static data ─────────────────────────────────────────────────────────────

const MATERIALS = [
  { id: 'carton',         label: 'Carton',          co2: 1.35 },
  { id: 'kraft',          label: 'Kraft',            co2: 1.10 },
  { id: 'plastique-pet',  label: 'Plastique PET',    co2: 3.40 },
  { id: 'alu',            label: 'Aluminium',        co2: 8.20 },
  { id: 'verre',          label: 'Verre',            co2: 0.90 },
  { id: 'carton-recycle', label: 'Carton Recyclé',   co2: 0.82 },
  { id: 'papier-couche',  label: 'Papier Couché',    co2: 1.55 },
]

const TRANSPORTS = [
  { id: 'local',         label: 'Local (<200 km)',          co2: 0.02 },
  { id: 'national',      label: 'National (200–1000 km)',   co2: 0.08 },
  { id: 'international', label: 'International (>1000 km)', co2: 0.35 },
]

const RECYCLABILITY: Record<string, Record<string, number>> = {
  carton: { FR: 5, DE: 5, UK: 4, US: 4, CN: 3 },
  kraft:  { FR: 5, DE: 5, UK: 4, US: 4, CN: 3 },
  pet:    { FR: 4, DE: 5, UK: 3, US: 3, CN: 2 },
  alu:    { FR: 5, DE: 5, UK: 4, US: 4, CN: 3 },
  verre:  { FR: 5, DE: 5, UK: 3, US: 3, CN: 2 },
}

const RECYCLABILITY_MATERIALS = ['carton', 'kraft', 'pet', 'alu', 'verre']
const COUNTRIES = ['FR', 'DE', 'UK', 'US', 'CN']

const BADGE_STYLES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'bold',    label: 'Bold' },
  { id: 'eco',     label: 'Eco' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(score: number): string {
  if (score >= 5) return '#388e3c'
  if (score >= 4) return '#7cb342'
  if (score >= 3) return '#f9a825'
  if (score >= 2) return '#ef6c00'
  return '#c62828'
}

function co2Color(gPerUnit: number): string {
  if (gPerUnit < 50)  return '#388e3c'
  if (gPerUnit < 200) return '#f57c00'
  return '#c62828'
}

function drawBadge(
  canvas: HTMLCanvasElement,
  co2g: number,
  style: string,
): void {
  const size = 140
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const cx = size / 2
  const cy = size / 2
  const rad = size / 2 - 6

  if (style === 'eco') {
    // Green gradient circle
    const grad = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, rad)
    grad.addColorStop(0, '#81c784')
    grad.addColorStop(1, '#2e7d32')
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = '#1b5e20'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.fillStyle = '#fff'
  } else if (style === 'bold') {
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#fff'
  } else {
    // minimal
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fillStyle = '#f5f5f5'
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.fillStyle = '#1a1a1a'
  }

  // Value
  const valStr = co2g < 1000
    ? `${co2g.toFixed(1)}g`
    : `${(co2g / 1000).toFixed(2)}kg`

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.font = `bold 28px sans-serif`
  ctx.fillText(valStr, cx, cy - 6)

  ctx.font = `11px sans-serif`
  ctx.fillText('CO₂e / unité', cx, cy + 18)

  ctx.font = `bold 10px sans-serif`
  ctx.fillText('Carbon Label', cx, cy + 34)
}

// ─── Tab: LCA ─────────────────────────────────────────────────────────────────

function LCATab({
  lcaResult,
  onResult,
  selectedMaterialId,
  onMaterialChange,
}: {
  lcaResult: LCAResult | null
  onResult: (r: LCAResult) => void
  selectedMaterialId: string
  onMaterialChange: (id: string) => void
}) {
  const [materialId, setMaterialId]   = useState(selectedMaterialId)
  const [weightG, setWeightG]         = useState(50)
  const [transportId, setTransportId] = useState('national')
  const [quantity, setQuantity]       = useState(1000)

  const handleCalculate = () => {
    const mat = MATERIALS.find(m => m.id === materialId)!
    const tr  = TRANSPORTS.find(t => t.id === transportId)!
    const weightKg = weightG / 1000
    const co2PerUnitKg = (mat.co2 + tr.co2) * weightKg
    const co2PerUnitG  = co2PerUnitKg * 1000
    const co2BatchKg   = co2PerUnitKg * quantity
    const kmEquiv      = co2BatchKg / 0.12

    onMaterialChange(materialId)
    onResult({ co2PerUnit: co2PerUnitG, co2Batch: co2BatchKg, kmEquiv })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <FieldLabel>Matière</FieldLabel>
        <select
          value={materialId}
          onChange={e => setMaterialId(e.target.value)}
          style={inputStyle}
        >
          {MATERIALS.map(m => (
            <option key={m.id} value={m.id}>{m.label} — {m.co2} kg CO₂e/kg</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Poids (grammes)</FieldLabel>
        <input
          type="number"
          value={weightG}
          min={1}
          onChange={e => setWeightG(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      <div>
        <FieldLabel>Transport</FieldLabel>
        <select
          value={transportId}
          onChange={e => setTransportId(e.target.value)}
          style={inputStyle}
        >
          {TRANSPORTS.map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel>Quantité (unités)</FieldLabel>
        <input
          type="number"
          value={quantity}
          min={1}
          onChange={e => setQuantity(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      <button onClick={handleCalculate} style={btnPrimary}>Calculer</button>

      {lcaResult && (
        <div style={{
          background: '#fafafa',
          border: `1px solid ${c.borderSep}`,
          borderRadius: r.lg,
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.sm, color: c.textMuted }}>CO₂ / unité</span>
            <span style={{
              fontSize: 15,
              fontWeight: fw.heavy,
              color: co2Color(lcaResult.co2PerUnit),
            }}>
              {lcaResult.co2PerUnit.toFixed(2)} g CO₂e
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.sm, color: c.textMuted }}>Total lot</span>
            <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.textMed }}>
              {lcaResult.co2Batch.toFixed(2)} kg CO₂e
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.sm, color: c.textMuted }}>Équivalent voiture</span>
            <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.textMed }}>
              {lcaResult.kmEquiv.toFixed(0)} km
            </span>
          </div>
          <div style={{
            height: 6,
            background: c.borderLight,
            borderRadius: r.pill,
            overflow: 'hidden',
            marginTop: 2,
          }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, (lcaResult.co2PerUnit / 400) * 100)}%`,
              background: co2Color(lcaResult.co2PerUnit),
              borderRadius: r.pill,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: c.textMuted, textAlign: 'right' }}>
            {lcaResult.co2PerUnit < 50 ? '✓ Faible impact' : lcaResult.co2PerUnit < 200 ? '⚠ Impact modéré' : '✗ Impact élevé'}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Recyclabilité ───────────────────────────────────────────────────────

function RecyclabilityTab({ highlightMaterialId }: { highlightMaterialId: string }) {
  // Map LCA material IDs to recyclability matrix keys
  const matKey: Record<string, string> = {
    carton: 'carton', kraft: 'kraft', 'plastique-pet': 'pet',
    alu: 'alu', verre: 'verre', 'carton-recycle': 'carton', 'papier-couche': 'carton',
  }
  const activeKey = matKey[highlightMaterialId] ?? 'carton'

  return (
    <div>
      <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 8 }}>
        Score de recyclabilité par pays (1–5)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, textAlign: 'left' }}>Matière</th>
              {COUNTRIES.map(c => (
                <th key={c} style={thStyle}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECYCLABILITY_MATERIALS.map(mat => {
              const isHighlighted = mat === activeKey
              return (
                <tr key={mat} style={{
                  background: isHighlighted ? '#f0f7ff' : 'transparent',
                  fontWeight: isHighlighted ? fw.bold : fw.normal,
                }}>
                  <td style={{ ...tdStyle, color: isHighlighted ? '#1565c0' : c.textMed }}>
                    {mat.toUpperCase()}
                  </td>
                  {COUNTRIES.map(country => {
                    const score = RECYCLABILITY[mat]?.[country] ?? 1
                    return (
                      <td key={country} style={{
                        ...tdStyle,
                        textAlign: 'center',
                        background: scoreColor(score),
                        color: '#fff',
                        fontWeight: fw.bold,
                        borderRadius: 3,
                      }}>
                        {score}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {[5, 4, 3, 2, 1].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: c.textMuted }}>
            <div style={{ width: 10, height: 10, background: scoreColor(s), borderRadius: 2 }} />
            {s === 5 ? 'Excellent' : s === 4 ? 'Bon' : s === 3 ? 'Moyen' : s === 2 ? 'Faible' : 'Mauvais'}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Carbon Label ────────────────────────────────────────────────────────

function CarbonLabelTab({
  lcaResult,
  onAddLayer,
}: {
  lcaResult: LCAResult | null
  onAddLayer: (l: ImageLayer) => void
}) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const [co2Val, setCo2Val]     = useState<number>(lcaResult?.co2PerUnit ?? 0)
  const [badgeStyle, setBadgeStyle] = useState('minimal')
  const [generated, setGenerated]   = useState(false)

  const handleGenerate = () => {
    if (!canvasRef.current) return
    const val = lcaResult ? lcaResult.co2PerUnit : co2Val
    drawBadge(canvasRef.current, val, badgeStyle)
    setGenerated(true)
  }

  const handleAddLayer = () => {
    if (!canvasRef.current || !generated) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const layer: ImageLayer = {
      id:             `carbon-label-${Date.now()}`,
      name:           'Carbon Label',
      src:            dataUrl,
      x:              10,
      y:              10,
      width:          30,
      height:         30,
      scale:          1,
      rotation:       0,
      visible:        true,
      locked:         false,
      faceAssignment: 'auto',
      opacity:        1,
      kind:           'picto',
      naturalWidth:   140,
      naturalHeight:  140,
    }
    onAddLayer(layer)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {!lcaResult && (
        <div>
          <FieldLabel>CO₂ / unité (g CO₂e)</FieldLabel>
          <input
            type="number"
            value={co2Val}
            min={0}
            step={0.1}
            onChange={e => setCo2Val(Number(e.target.value))}
            style={inputStyle}
          />
        </div>
      )}

      {lcaResult && (
        <div style={{
          background: '#f0f7ff',
          border: '1px solid #bbdefb',
          borderRadius: r.md,
          padding: '7px 10px',
          fontSize: fs.sm,
          color: '#1565c0',
        }}>
          Valeur LCA : {lcaResult.co2PerUnit.toFixed(2)} g CO₂e / unité
        </div>
      )}

      <div>
        <FieldLabel>Style du badge</FieldLabel>
        <select
          value={badgeStyle}
          onChange={e => setBadgeStyle(e.target.value)}
          style={inputStyle}
        >
          {BADGE_STYLES.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <button onClick={handleGenerate} style={btnPrimary}>Générer badge</button>

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          margin: '0 auto',
          borderRadius: '50%',
          border: `1px solid ${c.borderLight}`,
          width: 100,
          height: 100,
        }}
      />

      {generated && (
        <button
          onClick={handleAddLayer}
          style={{ ...btnPrimary, background: '#388e3c' }}
        >
          Ajouter au calque
        </button>
      )}
    </div>
  )
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function SustainabilitySection({ params: _params, onAddLayer }: SustainabilitySectionProps) {
  const [activeTab, setActiveTab]           = useState<'lca' | 'recyclability' | 'label'>('lca')
  const [lcaResult, setLcaResult]           = useState<LCAResult | null>(null)
  const [selectedMaterial, setSelectedMaterial] = useState('carton')

  const tabs: { id: 'lca' | 'recyclability' | 'label'; label: string }[] = [
    { id: 'lca',           label: 'LCA' },
    { id: 'recyclability', label: 'Recyclabilité' },
    { id: 'label',         label: 'Carbon Label' },
  ]

  return (
    <CollapsibleSection label="Durabilité & LCA">
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        border: `1px solid ${c.borderLight}`,
        borderRadius: r.md,
        overflow: 'hidden',
        marginBottom: 14,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              background: activeTab === tab.id ? '#1a1a1a' : '#f5f5f5',
              color: activeTab === tab.id ? '#fff' : c.textMed,
              border: 'none',
              padding: '6px 0',
              fontSize: 10,
              fontWeight: activeTab === tab.id ? fw.heavy : fw.normal,
              cursor: 'pointer',
              letterSpacing: 0.5,
              transition: 'background 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'lca' && (
        <LCATab
          lcaResult={lcaResult}
          onResult={setLcaResult}
          selectedMaterialId={selectedMaterial}
          onMaterialChange={setSelectedMaterial}
        />
      )}

      {activeTab === 'recyclability' && (
        <RecyclabilityTab highlightMaterialId={selectedMaterial} />
      )}

      {activeTab === 'label' && (
        <CarbonLabelTab lcaResult={lcaResult} onAddLayer={onAddLayer} />
      )}
    </CollapsibleSection>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d0d0d0',
  borderRadius: 4,
  padding: '5px 8px',
  fontSize: 11,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#333',
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  padding: '8px 0',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
}

const thStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: 10,
  color: '#666',
  fontWeight: 600,
  letterSpacing: 0.5,
  borderBottom: '1px solid #e0e0e0',
}

const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  fontSize: 11,
  borderBottom: '1px solid #f0f0f0',
}
