'use client'

import type { UnfoldResult, Vec2 } from '@/lib/unfold'

interface UnfoldDielineSVGProps {
  unfoldResult: UnfoldResult
  zoom: number
}

function toPath(pts: Vec2[]) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
}

export function UnfoldDielineSVG({ unfoldResult, zoom }: UnfoldDielineSVGProps) {
  return (
    <g>
      {unfoldResult.faces.map((f, i) => (
        <path key={`face-${i}`} d={toPath(f.vertices)} fill="rgba(245,243,239,0.9)" stroke="none" />
      ))}
      {unfoldResult.glueTabs.map((tab, i) => (
        <g key={`tab-${i}`}>
          <path d={toPath(tab)} fill="url(#hatch)" stroke="none" opacity={0.5} />
          <path d={toPath(tab)} fill="none" stroke="#e91e8c" strokeWidth={0.8 / zoom} strokeDasharray={`${2/zoom} ${2/zoom}`} />
          <text
            x={(tab[0].x + tab[1].x + tab[2].x + tab[3].x) / 4}
            y={(tab[0].y + tab[1].y + tab[2].y + tab[3].y) / 4}
            textAnchor="middle" dominantBaseline="middle"
            fill="#ccc" fontSize={5 / zoom} fontFamily="system-ui,sans-serif" letterSpacing="0.3"
          >PLIAGE</text>
        </g>
      ))}
      {unfoldResult.foldLines.map(([a, b], i) => (
        <line key={`fold-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#4488ff" strokeWidth={1 / zoom} strokeDasharray={`${4/zoom} ${2/zoom}`} />
      ))}
      {unfoldResult.cutLines.map(([a, b], i) => (
        <line key={`cut-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#e91e8c" strokeWidth={1.5 / zoom} strokeLinecap="round" />
      ))}
    </g>
  )
}
