'use client'

import type { BoxParams, LayerVisibility } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'
import { MM_TO_PX } from './constants'

interface FoldLinesSVGProps {
  dieline: DielineData
  layers: LayerVisibility
  params: BoxParams
  zoom: number
}

function offsetPath(path: string, delta: number): string {
  const m = path.match(/M\s*([\d.]+),([\d.]+)\s*L\s*([\d.]+),([\d.]+)/)
  if (!m) return path
  const x1 = parseFloat(m[1]), y1 = parseFloat(m[2]), x2 = parseFloat(m[3]), y2 = parseFloat(m[4])
  if (Math.abs(y1 - y2) < 1) return `M ${x1},${y1 + delta} L ${x2},${y2 + delta}`
  return `M ${x1 + delta},${y1} L ${x2 + delta},${y2}`
}

function midpoint(path: string): { x: number; y: number } | null {
  const m = path.match(/M\s*([\d.]+),([\d.]+)\s*L\s*([\d.]+),([\d.]+)/)
  if (!m) return null
  return { x: (parseFloat(m[1]) + parseFloat(m[3])) / 2, y: (parseFloat(m[2]) + parseFloat(m[4])) / 2 }
}

export function FoldLinesSVG({ dieline, layers, params, zoom }: FoldLinesSVGProps) {
  if (!layers.pli) return null

  const t = params.thickness * MM_TO_PX
  const useDouble = t > 0.5

  return (
    <>
      {dieline.foldLines.map((line, i) => useDouble ? (
        <g key={i}>
          <path d={offsetPath(line, -t / 2)} fill="none" stroke="#4488ff" strokeWidth={0.8 / zoom} strokeDasharray={`${5 / zoom} ${3 / zoom}`} />
          <path d={offsetPath(line, +t / 2)} fill="none" stroke="#4488ff" strokeWidth={0.8 / zoom} strokeDasharray={`${5 / zoom} ${3 / zoom}`} />
        </g>
      ) : (
        <path key={i} d={line} fill="none" stroke="#4488ff" strokeWidth={1 / zoom} strokeDasharray={`${5 / zoom} ${3 / zoom}`} />
      ))}
      {dieline.foldLines.map((line, i) => {
        const mid = midpoint(line)
        if (!mid) return null
        const r = 7 / zoom
        return (
          <g key={`fn-${i}`} pointerEvents="none">
            <circle cx={mid.x} cy={mid.y} r={r} fill="#4488ff" fillOpacity={0.88} />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={6.5 / zoom} fontFamily="system-ui,sans-serif" fontWeight="700">
              {i + 1}
            </text>
          </g>
        )
      })}
    </>
  )
}
