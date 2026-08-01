'use client'

import type { RefObject } from 'react'
import type { DielineData } from '@/lib/dieline'
import type { ImageLayer, LayerVisibility } from '@/lib/types'
import { MM_TO_PX } from './constants'

interface HiddenExportSVGProps {
  svgRef: RefObject<SVGSVGElement>
  dieline: DielineData
  imageLayers: ImageLayer[]
  layers: LayerVisibility
}

export function HiddenExportSVG({ svgRef, dieline, imageLayers, layers }: HiddenExportSVGProps) {
  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      width={dieline.svgWidth}
      height={dieline.svgHeight}
      viewBox={`0 0 ${dieline.svgWidth} ${dieline.svgHeight}`}
      style={{ display: 'none' }}
    >
      <defs>
        <pattern id="hatch-dl" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#ccc" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={dieline.svgWidth} height={dieline.svgHeight} fill="white" />
      {imageLayers.filter(l => l.visible).map(layer => (
        <image
          key={layer.id}
          href={layer.src}
          x={layer.x * MM_TO_PX}
          y={layer.y * MM_TO_PX}
          width={layer.width * layer.scale * MM_TO_PX}
          height={layer.height * layer.scale * MM_TO_PX}
        />
      ))}
      {layers.fondPerdu && <path d={dieline.bleedPath} fill="none" stroke="#ff8800" strokeWidth="0.8" strokeDasharray="6 3" />}
      {layers.collage && dieline.gluePaths.map((p, i) => <path key={i} d={p} fill="url(#hatch-dl)" stroke="#bbb" strokeWidth="0.5" />)}
      {layers.pli && dieline.foldLines.map((line, i) => <path key={i} d={line} fill="none" stroke="#4488ff" strokeWidth="1" strokeDasharray="5 3" />)}
      {layers.decoupe && <path d={dieline.cutPath} fill="rgba(233,30,140,0.04)" stroke="#e91e8c" strokeWidth="1.5" strokeLinejoin="round" />}
    </svg>
  )
}
