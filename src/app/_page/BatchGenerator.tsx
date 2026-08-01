'use client'

/**
 * Feature #56: Batch generation — generate multiple dieline sizes at once
 * Creates a ZIP-like multi-SVG download of variants.
 */

import { useState, useCallback } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'

interface SizeVariant {
  label: string
  params: BoxParams
}

function generateVariants(base: BoxParams, mode: 'scale' | 'steps', count: number): SizeVariant[] {
  const variants: SizeVariant[] = []
  if (mode === 'scale') {
    // Scale uniformly from 50% to 150%
    for (let i = 0; i < count; i++) {
      const factor = 0.5 + (i / (count - 1))
      variants.push({
        label: `${Math.round(factor * 100)}%`,
        params: {
          ...base,
          width: Math.round(base.width * factor),
          height: Math.round(base.height * factor),
          depth: Math.round(base.depth * factor),
        },
      })
    }
  } else {
    // Step through width in 10mm increments
    for (let i = 0; i < count; i++) {
      const w = base.width - 20 + i * 5
      if (w < 20) continue
      variants.push({
        label: `${w}×${base.height}×${base.depth}`,
        params: { ...base, width: w },
      })
    }
  }
  return variants
}

function dielineToSVG(params: BoxParams, template: TemplateType): string {
  const dieline = computeDieline(params, template)
  const MM_TO_PX = 3.7795275591
  const w = dieline.svgWidth * MM_TO_PX
  const h = dieline.svgHeight * MM_TO_PX
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">
  <g transform="scale(${MM_TO_PX})">
    <path d="${dieline.cutPath}" fill="none" stroke="#e91e8c" stroke-width="0.5"/>
    ${dieline.foldLines.map(l => `<path d="${l}" fill="none" stroke="#4488ff" stroke-width="0.3" stroke-dasharray="2 1"/>`).join('\n    ')}
    ${dieline.gluePaths.map(p => `<path d="${p}" fill="#eee" stroke="#aaa" stroke-width="0.3"/>`).join('\n    ')}
    ${dieline.bleedPath ? `<path d="${dieline.bleedPath}" fill="none" stroke="#ff8800" stroke-width="0.3" stroke-dasharray="3 1.5"/>` : ''}
    <text x="${dieline.svgWidth/2}" y="${dieline.svgHeight/2}" text-anchor="middle" fill="#ccc" font-size="6" font-family="system-ui">${params.width}×${params.height}×${params.depth}mm</text>
  </g>
</svg>`
}

export function BatchGenerator({ baseParams, activeTemplate, onClose }: {
  baseParams: BoxParams
  activeTemplate: TemplateType
  onClose: () => void
}) {
  const [mode, setMode] = useState<'scale' | 'steps'>('scale')
  const [count, setCount] = useState(5)
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<SizeVariant[]>([])

  const variants = generateVariants(baseParams, mode, count)

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    const svgs = variants.map(v => ({
      name: `patron-${v.label.replace(/[^a-z0-9]/gi, '_')}.svg`,
      content: dielineToSVG(v.params, activeTemplate),
    }))

    // Download all as individual SVG files (no JSZip needed)
    for (const { name, content } of svgs) {
      const blob = new Blob([content], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = name; a.click()
      URL.revokeObjectURL(url)
      await new Promise(r => setTimeout(r, 100)) // slight delay between downloads
    }
    setGenerating(false)
  }, [variants, activeTemplate])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9996, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '96vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Génération batch</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Mode de variation</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['scale', 'steps'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '8px', border: `1.5px solid ${mode===m?'#333':'#e0e0e0'}`, borderRadius: 6, background: mode===m?'#1a1a1a':'#fff', color: mode===m?'#fff':'#555', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                {m === 'scale' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="1.5" width="9" height="9" rx="1"/><path d="M4 8L8 4M8 4H5.5M8 4v2.5"/></svg>
                    Mise à l&apos;échelle (50–150%)
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1" y="4" width="10" height="4" rx="0.5"/><path d="M3 4V5.5M5 4V6M7 4V5.5M9 4V6"/></svg>
                    Largeur par pas de 5mm
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 10, color: '#888' }}>Nombre de variantes</div>
          <input type="range" min={3} max={20} value={count} onChange={e => setCount(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 13, fontWeight: 700, width: 24 }}>{count}</span>
        </div>

        {/* Preview grid */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 8 }}>Aperçu des {variants.length} variantes</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 6 }}>
            {variants.map((v, i) => (
              <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 5, padding: '6px 4px', textAlign: 'center', background: '#fafafa' }}>
                <div style={{ fontSize: 8, color: '#555', fontWeight: 600 }}>{v.label}</div>
                <div style={{ fontSize: 7, color: '#aaa', marginTop: 2 }}>{v.params.width}×{v.params.height}×{v.params.depth}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating}
          style={{ width: '100%', padding: '12px', background: generating ? '#888' : 'linear-gradient(135deg,#e91e8c,#9c27b0)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: generating ? 'wait' : 'pointer' }}>
          {generating ? `Génération en cours…` : `⬇ Télécharger ${variants.length} SVG`}
        </button>
        <div style={{ fontSize: 8, color: '#bbb', marginTop: 6, textAlign: 'center' }}>
          Chaque patron est exporté en SVG vectoriel séparé
        </div>
      </div>
    </div>
  )
}
