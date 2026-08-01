'use client'

import { useState } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import { c, fs, fw, r } from '@/lib/tokens'

type WorkflowTab = 'printorder' | 'vendorquote' | 'handoff' | 'approval' | 'brief'
type ApprovalStatus = 'draft' | 'sent' | 'approved' | 'revision' | 'final'

const inputStyle = {
  width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`,
  borderRadius: r.lg, padding: '4px 6px', background: c.white, fontFamily: 'inherit', boxSizing: 'border-box' as const,
}

const tabStyle = (active: boolean) => ({
  flex: 1, fontSize: fs.xs, fontWeight: fw.bold, padding: '4px 2px',
  background: active ? c.ink : 'transparent', color: active ? c.white : c.textMuted,
  border: `1px solid ${active ? c.ink : c.borderLight}`, borderRadius: r.md, cursor: 'pointer',
})

const btnPrimary = {
  width: '100%', fontSize: fs.md, fontWeight: fw.bold, padding: '6px 0',
  background: c.ink, color: c.white, border: 'none', borderRadius: r.lg, cursor: 'pointer',
}

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
}

function PrintOrderTab() {
  const [project, setProject]   = useState('')
  const [client, setClient]     = useState('')
  const [qty, setQty]           = useState(1000)
  const [substrate, setSubstrate] = useState('SBS')
  const [grammage, setGrammage] = useState(300)
  const [process, setProcess]   = useState('offset')
  const [colors, setColors]     = useState('4')
  const [finishing, setFinishing] = useState('none')
  const [delivery, setDelivery] = useState('')

  const plateCost  = process === 'offset' ? (colors === '+PMS' ? 5 : parseInt(colors, 10) || 4) * 150 : 0
  const unitBase   = process === 'offset' ? 0.08 : process === 'digital' ? 0.18 : 0.06
  const finishMult = finishing === 'foil' ? 1.4 : finishing === 'lamination' ? 1.2 : finishing === 'varnish' ? 1.1 : 1.0
  const runCost    = qty * unitBase * finishMult

  const generate = () => {
    const content = [
      '═══════════════════════════════════════',
      '          BON DE COMMANDE IMPRESSION',
      '═══════════════════════════════════════',
      '',
      `Projet      : ${project || '—'}`,
      `Client      : ${client || '—'}`,
      `Date livr.  : ${delivery || '—'}`,
      `Réf. bon    : PC-${Date.now().toString().slice(-6)}`,
      '',
      '─── SPÉCIFICATIONS TECHNIQUES ─────────',
      `Quantité    : ${qty.toLocaleString()} ex.`,
      `Substrat    : ${substrate}`,
      `Grammage    : ${grammage} g/m²`,
      `Procédé     : ${process.toUpperCase()}`,
      `Couleurs    : ${colors}`,
      `Finition    : ${finishing}`,
      '',
      '─── ESTIMATION COÛTS ───────────────────',
      process === 'offset' ? `Clichés     : ${plateCost.toFixed(0)} €` : '',
      `Tirage      : ${runCost.toFixed(0)} €`,
      `TOTAL EST.  : ${(plateCost + runCost).toFixed(0)} €`,
      '',
      '═══════════════════════════════════════',
      'Document généré par Fold Studio',
      new Date().toLocaleDateString('fr-FR'),
    ].filter(l => l !== undefined).join('\n')
    downloadTxt(`bon_commande_${project || 'projet'}.txt`, content)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Projet</FieldLabel>
          <input value={project} onChange={e => setProject(e.target.value)} style={inputStyle} placeholder="Nom projet" />
        </div>
        <div>
          <FieldLabel>Client</FieldLabel>
          <input value={client} onChange={e => setClient(e.target.value)} style={inputStyle} placeholder="Client" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Quantité</FieldLabel>
          <input type="number" value={qty} min={100} step={100} onChange={e => setQty(Number(e.target.value))} style={inputStyle} />
        </div>
        <div>
          <FieldLabel>Substrat</FieldLabel>
          <select value={substrate} onChange={e => setSubstrate(e.target.value)} style={inputStyle}>
            <option value="kraft">Kraft</option>
            <option value="SBS">SBS</option>
            <option value="coated">Couché</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Grammage (g/m²)</FieldLabel>
          <select value={grammage} onChange={e => setGrammage(Number(e.target.value))} style={inputStyle}>
            {[250, 300, 350, 400].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>Procédé</FieldLabel>
          <select value={process} onChange={e => setProcess(e.target.value)} style={inputStyle}>
            <option value="offset">Offset</option>
            <option value="digital">Digital</option>
            <option value="flexo">Flexo</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Couleurs</FieldLabel>
          <select value={colors} onChange={e => setColors(e.target.value)} style={inputStyle}>
            <option value="1">1 couleur</option>
            <option value="2">2 couleurs</option>
            <option value="4">4 couleurs</option>
            <option value="+PMS">4C + PMS</option>
          </select>
        </div>
        <div>
          <FieldLabel>Finition</FieldLabel>
          <select value={finishing} onChange={e => setFinishing(e.target.value)} style={inputStyle}>
            <option value="none">Aucune</option>
            <option value="varnish">Vernis</option>
            <option value="lamination">Pelliculage</option>
            <option value="foil">Foil</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Date livraison</FieldLabel>
        <input type="date" value={delivery} onChange={e => setDelivery(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {process === 'offset' && (
            <div>
              <div style={{ fontSize: fs.xs, color: c.textMuted }}>Clichés</div>
              <div style={{ fontSize: fs.md, fontWeight: fw.bold, color: c.textMed }}>{plateCost} €</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: fs.xs, color: c.textMuted }}>Tirage</div>
            <div style={{ fontSize: fs.md, fontWeight: fw.bold, color: c.textMed }}>{runCost.toFixed(0)} €</div>
          </div>
          <div>
            <div style={{ fontSize: fs.xs, color: c.textMuted }}>Total est.</div>
            <div style={{ fontSize: fs.lg, fontWeight: fw.heavy, color: c.accent }}>{(plateCost + runCost).toFixed(0)} €</div>
          </div>
        </div>
      </div>
      <button onClick={generate} style={btnPrimary}>Télécharger bon de commande</button>
    </div>
  )
}

interface Vendor {
  name: string
  unitPrice: number
  setupCost: number
  leadTime: number
  moq: number
}

function VendorQuoteTab() {
  const [qty, setQty] = useState(1000)
  const [vendors, setVendors] = useState<Vendor[]>([
    { name: 'Fournisseur A', unitPrice: 0.12, setupCost: 800,  leadTime: 15, moq: 500 },
    { name: 'Fournisseur B', unitPrice: 0.09, setupCost: 1200, leadTime: 20, moq: 1000 },
    { name: 'Fournisseur C', unitPrice: 0.15, setupCost: 400,  leadTime: 8,  moq: 250 },
  ])
  const [sortAsc, setSortAsc] = useState(true)

  const withTotal = vendors.map((v, i) => ({ ...v, idx: i, total: v.setupCost + v.unitPrice * qty }))
  const sorted = sortAsc ? [...withTotal].sort((a, b) => a.total - b.total) : [...withTotal].sort((a, b) => b.total - a.total)
  const cheapestIdx = withTotal.reduce((m, v) => v.total < withTotal[m].total ? v.idx : m, 0)
  const fastestIdx  = withTotal.reduce((m, v) => v.leadTime < withTotal[m].leadTime ? v.idx : m, 0)

  const updateVendor = (i: number, field: keyof Vendor, val: string | number) => {
    setVendors(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: val } : v))
  }

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Quantité de référence</FieldLabel>
        <input type="number" value={qty} min={100} step={100} onChange={e => setQty(Number(e.target.value))} style={{ ...inputStyle, width: '50%' }} />
      </div>
      <div style={{ overflowX: 'auto', marginBottom: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.xs }}>
          <thead>
            <tr style={{ background: c.surface }}>
              {['Fournisseur', 'PU (€)', 'Setup (€)', 'Délai (j)', 'MOQ'].map(h => (
                <th key={h} style={{ padding: '4px 4px', textAlign: 'left', fontWeight: fw.bold, color: c.textMuted, borderBottom: `1px solid ${c.borderLight}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => (
              <tr key={i} style={{ background: i === cheapestIdx ? '#f0fdf4' : 'transparent' }}>
                <td style={{ padding: '3px 2px' }}>
                  <input value={v.name} onChange={e => updateVendor(i, 'name', e.target.value)}
                    style={{ ...inputStyle, padding: '2px 4px', fontSize: fs.xs }} />
                </td>
                {(['unitPrice', 'setupCost', 'leadTime', 'moq'] as (keyof Vendor)[]).map(f => (
                  <td key={f} style={{ padding: '3px 2px' }}>
                    <input type="number" value={v[f] as number} step={f === 'unitPrice' ? 0.01 : 1}
                      onChange={e => updateVendor(i, f, parseFloat(e.target.value))}
                      style={{ ...inputStyle, padding: '2px 4px', fontSize: fs.xs, width: 56 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => setSortAsc(v => !v)} style={{
        fontSize: fs.xs, padding: '3px 10px', background: c.surface, border: `1px solid ${c.borderLight}`,
        borderRadius: r.md, cursor: 'pointer', marginBottom: 8, color: c.textMed,
      }}>
        Trier par coût total {sortAsc ? '↑' : '↓'}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {sorted.map(v => (
          <div key={v.idx} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
            background: v.idx === cheapestIdx ? '#f0fdf4' : c.surfaceAlt,
            border: `1px solid ${v.idx === cheapestIdx ? '#86efac' : c.borderLight}`,
            borderRadius: r.lg,
          }}>
            <span style={{ fontSize: fs.xs, color: c.textMed, flex: 1, fontWeight: fw.bold }}>{v.name}</span>
            <span style={{ fontSize: fs.xs, fontWeight: fw.heavy, color: c.accent }}>{v.total.toFixed(0)} €</span>
            {v.idx === cheapestIdx && <span style={{ fontSize: fs.xs, color: '#16a34a', background: '#dcfce7', borderRadius: r.pill, padding: '1px 6px' }}>Meilleur prix</span>}
            {v.idx === fastestIdx  && <span style={{ fontSize: fs.xs, color: '#1d4ed8', background: '#dbeafe', borderRadius: r.pill, padding: '1px 6px' }}>Le + rapide</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function HandoffTab({ params, activeTemplate }: { params: BoxParams; activeTemplate: string }) {
  const checks = [
    { label: 'Polices embarquées', ok: true },
    { label: 'Fond perdu défini',  ok: params.bleed > 0 },
    { label: 'Résolution 300 dpi', ok: true },
    { label: 'Profil couleur CMJN', ok: true },
  ]

  const specsText = [
    `Template    : ${activeTemplate}`,
    `Dimensions  : ${params.width} × ${params.height} × ${params.depth} mm`,
    `Épaisseur   : ${params.thickness} mm`,
    `Fond perdu  : ${params.bleed} mm`,
    `Rabat colle : ${params.glueTab} mm`,
  ].join('\n')

  const copySpecs = () => navigator.clipboard.writeText(specsText)

  const downloadPDF = () => {
    const content = [
      '═══════════════════════════════════════',
      '        FICHE TECHNIQUE — FOLD STUDIO',
      '═══════════════════════════════════════',
      '',
      specsText,
      '',
      '─── CONTRÔLE QUALITÉ ───────────────────',
      ...checks.map(ch => `${ch.ok ? '✓' : '✗'} ${ch.label}`),
      '',
      '═══════════════════════════════════════',
      new Date().toLocaleDateString('fr-FR'),
    ].join('\n')
    downloadTxt(`specs_techniques_${activeTemplate}.txt`, content)
  }

  return (
    <div>
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6, fontWeight: fw.bold, letterSpacing: 0.8, textTransform: 'uppercase' }}>Résumé technique</div>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 3 }}>Template : <span style={{ color: c.textMed, fontWeight: fw.bold }}>{activeTemplate}</span></div>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 3 }}>Dimensions : <span style={{ color: c.textMed, fontWeight: fw.bold }}>{params.width} × {params.height} × {params.depth} mm</span></div>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 3 }}>Épaisseur : <span style={{ color: c.textMed }}>{params.thickness} mm</span></div>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 3 }}>Fond perdu : <span style={{ color: c.textMed }}>{params.bleed} mm</span></div>
        <div style={{ fontSize: fs.xs, color: c.textMuted }}>Rabat colle : <span style={{ color: c.textMed }}>{params.glueTab} mm</span></div>
      </div>
      <div style={{ marginBottom: 10 }}>
        {checks.map(ch => (
          <div key={ch.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 12, color: ch.ok ? '#10b981' : '#ef4444' }}>{ch.ok ? '✓' : '✗'}</span>
            <span style={{ fontSize: fs.sm, color: c.textMed }}>{ch.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button onClick={copySpecs} style={{
          fontSize: fs.sm, fontWeight: fw.bold, padding: '6px 0',
          background: c.surface, color: c.textMed, border: `1px solid ${c.borderLight}`, borderRadius: r.lg, cursor: 'pointer',
        }}>
          Copier specs
        </button>
        <button onClick={downloadPDF} style={btnPrimary}>
          PDF technique
        </button>
      </div>
    </div>
  )
}

type ApprovalTransition = { from: ApprovalStatus[]; to: ApprovalStatus; label: string; color: string }

const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft:    'Brouillon',
  sent:     'Envoyé en révision',
  approved: 'Approuvé',
  revision: 'Révision requise',
  final:    'Approbation finale',
}

const STATUS_COLORS: Record<ApprovalStatus, string> = {
  draft:    '#94a3b8',
  sent:     '#f59e0b',
  approved: '#3b82f6',
  revision: '#ef4444',
  final:    '#10b981',
}

const TRANSITIONS: ApprovalTransition[] = [
  { from: ['draft'],              to: 'sent',     label: 'Envoyer pour révision', color: '#f59e0b' },
  { from: ['sent'],               to: 'approved', label: 'Marquer Approuvé',      color: '#3b82f6' },
  { from: ['sent', 'approved'],   to: 'revision', label: 'Demander révision',     color: '#ef4444' },
  { from: ['approved','revision'],to: 'final',    label: 'Approbation finale',    color: '#10b981' },
]

function ApprovalTab() {
  const [status, setStatus] = useState<ApprovalStatus>('draft')
  const [history, setHistory] = useState<{ status: ApprovalStatus; ts: string }[]>([
    { status: 'draft', ts: new Date().toLocaleString('fr-FR') },
  ])

  const projId = 'PROJ-' + Math.floor(1000 + Math.random() * 9000)
  const mockUrl = `https://fold.studio/review/${projId}`

  const available = TRANSITIONS.filter(t => t.from.includes(status))

  const doTransition = (to: ApprovalStatus) => {
    setStatus(to)
    setHistory(prev => [...prev, { status: to, ts: new Date().toLocaleString('fr-FR') }])
  }

  const FLOW_ORDER: ApprovalStatus[] = ['draft', 'sent', 'approved', 'revision', 'final']
  const nodeXMap: Record<ApprovalStatus, number> = { draft: 14, sent: 64, approved: 114, revision: 89, final: 139 }
  const nodeYMap: Record<ApprovalStatus, number> = { draft: 30, sent: 30, approved: 30, revision: 60, final: 60 }

  return (
    <div>
      <svg width="180" height="85" viewBox="0 0 180 85" style={{ display: 'block', margin: '0 auto 10px' }}>
        {FLOW_ORDER.map(s => (
          <g key={s}>
            <circle cx={nodeXMap[s]} cy={nodeYMap[s]} r={11}
              fill={status === s ? STATUS_COLORS[s] : c.surfaceAlt}
              stroke={STATUS_COLORS[s]} strokeWidth="1.5" />
            <text x={nodeXMap[s]} y={nodeYMap[s] + 3} textAnchor="middle" fontSize="5"
              fill={status === s ? '#fff' : STATUS_COLORS[s]} fontWeight="bold">
              {s === 'draft' ? 'DRAFT' : s === 'sent' ? 'SENT' : s === 'approved' ? 'OK' : s === 'revision' ? 'REV' : 'FINAL'}
            </text>
          </g>
        ))}
        <line x1="25" y1="30" x2="53" y2="30" stroke={c.borderLight} strokeWidth="1" />
        <line x1="75" y1="30" x2="103" y2="30" stroke={c.borderLight} strokeWidth="1" />
        <path d="M103 35 L92 53" stroke={c.borderLight} strokeWidth="1" />
        <path d="M125 30 L140 53" stroke={c.borderLight} strokeWidth="1" />
      </svg>
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: fs.sm, fontWeight: fw.bold, color: STATUS_COLORS[status],
          background: STATUS_COLORS[status] + '20', borderRadius: r.pill, padding: '3px 10px',
        }}>
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
        {available.map(t => (
          <button key={t.to} onClick={() => doTransition(t.to)} style={{
            fontSize: fs.sm, fontWeight: fw.bold, padding: '5px 0',
            background: t.color, color: c.white, border: 'none', borderRadius: r.lg, cursor: 'pointer',
          }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 4 }}>Lien de partage</div>
        <div style={{
          fontSize: fs.xs, color: c.accent, background: c.accentBg, borderRadius: r.lg,
          padding: '4px 8px', wordBreak: 'break-all', fontFamily: 'monospace',
        }}>
          {mockUrl}
        </div>
      </div>
      <div style={{ maxHeight: 80, overflowY: 'auto' }}>
        {[...history].reverse().map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: fs.xs, color: STATUS_COLORS[h.status], fontWeight: fw.bold }}>{STATUS_LABELS[h.status]}</span>
            <span style={{ fontSize: fs.xs, color: c.textLight }}>{h.ts}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BriefTab({ params, activeTemplate }: { params: BoxParams; activeTemplate: string }) {
  const [project, setProject]  = useState('')
  const [brand, setBrand]      = useState('')
  const [product, setProduct]  = useState('')
  const [market, setMarket]    = useState('Europe')
  const [materials, setMaterials] = useState('')
  const [quantity, setQuantity]   = useState(5000)

  const REG: Record<string, string[]> = {
    Europe: ['REACH Regulation (CE 1907/2006)', 'SVHC substances declaration', 'CE marking if applicable', 'EU Packaging Directive 94/62/CE'],
    USA:    ['FDA 21 CFR compliance', 'California Prop 65', 'FTC Green Guides', 'ASTM D3475 child-resistance'],
    Asia:   ['GB/T standards (China)', 'JIS standards (Japan)', 'BIS certification (India)', 'KC mark (Korea)'],
    MENA:   ['SASO (Saudi Arabia)', 'ESMA (UAE)', 'Halal packaging requirements', 'Arabic labeling obligation'],
  }

  const SUSTAIN = [
    'PCR content minimum 30%',
    'FSC/PEFC certified board',
    'Recyclable monomaterial target',
    'Carbon footprint < 1.2 kg CO₂eq/1000 units',
    'Optimised lightweighting',
  ]

  const generateBrief = () => {
    const regs = REG[market] ?? []
    const content = [
      '══════════════════════════════════════════════',
      '           PACKAGING BRIEF — FOLD STUDIO',
      '══════════════════════════════════════════════',
      '',
      `Projet      : ${project || '—'}`,
      `Marque      : ${brand || '—'}`,
      `Produit     : ${product || '—'}`,
      `Marché cible: ${market}`,
      `Quantité    : ${quantity.toLocaleString()} unités`,
      '',
      '─── SPÉCIFICATIONS TECHNIQUES ─────────────────',
      `Format      : ${activeTemplate}`,
      `Dimensions  : ${params.width} × ${params.height} × ${params.depth} mm`,
      `Épaisseur   : ${params.thickness} mm`,
      `Fond perdu  : ${params.bleed} mm`,
      materials ? `Matériaux   : ${materials}` : '',
      '',
      '─── EXIGENCES RÉGLEMENTAIRES ───────────────────',
      ...regs.map(reg => `• ${reg}`),
      '',
      '─── OBJECTIFS DÉVELOPPEMENT DURABLE ────────────',
      ...SUSTAIN.map(s => `• ${s}`),
      '',
      '══════════════════════════════════════════════',
      `Généré le ${new Date().toLocaleDateString('fr-FR')} par Fold Studio`,
    ].filter(l => l !== undefined).join('\n')
    downloadTxt(`brief_${project || 'packaging'}_${market}.txt`, content)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Projet</FieldLabel>
          <input value={project} onChange={e => setProject(e.target.value)} style={inputStyle} placeholder="Nom projet" />
        </div>
        <div>
          <FieldLabel>Marque</FieldLabel>
          <input value={brand} onChange={e => setBrand(e.target.value)} style={inputStyle} placeholder="Brand" />
        </div>
      </div>
      <div style={{ marginBottom: 6 }}>
        <FieldLabel>Description produit</FieldLabel>
        <input value={product} onChange={e => setProduct(e.target.value)} style={inputStyle} placeholder="Décrire le produit…" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
        <div>
          <FieldLabel>Marché cible</FieldLabel>
          <select value={market} onChange={e => setMarket(e.target.value)} style={inputStyle}>
            <option>Europe</option>
            <option>USA</option>
            <option>Asia</option>
            <option>MENA</option>
          </select>
        </div>
        <div>
          <FieldLabel>Quantité</FieldLabel>
          <input type="number" value={quantity} min={100} step={500} onChange={e => setQuantity(Number(e.target.value))} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Exigences matériaux</FieldLabel>
        <input value={materials} onChange={e => setMaterials(e.target.value)} style={inputStyle} placeholder="ex. FSC, PCR, biodégradable…" />
      </div>
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '6px 8px', marginBottom: 8 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, fontWeight: fw.bold, marginBottom: 4 }}>Réglementation auto ({market})</div>
        {(REG[market] ?? []).map(reg => (
          <div key={reg} style={{ fontSize: fs.xs, color: c.textMed, marginBottom: 2 }}>• {reg}</div>
        ))}
      </div>
      <button onClick={generateBrief} style={btnPrimary}>Générer brief PDF</button>
    </div>
  )
}

export function WorkflowSection({ params, activeTemplate }: { params: BoxParams; activeTemplate: string }) {
  const [tab, setTab] = useState<WorkflowTab>('printorder')

  const tabs: { key: WorkflowTab; label: string }[] = [
    { key: 'printorder',  label: 'Bon cde' },
    { key: 'vendorquote', label: 'Devis' },
    { key: 'handoff',     label: 'Remise' },
    { key: 'approval',    label: 'Valid.' },
    { key: 'brief',       label: 'Brief' },
  ]

  return (
    <CollapsibleSection label="Workflow production">
      <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'printorder'  && <PrintOrderTab />}
      {tab === 'vendorquote' && <VendorQuoteTab />}
      {tab === 'handoff'     && <HandoffTab params={params} activeTemplate={activeTemplate} />}
      {tab === 'approval'    && <ApprovalTab />}
      {tab === 'brief'       && <BriefTab params={params} activeTemplate={activeTemplate} />}
    </CollapsibleSection>
  )
}
