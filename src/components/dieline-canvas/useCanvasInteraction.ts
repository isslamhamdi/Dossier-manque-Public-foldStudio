'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type { BoxParams, ImageLayer } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'
import type { UnfoldResult } from '@/lib/unfold'
import { MM_TO_PX } from './constants'
import type { DragState } from './types'

interface Options {
  dieline: DielineData
  unfoldResult: UnfoldResult | null
  mode: 'fold' | 'unfold'
  params: BoxParams
  imageLayers: ImageLayer[]
  selectedLayerId: string | null
  selectedLayerIds: string[]
  onHoverFace?: (face: string | null) => void
  onSelectLayer?: (id: string | null) => void
  onToggleSelectLayer?: (id: string) => void
  onMoveImageLayer?: (id: string, dx: number, dy: number) => void
  onMoveSelectedLayers?: (dx: number, dy: number) => void
  onUpdateImageLayer?: (id: string, updates: Partial<ImageLayer>) => void
  onParamChange?: (key: keyof BoxParams, value: number) => void
  externalHoveredFace?: string | null
}

export function useCanvasInteraction({
  dieline, unfoldResult, mode, params, imageLayers,
  selectedLayerId, selectedLayerIds,
  onHoverFace, onSelectLayer, onToggleSelectLayer,
  onMoveImageLayer, onMoveSelectedLayers, onUpdateImageLayer, onParamChange,
  externalHoveredFace,
}: Options) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0, px: 0, py: 0 })
  const [spaceDown, setSpaceDown] = useState(false)
  const dragState = useRef<DragState | null>(null)
  const pendingPanRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const didPanRef = useRef(false)
  const panRef = useRef(pan)
  const zoomRef = useRef(zoom)

  // #34: Smart alignment guides — snap lines shown while dragging
  type AlignGuide = { axis: 'x' | 'y'; value: number; type?: 'fold' }
  const [alignGuides, setAlignGuides] = useState<AlignGuide[]>([])
  const [localHoveredFace, setLocalHoveredFace] = useState<string | null>(null)
  const effectiveHoveredFace = localHoveredFace ?? externalHoveredFace ?? null

  // New: snap, cursor, container size
  const [snapEnabled, setSnapEnabled] = useState(false)
  const [cursorMm, setCursorMm] = useState<{ x: number; y: number } | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })

  useEffect(() => { panRef.current = pan }, [pan])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  // Stable refs for callbacks — avoids stale closures in window listeners
  const onMoveImageLayerRef = useRef(onMoveImageLayer)
  const onMoveSelectedLayersRef = useRef(onMoveSelectedLayers)
  const onUpdateImageLayerRef = useRef(onUpdateImageLayer)
  const selectedLayerIdsRef = useRef(selectedLayerIds)
  const imageLayers_ref = useRef(imageLayers)
  const snapEnabledRef = useRef(snapEnabled)
  useEffect(() => { onMoveImageLayerRef.current = onMoveImageLayer }, [onMoveImageLayer])
  useEffect(() => { onMoveSelectedLayersRef.current = onMoveSelectedLayers }, [onMoveSelectedLayers])
  useEffect(() => { onUpdateImageLayerRef.current = onUpdateImageLayer }, [onUpdateImageLayer])
  useEffect(() => { selectedLayerIdsRef.current = selectedLayerIds }, [selectedLayerIds])
  useEffect(() => { imageLayers_ref.current = imageLayers }, [imageLayers])
  useEffect(() => { snapEnabledRef.current = snapEnabled }, [snapEnabled])

  // Window-level drag: active when user is dragging a layer (move/resize/rotate)
  const windowDragCleanupRef = useRef<(() => void) | null>(null)

  // Container ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    const obs = new ResizeObserver(([e]) =>
      setContainerSize({ w: e.contentRect.width, h: e.contentRect.height })
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Cleanup on unmount
  useEffect(() => () => { windowDragCleanupRef.current?.() }, [])

  // Fit view on mount, mode change, and template change — NOT on dimension slider changes
  const hasInitialFit = useRef(false)
  const lastModeRef = useRef(mode)
  const panelCount = dieline.panels.length
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const cw = el.clientWidth || 400
    const ch = el.clientHeight || 400
    const isFirstRender = !hasInitialFit.current
    const modeChanged = mode !== lastModeRef.current
    if (!isFirstRender && !modeChanged && unfoldResult === null) return
    hasInitialFit.current = true
    lastModeRef.current = mode
    if (unfoldResult) {
      const { minX, minY, maxX, maxY } = unfoldResult.bounds
      const uw = maxX - minX || 200
      const uh = maxY - minY || 200
      const fitZoom = Math.min((cw - 80) / uw, (ch - 80) / uh, 2)
      const newZoom = Math.max(fitZoom, 0.1)
      setZoom(newZoom)
      setPan({ x: (cw - uw * newZoom) / 2 - minX * newZoom, y: (ch - uh * newZoom) / 2 - minY * newZoom })
    } else {
      const fitZoom = Math.min((cw - 80) / dieline.svgWidth, (ch - 80) / dieline.svgHeight, 1)
      const newZoom = Math.max(fitZoom, 0.2)
      setZoom(newZoom)
      setPan({ x: (cw - dieline.svgWidth * newZoom) / 2, y: (ch - dieline.svgHeight * newZoom) / 2 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, unfoldResult, panelCount])

  // Spacebar pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.target as HTMLElement)?.isContentEditable) return
      e.preventDefault()
      setSpaceDown(true)
    }
    const up = (e: KeyboardEvent) => { if (e.code === 'Space') setSpaceDown(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // fold-studio:reset-view event
  useEffect(() => {
    const handler = () => handleReset()
    window.addEventListener('fold-studio:reset-view', handler)
    return () => window.removeEventListener('fold-studio:reset-view', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard zoom shortcuts (Ctrl+= / Ctrl+- / Ctrl+0)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey) return
      if (e.key === '=' || e.key === '+') {
        e.preventDefault()
        setZoom(z => Math.min(8, z * 1.25))
      } else if (e.key === '-') {
        e.preventDefault()
        setZoom(z => Math.max(0.1, z / 1.25))
      } else if (e.key === '0') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('fold-studio:reset-view'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleReset() {
    const el = containerRef.current
    if (!el) return
    const cw = el.clientWidth
    const ch = el.clientHeight
    if (mode === 'unfold' && unfoldResult) {
      const { minX, minY, maxX, maxY } = unfoldResult.bounds
      const uw = maxX - minX || 200
      const uh = maxY - minY || 200
      const fitZoom = Math.min((cw - 80) / uw, (ch - 80) / uh, 2)
      const newZoom = Math.max(fitZoom, 0.1)
      setZoom(newZoom)
      setPan({ x: (cw - uw * newZoom) / 2 - minX * newZoom, y: (ch - uh * newZoom) / 2 - minY * newZoom })
    } else {
      const fitZoom = Math.min((cw - 80) / dieline.svgWidth, (ch - 80) / dieline.svgHeight, 1)
      const newZoom = Math.max(fitZoom, 0.2)
      setZoom(newZoom)
      setPan({ x: (cw - dieline.svgWidth * newZoom) / 2, y: (ch - dieline.svgHeight * newZoom) / 2 })
    }
  }

  const zoomIn  = useCallback(() => setZoom(z => Math.min(8, z * 1.25)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(0.1, z / 1.25)), [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setZoom(z => Math.min(8, Math.max(0.2, z * factor)))
  }, [])

  const getHoveredFace = useCallback((svgX: number, svgY: number): string | null => {
    const front = dieline.panels.find(p => p.label === 'Front')
    if (!front) return null
    if (svgX >= front.x && svgX <= front.x + front.w && svgY >= 0 && svgY < front.y) return 'top'
    if (svgX >= front.x && svgX <= front.x + front.w && svgY > front.y + front.h) return 'bottom'
    const faceMap: Record<string, string> = { Left: 'left', Front: 'front', Right: 'right', Back: 'back' }
    for (const panel of dieline.panels) {
      if (!(panel.label in faceMap)) continue
      if (svgX >= panel.x && svgX <= panel.x + panel.w && svgY >= panel.y && svgY <= panel.y + panel.h)
        return faceMap[panel.label]
    }
    return null
  }, [dieline.panels])

  const getLayerCenterClient = useCallback((layer: ImageLayer) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    const z = zoomRef.current
    const p = panRef.current
    const wPx = layer.width * layer.scale * MM_TO_PX
    const hPx = layer.height * layer.scale * MM_TO_PX
    const xPx = layer.x * MM_TO_PX
    const yPx = layer.y * MM_TO_PX
    return {
      x: rect.left + (xPx + wPx / 2) * z + p.x,
      y: rect.top + (yPx + hPx / 2) * z + p.y,
    }
  }, [])

  // Core drag move logic — uses refs so it's safe to call from window listeners
  const applyDragMove = useCallback((clientX: number, clientY: number, shiftKey = false) => {
    const ds = dragState.current
    if (!ds) return

    if (ds.kind === 'move') {
      let dx = (clientX - ds.startX) / (zoomRef.current * MM_TO_PX)
      let dy = (clientY - ds.startY) / (zoomRef.current * MM_TO_PX)
      if (shiftKey) {
        dx = Math.round(dx / 5) * 5; dy = Math.round(dy / 5) * 5
      } else if (snapEnabledRef.current) {
        dx = Math.round(dx); dy = Math.round(dy)
      }

      // Alignment guides
      const layers = imageLayers_ref.current
      const activeLayer = layers.find(l => l.id === ds.id)
      if (activeLayer) {
        const ax = activeLayer.x + dx + (activeLayer.width * activeLayer.scale) / 2
        const ay = activeLayer.y + dy + (activeLayer.height * activeLayer.scale) / 2
        const guides: AlignGuide[] = []
        const SNAP_MM = 2
        for (const other of layers) {
          if (other.id === ds.id) continue
          const ocx = other.x + (other.width * other.scale) / 2
          const ocy = other.y + (other.height * other.scale) / 2
          if (Math.abs(ax - ocx) < SNAP_MM) guides.push({ axis: 'x', value: ocx * MM_TO_PX })
          if (Math.abs(ay - ocy) < SNAP_MM) guides.push({ axis: 'y', value: ocy * MM_TO_PX })
          if (Math.abs(ax - other.x) < SNAP_MM) guides.push({ axis: 'x', value: other.x * MM_TO_PX })
          if (Math.abs(ay - other.y) < SNAP_MM) guides.push({ axis: 'y', value: other.y * MM_TO_PX })
        }
        for (const panel of dieline.panels) {
          const pcx = (panel.x + panel.w / 2) * MM_TO_PX
          const pcy = (panel.y + panel.h / 2) * MM_TO_PX
          if (Math.abs(ax * MM_TO_PX - pcx) < SNAP_MM * MM_TO_PX) guides.push({ axis: 'x', value: pcx })
          if (Math.abs(ay * MM_TO_PX - pcy) < SNAP_MM * MM_TO_PX) guides.push({ axis: 'y', value: pcy })
        }

        // #372: Snap aux lignes de pli
        const FOLD_SNAP = 3
        const coordRe = /[ML]\s*([\d.]+),([\d.]+)/g
        const foldXs = new Set<number>(), foldYs = new Set<number>()
        for (const path of dieline.foldLines) {
          let m: RegExpExecArray | null
          coordRe.lastIndex = 0
          while ((m = coordRe.exec(path)) !== null) {
            foldXs.add(Math.round(parseFloat(m[1]) / MM_TO_PX * 10) / 10)
            foldYs.add(Math.round(parseFloat(m[2]) / MM_TO_PX * 10) / 10)
          }
        }
        for (const fx of Array.from(foldXs)) {
          if (Math.abs(ax - fx) < FOLD_SNAP) {
            guides.push({ axis: 'x', value: fx * MM_TO_PX, type: 'fold' })
            dx += fx - ax
          }
        }
        for (const fy of Array.from(foldYs)) {
          if (Math.abs(ay - fy) < FOLD_SNAP) {
            guides.push({ axis: 'y', value: fy * MM_TO_PX, type: 'fold' })
            dy += fy - ay
          }
        }

        setAlignGuides(guides)
      }

      const ids = selectedLayerIdsRef.current
      if (ids.length > 1 && ids.includes(ds.id) && onMoveSelectedLayersRef.current) {
        onMoveSelectedLayersRef.current(dx, dy)
      } else {
        onMoveImageLayerRef.current?.(ds.id, dx, dy)
      }
      ds.startX = clientX
      ds.startY = clientY

    } else if (ds.kind === 'resize') {
      const dx = clientX - ds.cx
      const dy = clientY - ds.cy
      const currentDist = Math.sqrt(dx * dx + dy * dy)
      if (ds.startDist > 0) {
        onUpdateImageLayerRef.current?.(ds.id, {
          scale: Math.max(0.05, Math.min(5, Math.round(ds.startScale * (currentDist / ds.startDist) * 100) / 100))
        })
      }

    } else if (ds.kind === 'rotate') {
      const dx = clientX - ds.cx
      const dy = clientY - ds.cy
      let newRot = ds.startRotation + (Math.atan2(dy, dx) * 180 / Math.PI - ds.startAngle)
      if (shiftKey) newRot = Math.round(newRot / 15) * 15
      onUpdateImageLayerRef.current?.(ds.id, { rotation: Math.round(newRot) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dieline.panels])

  // Attach window-level mousemove + mouseup during any layer drag
  // This allows drag to continue even when mouse leaves the canvas div
  const startWindowDrag = useCallback(() => {
    windowDragCleanupRef.current?.()

    const onWinMove = (e: MouseEvent) => applyDragMove(e.clientX, e.clientY, e.shiftKey)
    const onWinUp = () => {
      dragState.current = null
      setAlignGuides([])
      windowDragCleanupRef.current?.()
      windowDragCleanupRef.current = null
    }

    window.addEventListener('mousemove', onWinMove)
    window.addEventListener('mouseup', onWinUp)
    windowDragCleanupRef.current = () => {
      window.removeEventListener('mousemove', onWinMove)
      window.removeEventListener('mouseup', onWinUp)
    }
  }, [applyDragMove])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    didPanRef.current = false
    if (e.button === 1 || spaceDown) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX, y: e.clientY, px: pan.x, py: pan.y })
    } else if (e.button === 0) {
      pendingPanRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
    }
  }, [spaceDown, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Pan detection (when no drag is active)
    if (pendingPanRef.current && dragState.current === null && !isPanning) {
      const dx = e.clientX - pendingPanRef.current.x
      const dy = e.clientY - pendingPanRef.current.y
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        setIsPanning(true)
        setPanStart(pendingPanRef.current)
        didPanRef.current = true
        pendingPanRef.current = null
      }
    }

    const ds = dragState.current
    // Param drag (dimension handles) is not handled by window listeners
    if (ds?.kind === 'param' && onParamChange) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      if (ds.axis === 'x') {
        const svgX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current
        const deltaMm = (svgX - ds.startSvgX) / MM_TO_PX
        onParamChange(ds.param, Math.max(10, Math.round(ds.startValue + deltaMm)))
      } else {
        const svgY = (e.clientY - rect.top - panRef.current.y) / zoomRef.current
        const deltaMm = (svgY - ds.startSvgY) / MM_TO_PX
        onParamChange(ds.param, Math.max(10, Math.round(ds.startValue + deltaMm)))
      }
      return
    }

    // Layer drag (move/resize/rotate) is handled by window listeners — skip to avoid double-move
    if (ds) return

    if (!isPanning) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const svgX = (e.clientX - rect.left - panRef.current.x) / zoomRef.current
        const svgY = (e.clientY - rect.top - panRef.current.y) / zoomRef.current
        const face = getHoveredFace(svgX, svgY)
        onHoverFace?.(face)
        setLocalHoveredFace(face)
        setCursorMm({ x: svgX / MM_TO_PX, y: svgY / MM_TO_PX })
      }
      return
    }
    setPan({ x: panStart.px + (e.clientX - panStart.x), y: panStart.py + (e.clientY - panStart.y) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPanning, panStart, onHoverFace, getHoveredFace, onParamChange])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
    pendingPanRef.current = null
    setLocalHoveredFace(null)
    // Clear param drag (dimension handles) — no window listener for those
    if (dragState.current?.kind === 'param') {
      dragState.current = null
    }
    // Safety: clear layer drag too if window listener didn't fire
    if (!windowDragCleanupRef.current) {
      dragState.current = null
      setAlignGuides([])
    }
  }, [])

  const handleImageMouseDown = useCallback((e: React.MouseEvent, layer: ImageLayer) => {
    if (layer.locked) return
    e.stopPropagation()
    if (e.shiftKey) {
      onToggleSelectLayer?.(layer.id)
    } else {
      onSelectLayer?.(layer.id)
    }
    dragState.current = { kind: 'move', id: layer.id, startX: e.clientX, startY: e.clientY }
    startWindowDrag()
  }, [onSelectLayer, onToggleSelectLayer, startWindowDrag])

  const handleCornerMouseDown = useCallback((e: React.MouseEvent, layer: ImageLayer) => {
    e.stopPropagation()
    onSelectLayer?.(layer.id)
    const c = getLayerCenterClient(layer)
    const dx = e.clientX - c.x
    const dy = e.clientY - c.y
    const startDist = Math.sqrt(dx * dx + dy * dy)
    dragState.current = { kind: 'resize', id: layer.id, cx: c.x, cy: c.y, startDist: Math.max(startDist, 1), startScale: layer.scale }
    startWindowDrag()
  }, [onSelectLayer, getLayerCenterClient, startWindowDrag])

  const handleRotateMouseDown = useCallback((e: React.MouseEvent, layer: ImageLayer) => {
    e.stopPropagation()
    onSelectLayer?.(layer.id)
    const c = getLayerCenterClient(layer)
    dragState.current = {
      kind: 'rotate', id: layer.id, cx: c.x, cy: c.y,
      startAngle: Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI,
      startRotation: layer.rotation,
    }
    startWindowDrag()
  }, [onSelectLayer, getLayerCenterClient, startWindowDrag])

  const handleParamMouseDown = useCallback((e: React.MouseEvent, param: keyof BoxParams, axis: 'x' | 'y', startValue: number) => {
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragState.current = {
      kind: 'param', param, axis, startValue,
      startSvgX: (e.clientX - rect.left - panRef.current.x) / zoomRef.current,
      startSvgY: (e.clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }, [])

  const cursorStyle = (() => {
    const ds = dragState.current
    if (ds) {
      if (ds.kind === 'resize') return 'nwse-resize'
      if (ds.kind === 'rotate') return 'crosshair'
      if (ds.kind === 'param') return ds.axis === 'x' ? 'ew-resize' : 'ns-resize'
      return 'grabbing'
    }
    return spaceDown ? (isPanning ? 'grabbing' : 'grab') : 'default'
  })()

  return {
    containerRef, zoom, pan, isPanning, spaceDown, dragState, didPanRef,
    localHoveredFace, effectiveHoveredFace, cursorStyle,
    handleWheel, handleMouseDown, handleMouseMove, handleMouseUp,
    handleImageMouseDown, handleCornerMouseDown, handleRotateMouseDown, handleParamMouseDown,
    handleReset,
    snapEnabled, setSnapEnabled,
    cursorMm,
    containerSize,
    zoomIn, zoomOut,
    alignGuides,
  }
}
