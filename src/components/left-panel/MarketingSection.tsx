'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import type { ImageLayer } from '@/lib/types'

type Tab = 'translate' | 'seasonal' | 'consumer' | 'eyetrack'

const TAB_LABELS: Record<Tab, string> = {
  translate: 'Translate',
  seasonal: 'Seasonal',
  consumer: 'Consumer',
  eyetrack: 'Eye Track',
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

const LANGUAGES = [
  { label: 'Français', code: 'fr' },
  { label: 'English', code: 'en' },
  { label: 'العربية', code: 'ar' },
  { label: 'Español', code: 'es' },
  { label: 'Deutsch', code: 'de' },
  { label: '中文', code: 'zh' },
  { label: '日本語', code: 'ja' },
]

function TranslateTab() {
  const [inputText, setInputText] = useState('')
  const [targetLang, setTargetLang] = useState('fr')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const translate = useCallback(async () => {
    if (!inputText.trim()) return
    setLoading(true)
    setError('')
    setResult('')
    try {
      const res = await fetch('https://libretranslate.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: inputText, source: 'auto', target: targetLang }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setResult(data.translatedText ?? '')
    } catch {
      setError('API non disponible — clé requise')
    } finally {
      setLoading(false)
    }
  }, [inputText, targetLang])

  const copy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #438 — Multi-Language Layer Translate
      </div>
      <div style={{ fontSize: 8, color: c.textMuted, marginBottom: 8 }}>
        LibreTranslate: open-source, auto-detect source language
      </div>
      <FieldLabel>Texte à traduire</FieldLabel>
      <textarea
        value={inputText}
        onChange={e => setInputText(e.target.value)}
        rows={3}
        placeholder="Entrez le texte ici..."
        style={{
          width: '100%', fontSize: fs.md, padding: '4px 6px', border: `1px solid ${c.borderLight}`,
          borderRadius: r.md, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8,
        }}
      />
      <FieldLabel>Langue cible</FieldLabel>
      <select
        value={targetLang}
        onChange={e => setTargetLang(e.target.value)}
        style={{
          width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`,
          borderRadius: r.md, fontFamily: 'inherit', marginBottom: 8,
        }}
      >
        {LANGUAGES.map(l => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
      <button
        onClick={translate}
        disabled={loading || !inputText.trim()}
        style={{
          width: '100%', fontSize: fs.sm, fontWeight: fw.bold, padding: '5px 0', borderRadius: r.md,
          border: 'none', background: c.ink, color: c.white, cursor: loading ? 'wait' : 'pointer',
          opacity: !inputText.trim() ? 0.5 : 1, marginBottom: 8,
        }}
      >
        {loading ? 'Traduction…' : 'Translate via LibreTranslate'}
      </button>
      {error && (
        <div style={{ fontSize: fs.xs, color: c.danger, padding: '4px 6px', background: 'rgba(229,57,53,0.07)', borderRadius: r.sm, marginBottom: 6 }}>
          {error}
        </div>
      )}
      {result && (
        <div style={{ position: 'relative' }}>
          <FieldLabel>Résultat</FieldLabel>
          <div style={{
            fontSize: fs.md, padding: '6px 8px', background: c.surface, borderRadius: r.md,
            border: `1px solid ${c.borderLight}`, minHeight: 50, wordBreak: 'break-word',
          }}>
            {result}
          </div>
          <button
            onClick={copy}
            style={{
              position: 'absolute', top: 22, right: 6, fontSize: 8, padding: '2px 6px',
              borderRadius: r.sm, border: `1px solid ${c.borderLight}`, background: c.white,
              cursor: 'pointer', color: c.textMuted,
            }}
          >
            {copied ? '✓' : 'Copier'}
          </button>
        </div>
      )}
    </div>
  )
}

type Season = 'ramadan' | 'noel' | 'aid' | 'halloween' | 'valentine' | 'ete' | 'hiver'

const SEASONS: Record<Season, { label: string; colors: string[]; symbol: string }> = {
  ramadan:  { label: 'Ramadan',      colors: ['#D4AF37', '#006400', '#1a1a2e'], symbol: '☽' },
  noel:     { label: 'Noël',         colors: ['#CC0000', '#006400', '#FFD700'], symbol: '★' },
  aid:      { label: 'Aïd el-Fitr', colors: ['#D4AF37', '#008000', '#fff5e0'], symbol: '✦' },
  halloween:{ label: 'Halloween',    colors: ['#FF6600', '#800080', '#000000'], symbol: '◈' },
  valentine:{ label: 'Saint-Valentin', colors: ['#FF1744', '#FF69B4', '#ffffff'], symbol: '♥' },
  ete:      { label: 'Été',           colors: ['#FFD700', '#FF8C00', '#87CEEB'], symbol: '☀' },
  hiver:    { label: 'Hiver',         colors: ['#6bb7f0', '#f0f8ff', '#3a7bd5'], symbol: '❄' },
}

function SeasonalTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [season, setSeason] = useState<Season>('ramadan')
  const [baseColor, setBaseColor] = useState('#e8d5b7')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { colors, symbol } = SEASONS[season]
    ctx.clearRect(0, 0, 200, 200)

    const grad = ctx.createLinearGradient(0, 0, 200, 200)
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.5, colors[1])
    grad.addColorStop(1, colors[2] ?? colors[0])
    ctx.fillStyle = grad
    ctx.fillRect(10, 10, 180, 180)

    ctx.fillStyle = baseColor + '55'
    ctx.fillRect(30, 50, 140, 100)
    ctx.strokeStyle = colors[0]
    ctx.lineWidth = 2
    ctx.strokeRect(30, 50, 140, 100)

    ctx.font = 'bold 40px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(symbol, 100, 100)

    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#fff'
    ctx.fillText(SEASONS[season].label.toUpperCase(), 100, 170)
  }, [season, baseColor])

  useEffect(() => { draw() }, [draw])

  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `seasonal_${season}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #439 — Seasonal Variant Generator
      </div>
      <FieldLabel>Couleur de base</FieldLabel>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: r.sm, background: baseColor, border: `1px solid ${c.borderLight}` }} />
        <span style={{ fontSize: fs.xs, color: c.textMuted, fontFamily: 'monospace' }}>{baseColor.toUpperCase()}</span>
        <input type="color" value={baseColor} onChange={e => setBaseColor(e.target.value)} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      </label>
      <FieldLabel>Saison</FieldLabel>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {(Object.keys(SEASONS) as Season[]).map(s => (
          <button key={s} onClick={() => setSeason(s)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
            border: season === s ? 'none' : `1px solid ${c.borderLight}`,
            background: season === s ? SEASONS[s].colors[0] : c.white,
            color: season === s ? c.white : c.textMuted,
          }}>{SEASONS[s].label}</button>
        ))}
      </div>
      <canvas ref={canvasRef} width={200} height={200} style={{ display: 'block', margin: '0 auto', borderRadius: r.lg, border: `1px solid ${c.borderXLight}` }} />
      <button
        onClick={download}
        style={{
          marginTop: 8, width: '100%', fontSize: fs.sm, fontWeight: fw.bold, padding: '4px 0',
          borderRadius: r.md, border: 'none', background: c.ink, color: c.white, cursor: 'pointer',
        }}
      >
        Télécharger PNG
      </button>
    </div>
  )
}

function ConsumerTab() {
  const canvasARef = useRef<HTMLCanvasElement>(null)
  const canvasBRef = useRef<HTMLCanvasElement>(null)
  const [descA, setDescA] = useState('Design A — minimal, fond blanc')
  const [descB, setDescB] = useState('Design B — coloré, fond rouge')
  const [prefA, setPrefA] = useState(55)

  const drawHeatmap = useCallback((canvas: HTMLCanvasElement | null, seed: number) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 150, 200)

    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, 150, 200)
    ctx.strokeStyle = '#ccc'
    ctx.strokeRect(0, 0, 150, 200)

    const hotspots = [
      { x: 75, y: 100, r: 50, alpha: 0.4 },
      { x: 75 + (seed % 20) - 10, y: 70 + (seed % 15), r: 30, alpha: 0.3 },
      { x: 30 + (seed % 10), y: 160, r: 15, alpha: 0.1 },
      { x: 120 - (seed % 10), y: 160, r: 12, alpha: 0.08 },
    ]

    hotspots.forEach(({ x, y, r: radius, alpha }) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
      grad.addColorStop(0, `rgba(255,50,0,${alpha})`)
      grad.addColorStop(0.5, `rgba(255,200,0,${alpha * 0.5})`)
      grad.addColorStop(1, 'rgba(0,0,255,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
    })

    ctx.fillStyle = '#e91e8c'
    ctx.beginPath()
    ctx.arc(hotspots[1].x, hotspots[1].y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = c.white
    ctx.font = 'bold 7px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('1', hotspots[1].x, hotspots[1].y)
  }, [])

  const simulate = useCallback(() => {
    const pref = 40 + Math.floor(Math.random() * 30)
    setPrefA(pref)
    drawHeatmap(canvasARef.current, Math.floor(Math.random() * 100))
    drawHeatmap(canvasBRef.current, Math.floor(Math.random() * 100) + 50)
  }, [drawHeatmap])

  useEffect(() => {
    drawHeatmap(canvasARef.current, 42)
    drawHeatmap(canvasBRef.current, 87)
  }, [drawHeatmap])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #481 — Consumer Panel Simulator
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Design A</FieldLabel>
          <input value={descA} onChange={e => setDescA(e.target.value)}
            style={{ width: '100%', fontSize: fs.xs, padding: '2px 5px', border: `1px solid ${c.borderLight}`, borderRadius: r.sm, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 4 }} />
          <canvas ref={canvasARef} width={150} height={200} style={{ display: 'block', borderRadius: r.sm, border: `1px solid ${c.borderLight}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Design B</FieldLabel>
          <input value={descB} onChange={e => setDescB(e.target.value)}
            style={{ width: '100%', fontSize: fs.xs, padding: '2px 5px', border: `1px solid ${c.borderLight}`, borderRadius: r.sm, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 4 }} />
          <canvas ref={canvasBRef} width={150} height={200} style={{ display: 'block', borderRadius: r.sm, border: `1px solid ${c.borderLight}` }} />
        </div>
      </div>
      <button
        onClick={simulate}
        style={{
          width: '100%', fontSize: fs.sm, fontWeight: fw.bold, padding: '5px 0', borderRadius: r.md,
          border: 'none', background: c.ink, color: c.white, cursor: 'pointer', marginBottom: 10,
        }}
      >
        Simuler 200 consommateurs
      </button>
      <div style={{ background: c.surface, borderRadius: r.md, padding: '8px 10px', border: `1px solid ${c.borderXLight}` }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6 }}>Préférence panel simulé</div>
        <div style={{ display: 'flex', height: 14, borderRadius: r.sm, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: prefA, background: '#4488ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: c.white, fontWeight: fw.bold }}>{prefA}%</span>
          </div>
          <div style={{ flex: 100 - prefA, background: '#e91e8c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 8, color: c.white, fontWeight: fw.bold }}>{100 - prefA}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 8, color: '#4488ff', fontWeight: fw.bold }}>A — {prefA}%</span>
          <span style={{ fontSize: 8, color: '#e91e8c', fontWeight: fw.bold }}>B — {100 - prefA}%</span>
        </div>
        <div style={{ fontSize: 8, color: c.textMuted, marginTop: 4 }}>
          ● Premier point de fixation: centre (marqueur rose)
        </div>
      </div>
    </div>
  )
}

function EyeTrackTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [opacity, setOpacity] = useState(0.7)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = 300
    const H = 200

    const renderHeatmap = () => {
      const gridW = 32
      const gridH = 22
      const cellW = W / gridW
      const cellH = H / gridH

      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const nx = gx / gridW
          const ny = gy / gridH
          const dx = nx - 0.5
          const dy = ny - 0.5
          const centerBias = Math.exp(-(dx * dx + dy * dy) * 8) * 2
          const noise = (Math.sin(gx * 3.7 + gy * 2.3) * 0.5 + 0.5) * 0.2
          const val = Math.min(1, centerBias * 0.7 + noise)

          const r2 = Math.round(val < 0.5 ? 0 : (val - 0.5) * 2 * 255)
          const g2 = Math.round(val < 0.5 ? val * 2 * 255 : (1 - (val - 0.5) * 2) * 255)
          const b2 = Math.round(val < 0.5 ? (1 - val * 2) * 255 : 0)
          ctx.fillStyle = `rgba(${r2},${g2},${b2},${opacity})`
          ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1)
        }
      }
    }

    const src = imageLayers[0]?.src
    if (src) {
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, W, H)
        ctx.drawImage(img, 0, 0, W, H)
        renderHeatmap()
      }
      img.src = src
    } else {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#e0e0e0'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = c.textMuted
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Démo synthétique — aucune image', W / 2, H / 2 - 10)
      ctx.fillText('importée', W / 2, H / 2 + 6)
      renderHeatmap()
    }
  }, [imageLayers, opacity])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        #482 — Eye Tracking Heatmap (GBVS simplifié)
      </div>
      <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <div>
        <FieldLabel>Opacité heatmap: {Math.round(opacity * 100)}%</FieldLabel>
        <input
          type="range" min={0} max={1} step={0.05} value={opacity}
          onChange={e => setOpacity(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#e91e8c', height: 3 }}
        />
      </div>
      <div style={{ fontSize: 8, color: c.textMuted, marginTop: 8 }}>
        Bleu = faible saillance · Rouge = haute saillance. Biais centre ×2 (GBVS).
      </div>
    </div>
  )
}

export function MarketingSection({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const [tab, setTab] = useState<Tab>('translate')
  return (
    <CollapsibleSection label="Marketing & Consumer">
      <TabPills active={tab} onChange={setTab} />
      {tab === 'translate' && <TranslateTab />}
      {tab === 'seasonal' && <SeasonalTab />}
      {tab === 'consumer' && <ConsumerTab />}
      {tab === 'eyetrack' && <EyeTrackTab imageLayers={imageLayers} />}
    </CollapsibleSection>
  )
}
