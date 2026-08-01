'use client'

// #88 Layout AI image generation (existing)
// #89 Color palette from logo
// #92 Box type AI suggestion
// #93 Design error detection

import { useState, useRef } from 'react'
import type { ImageLayer, BoxParams, TemplateType } from '@/lib/types'
import { c, fs, r } from '@/lib/tokens'
import { SectionLabel, CollapsibleSection } from './ui'
import { computeDieline } from '@/lib/dieline'

const STYLES = [
  { key: 'minimalist', label: 'Minimaliste' },
  { key: 'luxury',     label: 'Luxe' },
  { key: 'bold',       label: 'Graphique' },
  { key: 'vintage',    label: 'Vintage' },
  { key: 'eco',        label: 'Éco' },
  { key: 'playful',    label: 'Coloré' },
]

// Face targets with their dimension formula (from BoxParams)
type FaceTarget = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
const FACE_TARGETS: { key: FaceTarget; label: string }[] = [
  { key: 'front',  label: 'Avant' },
  { key: 'back',   label: 'Arrière' },
  { key: 'left',   label: 'Gauche' },
  { key: 'right',  label: 'Droite' },
  { key: 'top',    label: 'Dessus' },
  { key: 'bottom', label: 'Dessous' },
]

const MM_TO_PX = 3.7795275591

function getFaceDimsMm(face: FaceTarget, params: BoxParams): { w: number; h: number } {
  switch (face) {
    case 'front':
    case 'back':   return { w: params.width,  h: params.height }
    case 'left':
    case 'right':  return { w: params.depth,  h: params.height }
    case 'top':
    case 'bottom': return { w: params.width,  h: params.depth }
  }
}

interface AIDesignSectionProps {
  onAddImageLayer: (layer: ImageLayer) => void
  params?: BoxParams
  activeTemplate?: TemplateType
  onTemplateChange?: (t: TemplateType) => void
}

export function AIDesignSection({ onAddImageLayer, params, activeTemplate, onTemplateChange }: AIDesignSectionProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('')
  const [selectedFace, setSelectedFace] = useState<FaceTarget>('front')
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [palette, setPalette] = useState<string[]>([])
  const [boxSuggestion, setBoxSuggestion] = useState<string | null>(null)
  const [aiErrors, setAiErrors] = useState<string[]>([])

  // Compute face dimensions from current params
  const faceDims = params ? getFaceDimsMm(selectedFace, params) : null

  async function generate() {
    if (!prompt.trim() || isGenerating) return
    setIsGenerating(true)
    setError(null)
    setPreview(null)

    try {
      const faceLabel = FACE_TARGETS.find(f => f.key === selectedFace)?.label ?? selectedFace
      const res = await fetch('/api/ai-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, style,
          faceW: faceDims?.w,
          faceH: faceDims?.h,
          faceName: faceLabel,
        }),
      })
      const data = await res.json() as { imageUrl?: string; provider?: string; error?: string }
      if (!res.ok || !data.imageUrl) throw new Error(data.error || 'Génération échouée')
      setPreview(data.imageUrl)
      setProvider(data.provider ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setIsGenerating(false)
    }
  }

  // #89 — Extract dominant colors from logo via canvas
  function extractPalette(file: File) {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 80; canvas.height = 80
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, 80, 80)
      const data = ctx.getImageData(0, 0, 80, 80).data
      const buckets: Record<string, number> = {}
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 40) continue
        const r2 = Math.round(data[i] / 32) * 32
        const g2 = Math.round(data[i + 1] / 32) * 32
        const b2 = Math.round(data[i + 2] / 32) * 32
        if (r2 > 240 && g2 > 240 && b2 > 240) continue
        const key = `${r2},${g2},${b2}`
        buckets[key] = (buckets[key] ?? 0) + 1
      }
      const top = Object.entries(buckets)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => {
          const [rv, gv, bv] = k.split(',').map(Number)
          return '#' + [rv, gv, bv].map(n => n.toString(16).padStart(2, '0')).join('')
        })
      setPalette(top)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  // #92 — Suggest box type based on dimensions
  function suggestBoxType() {
    if (!params) return
    const { width: w, height: h, depth: d } = params
    const ratio = h / Math.min(w, d)
    if (ratio > 3) setBoxSuggestion('Boîte tube — ratio H/base élevé idéal pour savons, tubes')
    else if (d < w * 0.25) setBoxSuggestion('Boîte plateau — faible profondeur, idéale pour chocolats, bijoux')
    else if (w > 200 && d > 150) setBoxSuggestion('Boîte expédition — grandes dimensions, préférer mailer box ou RSC')
    else if (w < 60 && h < 80) setBoxSuggestion('Petite boîte — idéale pour cosmétiques, médicaments')
    else setBoxSuggestion('Boîte standard — convient pour packaging général')
  }

  // #93 — Detect common design errors
  function detectErrors() {
    const errors: string[] = []
    if (!params) return setAiErrors(['Dimensions non disponibles'])
    if (params.bleed < 3) errors.push('Fond perdu insuffisant (< 3mm)')
    if (params.glueTab < 8) errors.push('Languette de colle trop étroite (< 8mm)')
    if (params.height / Math.min(params.width, params.depth) > 5) errors.push('Proportions extrêmes — boîte instable')
    if (!prompt && !preview) errors.push('Aucun artwork chargé — le patron est vide')
    if (errors.length === 0) errors.push('Aucune erreur de design détectée ✓')
    setAiErrors(errors)
  }

  function addToCanvas() {
    if (!preview) return
    const img = new Image()
    img.onload = () => {
      // Find the target panel position on the 2D dieline using computeDieline
      let x = 0, y = 0, width = faceDims?.w ?? 100, height = faceDims?.h ?? 100

      if (params) {
        const dieline = computeDieline(params, activeTemplate ?? 'box')
        const FACE_LABEL_MAP: Record<FaceTarget, string> = {
          front: 'Front', back: 'Back', left: 'Left', right: 'Right',
          top: 'Top', bottom: 'Bottom',
        }
        const targetLabel = FACE_LABEL_MAP[selectedFace]
        const panel = dieline.panels.find(p =>
          p.label === targetLabel || p.label.toLowerCase() === selectedFace
        )
        if (panel) {
          // Convert SVG px → mm for ImageLayer coordinates
          x = panel.x / MM_TO_PX
          y = panel.y / MM_TO_PX
          width  = panel.w / MM_TO_PX
          height = panel.h / MM_TO_PX
        } else if (faceDims) {
          // Fallback: place at top-left of dieline with correct face size
          width = faceDims.w
          height = faceDims.h
        }
      }

      onAddImageLayer({
        id: `ai-${Date.now()}`,
        name: `IA·${selectedFace}: ${prompt.slice(0, 25)}`,
        src: preview,
        x, y, width, height,
        scale: 1, rotation: 0,
        visible: true, locked: false,
        naturalWidth: img.naturalWidth,
        faceAssignment: selectedFace,
      })
    }
    img.src = preview
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <SectionLabel>IA Design</SectionLabel>

      {/* #89 Color palette from logo */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Palette depuis logo</div>
        <button onClick={() => logoInputRef.current?.click()}
          style={{ width: '100%', fontSize: fs.sm, padding: '5px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
          ↑ Analyser logo
        </button>
        <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { extractPalette(f); e.target.value = '' } }} />
        {palette.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
            {palette.map(col => (
              <div key={col} title={col} style={{ flex: 1, height: 24, borderRadius: 6, background: col, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer' }}
                onClick={() => navigator.clipboard?.writeText(col)} />
            ))}
          </div>
        )}
      </div>

      {/* #92 Box type suggestion */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={suggestBoxType}
            style={{ flex: 1, fontSize: fs.sm, padding: '5px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor" style={{ marginRight: 4 }}><path d="M6 0 6.8 5.2 12 6 6.8 6.8 6 12 5.2 6.8 0 6 5.2 5.2z"/></svg>
            Suggérer type boîte
          </button>
          <button onClick={detectErrors}
            style={{ flex: 1, fontSize: fs.sm, padding: '5px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" style={{ marginRight: 4 }}><path d="M6 1v10M1 6h10"/><circle cx="6" cy="6" r="4.5"/></svg>
            Détecter erreurs
          </button>
        </div>
        {boxSuggestion && (
          <div style={{ fontSize: 9, color: '#5A6BD4', marginTop: 5, padding: '4px 7px', background: 'rgba(90,107,212,0.07)', borderRadius: 7 }}>
            {boxSuggestion}
          </div>
        )}
        {aiErrors.length > 0 && (
          <div style={{ marginTop: 5, padding: '4px 7px', background: 'rgba(245,158,11,0.07)', borderRadius: 7 }}>
            {aiErrors.map((e, i) => (
              <div key={i} style={{ fontSize: 9, color: e.includes('✓') ? '#059669' : '#b45309' }}>{e.includes('✓') ? e : `⚠ ${e}`}</div>
            ))}
          </div>
        )}
      </div>

      {/* Face target selector */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
          Face cible
          {faceDims && <span style={{ fontWeight: 400, marginLeft: 6, color: '#5A6BD4' }}>{faceDims.w}×{faceDims.h}mm</span>}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {FACE_TARGETS.map(f => (
            <button key={f.key} onClick={() => setSelectedFace(f.key)}
              style={{
                padding: '2px 7px', borderRadius: 8, fontSize: 9, cursor: 'pointer',
                border: `1px solid ${selectedFace === f.key ? '#5A6BD4' : c.borderLight}`,
                background: selectedFace === f.key ? 'rgba(90,107,212,0.10)' : 'none',
                color: selectedFace === f.key ? '#5A6BD4' : c.textMed,
                fontWeight: selectedFace === f.key ? 700 : 400,
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {STYLES.map(s => (
          <button key={s.key} onClick={() => setStyle(prev => prev === s.key ? '' : s.key)}
            style={{
              padding: '2px 8px', borderRadius: 10, fontSize: 10, cursor: 'pointer',
              border: `1px solid ${style === s.key ? '#e91e8c' : c.borderLight}`,
              background: style === s.key ? 'rgba(233,30,140,0.08)' : 'none',
              color: style === s.key ? '#e91e8c' : c.textMed,
              fontWeight: style === s.key ? 700 : 400, transition: 'all 0.12s',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
        placeholder="Décrivez votre design… ex: logo cerise sur fond blanc, style japonais"
        rows={3}
        style={{
          width: '100%', resize: 'vertical', borderRadius: r.md,
          border: `1px solid ${c.borderLight}`, padding: '6px 8px',
          fontSize: fs.md, fontFamily: 'inherit', color: c.textMed,
          background: c.white, outline: 'none', boxSizing: 'border-box',
          lineHeight: 1.45,
        }}
      />

      <button
        onClick={generate}
        disabled={!prompt.trim() || isGenerating}
        style={{
          width: '100%', marginTop: 6,
          background: isGenerating ? '#f0ede9' : 'linear-gradient(135deg, #e91e8c, #5A6BD4)',
          border: 'none', borderRadius: r.lg, color: isGenerating ? '#aaa' : '#fff',
          fontSize: fs.md, fontWeight: 600, cursor: isGenerating ? 'not-allowed' : 'pointer',
          padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'opacity 0.15s',
        }}
      >
        {isGenerating ? (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#aaa" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
              <path d="M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1z" strokeOpacity="0.25"/>
              <path d="M6 1a5 5 0 0 1 5 5" strokeLinecap="round"/>
            </svg>
            Génération…
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z" strokeLinejoin="round"/>
            </svg>
            Générer (⌘↵)
          </>
        )}
      </button>

      {error && (
        <div style={{ marginTop: 6, padding: '5px 8px', background: '#fff0f0', borderRadius: r.md, fontSize: fs.sm, color: '#c00' }}>
          {error}
        </div>
      )}

      {preview && (
        <div style={{ marginTop: 8 }}>
          <img src={preview} alt="AI generated" style={{ width: '100%', borderRadius: r.md, border: `1px solid ${c.borderLight}`, display: 'block' }} />
          {provider && <div style={{ fontSize: 9, color: c.textGhost, marginTop: 3 }}>{provider}</div>}
          <button
            onClick={addToCanvas}
            style={{
              width: '100%', marginTop: 6, background: c.ink, border: 'none',
              color: c.white, borderRadius: r.lg, fontSize: fs.md, fontWeight: 600,
              cursor: 'pointer', padding: '7px 10px',
            }}
          >
            + Ajouter au patron
          </button>
        </div>
      )}
    </div>
  )
}
