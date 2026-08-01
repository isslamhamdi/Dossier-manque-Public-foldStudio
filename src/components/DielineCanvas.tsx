'use client'

import { useEffect, useMemo, useState, useDeferredValue, useRef } from 'react'
import { computeDieline } from '@/lib/dieline'
import { unfoldMesh } from '@/lib/unfold'
import type { DielineCanvasProps } from './dieline-canvas/types'
import { useCanvasInteraction } from './dieline-canvas/useCanvasInteraction'
import { useExport } from './dieline-canvas/useExport'
import { useFreehandAnnotations } from './dieline-canvas/useFreehandAnnotations'
import { DielineToolbar } from './dieline-canvas/DielineToolbar'
import { FoldDielineSVG } from './dieline-canvas/FoldDielineSVG'
import { UnfoldDielineSVG } from './dieline-canvas/UnfoldDielineSVG'
import { HiddenExportSVG } from './dieline-canvas/HiddenExportSVG'
import { Rulers } from './dieline-canvas/Rulers'
import { MM_TO_PX, RULER_H } from './dieline-canvas/constants'
import type { UnitType } from './left-panel/ui'

const PT_PER_MM = 2.834645669
function fmtCursorPos(mm: number, unit: UnitType): string {
  if (unit === 'cm') return (mm / 10).toFixed(2)
  if (unit === 'in') return (mm / 25.4).toFixed(3)
  if (unit === 'pt') return (mm * PT_PER_MM).toFixed(1)
  return mm.toFixed(1)
}

export default function DielineCanvas({
  params, layers, onLayerToggle, mode = 'fold', objContent = null,
  importedSvg = null,
  imageLayers = [], selectedLayerId = null, selectedLayerIds = [],
  onSelectLayer, onToggleSelectLayer, onMoveImageLayer, onMoveSelectedLayers,
  onUpdateImageLayer, onHoverFace, externalHoveredFace, onParamChange,
  activeTemplate = 'box', unit = 'mm',
}: DielineCanvasProps) {
  // useDeferredValue tells React this computation is low-priority — React 18 will
  // batch and defer it behind urgent user interactions (slider thumb movement)
  const deferredParams = useDeferredValue(params)
  const dieline = useMemo(() => computeDieline(deferredParams, activeTemplate), [deferredParams, activeTemplate])
  const unfoldResult = useMemo(() => objContent ? unfoldMesh(objContent, 200) : null, [objContent])

  // Blob URL for imported SVG (revoked on cleanup)
  const importedSvgUrl = useMemo(() => {
    if (!importedSvg) return null
    const blob = new Blob([importedSvg.raw], { type: 'image/svg+xml' })
    return URL.createObjectURL(blob)
  }, [importedSvg])
  const prevUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
    prevUrlRef.current = importedSvgUrl
  }, [importedSvgUrl])

  const interaction = useCanvasInteraction({
    dieline, unfoldResult, mode, params, imageLayers,
    selectedLayerId, selectedLayerIds,
    onHoverFace, onSelectLayer, onToggleSelectLayer,
    onMoveImageLayer, onMoveSelectedLayers, onUpdateImageLayer, onParamChange,
    externalHoveredFace,
  })

  const exportCtx = useExport({ dieline, imageLayers, layers, params })
  const ann = useFreehandAnnotations()
  const [showBleedOverlay, setShowBleedOverlay] = useState(false)
  const [showSafeZone, setShowSafeZone] = useState(false)
  const [dieineLocked, setDieineLocked] = useState(false)

  const { zoom, pan } = interaction
  const minorPx = MM_TO_PX * zoom
  const majorPx = 10 * MM_TO_PX * zoom

  const btnStyle = { background: 'none', border: 'none', padding: '4px 8px', fontSize: 11, color: '#555', cursor: 'pointer', fontFamily: 'system-ui,sans-serif', fontWeight: 500, lineHeight: 1 } as const

  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f5f3ef' }}>
      <DielineToolbar
        mode={mode} layers={layers} onLayerToggle={onLayerToggle}
        onReset={interaction.handleReset}
        showExportMenu={exportCtx.showExportMenu}
        setShowExportMenu={exportCtx.setShowExportMenu}
        handleDownloadPNG={exportCtx.handleDownloadPNG}
        handleDownloadSVG={exportCtx.handleDownloadSVG}
        handleDownloadPDF={exportCtx.handleDownloadPDF}
        handleDownloadFold={exportCtx.handleDownloadFold}
        handleDownloadDxf={exportCtx.handleDownloadDxf}
        handleDownloadPrintPdf={exportCtx.handleDownloadPrintPdf}
        snapEnabled={interaction.snapEnabled}
        showBleedOverlay={showBleedOverlay}
        onBleedOverlayToggle={() => setShowBleedOverlay(v => !v)}
        showSafeZone={showSafeZone}
        onSafeZoneToggle={() => setShowSafeZone(v => !v)}
        annotationMode={ann.annotationMode}
        onAnnotationToggle={() => ann.setAnnotationMode(v => !v)}
        onAnnotationUndo={ann.undoLastStroke}
        onAnnotationClear={ann.clearAnnotations}
        penColor={ann.penColor}
        onPenColorChange={ann.setPenColor}
        onSnapToggle={() => interaction.setSnapEnabled(v => !v)}
        dieineLocked={dieineLocked}
        onDielineLockToggle={() => setDieineLocked(v => !v)}
      />

      <div
        ref={interaction.containerRef}
        onWheel={interaction.handleWheel}
        onMouseDown={interaction.handleMouseDown}
        onMouseMove={interaction.handleMouseMove}
        onMouseUp={interaction.handleMouseUp}
        onMouseLeave={() => {
          // Don't cancel layer drag on leave — window listener handles mouseup
          if (!interaction.dragState.current) interaction.handleMouseUp()
          onHoverFace?.(null)
        }}
        onClick={() => { if (!interaction.didPanRef.current) onSelectLayer?.(null) }}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#f5f3ef', cursor: interaction.cursorStyle }}
      >
        {/* Dieline lock overlay */}
        {dieineLocked && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none', outline: '2px solid rgba(239,68,68,0.6)', borderRadius: 2 }}>
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(239,68,68,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Structure verrouillée
            </div>
          </div>
        )}

        {/* Face hover badge */}
        {mode !== 'unfold' && interaction.effectiveHoveredFace && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 20, pointerEvents: 'none',
            background: 'rgba(30,30,40,0.78)', backdropFilter: 'blur(6px)',
            color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
            padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase',
          }}>
            {{ front: 'FACE', back: 'DOS', left: 'CÔTÉ G.', right: 'CÔTÉ D.', top: 'COUVERCLE', bottom: 'FOND' }[interaction.effectiveHoveredFace] ?? interaction.effectiveHoveredFace}
          </div>
        )}

        {/* Line types legend */}
        {mode !== 'unfold' && (
          <div style={{
            position: 'absolute', top: RULER_H + 10, left: 10, zIndex: 10,
            background: 'rgba(255,255,255,0.96)',
            border: '1px solid #e4e0dc', borderRadius: 7,
            padding: '8px 12px', pointerEvents: 'none',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#aaa', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 7 }}>Types de lignes</div>
            {[
              { label: 'Découpe', color: '#e91e8c', dash: false },
              { label: 'Pli montagne', color: '#4488ff', dash: true },
              { label: 'Fond perdu', color: '#ff8800', dash: true },
              { label: 'Collage', color: '#b0b0b0', dash: false },
            ].map(({ label, color, dash }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <svg width="22" height="6" viewBox="0 0 22 6">
                  {dash ? <path d="M0 3 L22 3" stroke={color} strokeWidth="1.5" strokeDasharray="4 2" /> : <line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.8" />}
                </svg>
                <span style={{ fontSize: 9, color: '#555', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Main SVG */}
        <svg width="100%" height="100%" style={{ display: 'block', position: 'absolute', inset: 0 }}>
          <defs>
            <pattern id="minor-grid" width={minorPx} height={minorPx} patternUnits="userSpaceOnUse" x={pan.x % minorPx} y={pan.y % minorPx}>
              <path d={`M ${minorPx} 0 L 0 0 0 ${minorPx}`} fill="none" stroke="rgba(100,90,80,0.08)" strokeWidth="0.5" />
            </pattern>
            <pattern id="major-grid" width={majorPx} height={majorPx} patternUnits="userSpaceOnUse" x={pan.x % majorPx} y={pan.y % majorPx}>
              <rect width={majorPx} height={majorPx} fill="url(#minor-grid)" />
              <path d={`M ${majorPx} 0 L 0 0 0 ${majorPx}`} fill="none" stroke="rgba(100,90,80,0.16)" strokeWidth="0.5" />
            </pattern>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#ccc" strokeWidth="1" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#major-grid)" />

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Freehand annotations overlay */}
            {ann.annotations.map(a => (
              <path key={a.id} d={a.path} fill={a.color} opacity={0.85} />
            ))}

            {/* Alignment guides */}
            {interaction.alignGuides.map((g, i) => {
              const color = g.type === 'fold' ? '#ff6600' : '#e91e8c'
              return g.axis === 'x'
                ? <line key={i} x1={g.value} y1={-9999} x2={g.value} y2={99999} stroke={color} strokeWidth={0.8 / zoom} strokeDasharray={`${4 / zoom} ${3 / zoom}`} opacity={0.7} pointerEvents="none" />
                : <line key={i} x1={-9999} y1={g.value} x2={99999} y2={g.value} stroke={color} strokeWidth={0.8 / zoom} strokeDasharray={`${4 / zoom} ${3 / zoom}`} opacity={0.7} pointerEvents="none" />
            })}

            {/* Imported SVG overlay — shown when a dieline SVG has been imported */}
            {importedSvgUrl && importedSvg && mode !== 'unfold' && (
              <image
                href={importedSvgUrl}
                x={0} y={0}
                width={importedSvg.widthMm * MM_TO_PX}
                height={importedSvg.heightMm * MM_TO_PX}
                style={{ imageRendering: 'crisp-edges' } as React.CSSProperties}
              />
            )}

            {!importedSvg && mode !== 'unfold' && (
              <FoldDielineSVG
                params={deferredParams} dieline={dieline} layers={layers}
                imageLayers={imageLayers} zoom={zoom} unit={unit}
                effectiveHoveredFace={interaction.effectiveHoveredFace}
                selectedLayerId={selectedLayerId} selectedLayerIds={selectedLayerIds}
                showBleedOverlay={showBleedOverlay} showSafeZone={showSafeZone}
                onParamChange={onParamChange}
                handleImageMouseDown={interaction.handleImageMouseDown}
                handleCornerMouseDown={interaction.handleCornerMouseDown}
                handleRotateMouseDown={interaction.handleRotateMouseDown}
                handleParamMouseDown={interaction.handleParamMouseDown}
              />
            )}
            {mode === 'unfold' && unfoldResult && (
              <UnfoldDielineSVG unfoldResult={unfoldResult} zoom={zoom} />
            )}
          </g>
        </svg>

        <Rulers zoom={zoom} pan={pan} containerSize={interaction.containerSize} cursorMm={interaction.cursorMm} unit={unit} />

        <HiddenExportSVG svgRef={exportCtx.svgRef} dieline={dieline} imageLayers={imageLayers} layers={layers} />

        {/* Unfold empty state */}
        {mode === 'unfold' && !objContent && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="#c8b8a0" strokeWidth="1.4">
              <path d="M18 4L32 12V24L18 32L4 24V12L18 4Z" strokeLinejoin="round"/>
              <path d="M18 4v28M4 12l14 8 14-8" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: '#b0a090', fontWeight: 500, marginTop: 12 }}>Import an .obj file to get started</span>
          </div>
        )}

        {/* Bottom bar */}
        <div style={{ position: 'absolute', bottom: 10, left: RULER_H + 8, display: 'flex', alignItems: 'center', gap: 0, zIndex: 10, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', border: '1px solid #e4e0dc', borderRadius: 5, overflow: 'hidden' }}>
          <button onClick={interaction.zoomOut} title="Zoom arrière (⌘-)" className="fs-btn-ghost" style={btnStyle}>−</button>
          <button onClick={interaction.handleReset} title="Réinitialiser la vue (⌘0)" className="fs-btn-ghost" style={btnStyle}>{Math.round(zoom * 100)}%</button>
          <button onClick={interaction.zoomIn} title="Zoom avant (⌘+)" className="fs-btn-ghost" style={btnStyle}>+</button>
          {interaction.cursorMm && (
            <span style={{ fontSize: 9, color: '#999', fontFamily: 'monospace', paddingRight: 7, paddingLeft: 5, borderLeft: '1px solid #e4e0dc', whiteSpace: 'nowrap' }}>
              {fmtCursorPos(interaction.cursorMm.x, unit)}, {fmtCursorPos(interaction.cursorMm.y, unit)} {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
