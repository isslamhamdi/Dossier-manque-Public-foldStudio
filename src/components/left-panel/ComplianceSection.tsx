'use client'

// #82-87 Compliance/Légal — nutrition label, GS1, recycling, food contact, FSC, multilingual

import { useState } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface ComplianceSectionProps {
  onAddLayer: (layer: ImageLayer) => void
}

// GS1 barcode format validator
function validateGS1(barcode: string): { ok: boolean; msg: string } {
  const digits = barcode.replace(/\D/g, '')
  if (digits.length === 13) {
    const sum = digits.split('').reduce((acc, d, i) => acc + parseInt(d) * (i % 2 === 0 ? 1 : 3), 0)
    const check = (10 - (sum % 10)) % 10
    if (check === parseInt(digits[12])) return { ok: true, msg: 'EAN-13 valide ✓' }
    return { ok: false, msg: 'Chiffre de contrôle EAN-13 incorrect' }
  }
  if (digits.length === 14) return { ok: true, msg: 'Format ITF-14 (GTIN-14) — vérification externe' }
  if (digits.length === 12) return { ok: true, msg: 'UPC-A — vérification externe' }
  return { ok: false, msg: `Longueur inattendue (${digits.length} chiffres)` }
}

// Recycling logos — SVG pictograms
const RECYCLING_LOGOS = [
  { id: 'mobius', name: 'Möbius', svg: '<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 5 L35 30 L5 30 Z" stroke="#1a1a1a" stroke-width="2.5" stroke-linejoin="round" fill="none"/><path d="M20 5 L5 30" stroke="#1a1a1a" stroke-width="2.5" stroke-linecap="round"/></svg>' },
  { id: 'pp', name: 'PP 05', label: '♻ PP 05' },
  { id: 'pe', name: 'PE-LD 04', label: '♻ PE-LD 04' },
  { id: 'pet', name: 'PET 01', label: '♻ PET 01' },
  { id: 'aluminium', name: 'Aluminium', label: 'ALU ♻' },
  { id: 'carton', name: 'Carton', label: '♻ 20 PAP' },
  { id: 'verre', name: 'Verre', label: '♻ GL 70' },
  { id: 'triman', name: 'Triman', label: '⟲' },
]

const RECYCLE_COLORS: Record<string, string> = {
  pp: '#00a651', pe: '#00a651', pet: '#00a651', aluminium: '#b8b8b8',
  carton: '#7b5e3a', verre: '#2ecc71', triman: '#000000', mobius: '#1a1a1a',
}

function makeRecycleSvg(id: string, label: string): string {
  const col = RECYCLE_COLORS[id] ?? '#1a1a1a'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="8" fill="${col}" opacity="0.12"/>
    <text x="40" y="30" font-size="22" text-anchor="middle" fill="${col}" font-family="sans-serif">♻</text>
    <text x="40" y="55" font-size="11" text-anchor="middle" fill="${col}" font-family="sans-serif" font-weight="bold">${label}</text>
  </svg>`
  return 'data:image/svg+xml;base64,' + btoa(svg)
}

// Nutrition label SVG
interface NutritionData {
  energie: string; proteines: string; glucides: string
  sucres: string; lipides: string; satures: string; sel: string
}

function makeNutritionSvg(data: NutritionData, lang: string): string {
  const labels: Record<string, Record<string, string>> = {
    fr: { title: 'Valeurs nutritionnelles', per: 'Pour 100g', energie: 'Énergie', proteines: 'Protéines', glucides: 'Glucides', sucres: 'dont sucres', lipides: 'Matières grasses', satures: 'dont saturés', sel: 'Sel' },
    en: { title: 'Nutrition Facts', per: 'Per 100g', energie: 'Energy', proteines: 'Protein', glucides: 'Carbohydrates', sucres: 'of which sugars', lipides: 'Fat', satures: 'of which saturates', sel: 'Salt' },
    ar: { title: 'القيم الغذائية', per: 'لكل 100 غرام', energie: 'طاقة', proteines: 'بروتينات', glucides: 'كربوهيدرات', sucres: 'منها سكريات', lipides: 'دهون', satures: 'منها مشبعة', sel: 'ملح' },
  }
  const L = labels[lang] ?? labels['fr']
  const rows = [
    [L.energie, data.energie, 'kJ/kcal'],
    [L.proteines, data.proteines, 'g'],
    [L.glucides, data.glucides, 'g'],
    [L.sucres, data.sucres, 'g'],
    [L.lipides, data.lipides, 'g'],
    [L.satures, data.satures, 'g'],
    [L.sel, data.sel, 'g'],
  ]
  const rowH = 20, headerH = 44, totalH = headerH + rows.length * rowH + 12
  const rtl = lang === 'ar' ? 'direction="rtl"' : ''
  const rowsSvg = rows.map((row, i) => {
    const y = headerH + i * rowH
    const sub = row[0].startsWith('dont') || row[0].startsWith('of which') || row[0].startsWith('منها')
    return `<rect x="0" y="${y}" width="260" height="${rowH}" fill="${i % 2 === 0 ? '#fff' : '#f8f8f8'}"/>
    <text x="${sub ? 18 : 8}" y="${y + 13}" font-size="${sub ? 9 : 10}" fill="#333" font-family="sans-serif" ${rtl}>${row[0]}</text>
    <text x="200" y="${y + 13}" font-size="10" fill="#111" font-family="sans-serif" font-weight="bold" text-anchor="end">${row[1]}</text>
    <text x="252" y="${y + 13}" font-size="9" fill="#666" font-family="sans-serif" text-anchor="end">${row[2]}</text>
    <line x1="0" y1="${y + rowH}" x2="260" y2="${y + rowH}" stroke="#ddd" stroke-width="0.5"/>`
  }).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="${totalH}">
    <rect width="260" height="${totalH}" fill="#fff" rx="4" stroke="#222" stroke-width="2"/>
    <rect x="0" y="0" width="260" height="${headerH}" fill="#111" rx="4"/>
    <text x="130" y="18" font-size="14" font-weight="bold" fill="#fff" font-family="sans-serif" text-anchor="middle" ${rtl}>${L.title}</text>
    <text x="130" y="36" font-size="10" fill="#ccc" font-family="sans-serif" text-anchor="middle" ${rtl}>${L.per}</text>
    ${rowsSvg}
  </svg>`
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

export function ComplianceSection({ onAddLayer }: ComplianceSectionProps) {
  const [gs1Code, setGs1Code] = useState('')
  const [foodContact, setFoodContact] = useState(false)
  const [fsc, setFsc] = useState(false)
  const [pefc, setPefc] = useState(false)
  const [lang, setLang] = useState('fr')
  const [nutrition, setNutrition] = useState<NutritionData>({
    energie: '1500 / 358', proteines: '7.5', glucides: '68', sucres: '4.2', lipides: '3.1', satures: '0.8', sel: '0.4',
  })
  const [showNutrition, setShowNutrition] = useState(false)

  const gs1Result = gs1Code ? validateGS1(gs1Code) : null

  function addNutritionLabel() {
    const src = makeNutritionSvg(nutrition, lang)
    onAddLayer({ id: `nutr-${Date.now()}`, name: 'Tableau nutritionnel', src, x: 10, y: 10, width: 130, height: 80, scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto' })
  }

  function addRecycleLogo(id: string, label: string) {
    const src = makeRecycleSvg(id, label)
    onAddLayer({ id: `recyc-${Date.now()}`, name: `Logo ${label}`, src, x: 10, y: 10, width: 30, height: 30, scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto' })
  }

  return (
    <CollapsibleSection label="Compliance & Légal">
      {/* #83 GS1 barcode validation */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Validation GS1</div>
        <input
          value={gs1Code}
          onChange={e => setGs1Code(e.target.value)}
          placeholder="EAN-13, ITF-14, UPC-A…"
          style={{ width: '100%', fontSize: fs.md, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '5px 7px', boxSizing: 'border-box', fontFamily: 'inherit', background: c.white }}
        />
        {gs1Result && (
          <div style={{ fontSize: 9, marginTop: 4, color: gs1Result.ok ? '#059669' : '#ef4444', padding: '3px 6px', background: gs1Result.ok ? 'rgba(5,150,105,0.07)' : 'rgba(239,68,68,0.07)', borderRadius: 6 }}>
            {gs1Result.msg}
          </div>
        )}
      </div>

      {/* #84 Recycling logos */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Logos recyclage</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {RECYCLING_LOGOS.filter(l => l.label).map(logo => (
            <button key={logo.id} onClick={() => addRecycleLogo(logo.id, logo.label!)}
              style={{ fontSize: 9, padding: '3px 7px', borderRadius: 8, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: RECYCLE_COLORS[logo.id] ?? c.textMed, fontWeight: 600 }}>
              {logo.name}
            </button>
          ))}
        </div>
      </div>

      {/* #85 Food contact + #86 FSC/PEFC */}
      <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <input type="checkbox" checked={foodContact} onChange={e => setFoodContact(e.target.checked)} style={{ accentColor: '#5A6BD4' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>Contact alimentaire conforme (EU 10/2011)</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <input type="checkbox" checked={fsc} onChange={e => setFsc(e.target.checked)} style={{ accentColor: '#059669' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>FSC® certifié</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <input type="checkbox" checked={pefc} onChange={e => setPefc(e.target.checked)} style={{ accentColor: '#059669' }} />
          <span style={{ fontSize: fs.sm, color: c.textMed }}>PEFC™ certifié</span>
        </label>
        {(foodContact || fsc || pefc) && (
          <div style={{ fontSize: 9, color: '#059669', background: 'rgba(5,150,105,0.07)', borderRadius: 7, padding: '4px 7px' }}>
            {[foodContact && '✓ Contact alimentaire', fsc && '✓ FSC', pefc && '✓ PEFC'].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* #87 Multilingual nutrition label */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Tableau nutritionnel</div>
          <button onClick={() => setShowNutrition(v => !v)}
            style={{ fontSize: 9, padding: '2px 7px', borderRadius: 7, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
            {showNutrition ? '▲ Replier' : '▼ Éditer'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          {(['fr', 'en', 'ar'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ flex: 1, fontSize: 10, padding: '3px 0', borderRadius: 7, border: `1px solid ${lang === l ? '#5A6BD4' : c.borderLight}`, background: lang === l ? 'rgba(90,107,212,0.1)' : c.white, cursor: 'pointer', fontWeight: lang === l ? 700 : 400, color: lang === l ? '#5A6BD4' : c.textMed }}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {showNutrition && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 6px', marginBottom: 8 }}>
            {(Object.keys(nutrition) as (keyof NutritionData)[]).map(key => (
              <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, color: c.textGhost }}>{key}</span>
                <input
                  value={nutrition[key]}
                  onChange={e => setNutrition(prev => ({ ...prev, [key]: e.target.value }))}
                  style={{ fontSize: 10, border: `1px solid ${c.borderLight}`, borderRadius: 5, padding: '3px 5px', fontFamily: 'inherit' }}
                />
              </label>
            ))}
          </div>
        )}

        <button onClick={addNutritionLabel}
          style={{ width: '100%', fontSize: fs.sm, fontWeight: 600, padding: '6px 0', borderRadius: r.md, border: 'none', background: '#5A6BD4', color: '#fff', cursor: 'pointer' }}>
          + Ajouter au patron
        </button>
      </div>
    </CollapsibleSection>
  )
}
