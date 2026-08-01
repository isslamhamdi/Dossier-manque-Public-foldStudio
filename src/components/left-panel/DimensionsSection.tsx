'use client'

import { useState, useMemo, useDeferredValue } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { MM_TO_PX } from '@/lib/dieline/helpers'
import { SliderRow, SectionLabel, UnitType, UNITS } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import { NumberTicker } from '@/components/ui/number-ticker'
import { FLUTE_SPECS, FLUTE_ORDER, getFluteSpec } from '@/lib/flutes'
import type { FluteId } from '@/lib/flutes'

const PT_PER_MM = 2.834645669

// Generate SVG sine-wave path for corrugation preview chip
function buildCorruPath(flutesPer30cm: number, thickness: number): string {
  const periods = Math.max(2, Math.min(8, Math.round(flutesPer30cm / 10)))
  const amplitude = Math.min(4, thickness * 0.8)
  const pts: string[] = []
  const steps = periods * 8
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 30
    const y = 7 - Math.sin((i / steps) * Math.PI * 2 * periods) * amplitude
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function toDisp(mm: number, unit: UnitType, decimals = 0): number {
  if (unit === 'cm') return Math.round(mm / 10 * Math.pow(10, decimals)) / Math.pow(10, decimals)
  if (unit === 'in') return Math.round(mm / 25.4 * 100) / 100
  if (unit === 'pt') return Math.round(mm * PT_PER_MM * 10) / 10
  return mm
}

export function DimensionsSection({ params, onParamChange, onFluteChange, activeTemplate = 'box', unit, onUnitChange, showLabel = true }: {
  params: BoxParams
  onParamChange: (key: keyof BoxParams, value: number) => void
  onFluteChange?: (fluteId: FluteId) => void
  activeTemplate?: TemplateType
  unit: UnitType
  onUnitChange: (u: UnitType) => void
  showLabel?: boolean
}) {

  const [showFluteInfo, setShowFluteInfo] = useState(false)

  // Defer patron-size computation so it doesn't run on every urgent slider frame
  const deferredParams = useDeferredValue(params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dieline = useMemo(() => computeDieline(deferredParams, activeTemplate), [deferredParams.width, deferredParams.height, deferredParams.depth, deferredParams.glueTab, deferredParams.bleed, activeTemplate])
  const B = deferredParams.bleed * MM_TO_PX
  const patronW = Math.round((dieline.svgWidth - 2 * B) / MM_TO_PX)
  const patronH = Math.round((dieline.svgHeight - 2 * B) / MM_TO_PX)
  const volume = (params.width * params.height * params.depth / 1000).toFixed(1)

  const unitLabel = unit
  const pW = toDisp(patronW, unit, 1)
  const pH = toDisp(patronH, unit, 1)

  const currentFlute = getFluteSpec(params.fluteType ?? 'E')
  const handleFluteSelect = (id: FluteId) => {
    onFluteChange?.(id)
    const spec = FLUTE_SPECS[id]
    onParamChange('thickness', spec.thickness)
    onParamChange('fluteType' as keyof BoxParams, id as any)
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        {showLabel && <SectionLabel>Dimensions</SectionLabel>}
        <div style={{ display: 'flex', background: c.surface, borderRadius: r.lg, padding: 2, gap: 2, width: 'fit-content' }}>
          {UNITS.map(u => (
            <button
              key={u}
              onClick={() => onUnitChange(u)}
              className="fs-btn-tab"
              style={{
                background: unit === u ? c.ink : 'transparent',
                color: unit === u ? c.white : c.textMuted,
                border: 'none', borderRadius: r.md, padding: '4px 12px',
                fontSize: fs.sm, fontWeight: fw.heavy, cursor: 'pointer',
                letterSpacing: 0.5, textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
            >{u}</button>
          ))}
        </div>
      </div>

      <SliderRow label="Largeur"    value={params.width}     min={20}  max={500} step={0.01} onChange={v => onParamChange('width', v)}     unit={unit} />
      <SliderRow label="Hauteur"    value={params.height}    min={20}  max={500} step={0.01} onChange={v => onParamChange('height', v)}    unit={unit} />
      <SliderRow label="Profondeur" value={params.depth}     min={10}  max={300} step={0.01} onChange={v => onParamChange('depth', v)}     unit={unit} />
      <SliderRow label="Languette"  value={params.glueTab}   min={5}   max={60}  step={0.01} onChange={v => onParamChange('glueTab', v)}   unit={unit} />
      <SliderRow label="Épaisseur"  value={params.thickness} min={0.1} max={8}   step={0.01} onChange={v => onParamChange('thickness', v)} unit={unit} />

      {/* #80: Flute / substrate type selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: fs.sm, color: c.textMuted, fontWeight: fw.bold, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Type carton
          </span>
          <button
            onClick={() => setShowFluteInfo(v => !v)}
            style={{ fontSize: 9, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
            title="Afficher infos"
          >
            {showFluteInfo ? '▲ moins' : 'ℹ infos'}
          </button>
        </div>

        {/* Grid of flute chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {FLUTE_ORDER.map(id => {
            const spec = FLUTE_SPECS[id]
            const active = (params.fluteType ?? 'E') === id
            const isCorrugated = spec.corrugated
            return (
              <button
                key={id}
                onClick={() => handleFluteSelect(id)}
                title={spec.description}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '5px 7px', borderRadius: 6, cursor: 'pointer',
                  border: active ? '1.5px solid #1a1a1a' : '1.5px solid #e0e0e0',
                  background: active ? '#1a1a1a' : isCorrugated ? '#faf7f3' : '#f5f5f5',
                  transition: 'all 0.12s',
                  minWidth: 42,
                }}
              >
                {/* Mini corrugation preview */}
                <svg width="30" height="14" viewBox="0 0 30 14" style={{ marginBottom: 2 }}>
                  {isCorrugated ? (
                    <>
                      <rect x="0" y="0" width="30" height="3" rx="1"
                        fill={active ? 'rgba(255,255,255,0.5)' : '#c8b08a'} />
                      <path
                        d={buildCorruPath(spec.flutesPer30cm, spec.thickness)}
                        fill="none"
                        stroke={active ? 'rgba(255,255,255,0.7)' : '#b08040'}
                        strokeWidth="1.2"
                      />
                      {spec.liners >= 2 && (
                        <rect x="0" y="11" width="30" height="3" rx="1"
                          fill={active ? 'rgba(255,255,255,0.5)' : '#c8b08a'} />
                      )}
                    </>
                  ) : (
                    /* Flat board — show thickness as stacked lines */
                    Array.from({ length: Math.max(1, Math.round(spec.thickness / 0.15)) }).map((_, i, arr) => (
                      <rect key={i} x="2" y={1 + i * (12 / arr.length)} width="26" height={Math.max(1, 10 / arr.length - 0.5)} rx="0.5"
                        fill={active ? 'rgba(255,255,255,0.6)' : spec.color} opacity={0.7 + i * 0.05}
                      />
                    ))
                  )}
                </svg>
                <span style={{
                  fontSize: 9, fontWeight: fw.heavy, letterSpacing: 0.3,
                  color: active ? '#fff' : '#333',
                }}>
                  {spec.shortLabel}
                </span>
                <span style={{ fontSize: 8, color: active ? 'rgba(255,255,255,0.65)' : '#999' }}>
                  {spec.thickness}mm
                </span>
              </button>
            )
          })}
        </div>

        {/* Info panel */}
        {showFluteInfo && (
          <div style={{
            marginTop: 8, padding: '8px 10px', borderRadius: 6,
            background: '#f8f6f2', border: '1px solid #e8e0d4',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{
                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                background: currentFlute.corrugated ? '#e67e22' : '#27ae60',
              }} />
              <span style={{ fontSize: 11, fontWeight: fw.heavy, color: '#333' }}>
                {currentFlute.label}
              </span>
              <span style={{ fontSize: 10, color: '#888', marginLeft: 'auto' }}>
                {currentFlute.corrugated ? `${currentFlute.flutesPer30cm} fl/30cm` : 'Plat'}
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 6, lineHeight: 1.4 }}>
              {currentFlute.description}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px' }}>
              {[
                ['Épaisseur', `${currentFlute.thickness} mm`],
                ['Grammage', `${currentFlute.gsm[0]}–${currentFlute.gsm[1]} g/m²`],
                ['Charge max', `${currentFlute.maxWeight} kg`],
                ['Résistance', { low: 'Faible', medium: 'Moyenne', high: 'Élevée', 'very-high': 'Très élevée' }[currentFlute.stackStrength]],
              ].map(([label, val]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, color: '#999' }}>{label}</span>
                  <span style={{ fontSize: 9, fontWeight: fw.bold, color: '#444' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Auto-calculate glue tab from paper thickness #58 */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => {
            // Standard rule: glue tab = max(10mm, 4× paper thickness + 5mm)
            const recommended = Math.max(10, Math.round(params.thickness * 4 + 5))
            onParamChange('glueTab', recommended)
          }}
          className="fs-btn-default"
          style={{ fontSize: 10, padding: '4px 10px', borderRadius: 4, border: '1px solid #e0e0e0', background: '#f8f8f8', color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>
          ↻ Calc. auto languette ({Math.max(10, Math.round(params.thickness * 4 + 5))} mm)
        </button>
      </div>

      {/* Structural integrity check #59 — memoized so it doesn't oscillate during slider drag */}
      {useMemo(() => {
        const issues: string[] = []
        const r = deferredParams.width / deferredParams.depth
        if (r > 8) issues.push(`Ratio L/P trop élevé (${r.toFixed(1)}:1 > 8:1)`)
        if (deferredParams.height / deferredParams.depth > 10) issues.push('Hauteur excessive vs profondeur')
        if (deferredParams.glueTab < deferredParams.thickness * 3) issues.push(`Languette trop courte (min ${Math.ceil(deferredParams.thickness * 3)} mm recommandé)`)
        if (deferredParams.thickness > 2 && deferredParams.bleed < deferredParams.thickness) issues.push('Fond perdu insuffisant pour cette épaisseur')
        const surface = 2 * (deferredParams.width * deferredParams.height + deferredParams.width * deferredParams.depth + deferredParams.height * deferredParams.depth)
        if (surface > 150000) issues.push('Surface totale > 1500 cm² — vérifier rigidité')
        return issues.length > 0 ? (
          <div style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 5, background: '#fff8e1', border: '1px solid #ffe082' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#b45309', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Intégrité structurelle
            </div>
            {issues.map((iss, i) => (
              <div key={i} style={{ fontSize: 10, color: '#92400e', marginBottom: 1 }}>⚠ {iss}</div>
            ))}
          </div>
        ) : null
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [deferredParams.width, deferredParams.height, deferredParams.depth, deferredParams.glueTab, deferredParams.thickness, deferredParams.bleed])}
      <SliderRow label="Fond perdu" value={params.bleed}     min={0}   max={20}  step={0.01} onChange={v => onParamChange('bleed', v)}     unit={unit} />

      <div style={{ borderTop: '1px solid #efefef', paddingTop: 14, marginBottom: 16 }}>
        <SectionLabel>Infos</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.md, color: c.textMuted }}>Patron</span>
            <span style={{ fontSize: fs.md, color: c.ink, fontWeight: fw.bold }}>
              <NumberTicker value={pW} decimals={unit === 'mm' ? 0 : 1} /> × <NumberTicker value={pH} decimals={unit === 'mm' ? 0 : 1} /> {unitLabel}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.md, color: c.textMuted }}>Volume</span>
            <span style={{ fontSize: fs.md, color: c.ink, fontWeight: fw.bold }}>
              <NumberTicker value={parseFloat(volume)} decimals={1} suffix=" cm³" />
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: fs.md, color: c.textMuted }}>Faces</span>
            <span style={{ fontSize: fs.md, color: c.ink, fontWeight: fw.bold }}>6</span>
          </div>
        </div>
      </div>
    </>
  )
}
