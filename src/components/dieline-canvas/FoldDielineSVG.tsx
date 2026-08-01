'use client'

import type { BoxParams, LayerVisibility, ImageLayer } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'
import type { UnitType } from '@/components/left-panel/ui'
import { MM_TO_PX } from './constants'
import { ImageLayersSVG } from './ImageLayersSVG'
import { FoldLinesSVG } from './FoldLinesSVG'
import { DimensionAnnotations } from './DimensionAnnotations'
import { ResizeHandles } from './ResizeHandles'

interface FoldDielineSVGProps {
  params: BoxParams
  dieline: DielineData
  layers: LayerVisibility
  imageLayers: ImageLayer[]
  zoom: number
  unit?: UnitType
  effectiveHoveredFace: string | null
  selectedLayerId: string | null
  selectedLayerIds: string[]
  showBleedOverlay?: boolean
  showSafeZone?: boolean
  onParamChange?: (key: keyof BoxParams, value: number) => void
  handleImageMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
  handleCornerMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
  handleRotateMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
  handleParamMouseDown: (e: React.MouseEvent, param: keyof BoxParams, axis: 'x' | 'y', startValue: number) => void
}

export function FoldDielineSVG({
  params, dieline, layers, imageLayers, zoom, unit = 'mm',
  effectiveHoveredFace, selectedLayerId, selectedLayerIds,
  showBleedOverlay = false, showSafeZone = false,
  onParamChange, handleImageMouseDown, handleCornerMouseDown,
  handleRotateMouseDown, handleParamMouseDown,
}: FoldDielineSVGProps) {
  const bPx = params.bleed * MM_TO_PX
  const px4 = 4 / zoom
  const rx = 4 / zoom

  return (
    <>
      {/* Drop shadow + paper sheet */}
      <rect x={-bPx - px4 + 3 / zoom} y={-bPx - px4 + 5 / zoom} width={dieline.svgWidth + px4 * 2} height={dieline.svgHeight + px4 * 2} fill="rgba(0,0,0,0.06)" rx={rx} />
      <rect x={-bPx - px4} y={-bPx - px4} width={dieline.svgWidth + px4 * 2} height={dieline.svgHeight + px4 * 2} fill="white" stroke="#dedad4" strokeWidth={0.8 / zoom} rx={rx} />

      {/* Face hover highlights */}
      {effectiveHoveredFace && (() => {
        const faceMap: Record<string, string> = { left: 'Left', front: 'Front', right: 'Right', back: 'Back' }
        const frontPanel = dieline.panels.find(p => p.label === 'Front')
        if (effectiveHoveredFace === 'top' && frontPanel) {
          return <rect x={frontPanel.x} y={0} width={frontPanel.w} height={frontPanel.y} fill="rgba(100,180,255,0.18)" pointerEvents="none" />
        }
        if (effectiveHoveredFace === 'bottom' && frontPanel) {
          const btmY = frontPanel.y + frontPanel.h
          return <rect x={frontPanel.x} y={btmY} width={frontPanel.w} height={dieline.svgHeight - btmY} fill="rgba(100,180,255,0.18)" pointerEvents="none" />
        }
        const panel = dieline.panels.find(p => p.label === faceMap[effectiveHoveredFace])
        if (!panel) return null
        return <rect x={panel.x} y={panel.y} width={panel.w} height={panel.h} fill="rgba(100,180,255,0.18)" pointerEvents="none" />
      })()}

      {/* Bleed */}
      {layers.fondPerdu && (
        <path d={dieline.bleedPath} fill="none" stroke="#ff8800" strokeWidth={0.8 / zoom} strokeDasharray={`${6 / zoom} ${3 / zoom}`} pointerEvents="none" />
      )}

      {/* Glue areas */}
      {layers.collage && dieline.gluePaths.map((p, i) => (
        <path key={i} d={p} fill="url(#hatch)" stroke="#bbb" strokeWidth={0.5 / zoom} pointerEvents="none" />
      ))}

      <FoldLinesSVG dieline={dieline} layers={layers} params={params} zoom={zoom} />

      {/* Cut path */}
      {layers.decoupe && (
        <path d={dieline.cutPath} fill="rgba(233,30,140,0.04)" stroke="#e91e8c" strokeWidth={1.5 / zoom} strokeLinejoin="round" pointerEvents="none" />
      )}

      {/* Image layers — rendered above structural lines so mouse events reach them */}
      <ImageLayersSVG
        imageLayers={imageLayers} zoom={zoom}
        selectedLayerId={selectedLayerId} selectedLayerIds={selectedLayerIds}
        handleImageMouseDown={handleImageMouseDown}
        handleCornerMouseDown={handleCornerMouseDown}
        handleRotateMouseDown={handleRotateMouseDown}
      />

      {/* Bleed zone overlay */}
      {showBleedOverlay && (
        <rect
          x={-bPx} y={-bPx}
          width={dieline.svgWidth + bPx * 2} height={dieline.svgHeight + bPx * 2}
          fill="none" stroke="#e53935" strokeWidth={1.2 / zoom}
          strokeDasharray={`${5/zoom} ${3/zoom}`} pointerEvents="none"
        />
      )}
      {showBleedOverlay && (
        <rect x={-bPx} y={-bPx} width={dieline.svgWidth + bPx * 2} height={dieline.svgHeight + bPx * 2}
          fill="rgba(229,57,53,0.04)" pointerEvents="none" />
      )}

      {/* Safe zone overlay — 3mm inside cut */}
      {showSafeZone && (() => {
        const safeInset = 3 * MM_TO_PX
        return dieline.panels.filter(p => p.label !== 'Glue').map((panel, i) => (
          <rect key={i}
            x={panel.x + safeInset} y={panel.y + safeInset}
            width={Math.max(0, panel.w - safeInset * 2)} height={Math.max(0, panel.h - safeInset * 2)}
            fill="none" stroke="#2196f3" strokeWidth={0.7/zoom}
            strokeDasharray={`${4/zoom} ${2/zoom}`} pointerEvents="none" opacity={0.6}
          />
        ))
      })()}

      {/* Panel labels */}
      {dieline.panels.map((panel, i) => {
        const PANEL_FR: Record<string, string> = { Front: 'FACE', Back: 'DOS', Left: 'CÔTÉ', Right: 'CÔTÉ', Top: 'COUVERCLE', Bottom: 'FOND' }
        const isGlue = panel.label === 'Glue'
        const labelText = isGlue ? 'COLLAGE' : (PANEL_FR[panel.label] ?? panel.label.toUpperCase())
        const fs = Math.max(7, Math.min(12, panel.w * 0.12)) / zoom
        return (
          <g key={i} pointerEvents="none">
            {!isGlue && (
              <rect x={panel.x + 1/zoom} y={panel.y + 1/zoom} width={panel.w - 2/zoom} height={panel.h - 2/zoom}
                fill="rgba(233,30,140,0.02)" rx={2/zoom} />
            )}
            <text x={panel.x + panel.w / 2} y={isGlue ? panel.y + panel.h / 2 - 8 / zoom : panel.y + panel.h / 2}
              textAnchor="middle" dominantBaseline="middle"
              fill={isGlue ? '#bbb' : '#b0a898'} fontSize={fs}
              fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing={1 / zoom}>
              {labelText}
            </text>
            {isGlue && (
              <text x={panel.x + panel.w / 2} y={panel.y + panel.h / 2 + 8 / zoom}
                textAnchor="middle" dominantBaseline="middle"
                fill="#ccc" fontSize={Math.max(6, 8 / zoom)} fontFamily="system-ui, sans-serif">
                {unit === 'cm' ? `${(params.glueTab/10).toFixed(1)}cm` : unit === 'in' ? `${(params.glueTab/25.4).toFixed(2)}in` : unit === 'pt' ? `${Math.round(params.glueTab*2.835)}pt` : `${Math.round(params.glueTab)}mm`}
              </text>
            )}
          </g>
        )
      })}

      <DimensionAnnotations dieline={dieline} params={params} zoom={zoom} unit={unit} />

      {onParamChange && (
        <ResizeHandles dieline={dieline} params={params} zoom={zoom} handleParamMouseDown={handleParamMouseDown} />
      )}
    </>
  )
}
