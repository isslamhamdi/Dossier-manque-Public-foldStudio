'use client'

import type { BoxParams } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'
import type { UnitType } from '@/components/left-panel/ui'

const PT_PER_MM = 2.834645669

function fmtMm(mm: number, unit: UnitType): string {
  if (unit === 'cm') return `${(mm / 10).toFixed(1)} cm`
  if (unit === 'in') return `${(mm / 25.4).toFixed(2)} in`
  if (unit === 'pt') return `${(mm * PT_PER_MM).toFixed(0)} pt`
  return `${Math.round(mm)} mm`
}

interface DimensionAnnotationsProps {
  dieline: DielineData
  params: BoxParams
  zoom: number
  unit?: UnitType
}

export function DimensionAnnotations({ dieline, params, zoom, unit = 'mm' }: DimensionAnnotationsProps) {
  const frontPanel = dieline.panels.find(p => p.label === 'Front')
  const leftPanel = dieline.panels.find(p => p.label === 'Left')
  if (!frontPanel || !leftPanel) return null

  const tickH = 4 / zoom, offset = 14 / zoom, labelFs = 8 / zoom
  const wx1 = frontPanel.x, wx2 = frontPanel.x + frontPanel.w, wy = frontPanel.y + frontPanel.h + offset
  const hy1 = frontPanel.y, hy2 = frontPanel.y + frontPanel.h, hx = leftPanel.x - offset
  const dx1 = leftPanel.x, dx2 = leftPanel.x + leftPanel.w, dy = frontPanel.y - offset

  return (
    <g fill="none" stroke="#aaa" strokeWidth={0.7 / zoom}>
      <line x1={wx1} y1={wy - tickH} x2={wx1} y2={wy + tickH} />
      <line x1={wx2} y1={wy - tickH} x2={wx2} y2={wy + tickH} />
      <line x1={wx1} y1={wy} x2={wx2} y2={wy} />
      <text x={(wx1 + wx2) / 2} y={wy + offset * 0.7} textAnchor="middle" fill="#aaa" stroke="none" fontSize={labelFs} fontFamily="system-ui,sans-serif">W {fmtMm(params.width, unit)}</text>

      <line x1={hx - tickH} y1={hy1} x2={hx + tickH} y2={hy1} />
      <line x1={hx - tickH} y1={hy2} x2={hx + tickH} y2={hy2} />
      <line x1={hx} y1={hy1} x2={hx} y2={hy2} />
      <text x={hx - offset * 0.8} y={(hy1 + hy2) / 2} textAnchor="middle" fill="#aaa" stroke="none" fontSize={labelFs} fontFamily="system-ui,sans-serif"
        transform={`rotate(-90, ${hx - offset * 0.8}, ${(hy1 + hy2) / 2})`}>H {fmtMm(params.height, unit)}</text>

      <line x1={dx1} y1={dy - tickH} x2={dx1} y2={dy + tickH} />
      <line x1={dx2} y1={dy - tickH} x2={dx2} y2={dy + tickH} />
      <line x1={dx1} y1={dy} x2={dx2} y2={dy} />
      <text x={(dx1 + dx2) / 2} y={dy - offset * 0.5} textAnchor="middle" fill="#aaa" stroke="none" fontSize={labelFs} fontFamily="system-ui,sans-serif">D {fmtMm(params.depth, unit)}</text>
    </g>
  )
}
