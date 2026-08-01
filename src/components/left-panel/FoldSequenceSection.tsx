'use client'

import { useState, useMemo } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { MM_TO_PX } from '@/lib/dieline/helpers'
import { c, fs, fw, r } from '@/lib/tokens'
import { CollapsibleSection } from './ui'

interface FoldStep {
  num: number
  label: string
  description: string
  panelIds: string[]
}

function getFoldSteps(template: TemplateType, params: BoxParams): FoldStep[] {
  const base: FoldStep[] = [
    { num: 1, label: 'Planche plate', description: 'Découpe du patron à plat sur la feuille', panelIds: [] },
    { num: 2, label: 'Rainurage', description: 'Rainure les lignes de pliage pour faciliter la mise en forme', panelIds: [] },
    { num: 3, label: 'Languette de colle', description: `Encollage de la languette (${params.glueTab ?? 15} mm)`, panelIds: ['Glue'] },
    { num: 4, label: 'Assemblage base', description: 'Repli et collage du fond de la boîte', panelIds: ['Bottom'] },
    { num: 5, label: 'Montage corps', description: 'Repli des côtés (L, R) et fermeture du tube carton', panelIds: ['Left', 'Right'] },
    { num: 6, label: 'Fermeture couvercle', description: 'Insertion et verrouillage du couvercle', panelIds: ['Top', 'TopFront'] },
  ]

  if (template === 'tuck-end' || template === 'reverse-tuck') {
    base[5] = { num: 6, label: 'Tuck-end', description: 'Rentrer les rabats avant et insérer le tuck dans la boîte', panelIds: ['TopFront', 'BottomFront'] }
  }
  if (template === 'seal-end') {
    base[5] = { num: 6, label: 'Scellage', description: 'Fermeture des rabats top et bottom par collage ou thermoscellage', panelIds: ['Top', 'Bottom'] }
  }
  return base
}

const STEP_COLORS = ['#e91e8c', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export function FoldSequenceSection({ params, activeTemplate }: { params: BoxParams; activeTemplate: TemplateType }) {
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const dieline = useMemo(() => computeDieline(params, activeTemplate), [params, activeTemplate])
  const steps = useMemo(() => getFoldSteps(activeTemplate, params), [activeTemplate, params])

  const svgW = 160
  const scale = svgW / (dieline.svgWidth * MM_TO_PX)
  const svgH = dieline.svgHeight * MM_TO_PX * scale

  return (
    <CollapsibleSection label="Séquence de pliage">
      <div>
          {/* Mini dieline preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <svg width={svgW} height={svgH} style={{ border: `1px solid ${c.borderLight}`, borderRadius: r.md, background: '#fafafa' }}>
              <g transform={`scale(${scale * MM_TO_PX})`}>
                <path d={dieline.cutPath} fill="rgba(233,30,140,0.04)" stroke="#e91e8c" strokeWidth={0.5} />
                {dieline.foldLines.map((l, i) => (
                  <path key={i} d={l} fill="none" stroke="#4488ff" strokeWidth={0.4} strokeDasharray="2 1" />
                ))}
                {/* Number fold lines */}
                {dieline.foldLines.map((_, i) => {
                  const step = steps[i % steps.length]
                  const color = STEP_COLORS[i % STEP_COLORS.length]
                  return (
                    <circle key={i} cx={8 + (i * 12)} cy={4} r={3.5} fill={color} opacity={0.9} />
                  )
                })}
              </g>
              {/* Step numbers overlay */}
              {steps.slice(0, dieline.foldLines.length).map((step, i) => (
                <text key={i} x={8 + i * (svgW / Math.max(dieline.foldLines.length, 1))} y={12}
                  fontSize={7} fill={STEP_COLORS[i % STEP_COLORS.length]} textAnchor="middle" fontWeight="700">
                  {step.num}
                </text>
              ))}
            </svg>
          </div>

          {/* Step list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {steps.map((step) => (
              <div
                key={step.num}
                onClick={() => setActiveStep(activeStep === step.num ? null : step.num)}
                style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 8px',
                  borderRadius: r.md, cursor: 'pointer',
                  background: activeStep === step.num ? '#fdf4ff' : 'transparent',
                  border: `1px solid ${activeStep === step.num ? '#e9d5ff' : 'transparent'}`,
                  transition: 'background 0.1s',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: STEP_COLORS[(step.num - 1) % STEP_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff',
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: '#333' }}>{step.label}</div>
                  {activeStep === step.num && (
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: 1.5 }}>{step.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 9, color: '#bbb', marginTop: 8, textAlign: 'center' }}>
            Cliquez sur une étape pour voir les détails
          </div>
        </div>
    </CollapsibleSection>
  )
}
