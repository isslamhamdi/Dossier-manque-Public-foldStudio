'use client'

import type { BoxParams } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'

interface ResizeHandlesProps {
  dieline: DielineData
  params: BoxParams
  zoom: number
  handleParamMouseDown: (e: React.MouseEvent, param: keyof BoxParams, axis: 'x' | 'y', startValue: number) => void
}

export function ResizeHandles({ dieline, params, zoom, handleParamMouseDown }: ResizeHandlesProps) {
  const front = dieline.panels.find(p => p.label === 'Front')
  const right = dieline.panels.find(p => p.label === 'Right')
  if (!front || !right) return null

  const hw = 8 / zoom, hh = 16 / zoom

  return (
    <g>
      <rect x={front.x + front.w - hw / 2} y={front.y + front.h / 2 - hh} width={hw} height={hh * 2}
        fill="#4488ff" fillOpacity={0.7} rx={2 / zoom} style={{ cursor: 'ew-resize' }}
        onMouseDown={e => handleParamMouseDown(e, 'width', 'x', params.width)} />
      <rect x={front.x + front.w / 2 - hh} y={front.y + front.h - hw / 2} width={hh * 2} height={hw}
        fill="#44bb88" fillOpacity={0.7} rx={2 / zoom} style={{ cursor: 'ns-resize' }}
        onMouseDown={e => handleParamMouseDown(e, 'height', 'y', params.height)} />
      <rect x={right.x + right.w - hw / 2} y={right.y + right.h / 2 - hh} width={hw} height={hh * 2}
        fill="#ff8844" fillOpacity={0.7} rx={2 / zoom} style={{ cursor: 'ew-resize' }}
        onMouseDown={e => handleParamMouseDown(e, 'depth', 'x', params.depth)} />
    </g>
  )
}
