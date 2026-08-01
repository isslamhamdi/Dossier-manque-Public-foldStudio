'use client'

import { useMemo } from 'react'
import { MM_TO_PX, RULER_H } from './constants'
import type { UnitType } from '@/components/left-panel/ui'

const PT_PER_MM = 2.834645669

function mmToUnit(mm: number, unit: UnitType): number {
  if (unit === 'cm') return mm / 10
  if (unit === 'in') return mm / 25.4
  if (unit === 'pt') return mm * PT_PER_MM
  return mm
}

function fmtLabel(mm: number, unit: UnitType): string {
  if (unit === 'cm') return (mm / 10).toFixed(mm % 10 === 0 ? 0 : 1)
  if (unit === 'in') return (mm / 25.4).toFixed(mm % 25.4 < 0.01 ? 0 : 2)
  if (unit === 'pt') return Math.round(mm * PT_PER_MM).toString()
  return mm.toString()
}

interface RulersProps {
  zoom: number
  pan: { x: number; y: number }
  containerSize: { w: number; h: number }
  cursorMm: { x: number; y: number } | null
  unit?: UnitType
}

export function Rulers({ zoom, pan, containerSize, cursorMm, unit = 'mm' }: RulersProps) {
  const pxPerMm = MM_TO_PX * zoom

  const { hTicks, vTicks } = useMemo(() => {
    // Steps in mm that produce clean numbers in each unit
    const stepsMm: Record<UnitType, number[]> = {
      mm: [1, 2, 5, 10, 20, 50, 100, 200, 500],
      cm: [5, 10, 20, 50, 100, 200, 500],         // 0.5, 1, 2, 5, 10, 20, 50 cm
      in: [12.7, 25.4, 50.8, 127, 254],            // 0.5, 1, 2, 5, 10 in
      pt: [3.528, 7.056, 17.64, 35.28, 70.56, 176.4], // 10, 20, 50, 100, 200, 500 pt
    }
    const steps = stepsMm[unit]
    let step = steps[steps.length - 1]
    for (const s of steps) {
      if (s * pxPerMm >= 48) { step = s; break }
    }
    const hT: Array<{ px: number; mm: number }> = []
    const x0 = (RULER_H - pan.x) / pxPerMm
    const x1 = (containerSize.w - pan.x) / pxPerMm
    for (let m = Math.floor(x0 / step) * step; m <= x1 + step; m += step) {
      hT.push({ px: pan.x + m * pxPerMm - RULER_H, mm: m })
    }
    const vT: Array<{ py: number; mm: number }> = []
    const y0 = (RULER_H - pan.y) / pxPerMm
    const y1 = (containerSize.h - pan.y) / pxPerMm
    for (let m = Math.floor(y0 / step) * step; m <= y1 + step; m += step) {
      vT.push({ py: pan.y + m * pxPerMm - RULER_H, mm: m })
    }
    return { hTicks: hT, vTicks: vT }
  }, [pxPerMm, pan.x, pan.y, containerSize.w, containerSize.h, unit])

  const bg = 'rgba(240,237,233,0.96)'
  const tColor = '#b0ada8'
  const lColor = '#999693'
  const font = '9px system-ui,sans-serif'
  const cW = Math.max(0, containerSize.w - RULER_H)
  const cH = Math.max(0, containerSize.h - RULER_H)
  const curHpx = cursorMm ? pan.x + cursorMm.x * pxPerMm - RULER_H : null
  const curVpy = cursorMm ? pan.y + cursorMm.y * pxPerMm - RULER_H : null

  return (
    <>
      {/* Corner square with unit label */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: RULER_H, height: RULER_H,
        zIndex: 15, background: bg, borderRight: '1px solid #d4d0cc',
        borderBottom: '1px solid #d4d0cc', pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 7, color: '#b0ada8', fontFamily: 'system-ui,sans-serif', fontWeight: 600,
      }}>
        {unit}
      </div>

      {/* Horizontal ruler */}
      <svg style={{ position: 'absolute', top: 0, left: RULER_H, zIndex: 14, pointerEvents: 'none', overflow: 'hidden' }} width={cW} height={RULER_H}>
        <rect width="100%" height="100%" fill={bg} />
        <line x1="0" y1={RULER_H - 1} x2="100%" y2={RULER_H - 1} stroke="#d4d0cc" strokeWidth="1" />
        {hTicks.map(({ px, mm }) => (
          <g key={mm} transform={`translate(${px},0)`}>
            <line x1="0" x2="0" y1={RULER_H} y2={RULER_H - 7} stroke={tColor} strokeWidth="0.8" />
            <text x="2" y={RULER_H - 9} fill={lColor} style={{ font }}>{fmtLabel(mm, unit)}</text>
          </g>
        ))}
        {curHpx != null && <line x1={curHpx} x2={curHpx} y1={0} y2={RULER_H} stroke="#e91e8c" strokeWidth="1" opacity={0.6} />}
      </svg>

      {/* Vertical ruler */}
      <svg style={{ position: 'absolute', top: RULER_H, left: 0, zIndex: 14, pointerEvents: 'none', overflow: 'hidden' }} width={RULER_H} height={cH}>
        <rect width="100%" height="100%" fill={bg} />
        <line x1={RULER_H - 1} y1="0" x2={RULER_H - 1} y2="100%" stroke="#d4d0cc" strokeWidth="1" />
        {vTicks.map(({ py, mm }) => (
          <g key={mm}>
            <line x1={RULER_H} x2={RULER_H - 7} y1={py} y2={py} stroke={tColor} strokeWidth="0.8" />
            <text transform={`translate(${RULER_H / 2},${py}) rotate(-90)`} textAnchor="middle" dominantBaseline="central" fill={lColor} style={{ font }}>{fmtLabel(mm, unit)}</text>
          </g>
        ))}
        {curVpy != null && <line x1={0} x2={RULER_H} y1={curVpy} y2={curVpy} stroke="#e91e8c" strokeWidth="1" opacity={0.6} />}
      </svg>
    </>
  )
}
