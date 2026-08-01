'use client'

import { useState, useCallback } from 'react'
import type { BoxParams } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

// ── #433-436 : Branding ────────────────────────────────────────────────────────

type BrandTab = 'consistency' | 'diereuse' | 'psychology' | 'cultural'

const TAB_LABELS: { id: BrandTab; label: string }[] = [
  { id: 'consistency', label: 'Cohérence' },
  { id: 'diereuse',    label: 'Réutilisation' },
  { id: 'psychology',  label: 'Psychologie' },
  { id: 'cultural',    label: 'Culturel' },
]

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #d0d0d0', borderRadius: 4,
  padding: '5px 8px', fontSize: 11, outline: 'none',
  boxSizing: 'border-box', background: '#fff', color: '#333',
}
const btnPrimary: React.CSSProperties = {
  width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
  borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '').padEnd(6, '0')
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  }
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
  else if (max === gn) h = ((bn - rn) / d + 2) / 6
  else h = ((rn - gn) / d + 4) / 6
  return { h: h * 360, s, l }
}

function deltaE(hex1: string, hex2: string): number {
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex1)
  const { r: r2, g: g2, b: b2 } = hexToRgb(hex2)
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2) / 441 * 100
}

// ── #433 ConsistencyTab ────────────────────────────────────────────────────────

const FONT_CATEGORIES: Record<string, string> = {
  'arial': 'sans-serif', 'helvetica': 'sans-serif', 'roboto': 'sans-serif', 'inter': 'sans-serif',
  'times': 'serif', 'georgia': 'serif', 'garamond': 'serif', 'palatino': 'serif',
  'comic sans': 'informal', 'papyrus': 'informal', 'impact': 'display',
  'futura': 'geometric', 'gill sans': 'humanist',
  'courier': 'monospace', 'monaco': 'monospace',
}

function getCategory(fontName: string): string {
  const lower = fontName.toLowerCase().trim()
  for (const [k, v] of Object.entries(FONT_CATEGORIES)) {
    if (lower.includes(k)) return v
  }
  return 'unknown'
}

function ConsistencyTab() {
  const [colors, setColors] = useState(['#d32f2f', '#1565c0', '#f57f17', '#2e7d32'])
  const [font1, setFont1] = useState('Arial')
  const [font2, setFont2] = useState('Helvetica')
  const [results, setResults] = useState<{ i: number; j: number; de: number }[] | null>(null)

  const handleCheck = useCallback(() => {
    const pairs: { i: number; j: number; de: number }[] = []
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        pairs.push({ i, j, de: deltaE(colors[i], colors[j]) })
      }
    }
    setResults(pairs)
  }, [colors])

  const avgDE = results ? results.reduce((s, p) => s + p.de, 0) / results.length : 0
  const grade = !results ? null : avgDE < 10 ? 'A' : avgDE < 20 ? 'B' : avgDE < 30 ? 'C' : 'D'
  const gradeColor = grade === 'A' ? '#2e7d32' : grade === 'B' ? '#558b2f' : grade === 'C' ? '#f57c00' : '#d32f2f'

  const cat1 = getCategory(font1), cat2 = getCategory(font2)
  const fontsConsistent = cat1 !== 'unknown' && cat2 !== 'unknown' && cat1 === cat2
  const fontMsg = cat1 === 'unknown' || cat2 === 'unknown'
    ? { text: 'Police inconnue — vérification manuelle', color: '#888' }
    : fontsConsistent
      ? { text: `Cohérent — même catégorie (${cat1})`, color: '#2e7d32' }
      : { text: `Incohérent — ${cat1} vs ${cat2}`, color: '#d32f2f' }

  return (
    <div>
      <FieldLabel>COULEURS BRAND (4 max)</FieldLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {colors.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: c, border: '1px solid #d0d0d0', flexShrink: 0 }} />
            <input type="color" value={c} onChange={e => {
              const next = [...colors]; next[i] = e.target.value; setColors(next)
            }} style={{ ...inputStyle, height: 30, padding: 2, flex: 1 }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        <div>
          <FieldLabel>POLICE 1</FieldLabel>
          <input value={font1} onChange={e => setFont1(e.target.value)} style={inputStyle} placeholder="Arial" />
        </div>
        <div>
          <FieldLabel>POLICE 2</FieldLabel>
          <input value={font2} onChange={e => setFont2(e.target.value)} style={inputStyle} placeholder="Helvetica" />
        </div>
      </div>

      <div style={{ padding: '5px 10px', borderRadius: 4, marginBottom: 10, background: fontsConsistent ? '#e8f5e9' : '#fdecea' }}>
        <span style={{ fontSize: 10, color: fontMsg.color }}>{fontMsg.text}</span>
      </div>

      <button onClick={handleCheck} style={btnPrimary}>Analyser cohérence</button>

      {results && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: gradeColor }}>{grade}</div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#444' }}>Note cohérence</div>
              <div style={{ fontSize: 9, color: '#888' }}>ΔE moy. {avgDE.toFixed(1)} (A&lt;10, B&lt;20, C&lt;30, D≥30)</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {colors.map((c, i) => (
              <div key={i} style={{ flex: 1, height: 28, borderRadius: 4, background: c, border: '1px solid #ddd' }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {results.map(p => (
              <div key={`${p.i}-${p.j}`} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                borderRadius: 4, background: p.de > 25 ? '#fdecea' : '#f5f5f5',
                border: `1px solid ${p.de > 25 ? '#ffcdd2' : '#e8e8e8'}`,
              }}>
                <div style={{ width: 14, height: 14, borderRadius: 2, background: colors[p.i], border: '1px solid #ccc', flexShrink: 0 }} />
                <div style={{ width: 14, height: 14, borderRadius: 2, background: colors[p.j], border: '1px solid #ccc', flexShrink: 0 }} />
                <span style={{ fontSize: 10, flex: 1 }}>Paire {p.i + 1}–{p.j + 1}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: p.de > 25 ? '#d32f2f' : '#2e7d32' }}>
                  ΔE {p.de.toFixed(1)}{p.de > 25 ? ' ⚠' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── #434 DieReuseTab ───────────────────────────────────────────────────────────

interface DieSize { w: number; h: number; d: number }

const FEFCO_DIES: DieSize[] = [
  { w: 100, h: 100, d: 50 },
  { w: 150, h: 200, d: 100 },
  { w: 200, h: 300, d: 150 },
  { w: 250, h: 350, d: 175 },
  { w: 300, h: 400, d: 200 },
  { w: 120, h: 180, d: 80 },
  { w: 80,  h: 120, d: 40 },
  { w: 200, h: 200, d: 100 },
  { w: 160, h: 240, d: 80 },
  { w: 350, h: 500, d: 250 },
  { w: 400, h: 600, d: 200 },
  { w: 180, h: 270, d: 90 },
]

function dieDist(a: DieSize, b: DieSize): number {
  return Math.sqrt((a.w - b.w) ** 2 + (a.h - b.h) ** 2 + (a.d - b.d) ** 2)
}

function DieReuseTab({ params }: { params: BoxParams }) {
  const target: DieSize = { w: params.width, h: params.height, d: params.depth }

  const matches = FEFCO_DIES
    .map(die => ({ die, dist: dieDist(target, die) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)

  const NEW_DIE_COST = 2500

  return (
    <div>
      <div style={{ marginBottom: 10, padding: '8px 10px', background: '#f5f5f5', borderRadius: 6 }}>
        <div style={{ fontSize: 10, color: '#555', fontWeight: 600, marginBottom: 4 }}>BOITE COURANTE</div>
        <div style={{ fontSize: 11, color: '#222' }}>
          {params.width} × {params.height} × {params.depth} mm
        </div>
      </div>

      <FieldLabel>3 DÉCOUPES FEFCO COMPATIBLES</FieldLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {matches.map((m, idx) => {
          const savings = idx === 0 && m.dist < 10 ? NEW_DIE_COST : Math.round(NEW_DIE_COST * Math.max(0, 1 - m.dist / 500))
          const isExact = m.dist < 1
          return (
            <div key={idx} style={{
              border: idx === 0 ? '2px solid #1a1a1a' : '1px solid #d0d0d0',
              borderRadius: 6, padding: '8px 10px',
              background: idx === 0 ? '#fafafa' : '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: idx === 0 ? '#1a1a1a' : '#555' }}>
                  {idx === 0 ? 'Meilleur match' : `Option ${idx + 1}`}
                  {isExact && <span style={{ marginLeft: 6, color: '#2e7d32', fontSize: 9 }}>EXACT</span>}
                </span>
                <span style={{ fontSize: 9, color: '#888' }}>Δ {m.dist.toFixed(1)} mm</span>
              </div>
              <div style={{ fontSize: 11, color: '#333', marginBottom: 3 }}>
                {m.die.w} × {m.die.h} × {m.die.d} mm
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9 }}>
                <span style={{ color: m.dist < 10 ? '#2e7d32' : '#f57c00', fontWeight: 600 }}>
                  Économie ≈ {savings.toLocaleString('fr-FR')} €
                </span>
                <span style={{ color: '#aaa' }}>Réutilisation : {m.dist < 10 ? '0 €' : 'partielle'}</span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 9, color: '#aaa', marginTop: 8 }}>
        Nouvelle découpe = {NEW_DIE_COST.toLocaleString('fr-FR')} € · Réutilisation = 0 €
      </div>
    </div>
  )
}

// ── #435 PsychologyTab ─────────────────────────────────────────────────────────

interface ColorMeaning {
  name: string
  emotions: string[]
  industries: string[]
  satNote: string
  lightNote: string
}

function getColorMeaning(h: number, s: number, l: number): ColorMeaning {
  let name: string, emotions: string[], industries: string[]

  if (h < 30 || h >= 330) {
    name = 'Rouge'
    emotions = ['Énergie', 'Passion', 'Urgence', 'Danger']
    industries = ['Alimentation', 'Promotion', 'Sport', 'Luxe']
  } else if (h < 60) {
    name = 'Orange'
    emotions = ['Créativité', 'Chaleur', 'Enthousiasme', 'Convivialité']
    industries = ['Alimentation', 'Loisirs', 'Tech', 'Jeunesse']
  } else if (h < 90) {
    name = 'Jaune'
    emotions = ['Optimisme', 'Attention', 'Clarté', 'Bonheur']
    industries = ['Enfants', 'Alimentation', 'Transport', 'Promotion']
  } else if (h < 150) {
    name = 'Vert'
    emotions = ['Nature', 'Confiance', 'Calme', 'Santé']
    industries = ['Bio', 'Santé', 'Finance', 'Environnement']
  } else if (h < 210) {
    name = 'Cyan'
    emotions = ['Propreté', 'Technologie', 'Fraîcheur', 'Clarté']
    industries = ['Tech', 'Santé', 'Cosmétique', 'Eau']
  } else if (h < 270) {
    name = 'Bleu'
    emotions = ['Confiance', 'Professionnalisme', 'Sérénité', 'Fiabilité']
    industries = ['Finance', 'Tech', 'Pharmaceutique', 'Corporate']
  } else if (h < 330) {
    name = 'Violet'
    emotions = ['Luxe', 'Créativité', 'Mystère', 'Spiritualité']
    industries = ['Luxe', 'Beauté', 'Spirituel', 'Premium']
  } else {
    name = 'Rose'
    emotions = ['Féminité', 'Fun', 'Douceur', 'Romance']
    industries = ['Beauté', 'Enfants', 'Mode', 'Santé femme']
  }

  const satNote = s > 0.6 ? 'Haute saturation → Impact fort, visible' : s > 0.3 ? 'Saturation moyenne → Équilibré' : 'Saturation basse → Sophistiqué, subtil'
  const lightNote = l > 0.65 ? 'Clair → Jeune, accessible, léger' : l < 0.35 ? 'Foncé → Premium, sérieux, luxe' : 'Neutre → Polyvalent'

  return { name, emotions, industries, satNote, lightNote }
}

function PsychologyTab() {
  const [color, setColor] = useState('#1565c0')

  const { r, g, b } = hexToRgb(color)
  const { h, s, l } = rgbToHsl(r, g, b)
  const meaning = getColorMeaning(h, s, l)

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>COULEUR DOMINANTE</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 8, background: color, border: '1px solid #d0d0d0', flexShrink: 0 }} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ ...inputStyle, height: 48, padding: 2 }} />
        </div>
      </div>

      <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e0e0e0', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{meaning.name}</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {meaning.emotions.map(e => (
            <span key={e} style={{
              padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600,
              background: color, color: l > 0.55 ? '#222' : '#fff',
            }}>{e}</span>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{meaning.satNote}</div>
        <div style={{ fontSize: 10, color: '#555', marginBottom: 8 }}>{meaning.lightNote}</div>
        <div>
          <div style={{ fontSize: 9, color: '#aaa', fontWeight: 600, letterSpacing: 0.8, marginBottom: 4 }}>RECOMMANDÉ POUR</div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {meaning.industries.map(ind => (
              <span key={ind} style={{
                padding: '2px 7px', borderRadius: 4, fontSize: 9,
                background: '#f0f0f0', color: '#444', border: '1px solid #e0e0e0',
              }}>{ind}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 9 }}>
        <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '4px 6px' }}>
          <div style={{ color: '#aaa', fontWeight: 600, marginBottom: 2 }}>HUE</div>
          <div style={{ color: '#333' }}>{h.toFixed(0)}°</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '4px 6px' }}>
          <div style={{ color: '#aaa', fontWeight: 600, marginBottom: 2 }}>SAT</div>
          <div style={{ color: '#333' }}>{(s * 100).toFixed(0)}%</div>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '4px 6px' }}>
          <div style={{ color: '#aaa', fontWeight: 600, marginBottom: 2 }}>LUM</div>
          <div style={{ color: '#333' }}>{(l * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  )
}

// ── #436 CulturalTab ───────────────────────────────────────────────────────────

type Market = 'France' | 'USA' | 'China' | 'Japan' | 'MiddleEast' | 'India' | 'Brazil' | 'Germany'

interface CulturalRule {
  colors: { color: string; meaning: string; negative?: boolean }[]
}

const CULTURAL_RULES: Record<Market, CulturalRule> = {
  China:      { colors: [{ color: 'red',    meaning: 'Chance / Prospérité' }, { color: 'white', meaning: 'Deuil / Mort', negative: true }, { color: 'yellow', meaning: 'Royal / Impérial' }] },
  Japan:      { colors: [{ color: 'white',  meaning: 'Pureté / Mort', negative: true }, { color: 'red', meaning: 'Danger / Passion', negative: true }, { color: 'black', meaning: 'Mystère / Élégance' }] },
  MiddleEast: { colors: [{ color: 'green',  meaning: 'Islam / Sacré' }, { color: 'white', meaning: 'Paix / Pureté' }, { color: 'black', meaning: 'Deuil', negative: true }] },
  India:      { colors: [{ color: 'white',  meaning: 'Deuil / Veuvage', negative: true }, { color: 'red', meaning: 'Fertilité / Amour' }, { color: 'saffron', meaning: 'Sacré / Courage' }] },
  Brazil:     { colors: [{ color: 'green',  meaning: 'National / Espoir' }, { color: 'yellow', meaning: 'National / Richesse' }, { color: 'purple', meaning: 'Deuil', negative: true }] },
  France:     { colors: [{ color: 'blue',   meaning: 'Officiel / Liberté' }, { color: 'red', meaning: 'Passion / Danger' }, { color: 'white', meaning: 'Pureté / Paix' }] },
  USA:        { colors: [{ color: 'red',    meaning: 'Énergie / Urgence' }, { color: 'blue', meaning: 'Confiance / Patriotisme' }, { color: 'white', meaning: 'Pureté' }] },
  Germany:    { colors: [{ color: 'black',  meaning: 'National (+ rouge/or)' }, { color: 'red', meaning: 'National / Passion' }, { color: 'gold', meaning: 'National / Prestige' }] },
}

const MARKET_LABELS: { id: Market; flag: string }[] = [
  { id: 'France',     flag: '🇫🇷' },
  { id: 'USA',        flag: '🇺🇸' },
  { id: 'China',      flag: '🇨🇳' },
  { id: 'Japan',      flag: '🇯🇵' },
  { id: 'MiddleEast', flag: '🕌' },
  { id: 'India',      flag: '🇮🇳' },
  { id: 'Brazil',     flag: '🇧🇷' },
  { id: 'Germany',    flag: '🇩🇪' },
]

const COLOR_NAME_MAP: Record<string, string[]> = {
  red:     ['#ff', '#e0', '#cc', '#d3', '#c6', '#b7'],
  white:   ['#ff', '#f5', '#fa'],
  yellow:  ['#ff', '#f9', '#fb', '#fc'],
  green:   ['#00', '#0a', '#2e', '#38', '#4c', '#1b'],
  black:   ['#00', '#11', '#1a', '#22'],
  blue:    ['#00', '#01', '#15', '#1e', '#0d'],
  purple:  ['#9c', '#6a', '#7b', '#4a', '#8e'],
  saffron: ['#ff', '#f4', '#e8'],
  gold:    ['#ff', '#fd', '#cc'],
}

function detectColorName(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const { h, s, l } = rgbToHsl(r, g, b)
  if (l > 0.9 && s < 0.15) return 'white'
  if (l < 0.15) return 'black'
  if (s < 0.15) return 'gray'
  if (h < 15 || h >= 345) return 'red'
  if (h < 40) return 'orange'
  if (h < 70) { return l > 0.6 ? 'yellow' : 'gold' }
  if (h < 160) return 'green'
  if (h < 200) return 'cyan'
  if (h < 265) return 'blue'
  if (h < 320) return 'purple'
  return 'red'
}

function CulturalTab() {
  const [color, setColor] = useState('#d32f2f')
  const [selectedMarkets, setSelectedMarkets] = useState<Market[]>(['France', 'China', 'Japan'])

  const colorName = detectColorName(color)

  const toggleMarket = (m: Market) => {
    setSelectedMarkets(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>COULEUR À ANALYSER</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: color, border: '1px solid #d0d0d0', flexShrink: 0 }} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ ...inputStyle, height: 36, padding: 2 }} />
          <span style={{ fontSize: 10, color: '#888', fontStyle: 'italic', whiteSpace: 'nowrap' }}>≈ {colorName}</span>
        </div>
      </div>

      <FieldLabel>MARCHÉS</FieldLabel>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {MARKET_LABELS.map(m => (
          <button key={m.id} onClick={() => toggleMarket(m.id)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
            border: selectedMarkets.includes(m.id) ? 'none' : '1px solid #d0d0d0',
            background: selectedMarkets.includes(m.id) ? '#1a1a1a' : '#f5f5f5',
            color: selectedMarkets.includes(m.id) ? '#fff' : '#555',
            cursor: 'pointer',
          }}>{m.flag} {m.id}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {selectedMarkets.map(market => {
          const rules = CULTURAL_RULES[market]
          const relevantRules = rules.colors.filter(rule => rule.color === colorName || rule.color.includes(colorName.slice(0, 3)))
          const hasNegative = relevantRules.some(r => r.negative)
          const hasPositive = relevantRules.some(r => !r.negative)

          return (
            <div key={market} style={{
              border: hasNegative ? '1px solid #ffcdd2' : hasPositive ? '1px solid #c8e6c9' : '1px solid #e0e0e0',
              borderRadius: 6, padding: '8px 10px',
              background: hasNegative ? '#fff8f8' : hasPositive ? '#f8fff8' : '#fafafa',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1a1a1a' }}>
                  {MARKET_LABELS.find(m => m.id === market)?.flag} {market}
                </span>
                {hasNegative && <span style={{ fontSize: 10, color: '#d32f2f', fontWeight: 700 }}>⚠ Attention</span>}
                {hasPositive && !hasNegative && <span style={{ fontSize: 10, color: '#2e7d32', fontWeight: 700 }}>✓ Positif</span>}
              </div>
              {rules.colors.map((rule, i) => {
                const isRelevant = rule.color === colorName || rule.color.includes(colorName.slice(0, 3))
                return (
                  <div key={i} style={{
                    fontSize: 10, color: isRelevant ? (rule.negative ? '#d32f2f' : '#2e7d32') : '#aaa',
                    padding: '2px 0',
                    fontWeight: isRelevant ? 600 : 400,
                  }}>
                    {rule.color.charAt(0).toUpperCase() + rule.color.slice(1)}: {rule.meaning}
                    {isRelevant && rule.negative && ' ⚠'}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {selectedMarkets.length === 0 && (
        <div style={{ fontSize: 10, color: '#aaa', textAlign: 'center', padding: '16px 0' }}>
          Sélectionnez des marchés à analyser
        </div>
      )}
    </div>
  )
}

// ── Main section ───────────────────────────────────────────────────────────────

export function BrandingSection({ params }: { params: BoxParams }) {
  const [tab, setTab] = useState<BrandTab>('consistency')

  return (
    <CollapsibleSection label="BRANDING & IDENTITÉ">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
        
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {TAB_LABELS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600,
            border: tab === t.id ? 'none' : '1px solid #d0d0d0',
            background: tab === t.id ? '#1a1a1a' : '#f5f5f5',
            color: tab === t.id ? '#fff' : '#555',
            cursor: 'pointer', letterSpacing: 0.4,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'consistency' && <ConsistencyTab />}
      {tab === 'diereuse'    && <DieReuseTab params={params} />}
      {tab === 'psychology'  && <PsychologyTab />}
      {tab === 'cultural'    && <CulturalTab />}
    </CollapsibleSection>
  )
}
