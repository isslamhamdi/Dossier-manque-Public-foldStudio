'use client'

import { useState, useMemo } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { MM_TO_PX } from '@/lib/dieline/helpers'

interface Variant {
  label: string
  params: BoxParams
}

function MiniPreview({ params, activeTemplate, label }: { params: BoxParams; activeTemplate: TemplateType; label: string }) {
  const dieline = useMemo(() => computeDieline(params, activeTemplate), [params, activeTemplate])
  const W = 160
  const scale = W / (dieline.svgWidth * MM_TO_PX)
  const H = dieline.svgHeight * MM_TO_PX * scale
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#555', marginBottom: 6, textAlign: 'center' }}>{label}</div>
      <svg width={W} height={H} style={{ border: '1px solid #e0e0e0', borderRadius: 6, background: '#fafafa' }}>
        <g transform={`scale(${scale * MM_TO_PX})`}>
          <path d={dieline.cutPath} fill="rgba(233,30,140,0.05)" stroke="#e91e8c" strokeWidth={0.5} />
          {dieline.foldLines.map((l, i) => (
            <path key={i} d={l} fill="none" stroke="#4488ff" strokeWidth={0.3} strokeDasharray="2 1" />
          ))}
          {dieline.gluePaths.map((p, i) => (
            <path key={i} d={p} fill="#eee" stroke="#aaa" strokeWidth={0.3} />
          ))}
        </g>
      </svg>
      <div style={{ marginTop: 6, textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#222' }}>{params.width}×{params.height}×{params.depth} mm</div>
        <div style={{ fontSize: 9, color: '#888' }}>
          Vol: {((params.width * params.height * params.depth) / 1000).toFixed(1)} cm³ ·
          Patron: {dieline.svgWidth.toFixed(0)}×{dieline.svgHeight.toFixed(0)} mm
        </div>
      </div>
    </div>
  )
}

interface Props {
  baseParams: BoxParams
  activeTemplate: TemplateType
  onClose: () => void
}

export function VariantCompare({ baseParams, activeTemplate, onClose }: Props) {
  const [variants, setVariants] = useState<Variant[]>([
    { label: 'Variante A (base)', params: { ...baseParams } },
    { label: 'Variante B (+20%)', params: { ...baseParams, width: Math.round(baseParams.width * 1.2), height: Math.round(baseParams.height * 1.2) } },
  ])
  const [editIdx, setEditIdx] = useState<number | null>(null)

  const updateVariant = (idx: number, key: keyof BoxParams, val: number) => {
    setVariants(prev => prev.map((v, i) => i === idx ? { ...v, params: { ...v.params, [key]: val } } : v))
  }

  const addVariant = () => {
    setVariants(prev => [...prev, {
      label: `Variante ${String.fromCharCode(65 + prev.length)}`,
      params: { ...baseParams },
    }])
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: Math.min(900, window.innerWidth - 32), maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#222' }}>Comparaison de variantes</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {variants.length < 4 && (
              <button onClick={addVariant} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#f8f8f8', color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
                + Variante
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888' }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Previews row */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 20, justifyContent: 'center' }}>
            {variants.map((v, i) => (
              <MiniPreview key={i} params={v.params} activeTemplate={activeTemplate} label={v.label} />
            ))}
          </div>

          {/* Diff table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 700, color: '#444', border: '1px solid #eee' }}>Paramètre</th>
                {variants.map((v, i) => (
                  <th key={i} style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: '#444', border: '1px solid #eee' }}>
                    <input value={v.label} onChange={e => setVariants(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                      style={{ border: 'none', background: 'transparent', fontWeight: 700, textAlign: 'center', fontSize: 11, outline: 'none', width: '100%' }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['width', 'height', 'depth', 'glueTab', 'thickness', 'bleed'] as (keyof BoxParams)[]).map(key => {
                const vals = variants.map(v => v.params[key])
                const allSame = vals.every(x => x === vals[0])
                const labels: Partial<Record<keyof BoxParams, string>> = { width: 'Largeur (mm)', height: 'Hauteur (mm)', depth: 'Profondeur (mm)', glueTab: 'Languette (mm)', thickness: 'Épaisseur (mm)', bleed: 'Fond perdu (mm)' }
                return (
                  <tr key={key} style={{ background: allSame ? '#fff' : '#fff8e1' }}>
                    <td style={{ padding: '6px 10px', color: '#666', border: '1px solid #eee', fontWeight: 600 }}>
                      {labels[key]}
                    </td>
                    {variants.map((v, i) => (
                      <td key={i} style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #eee' }}>
                        {editIdx === i ? (
                          <input type="number" value={v.params[key]} step={0.01}
                            onChange={e => updateVariant(i, key, Number(e.target.value))}
                            style={{ width: 60, border: '1px solid #e91e8c', borderRadius: 3, padding: '2px 4px', fontSize: 11, outline: 'none', textAlign: 'center' }} />
                        ) : (
                          <span style={{ color: allSame ? '#333' : '#b45309', fontWeight: allSame ? 400 : 700 }}>{v.params[key]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
              {/* Volume row */}
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ padding: '6px 10px', color: '#666', border: '1px solid #eee', fontWeight: 600 }}>Volume (cm³)</td>
                {variants.map((v, i) => (
                  <td key={i} style={{ padding: '6px 10px', textAlign: 'center', border: '1px solid #eee', fontWeight: 700, color: '#059669' }}>
                    {((v.params.width * v.params.height * v.params.depth) / 1000).toFixed(1)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Edit controls */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {variants.map((_, i) => (
              <button key={i} onClick={() => setEditIdx(editIdx === i ? null : i)}
                style={{ flex: 1, fontSize: 10, padding: '5px 0', borderRadius: 5, border: `1px solid ${editIdx === i ? '#e91e8c' : '#e0e0e0'}`, background: editIdx === i ? '#fdf0f5' : '#f8f8f8', color: editIdx === i ? '#e91e8c' : '#555', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                {editIdx === i ? '✓ Terminer' : `Modifier variante ${String.fromCharCode(65 + i)}`}
              </button>
            ))}
            {variants.length > 1 && (
              <button onClick={() => setVariants(prev => prev.slice(0, -1))}
                style={{ fontSize: 10, padding: '5px 10px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>
                Suppr. dernière
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
