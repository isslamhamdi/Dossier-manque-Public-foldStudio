'use client'

import type { ImageLayer } from '@/lib/types'
import { MM_TO_PX } from './constants'

interface ImageLayersSVGProps {
  imageLayers: ImageLayer[]
  zoom: number
  selectedLayerId: string | null
  selectedLayerIds: string[]
  handleImageMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
  handleCornerMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
  handleRotateMouseDown: (e: React.MouseEvent, layer: ImageLayer) => void
}

export function ImageLayersSVG({
  imageLayers, zoom, selectedLayerId, selectedLayerIds,
  handleImageMouseDown, handleCornerMouseDown, handleRotateMouseDown,
}: ImageLayersSVGProps) {
  return (
    <>
      {imageLayers.filter(l => l.visible).map(layer => {
        const xPx = layer.x * MM_TO_PX, yPx = layer.y * MM_TO_PX
        const wPx = layer.width * layer.scale * MM_TO_PX, hPx = layer.height * layer.scale * MM_TO_PX
        const cxPx = xPx + wPx / 2, cyPx = yPx + hPx / 2
        const isSelected = layer.id === selectedLayerId
        const isInGroup = selectedLayerIds.includes(layer.id) && selectedLayerIds.length > 1
        const pf = layer.patternFill
        const patternId = `pattern-${layer.id}`
        const sizePx = (pf?.size ?? 10) * MM_TO_PX
        const clipId = `clip-${layer.id}`
        const spotId = `spot-${layer.id}`

        // #28: Spot ink hatch pattern color
        const SPOT_COLORS: Record<string, string> = {
          gold: '#c9a030', silver: '#a0a8b0', varnish: '#90b0e8', uv: '#c060f0', emboss: '#8888aa',
        }
        const spotColor = layer.spotInk && layer.spotInk !== 'none' ? SPOT_COLORS[layer.spotInk] : null

        return (
          <g key={layer.id} opacity={layer.opacity ?? 1}
             style={{ mixBlendMode: (layer.blendMode as React.CSSProperties['mixBlendMode']) ?? 'normal' }}>
            {pf?.enabled && pf.type !== 'none' && (
              <defs>
                <pattern id={patternId} x={0} y={0} width={sizePx} height={sizePx} patternUnits="userSpaceOnUse"
                  patternTransform={`rotate(${pf.angle ?? 0} ${cxPx} ${cyPx})`}>
                  {pf.type === 'dots' && (
                    <circle cx={sizePx / 2} cy={sizePx / 2} r={sizePx / 6} fill={pf.color} />
                  )}
                  {pf.type === 'stripes' && (
                    <line x1={0} y1={0} x2={0} y2={sizePx} stroke={pf.color} strokeWidth={sizePx / 4} />
                  )}
                  {pf.type === 'crosshatch' && (
                    <>
                      <line x1={0} y1={0} x2={0} y2={sizePx} stroke={pf.color} strokeWidth={sizePx / 8} />
                      <line x1={0} y1={0} x2={sizePx} y2={0} stroke={pf.color} strokeWidth={sizePx / 8} />
                    </>
                  )}
                  {pf.type === 'repeat' && (
                    <image href={layer.src} x={0} y={0} width={sizePx} height={sizePx} preserveAspectRatio="xMidYMid slice" />
                  )}
                </pattern>
              </defs>
            )}
            {pf?.enabled && pf.type !== 'none' && (
              <rect x={xPx} y={yPx} width={wPx} height={hPx} fill={`url(#${patternId})`}
                style={{ transformOrigin: `${cxPx}px ${cyPx}px`, transform: `rotate(${layer.rotation}deg)` }}
                pointerEvents="none" />
            )}
            {layer.clipMask && (
              <defs>
                <clipPath id={clipId}>
                  <rect x={xPx} y={yPx} width={wPx} height={hPx} />
                </clipPath>
              </defs>
            )}
            {/* #28: Spot ink hatch defs */}
            {spotColor && (
              <defs>
                <pattern id={spotId} x={0} y={0} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform={`rotate(45 ${cxPx} ${cyPx})`}>
                  <line x1={0} y1={0} x2={0} y2={6} stroke={spotColor} strokeWidth={1.5} opacity={0.55} />
                </pattern>
              </defs>
            )}
            <g transform={`rotate(${layer.rotation}, ${cxPx}, ${cyPx})`}>
              <image
                href={layer.src} x={xPx} y={yPx} width={wPx} height={hPx}
                preserveAspectRatio="xMidYMid meet"
                clipPath={layer.clipMask ? `url(#${clipId})` : undefined}
                transform={layer.flipH || layer.flipV ? `scale(${layer.flipH ? -1 : 1}, ${layer.flipV ? -1 : 1})` : undefined}
                style={{ transformOrigin: `${cxPx}px ${cyPx}px`, cursor: layer.locked ? 'default' : 'move' }}
                onMouseDown={e => handleImageMouseDown(e, layer)}
                onClick={e => e.stopPropagation()}
              />
              {/* #28: Spot ink overlay */}
              {spotColor && (
                <rect x={xPx} y={yPx} width={wPx} height={hPx}
                  fill={`url(#${spotId})`} pointerEvents="none"
                  style={{ transformOrigin: `${cxPx}px ${cyPx}px` }} />
              )}
            </g>
            {isInGroup && !isSelected && (
              <rect x={xPx} y={yPx} width={wPx} height={hPx}
                fill="rgba(68,136,255,0.06)" stroke="#4488ff"
                strokeWidth={1.2 / zoom} strokeDasharray={`${5 / zoom} ${2 / zoom}`}
                pointerEvents="none" />
            )}
            {isSelected && (
              <>
                <rect x={xPx} y={yPx} width={wPx} height={hPx}
                  fill="none" stroke="#e91e8c"
                  strokeWidth={1.5 / zoom} strokeDasharray={`${6 / zoom} ${3 / zoom}`}
                  pointerEvents="none" />
                {[{ x: xPx, y: yPx }, { x: xPx + wPx, y: yPx }, { x: xPx + wPx, y: yPx + hPx }, { x: xPx, y: yPx + hPx }]
                  .map((pt, hi) => (
                    <circle key={`corner-${hi}`} cx={pt.x} cy={pt.y} r={5 / zoom}
                      fill="#1a1a1a" stroke="white" strokeWidth={1.5 / zoom}
                      style={{ cursor: 'nwse-resize' }}
                      onMouseDown={e => { if (!layer.locked) handleCornerMouseDown(e, layer) }}
                      onClick={e => e.stopPropagation()}
                    />
                  ))
                }
                {(() => {
                  const offset = 14 / zoom, s = 5 / zoom
                  return [
                    { x: cxPx, y: yPx - offset },
                    { x: xPx + wPx + offset, y: cyPx },
                    { x: cxPx, y: yPx + hPx + offset },
                    { x: xPx - offset, y: cyPx },
                  ].map((pt, di) => (
                    <polygon key={`rot-${di}`}
                      points={`${pt.x},${pt.y - s} ${pt.x + s},${pt.y} ${pt.x},${pt.y + s} ${pt.x - s},${pt.y}`}
                      fill="white" stroke="#e91e8c" strokeWidth={1.5 / zoom}
                      style={{ cursor: 'crosshair' }}
                      onMouseDown={e => { if (!layer.locked) handleRotateMouseDown(e, layer) }}
                      onClick={e => e.stopPropagation()}
                    />
                  ))
                })()}
              </>
            )}
          </g>
        )
      })}
    </>
  )
}
