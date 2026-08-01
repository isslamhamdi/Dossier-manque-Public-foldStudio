'use client'

import { useState, useMemo } from 'react'
import { SectionLabel } from './ui'
import type { BoxParams } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'

// Paper weights (g/m²) → price per m² (€, indicative offset industry data)
const PAPER_PRESETS = [
  { label: 'Carton 350g/m²',   gm2: 350, priceM2: 1.20 },
  { label: 'Carton 400g/m²',   gm2: 400, priceM2: 1.45 },
  { label: 'Microflute B/E',   gm2: 580, priceM2: 1.80 },
  { label: 'Kraft 250g/m²',    gm2: 250, priceM2: 0.95 },
  { label: 'Couché mat 300g',  gm2: 300, priceM2: 1.30 },
]

const COLORS_PRESETS = [
  { label: '1 couleur (N)', colors: 1, priceK: 18 },
  { label: '2 couleurs',    colors: 2, priceK: 28 },
  { label: '4/0 (quadri recto)', colors: 4, priceK: 40 },
  { label: '4/4 (quadri r/v)', colors: 8, priceK: 68 },
]

const FINISH_PRESETS = [
  { label: 'Sans', price: 0 },
  { label: 'Pelliculage mat', price: 0.08 },
  { label: 'Pelliculage brillant', price: 0.06 },
  { label: 'Vernis UV sélectif', price: 0.15 },
  { label: 'Dorure à chaud', price: 0.35 },
]

export function CostSection({ params, dieline }: { params: BoxParams; dieline: DielineData }) {
  const [open, setOpen] = useState(false)
  const [paperIdx, setPaperIdx] = useState(0)
  const [colorIdx, setColorIdx] = useState(2)
  const [finishIdx, setFinishIdx] = useState(0)
  const [qty, setQty] = useState(1000)

  const paper = PAPER_PRESETS[paperIdx]
  const colorConfig = COLORS_PRESETS[colorIdx]
  const finish = FINISH_PRESETS[finishIdx]

  const costs = useMemo(() => {
    // Surface du patron en m²
    const areaMm2 = dieline.svgWidth * dieline.svgHeight
    const areaM2 = areaMm2 / 1_000_000
    const wasteMultiplier = 1.12 // 12% chutes

    // Coût matière
    const matCost = areaM2 * paper.priceM2 * wasteMultiplier * qty

    // Coût impression (par mille) + fixe mise en route
    const setupCost = colorConfig.colors * 120 // 120€/couleur mise en route
    const impCost = (qty / 1000) * colorConfig.priceK * (dieline.svgWidth * dieline.svgHeight > 50000 ? 1.3 : 1)

    // Coût finition
    const finCost = areaM2 * finish.price * qty

    // Coût cliché — estimé en mm² surface de découpe
    const cuttingPerim = params.width * 2 + params.height * 2 + params.depth * 4 // approximation périmètre
    const clisheCost = cuttingPerim * 0.08 + colorConfig.colors * 95 // 95€/couleur cliché offset

    const total = matCost + setupCost + impCost + finCost + clisheCost
    const unitCost = total / qty

    return {
      matCost: Math.round(matCost),
      setupCost: Math.round(setupCost + clisheCost),
      impCost: Math.round(impCost),
      finCost: Math.round(finCost),
      clisheCost: Math.round(clisheCost),
      total: Math.round(total),
      unitCost: unitCost.toFixed(3),
    }
  }, [dieline, paper, colorConfig, finish, qty, params])

  return (
    <div style={{ borderTop: '1px solid #efefef', paddingTop: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel>Estimation coût impression</SectionLabel>
        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: '#999' }}>
          {open ? '▲' : '▼'}
        </button>
      </div>

      {open && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Quantité</div>
              <input type="number" min={100} step={100} value={qty} onChange={e => setQty(Number(e.target.value))}
                style={{ width: '100%', fontSize: 11, border: '1px solid #e0e0e0', borderRadius: 3, padding: '3px 6px', outline: 'none' }} />
            </div>
          </div>

          {/* Paper */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Matière</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {PAPER_PRESETS.map((p, i) => (
                <button key={i} onClick={() => setPaperIdx(i)}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, border: `1px solid ${paperIdx===i?'#555':'#e0e0e0'}`, background: paperIdx===i?'#333':'#fff', color: paperIdx===i?'#fff':'#555', cursor: 'pointer' }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Impression</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {COLORS_PRESETS.map((c, i) => (
                <button key={i} onClick={() => setColorIdx(i)}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, border: `1px solid ${colorIdx===i?'#555':'#e0e0e0'}`, background: colorIdx===i?'#333':'#fff', color: colorIdx===i?'#fff':'#555', cursor: 'pointer' }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Finish */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: '#888', marginBottom: 3 }}>Finition</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {FINISH_PRESETS.map((f, i) => (
                <button key={i} onClick={() => setFinishIdx(i)}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, border: `1px solid ${finishIdx===i?'#555':'#e0e0e0'}`, background: finishIdx===i?'#333':'#fff', color: finishIdx===i?'#fff':'#555', cursor: 'pointer' }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div style={{ background: '#f7f7f7', borderRadius: 6, padding: '10px 12px' }}>
            {[
              { label: 'Matière', val: `${costs.matCost} €` },
              { label: 'Mise en route + clichés', val: `${costs.setupCost} €` },
              { label: 'Impression', val: `${costs.impCost} €` },
              { label: 'Finition', val: `${costs.finCost} €` },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#666', marginBottom: 4 }}>
                <span>{label}</span><span style={{ fontFamily: 'monospace' }}>{val}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e0e0e0', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 10, fontWeight: 700 }}>Total {qty.toLocaleString('fr')} ex.</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#e91e8c' }}>{costs.total.toLocaleString('fr')} €</span>
            </div>
            <div style={{ textAlign: 'right', fontSize: 9, color: '#888', marginTop: 3 }}>
              soit <strong>{costs.unitCost} €</strong> / unité
            </div>
          </div>
          <div style={{ fontSize: 8, color: '#bbb', marginTop: 5, lineHeight: 1.4 }}>
            Estimation indicative. Tarifs offset France (2024). Demander devis imprimeur pour confirmer.
          </div>
        </>
      )}
    </div>
  )
}
