'use client'

import { useState, useRef, useEffect } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import { c, fs, fw, r } from '@/lib/tokens'

type SafetyTab = 'cr' | 'senior' | 'openforce' | 'tamper' | 'peel' | 'braille'

type CRType = 'push-and-turn' | 'squeeze-and-lift' | 'blister-push' | 'tear-notch'
type TamperType = 'perforation' | 'tear-strip' | 'shrink-band' | 'void-label' | 'induction-seal'
type ClosureType = 'snap' | 'tuck' | 'glue' | 'velcro' | 'zipper'
type AdhesiveType = 'pressure-sensitive' | 'hot-melt' | 'water-based' | 'solvent'
type SubstrateType = 'kraft' | 'coated' | 'PE' | 'PET'
type PeelAngle = '90' | '180'

const BRAILLE_MAP: Record<string, number> = {
  A: 0b100000, B: 0b110000, C: 0b100100, D: 0b100110, E: 0b100010,
  F: 0b110100, G: 0b110110, H: 0b110010, I: 0b010100, J: 0b010110,
  K: 0b101000, L: 0b111000, M: 0b101100, N: 0b101110, O: 0b101010,
  P: 0b111100, Q: 0b111110, R: 0b111010, S: 0b011100, T: 0b011110,
  U: 0b101001, V: 0b111001, W: 0b010111, X: 0b101101, Y: 0b101111,
  Z: 0b101011, ' ': 0b000000,
  '0': 0b010110, '1': 0b100000, '2': 0b110000, '3': 0b100100,
  '4': 0b100110, '5': 0b100010, '6': 0b110100, '7': 0b110110,
  '8': 0b110010, '9': 0b010100,
}

const PEEL_TABLE: Record<AdhesiveType, Record<SubstrateType, number>> = {
  'pressure-sensitive': { kraft: 3, coated: 2, PE: 4, PET: 5 },
  'hot-melt':           { kraft: 8, coated: 6, PE: 10, PET: 12 },
  'water-based':        { kraft: 5, coated: 4, PE: 3, PET: 3 },
  'solvent':            { kraft: 12, coated: 10, PE: 8, PET: 15 },
}

const CR_DATA: Record<CRType, { minForce: number; iso: boolean; label: string }> = {
  'push-and-turn':   { minForce: 40, iso: true,  label: 'Push & Turn' },
  'squeeze-and-lift':{ minForce: 35, iso: true,  label: 'Squeeze & Lift' },
  'blister-push':    { minForce: 25, iso: false, label: 'Blister Push' },
  'tear-notch':      { minForce: 20, iso: false, label: 'Tear Notch' },
}

const inputStyle = {
  width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`,
  borderRadius: r.lg, padding: '4px 6px', background: c.white, fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

const tabStyle = (active: boolean) => ({
  flex: 1, fontSize: fs.xs, fontWeight: fw.bold, padding: '4px 2px',
  background: active ? c.ink : 'transparent', color: active ? c.white : c.textMuted,
  border: `1px solid ${active ? c.ink : c.borderLight}`, borderRadius: r.md, cursor: 'pointer',
})

const metricBox = (label: string, value: string, color: string = c.textMed) => (
  <div style={{ background: c.surface, borderRadius: r.lg, padding: '6px 8px' }}>
    <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: fs.md, fontWeight: fw.bold, color }}>{value}</div>
  </div>
)

function CRTab() {
  const [crType, setCrType] = useState<CRType>('push-and-turn')
  const data = CR_DATA[crType]

  const crSVG: Record<CRType, JSX.Element> = {
    'push-and-turn': (
      <svg width="120" height="80" viewBox="0 0 120 80">
        <circle cx="60" cy="40" r="32" fill="none" stroke={c.accent} strokeWidth="2" />
        <circle cx="60" cy="40" r="18" fill={c.accentBg} stroke={c.accent} strokeWidth="1.5" />
        <path d="M60 8 L64 18 L60 16 L56 18 Z" fill={c.accent} />
        <path d="M92 40 L82 44 L84 40 L82 36 Z" fill={c.accent} />
        <text x="60" y="44" textAnchor="middle" fontSize="8" fill={c.accent} fontWeight="bold">↓ push</text>
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill={c.textMuted}>↻ turn</text>
      </svg>
    ),
    'squeeze-and-lift': (
      <svg width="120" height="80" viewBox="0 0 120 80">
        <rect x="30" y="20" width="60" height="40" rx="4" fill={c.accentBg} stroke={c.accent} strokeWidth="2" />
        <path d="M30 40 C20 35 20 45 30 40" fill="none" stroke={c.accent} strokeWidth="2" />
        <path d="M90 40 C100 35 100 45 90 40" fill="none" stroke={c.accent} strokeWidth="2" />
        <path d="M50 20 L60 10 L70 20" fill="none" stroke={c.accent} strokeWidth="1.5" strokeDasharray="3,2" />
        <text x="60" y="45" textAnchor="middle" fontSize="8" fill={c.accent} fontWeight="bold">squeeze</text>
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill={c.textMuted}>→ lift</text>
      </svg>
    ),
    'blister-push': (
      <svg width="120" height="80" viewBox="0 0 120 80">
        <rect x="10" y="30" width="100" height="30" rx="3" fill={c.surface} stroke={c.borderLight} strokeWidth="1.5" />
        {[25, 45, 65, 85].map(x => (
          <ellipse key={x} cx={x} cy="40" rx="10" ry="12" fill={c.accentBg} stroke={c.accent} strokeWidth="1.5" />
        ))}
        <path d="M45 18 L45 28" stroke={c.accent} strokeWidth="2" markerEnd="url(#arr)" />
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill={c.textMuted}>push through foil</text>
      </svg>
    ),
    'tear-notch': (
      <svg width="120" height="80" viewBox="0 0 120 80">
        <rect x="15" y="20" width="90" height="40" rx="4" fill={c.accentBg} stroke={c.accent} strokeWidth="1.5" />
        <path d="M15 35 L25 28 L35 35 L45 28 L55 35 L65 28 L75 35 L85 28 L95 35" fill="none" stroke={c.accent} strokeWidth="1.5" strokeDasharray="2,2" />
        <path d="M15 45 L25 38 L35 45 L45 38 L55 45 L65 38 L75 45 L85 38 L95 45" fill="none" stroke={c.accent} strokeWidth="1" strokeDasharray="2,2" />
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill={c.textMuted}>tear along notch</text>
      </svg>
    ),
  }

  return (
    <div>
      <FieldLabel>Mécanisme CR</FieldLabel>
      <select value={crType} onChange={e => setCrType(e.target.value as CRType)} style={{ ...inputStyle, marginBottom: 10 }}>
        {Object.entries(CR_DATA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, background: c.surfaceAlt, borderRadius: r.lg, padding: 8 }}>
        {crSVG[crType]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        {metricBox('Force min.', `${data.minForce} N`, c.accent)}
        {metricBox('ISO 8317', data.iso ? '✓ Conforme' : '✗ Non applicable', data.iso ? '#10b981' : c.textMuted)}
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, background: c.accentBg, borderRadius: r.lg, padding: '6px 8px', lineHeight: 1.5 }}>
        <strong style={{ color: c.accent }}>PPPA :</strong> Emballage CR requis pour médicaments OTC et produits chimiques ménagers. Conforme 16 CFR Part 1700.
      </div>
    </div>
  )
}

function SeniorTab() {
  const [checks, setChecks] = useState({
    textSize: false, highContrast: false, easyGrip: false,
    lowForce: false, clearInstructions: false, resealable: false, noSmallTabs: false,
  })

  const items = [
    { key: 'textSize',          label: 'Texte ≥ 12pt', pts: 2 },
    { key: 'highContrast',      label: 'Fort contraste', pts: 2 },
    { key: 'easyGrip',          label: 'Surface grip', pts: 1 },
    { key: 'lowForce',          label: 'Force ouverture < 15N', pts: 2 },
    { key: 'clearInstructions', label: 'Instructions claires', pts: 1 },
    { key: 'resealable',        label: 'Refermable', pts: 1 },
    { key: 'noSmallTabs',       label: 'Pas de petits rabats', pts: 1 },
  ] as const

  const score = items.reduce((s, i) => s + (checks[i.key] ? i.pts : 0), 0)
  const badge = score >= 8 ? { label: 'Excellent', color: '#10b981' }
    : score >= 5 ? { label: 'Bon', color: '#3b82f6' }
    : score >= 3 ? { label: 'Passable', color: '#f59e0b' }
    : { label: 'Faible', color: '#ef4444' }

  const pct = (score / 10) * 100
  const r2 = 36
  const circ = 2 * Math.PI * r2
  const dash = (pct / 100) * circ

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r2} fill="none" stroke={c.borderXLight} strokeWidth="8" />
          <circle cx="50" cy="50" r={r2} fill="none" stroke={badge.color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.4s' }} />
          <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="bold" fill={badge.color}>{score}</text>
          <text x="50" y="58" textAnchor="middle" fontSize="9" fill={c.textMuted}>/10</text>
        </svg>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: fs.md, fontWeight: fw.bold, color: badge.color, background: badge.color + '20', borderRadius: r.pill, padding: '2px 10px' }}>{badge.label}</span>
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6 }}>Recommandations AARP</div>
      {items.map(item => (
        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={checks[item.key]}
            onChange={e => setChecks(prev => ({ ...prev, [item.key]: e.target.checked }))}
            style={{ width: 13, height: 13 }} />
          <span style={{ fontSize: fs.md, color: c.textMed, flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: fs.xs, color: c.accent, fontWeight: fw.bold }}>+{item.pts}</span>
        </label>
      ))}
    </div>
  )
}

function OpenForceTab() {
  const [closure, setClosure] = useState<ClosureType>('tuck')
  const [flapWidth, setFlapWidth] = useState(50)
  const [thickness, setThickness] = useState(0.4)
  const [adhesiveStr, setAdhesiveStr] = useState(0)

  const force = (() => {
    const S = 2.5
    if (closure === 'tuck') return S * flapWidth * thickness * thickness
    if (closure === 'snap') {
      const snapDepth = 1.5
      const springK = 8
      return snapDepth * springK
    }
    if (closure === 'glue') return adhesiveStr * flapWidth * thickness
    if (closure === 'velcro') return 3.5 * (flapWidth / 25)
    if (closure === 'zipper') return 2.0 * (flapWidth / 25)
    return 0
  })()

  const forceColor = force > 35 ? '#ef4444' : force > 20 ? '#f59e0b' : '#10b981'

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Type de fermeture</FieldLabel>
        <select value={closure} onChange={e => setClosure(e.target.value as ClosureType)} style={inputStyle}>
          <option value="tuck">Tuck (rabat)</option>
          <option value="snap">Snap (encliquetage)</option>
          <option value="glue">Glue (colle)</option>
          <option value="velcro">Velcro</option>
          <option value="zipper">Zipper</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>Largeur rabat (mm)</FieldLabel>
          <input type="number" value={flapWidth} min={10} max={200}
            onChange={e => setFlapWidth(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Épaisseur matériau (mm)</FieldLabel>
          <input type="number" value={thickness} min={0.1} max={5} step={0.1}
            onChange={e => setThickness(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>
      {(closure === 'glue') && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>Résistance adhésif (N/mm²)</FieldLabel>
          <input type="number" value={adhesiveStr} min={0} max={20} step={0.5}
            onChange={e => setAdhesiveStr(Number(e.target.value))} style={inputStyle} />
        </div>
      )}
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '10px 12px', marginBottom: 10, textAlign: 'center' }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 4 }}>Force d'ouverture estimée</div>
        <div style={{ fontSize: 26, fontWeight: fw.heavy, color: forceColor }}>{force.toFixed(1)} N</div>
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        <div style={{ background: '#10b98120', borderRadius: r.md, padding: '4px 6px', textAlign: 'center' }}>
          <div style={{ fontWeight: fw.bold, color: '#10b981' }}>≤ 10N</div>
          <div>Séniors</div>
        </div>
        <div style={{ background: '#3b82f620', borderRadius: r.md, padding: '4px 6px', textAlign: 'center' }}>
          <div style={{ fontWeight: fw.bold, color: '#3b82f6' }}>≤ 20N</div>
          <div>Adulte</div>
        </div>
        <div style={{ background: '#ef444420', borderRadius: r.md, padding: '4px 6px', textAlign: 'center' }}>
          <div style={{ fontWeight: fw.bold, color: '#ef4444' }}>≥ 35N</div>
          <div>CR requis</div>
        </div>
      </div>
    </div>
  )
}

function TamperTab() {
  const [tamperType, setTamperType] = useState<TamperType>('perforation')

  const tamperSVG: Record<TamperType, JSX.Element> = {
    perforation: (
      <svg width="150" height="100" viewBox="0 0 150 100">
        <rect x="5" y="5" width="140" height="90" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1" />
        <rect x="5" y="5" width="140" height="30" rx="4" fill={c.accentBg} stroke={c.accent} strokeWidth="1.5" />
        <text x="75" y="25" textAnchor="middle" fontSize="9" fill={c.accent}>RABAT SUPÉRIEUR</text>
        <line x1="5" y1="35" x2="145" y2="35" stroke={c.accent} strokeWidth="1.5"
          strokeDasharray="4,3" strokeLinecap="round" />
        <text x="75" y="46" textAnchor="middle" fontSize="7" fill={c.textMuted}>ligne de perforation</text>
        <text x="75" y="75" textAnchor="middle" fontSize="8" fill={c.textMuted}>Corps boîte</text>
      </svg>
    ),
    'tear-strip': (
      <svg width="150" height="100" viewBox="0 0 150 100">
        <rect x="5" y="5" width="140" height="90" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1" />
        <rect x="5" y="28" width="140" height="16" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="5" y1="28" x2="145" y2="28" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
        <line x1="5" y1="44" x2="145" y2="44" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,2" />
        <text x="140" y="40" textAnchor="end" fontSize="7" fill="#92400e">↑ tirer</text>
        <text x="75" y="75" textAnchor="middle" fontSize="8" fill={c.textMuted}>Bandelette d'arrachage</text>
      </svg>
    ),
    'shrink-band': (
      <svg width="150" height="100" viewBox="0 0 150 100">
        <rect x="20" y="10" width="110" height="80" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1" />
        <rect x="10" y="28" width="130" height="25" rx="2" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,3" />
        <text x="75" y="45" textAnchor="middle" fontSize="8" fill="#8b5cf6" fontWeight="bold">manchon rétractable</text>
        <text x="75" y="84" textAnchor="middle" fontSize="7" fill={c.textMuted}>film thermorétractable</text>
      </svg>
    ),
    'void-label': (
      <svg width="150" height="100" viewBox="0 0 150 100">
        <rect x="5" y="5" width="140" height="90" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1" />
        <rect x="30" y="30" width="90" height="40" rx="3" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
        <text x="75" y="54" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444" opacity="0.6">VOID</text>
        <text x="75" y="66" textAnchor="middle" fontSize="6" fill="#ef4444" opacity="0.4">VOID VOID VOID</text>
        <text x="75" y="84" textAnchor="middle" fontSize="7" fill={c.textMuted}>étiquette VOID</text>
      </svg>
    ),
    'induction-seal': (
      <svg width="150" height="100" viewBox="0 0 150 100">
        <rect x="5" y="5" width="140" height="90" rx="4" fill={c.surfaceAlt} stroke={c.borderLight} strokeWidth="1" />
        <ellipse cx="75" cy="32" rx="45" ry="18" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
        <ellipse cx="75" cy="32" rx="35" ry="12" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" />
        <text x="75" y="36" textAnchor="middle" fontSize="8" fill="#10b981" fontWeight="bold">induction seal</text>
        <text x="75" y="75" textAnchor="middle" fontSize="7" fill={c.textMuted}>scellage inductif aluminium</text>
      </svg>
    ),
  }

  const exportSVG = () => {
    const svgEl = document.querySelector('#tamper-svg-area svg')
    if (!svgEl) return
    const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tamper-${tamperType}.svg`
    a.click()
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Type d'inviolabilité</FieldLabel>
        <select value={tamperType} onChange={e => setTamperType(e.target.value as TamperType)} style={inputStyle}>
          <option value="perforation">Perforation</option>
          <option value="tear-strip">Bandelette arrachage</option>
          <option value="shrink-band">Manchon rétractable</option>
          <option value="void-label">Étiquette VOID</option>
          <option value="induction-seal">Scellage inductif</option>
        </select>
      </div>
      <div id="tamper-svg-area" style={{ display: 'flex', justifyContent: 'center', background: c.surfaceAlt, borderRadius: r.lg, padding: 8, marginBottom: 10 }}>
        {tamperSVG[tamperType]}
      </div>
      <button onClick={exportSVG} style={{
        width: '100%', fontSize: fs.md, fontWeight: fw.bold, padding: '6px 0',
        background: c.ink, color: c.white, border: 'none', borderRadius: r.lg, cursor: 'pointer',
      }}>
        Exporter couche SVG
      </button>
    </div>
  )
}

function PeelTab() {
  const [adhesive, setAdhesive] = useState<AdhesiveType>('pressure-sensitive')
  const [substrate, setSubstrate] = useState<SubstrateType>('kraft')
  const [angle, setAngle] = useState<PeelAngle>('90')

  const base = PEEL_TABLE[adhesive][substrate]
  const corrected = angle === '180' ? base * 0.7 : base
  const barW = Math.min(100, (corrected / 15) * 100)
  const barColor = corrected < 3 ? '#ef4444' : corrected < 8 ? '#f59e0b' : '#10b981'

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Type d'adhésif</FieldLabel>
        <select value={adhesive} onChange={e => setAdhesive(e.target.value as AdhesiveType)} style={inputStyle}>
          <option value="pressure-sensitive">Pression sensitive (PSA)</option>
          <option value="hot-melt">Hot-melt</option>
          <option value="water-based">Base aqueuse</option>
          <option value="solvent">Solvant</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>Substrat</FieldLabel>
          <select value={substrate} onChange={e => setSubstrate(e.target.value as SubstrateType)} style={inputStyle}>
            <option value="kraft">Kraft</option>
            <option value="coated">Couché</option>
            <option value="PE">PE</option>
            <option value="PET">PET</option>
          </select>
        </div>
        <div>
          <FieldLabel>Angle de pelage</FieldLabel>
          <select value={angle} onChange={e => setAngle(e.target.value as PeelAngle)} style={inputStyle}>
            <option value="90">90°</option>
            <option value="180">180°</option>
          </select>
        </div>
      </div>
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.textMed }}>Résistance au pelage</span>
          <span style={{ fontSize: fs.md, fontWeight: fw.heavy, color: barColor }}>{corrected.toFixed(1)} N/25mm</span>
        </div>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: r.pill, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barW}%`, background: barColor, borderRadius: r.pill, transition: 'width 0.3s' }} />
        </div>
        {angle === '180' && (
          <div style={{ fontSize: fs.xs, color: c.textMuted, marginTop: 4 }}>
            Correction 180° : ×0.7 (base {base} N/25mm)
          </div>
        )}
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted }}>Selon ISO 29862 / FINAT FTM1</div>
    </div>
  )
}

function BrailleTab() {
  const [text, setText] = useState('HELLO')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const CELL_W = 12
  const CELL_H = 18
  const DOT_R = 2.5
  const PAD = 4

  const upperText = text.toUpperCase().slice(0, 40)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const chars = upperText.split('')
    const cols = chars.length
    canvas.width = Math.max(1, cols * (CELL_W + PAD) + PAD)
    canvas.height = CELL_H + PAD * 2

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    chars.forEach((ch, i) => {
      const bits = BRAILLE_MAP[ch] ?? 0
      const ox = PAD + i * (CELL_W + PAD)
      const oy = PAD
      const dotPositions = [
        [0, 0], [0, 1], [0, 2],
        [1, 0], [1, 1], [1, 2],
      ]
      dotPositions.forEach(([col, row], dotIdx) => {
        const raised = (bits >> (5 - dotIdx)) & 1
        const cx = ox + col * (CELL_W / 2) + DOT_R + 1
        const cy = oy + row * (CELL_H / 3) + DOT_R + 1
        ctx.beginPath()
        ctx.arc(cx, cy, DOT_R, 0, Math.PI * 2)
        ctx.fillStyle = raised ? '#3b82f6' : '#e5e7eb'
        ctx.fill()
      })
    })
  }, [upperText])

  const dotNotation = (ch: string): string => {
    const bits = BRAILLE_MAP[ch] ?? 0
    const dots: number[] = []
    for (let i = 0; i < 6; i++) {
      if ((bits >> (5 - i)) & 1) dots.push(i + 1)
    }
    return dots.length === 0 ? '(espace)' : `dots ${dots.join(',')}`
  }

  const exportPNG = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `braille-${upperText.replace(/\s/g, '_')}.png`
    a.click()
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Texte (max 40 car.)</FieldLabel>
        <input type="text" value={text} maxLength={40}
          onChange={e => setText(e.target.value)}
          style={inputStyle} placeholder="HELLO WORLD" />
      </div>
      <div style={{ background: c.surfaceAlt, borderRadius: r.lg, padding: 8, marginBottom: 8, overflowX: 'auto' }}>
        <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', imageRendering: 'pixelated' }} />
      </div>
      <div style={{ marginBottom: 8, maxHeight: 80, overflowY: 'auto' }}>
        {upperText.split('').map((ch, i) => (
          <div key={i} style={{ fontSize: fs.xs, color: c.textMuted, lineHeight: 1.6 }}>
            <span style={{ fontWeight: fw.bold, color: c.textMed, fontFamily: 'monospace', marginRight: 4 }}>{ch}</span>
            <span>{dotNotation(ch)}</span>
          </div>
        ))}
      </div>
      <button onClick={exportPNG} style={{
        width: '100%', fontSize: fs.md, fontWeight: fw.bold, padding: '6px 0',
        background: c.ink, color: c.white, border: 'none', borderRadius: r.lg, cursor: 'pointer',
      }}>
        Exporter PNG
      </button>
    </div>
  )
}

export function SafetySection({ params }: { params: BoxParams }) {
  const [tab, setTab] = useState<SafetyTab>('cr')

  const tabs: { key: SafetyTab; label: string }[] = [
    { key: 'cr',        label: 'CR' },
    { key: 'senior',    label: 'Sénior' },
    { key: 'openforce', label: 'Force' },
    { key: 'tamper',    label: 'Tamper' },
    { key: 'peel',      label: 'Peel' },
    { key: 'braille',   label: 'Braille' },
  ]

  void params

  return (
    <CollapsibleSection label="Sécurité & Accessibilité">
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'cr'        && <CRTab />}
      {tab === 'senior'    && <SeniorTab />}
      {tab === 'openforce' && <OpenForceTab />}
      {tab === 'tamper'    && <TamperTab />}
      {tab === 'peel'      && <PeelTab />}
      {tab === 'braille'   && <BrailleTab />}
    </CollapsibleSection>
  )
}
