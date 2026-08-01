'use client'

import { useState, useRef, useEffect } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import { c, fs, fw, r } from '@/lib/tokens'

type Tab = 'wvtr' | 'otr' | 'map' | 'shelflife' | 'allergen' | 'fda'

const TABS: { id: Tab; label: string }[] = [
  { id: 'wvtr',      label: 'WVTR' },
  { id: 'otr',       label: 'OTR' },
  { id: 'map',       label: 'MAP' },
  { id: 'shelflife', label: 'Shelf Life' },
  { id: 'allergen',  label: 'Allergen' },
  { id: 'fda',       label: 'FDA' },
]

const WVTR_MATERIALS: { label: string; wvtr: number }[] = [
  { label: 'Kraft paper',    wvtr: 200 },
  { label: 'Coated kraft',   wvtr: 50 },
  { label: 'PE',             wvtr: 3 },
  { label: 'PP',             wvtr: 5 },
  { label: 'PET',            wvtr: 1.5 },
  { label: 'Aluminum foil',  wvtr: 0.001 },
  { label: 'PVDC',           wvtr: 0.05 },
]

const OTR_MATERIALS: { label: string; otr: number }[] = [
  { label: 'Kraft',     otr: 5000 },
  { label: 'PE',        otr: 3000 },
  { label: 'PP',        otr: 2500 },
  { label: 'PET',       otr: 50 },
  { label: 'EVOH',      otr: 0.1 },
  { label: 'Aluminum',  otr: 0 },
]

const OTR_PRODUCTS: { label: string; sensitivity: number }[] = [
  { label: 'Coffee',      sensitivity: 0.01 },
  { label: 'Chips',       sensitivity: 0.05 },
  { label: 'Fresh meat',  sensitivity: 0.5 },
  { label: 'Frozen',      sensitivity: 5 },
]

const MAP_PRESETS: { label: string; n2: number; co2: number; o2: number }[] = [
  { label: 'Fresh meat',  n2: 70, co2: 30, o2: 0 },
  { label: 'Fish',        n2: 40, co2: 60, o2: 0 },
  { label: 'Vegetables',  n2: 70, co2: 10, o2: 20 },
  { label: 'Cheese',      n2: 30, co2: 70, o2: 0 },
]

const ALLERGENS_EU = [
  'Gluten', 'Crustaceans', 'Eggs', 'Fish', 'Peanuts', 'Soybeans',
  'Milk', 'Nuts', 'Celery', 'Mustard', 'Sesame', 'Sulphites', 'Lupin', 'Molluscs',
]

const SHELF_LIFE_PRODUCTS = [
  { product: 'Biscuits',      days: 180 },
  { product: 'Chips',         days: 60 },
  { product: 'Coffee',        days: 730 },
  { product: 'Fresh juice',   days: 14 },
  { product: 'Dried pasta',   days: 730 },
  { product: 'Cheese (hard)', days: 120 },
]

const R_GAS = 8.314

function row(label: string, value: React.ReactNode, last = false) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: last ? 'none' : `1px solid ${c.borderXLight}` }}>
      <span style={{ fontSize: fs.sm, color: c.textMuted }}>{label}</span>
      <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.ink }}>{value}</span>
    </div>
  )
}

function sel(value: string | number, onChange: (v: string) => void, options: { value: string | number; label: string }[]) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`, borderRadius: r.lg, padding: '4px 6px', background: c.white, fontFamily: 'inherit', marginBottom: 8 }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function numInput(value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step ?? 1}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{ width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '4px 6px', background: c.white, outline: 'none', fontFamily: 'inherit', marginBottom: 8 }}
    />
  )
}

function badge(text: string, ok: boolean) {
  return (
    <span style={{
      display: 'inline-block', fontSize: fs.xs, fontWeight: fw.bold, padding: '2px 7px', borderRadius: r.pill,
      background: ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: ok ? '#059669' : '#dc2626', border: `1px solid ${ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>{text}</span>
  )
}

function WVTRTab() {
  const [matIdx, setMatIdx] = useState(0)
  const [area, setArea] = useState(500)
  const [sensitivity, setSensitivity] = useState<'dry' | 'medium' | 'sensitive'>('medium')

  const mat = WVTR_MATERIALS[matIdx]
  const totalWvtr = mat.wvtr * (area / 10000)
  const thresholds = { dry: 50, medium: 10, sensitive: 1 }
  const threshold = thresholds[sensitivity]
  const sufficient = mat.wvtr <= threshold

  return (
    <div>
      <FieldLabel>Material</FieldLabel>
      {sel(matIdx, v => setMatIdx(Number(v)), WVTR_MATERIALS.map((m, i) => ({ value: i, label: m.label })))}
      <FieldLabel>Surface area (cm²)</FieldLabel>
      {numInput(area, setArea, 1, 100000)}
      <FieldLabel>Product humidity sensitivity</FieldLabel>
      {sel(sensitivity, v => setSensitivity(v as 'dry' | 'medium' | 'sensitive'), [
        { value: 'dry', label: 'Dry (threshold 50 g/m²/day)' },
        { value: 'medium', label: 'Medium (threshold 10 g/m²/day)' },
        { value: 'sensitive', label: 'Sensitive (threshold 1 g/m²/day)' },
      ])}
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '8px 10px', marginTop: 4 }}>
        {row('WVTR (material)', `${mat.wvtr} g/m²/day`)}
        {row('Total moisture transmission', `${totalWvtr.toFixed(4)} g/day`)}
        {row('Assessment', badge(sufficient ? 'Sufficient' : 'Insufficient', sufficient), true)}
      </div>
      <div style={{ fontSize: fs.xs, color: c.textGhost, marginTop: 6 }}>Ref: TAPPI T464 / ISO 2528</div>
    </div>
  )
}

function OTRTab() {
  const [matIdx, setMatIdx] = useState(0)
  const [prodIdx, setProdIdx] = useState(0)
  const [weight, setWeight] = useState(200)
  const [area, setArea] = useState(400)

  const mat = OTR_MATERIALS[matIdx]
  const prod = OTR_PRODUCTS[prodIdx]
  const areM2 = area / 10000
  const otrTotal = mat.otr * areM2
  const shelfDays = prod.sensitivity > 0 && mat.otr > 0
    ? Math.round((prod.sensitivity * weight) / (otrTotal || 0.0001))
    : mat.otr === 0 ? 9999 : 0

  return (
    <div>
      <FieldLabel>Barrier material</FieldLabel>
      {sel(matIdx, v => setMatIdx(Number(v)), OTR_MATERIALS.map((m, i) => ({ value: i, label: `${m.label} — ${m.otr} cc/m²/day` })))}
      <FieldLabel>Product type</FieldLabel>
      {sel(prodIdx, v => setProdIdx(Number(v)), OTR_PRODUCTS.map((p, i) => ({ value: i, label: p.label })))}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 2 }}>
        <div>
          <FieldLabel>Area (cm²)</FieldLabel>
          {numInput(area, setArea, 1, 100000)}
        </div>
        <div>
          <FieldLabel>Product weight (g)</FieldLabel>
          {numInput(weight, setWeight, 1, 10000)}
        </div>
      </div>
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '8px 10px' }}>
        {row('OTR', `${mat.otr} cc/m²/day`)}
        {row('O₂ transmitted/day', `${otrTotal.toFixed(4)} cc/day`)}
        {row('Shelf life (oxidation)', mat.otr === 0 ? '∞ (hermetic)' : `${shelfDays} days`, true)}
      </div>
    </div>
  )
}

function MAPTab() {
  const [n2, setN2] = useState(70)
  const [co2, setCo2] = useState(30)
  const [o2, setO2] = useState(0)

  const total = n2 + co2 + o2

  function applyPreset(p: typeof MAP_PRESETS[0]) {
    setN2(p.n2); setCo2(p.co2); setO2(p.o2)
  }

  function handleSlider(gas: 'n2' | 'co2' | 'o2', val: number) {
    const v = Math.max(0, Math.min(100, val))
    if (gas === 'n2') { const rem = Math.max(0, 100 - v); setCo2(Math.round(rem * co2 / (co2 + o2 + 0.001))); setO2(Math.round(rem * o2 / (co2 + o2 + 0.001))); setN2(v) }
    else if (gas === 'co2') { const rem = Math.max(0, 100 - v); setN2(Math.round(rem * n2 / (n2 + o2 + 0.001))); setO2(Math.round(rem * o2 / (n2 + o2 + 0.001))); setCo2(v) }
    else { const rem = Math.max(0, 100 - v); setN2(Math.round(rem * n2 / (n2 + co2 + 0.001))); setCo2(Math.round(rem * co2 / (n2 + co2 + 0.001))); setO2(v) }
  }

  const cx = 50; const cy = 50; const radius = 36
  function arc(pct: number, offset: number): string {
    const circumference = 2 * Math.PI * radius
    return `stroke-dasharray: ${(pct / 100) * circumference} ${circumference}; stroke-dashoffset: -${(offset / 100) * circumference}`
  }
  const n2Pct = n2; const co2Pct = co2; const o2Pct = o2
  const n2Off = 0; const co2Off = n2Pct; const o2Off = n2Pct + co2Pct
  const circ = 2 * Math.PI * radius

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {MAP_PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)} style={{
            fontSize: fs.xs, padding: '3px 7px', borderRadius: r.pill, border: `1px solid ${c.borderLight}`,
            background: c.surface, cursor: 'pointer', color: c.textMed,
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={c.borderXLight} strokeWidth="12" />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#4488ff" strokeWidth="12"
            strokeDasharray={`${(n2Pct / 100) * circ} ${circ}`}
            strokeDashoffset={-(n2Off / 100) * circ}
            transform={`rotate(-90 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f59e0b" strokeWidth="12"
            strokeDasharray={`${(co2Pct / 100) * circ} ${circ}`}
            strokeDashoffset={-(co2Off / 100) * circ}
            transform={`rotate(-90 ${cx} ${cy})`} />
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#10b981" strokeWidth="12"
            strokeDasharray={`${(o2Pct / 100) * circ} ${circ}`}
            strokeDashoffset={-(o2Off / 100) * circ}
            transform={`rotate(-90 ${cx} ${cy})`} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill={c.textMuted}>{total}%</text>
        </svg>
        <div style={{ flex: 1 }}>
          {([['N₂', n2, (v: number) => handleSlider('n2', v), '#4488ff'], ['CO₂', co2, (v: number) => handleSlider('co2', v), '#f59e0b'], ['O₂', o2, (v: number) => handleSlider('o2', v), '#10b981']] as [string, number, (v: number) => void, string][]).map(([label, val, setter, color]) => (
            <div key={label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: fs.sm, color: c.textMuted }}>{label}</span>
                <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.ink }}>{val}%</span>
              </div>
              <input type="range" min={0} max={100} value={val} onChange={e => setter(Number(e.target.value))}
                style={{ width: '100%', accentColor: color }} />
            </div>
          ))}
        </div>
      </div>
      {total !== 100 && (
        <div style={{ fontSize: fs.xs, color: '#dc2626', marginBottom: 6 }}>⚠ Total: {total}% (must equal 100%)</div>
      )}
      <div style={{ background: c.surface, borderRadius: r.lg, padding: '6px 8px', fontFamily: 'monospace', fontSize: fs.sm, color: c.textMed }}>
        Atmosphere: N₂ {n2}%, CO₂ {co2}%, O₂ {o2}%
      </div>
    </div>
  )
}

function ShelfLifeTab() {
  const [shelfRef, setShelfRef] = useState(180)
  const [tRef, setTRef] = useState(20)
  const [tStorage, setTStorage] = useState(4)
  const [ea, setEa] = useState(50)

  const tRefK = tRef + 273.15
  const tStorK = tStorage + 273.15
  const estimated = Math.round(shelfRef * Math.exp((ea * 1000 / R_GAS) * (1 / tRefK - 1 / tStorK)))

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div>
          <FieldLabel>Ref shelf life (days)</FieldLabel>
          {numInput(shelfRef, setShelfRef, 1, 3650)}
        </div>
        <div>
          <FieldLabel>T ref (°C)</FieldLabel>
          {numInput(tRef, setTRef, -20, 80)}
        </div>
        <div>
          <FieldLabel>T storage (°C)</FieldLabel>
          {numInput(tStorage, setTStorage, -40, 60)}
        </div>
        <div>
          <FieldLabel>Ea (kJ/mol)</FieldLabel>
          {numInput(ea, setEa, 10, 200)}
        </div>
      </div>
      <div style={{ background: 'rgba(68,136,255,0.08)', border: `1px solid ${c.accentBorder}`, borderRadius: r.lg, padding: '8px 10px', marginBottom: 10 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 2 }}>Estimated shelf life at {tStorage}°C</div>
        <div style={{ fontSize: 22, fontWeight: fw.heavy, color: c.accent }}>{estimated > 9999 ? '>9999' : estimated} <span style={{ fontSize: fs.md, fontWeight: fw.normal }}>days</span></div>
        <div style={{ fontSize: fs.xs, color: c.textGhost, marginTop: 2 }}>Arrhenius model — Ea = {ea} kJ/mol</div>
      </div>
      <div style={{ fontSize: fs.xs, fontWeight: fw.bold, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Reference products (at 20°C)</div>
      <div style={{ border: `1px solid ${c.borderXLight}`, borderRadius: r.lg, overflow: 'hidden' }}>
        {SHELF_LIFE_PRODUCTS.map((p, i) => (
          <div key={p.product} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: i % 2 ? c.surface : c.white }}>
            <span style={{ fontSize: fs.sm, color: c.textMed }}>{p.product}</span>
            <span style={{ fontSize: fs.sm, fontWeight: fw.bold, color: c.ink }}>{p.days}d</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AllergenTab() {
  const [present, setPresent] = useState<Set<string>>(new Set())
  const [mayContain, setMayContain] = useState<Set<string>>(new Set())

  function toggle(allergen: string, set: 'present' | 'maycontain') {
    if (set === 'present') {
      setPresent(prev => { const n = new Set(prev); n.has(allergen) ? n.delete(allergen) : n.add(allergen); return n })
    } else {
      setMayContain(prev => { const n = new Set(prev); n.has(allergen) ? n.delete(allergen) : n.add(allergen); return n })
    }
  }

  const presentList = ALLERGENS_EU.filter(a => present.has(a))
  const mayList = ALLERGENS_EU.filter(a => mayContain.has(a))
  const statement = [
    presentList.length ? `Contains: ${presentList.join(', ')}.` : '',
    mayList.length ? `May contain: ${mayList.join(', ')}.` : '',
  ].filter(Boolean).join(' ')

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6 }}>EU Reg. 1169/2011 — 14 major allergens</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 10 }}>
        {ALLERGENS_EU.map(a => (
          <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 0' }}>
            <input type="checkbox" id={`a-${a}`} checked={present.has(a)} onChange={() => toggle(a, 'present')}
              style={{ accentColor: c.accent, cursor: 'pointer' }} />
            <label htmlFor={`a-${a}`} style={{ fontSize: fs.sm, color: present.has(a) ? c.ink : c.textMed, cursor: 'pointer', userSelect: 'none' }}>{a}</label>
          </div>
        ))}
      </div>
      <div style={{ fontSize: fs.xs, fontWeight: fw.bold, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>May contain (cross-contamination)</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
        {ALLERGENS_EU.filter(a => !present.has(a)).map(a => (
          <button key={a} onClick={() => toggle(a, 'maycontain')} style={{
            fontSize: fs.xs, padding: '2px 6px', borderRadius: r.pill, cursor: 'pointer',
            border: `1px solid ${mayContain.has(a) ? c.accent : c.borderLight}`,
            background: mayContain.has(a) ? c.accentBg : c.surface,
            color: mayContain.has(a) ? c.accent : c.textMed,
          }}>{a}</button>
        ))}
      </div>
      {present.size === 0 && mayContain.size === 0 ? (
        <div style={{ fontSize: fs.xs, color: '#b45309', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: r.lg, padding: '6px 8px' }}>
          ⚠ No allergen statement added. Add at least "Contains: none" or declare allergens.
        </div>
      ) : (
        <div style={{ background: c.surface, border: `1px solid ${c.borderLight}`, borderRadius: r.lg, padding: '8px 10px' }}>
          <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 4, fontWeight: fw.bold }}>LABEL OUTPUT</div>
          <div style={{ fontSize: fs.md, color: c.ink, lineHeight: 1.6, fontWeight: fw.medium }}>{statement}</div>
        </div>
      )}
    </div>
  )
}

interface NutritionField { label: string; key: string; unit: string; required: boolean }

const NUTRITION_FIELDS: NutritionField[] = [
  { label: 'Serving size',    key: 'servingSize',     unit: 'g',  required: true },
  { label: 'Calories',        key: 'calories',        unit: 'kcal', required: true },
  { label: 'Total fat',       key: 'totalFat',        unit: 'g',  required: true },
  { label: 'Saturated fat',   key: 'saturatedFat',    unit: 'g',  required: true },
  { label: 'Trans fat',       key: 'transFat',        unit: 'g',  required: true },
  { label: 'Cholesterol',     key: 'cholesterol',     unit: 'mg', required: true },
  { label: 'Sodium',          key: 'sodium',          unit: 'mg', required: true },
  { label: 'Total carbs',     key: 'totalCarbs',      unit: 'g',  required: true },
  { label: 'Dietary fiber',   key: 'dietaryFiber',    unit: 'g',  required: true },
  { label: 'Total sugars',    key: 'totalSugars',     unit: 'g',  required: true },
  { label: 'Added sugars',    key: 'addedSugars',     unit: 'g',  required: true },
  { label: 'Protein',         key: 'protein',         unit: 'g',  required: true },
  { label: 'Vitamin D',       key: 'vitaminD',        unit: 'mcg', required: true },
  { label: 'Calcium',         key: 'calcium',         unit: 'mg', required: true },
  { label: 'Iron',            key: 'iron',            unit: 'mg', required: true },
  { label: 'Potassium',       key: 'potassium',       unit: 'mg', required: true },
]

type NutritionValues = Record<string, number>

function FDATab() {
  const [vals, setVals] = useState<NutritionValues>(() =>
    Object.fromEntries(NUTRITION_FIELDS.map(f => [f.key, 0]))
  )

  function set(key: string, v: number) {
    setVals(prev => ({ ...prev, [key]: v }))
  }

  const allFilled = NUTRITION_FIELDS.every(f => vals[f.key] > 0)
  const fatOk = vals.saturatedFat + vals.transFat <= vals.totalFat + 0.5
  const sodiumWarning = vals.sodium > 2400
  const warnings: string[] = []
  if (!fatOk) warnings.push('Sat. fat + trans fat exceeds total fat')
  if (sodiumWarning) warnings.push('Sodium > 2400 mg: exceeds daily recommendation')
  if (!allFilled) warnings.push('All required fields must be > 0 for compliance')

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 8 }}>21 CFR 101.9 — FDA Nutrition Facts</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
        {NUTRITION_FIELDS.map(f => (
          <div key={f.key}>
            <FieldLabel>{f.label} ({f.unit})</FieldLabel>
            <input
              type="number"
              min={0}
              step={0.1}
              value={vals[f.key]}
              onChange={e => set(f.key, parseFloat(e.target.value) || 0)}
              style={{ width: '100%', fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '3px 5px', background: c.white, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ))}
      </div>

      {warnings.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: r.lg, padding: '6px 8px', marginBottom: 10 }}>
          {warnings.map((w, i) => <div key={i} style={{ fontSize: fs.xs, color: '#dc2626' }}>⚠ {w}</div>)}
        </div>
      )}

      {allFilled && warnings.length === 0 && (
        <div style={{ fontSize: fs.xs, color: '#059669', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: r.lg, padding: '5px 8px', marginBottom: 10 }}>
          ✓ Nutrition Facts panel compliant with 21 CFR 101.9
        </div>
      )}

      <div style={{ border: '2px solid #000', borderRadius: 0, padding: '6px 8px', background: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: 200 }}>
        <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, borderBottom: '8px solid #000', paddingBottom: 4, marginBottom: 4 }}>Nutrition Facts</div>
        <div style={{ fontSize: 9, borderBottom: '4px solid #000', paddingBottom: 3, marginBottom: 3 }}>
          <span>Serving Size </span><span style={{ fontWeight: 700 }}>{vals.servingSize}g</span>
        </div>
        <div style={{ fontSize: 8, fontWeight: 700, marginBottom: 1 }}>Amount Per Serving</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #000', paddingBottom: 2, marginBottom: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700 }}>Calories</span>
          <span style={{ fontSize: 16, fontWeight: 900 }}>{vals.calories}</span>
        </div>
        <div style={{ fontSize: 7, textAlign: 'right', borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 2 }}>% Daily Value*</div>
        {[
          { label: 'Total Fat', value: `${vals.totalFat}g` },
          { label: '  Saturated Fat', value: `${vals.saturatedFat}g` },
          { label: '  Trans Fat', value: `${vals.transFat}g` },
          { label: 'Cholesterol', value: `${vals.cholesterol}mg` },
          { label: 'Sodium', value: `${vals.sodium}mg` },
          { label: 'Total Carbohydrate', value: `${vals.totalCarbs}g` },
          { label: '  Dietary Fiber', value: `${vals.dietaryFiber}g` },
          { label: '  Total Sugars', value: `${vals.totalSugars}g` },
          { label: 'Protein', value: `${vals.protein}g` },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #ccc', padding: '1px 0' }}>
            <span style={{ fontSize: 7 }}>{r.label}</span>
            <span style={{ fontSize: 7, fontWeight: 700 }}>{r.value}</span>
          </div>
        ))}
        <div style={{ borderTop: '4px solid #000', marginTop: 3, paddingTop: 3 }}>
          {[
            { label: 'Vitamin D', value: `${vals.vitaminD}mcg` },
            { label: 'Calcium', value: `${vals.calcium}mg` },
            { label: 'Iron', value: `${vals.iron}mg` },
            { label: 'Potassium', value: `${vals.potassium}mg` },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '0.5px solid #ccc', padding: '1px 0' }}>
              <span style={{ fontSize: 7 }}>{r.label}</span>
              <span style={{ fontSize: 7, fontWeight: 700 }}>{r.value}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 6, color: '#444', marginTop: 3 }}>*% Daily Values based on 2,000 cal diet.</div>
      </div>
    </div>
  )
}

export function FoodSafetySection({ params }: { params: BoxParams }) {
  const [tab, setTab] = useState<Tab>('wvtr')

  return (
    <CollapsibleSection label="Food Safety">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 12 }}>
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
      {tab === 'wvtr'      && <WVTRTab />}
      {tab === 'otr'       && <OTRTab />}
      {tab === 'map'       && <MAPTab />}
      {tab === 'shelflife' && <ShelfLifeTab />}
      {tab === 'allergen'  && <AllergenTab />}
      {tab === 'fda'       && <FDATab />}
    </CollapsibleSection>
  )
}
