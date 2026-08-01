'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { gsap } from 'gsap'
import Nav from '@/components/Nav'
const LeftPanel = dynamic(() => import('@/components/LeftPanel'), { ssr: false })
const ToolbarStripDynamic = dynamic(() => import('@/components/ToolbarStrip').then(m => ({ default: m.ToolbarStrip })), { ssr: false })
import type { ToolCategory } from '@/components/ToolbarStrip'
import DielineCanvas from '@/components/DielineCanvas'
import RenderPanel from '@/components/RenderPanel'
import TemplateModal from '@/components/TemplateModal'
import type { BoxParams, LayerVisibility, TemplateType, MaterialColors } from '@/lib/types'
import { preloadTextures } from '@/lib/textures'
import { useFoldAnimation } from './_page/useFoldAnimation'
import { usePhysicsFold } from './_page/usePhysicsFold'
import { useVideoExport } from './_page/useVideoExport'
import { VideoExportOverlay } from './_page/VideoExportOverlay'
import { useMultiAngleExport } from './_page/useMultiAngleExport'
import { useTheme } from './_page/useTheme'
import { useBrandKit } from './_page/useBrandKit'
import { BrandKitPanel } from './_page/BrandKitPanel'
import { BatchGenerator } from './_page/BatchGenerator'
import { VersionCompare } from './_page/VersionCompare'
import { KeyboardShortcutsPanel } from './_page/KeyboardShortcutsPanel'
import { useHistory } from './_page/useHistory'
import { useProjects } from './_page/useProjects'
import { useLocale } from './_page/useLocale'
import { ProjectsPanel } from './_page/ProjectsPanel'
import { AnnotationLayer } from './_page/AnnotationLayer'
import { ProofingModeOverlay } from './_page/ProofingMode'
import { ARPreviewButton } from './_page/ARPreviewButton'
import { VariantCompare } from './_page/VariantCompare'
import type { Annotation } from './_page/AnnotationLayer'
import { useLocalPersistence } from './_page/useLocalPersistence'
import { useCollaboration } from './_page/useCollaboration'
import { useImageLayers } from './_page/useImageLayers'
import { usePanelLayout, DEFAULT_LEFT_W, DEFAULT_CENTER_W, DEFAULT_RENDER_W } from './_page/usePanelLayout'
import { useMaterials } from './_page/useMaterials'
import { MaterialsPanel } from './_page/MaterialsPanel'
import { MatControlsPanel } from './_page/MatControlsPanel'
import { DEFAULT_MAT_CONTROLS } from '@/lib/matControls'
import type { MatControls } from '@/lib/matControls'
import { ThreeToolbar } from './_page/ThreeToolbar'
import { FoldProgressBar } from './_page/FoldProgressBar'
import { ThreeViewHeader } from './_page/ThreeViewHeader'
import { DimensionBar } from './_page/DimensionBar'
import { ObjEmptyState } from './_page/ObjEmptyState'
import { ClientPortal } from './_page/ClientPortal'
import { StructuralEditor } from './_page/StructuralEditor'
import { ShopifyPanel } from './_page/ShopifyPanel'
import { PrintSubmitPanel } from './_page/PrintSubmitPanel'
import { LIGHTING_DEFAULTS, POST_FX_DEFAULTS, TEXT3D_DEFAULTS, SCENE_CAMERA_DEFAULTS, useScrollFold } from '@/lib/threeDefaults'
import type { LightingConfig } from '@/components/three-scene/AdvancedLighting'
import type { PostFXConfig } from '@/components/three-scene/EffectsLayer'
import type { Text3DConfig } from '@/components/three-scene/Text3DLayer'
import type { SceneCameraConfig } from '@/components/left-panel/SceneCameraSection'
import type { FoldNode } from '@/lib/dieline/helpers'
import type { ImportedSvgInfo } from '@/components/dieline-canvas/types'
import { buildPacklyFoldNode } from '@/lib/dieline/packlyFoldNodes'

const ThreeScene = dynamic(() => import('@/components/ThreeScene'), { ssr: false })

const DEFAULT_PARAMS: BoxParams = { width: 100, height: 60, depth: 40, glueTab: 15, thickness: 0.5, bleed: 3 }
const DEFAULT_LAYERS: LayerVisibility = { decoupe: true, pli: true, collage: true, fondPerdu: true }

export default function FoldStudio() {
  const [activeTab, setActiveTab] = useState<'fold' | 'unfold'>('fold')
  const [params, setParams] = useState<BoxParams>(DEFAULT_PARAMS)
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS)
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('box')
  const [unit, setUnit] = useState<import('@/components/left-panel/ui').UnitType>('mm')
  const [showTemplates, setShowTemplates] = useState(false)
  const [objContent, setObjContent] = useState<string | null>(null)
  const [unfoldView, setUnfoldView] = useState<'mesh' | 'folded'>('folded')
  const [showGrid, setShowGrid] = useState(true)
  const [wireframe, setWireframe] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)
  const [hoveredFace, setHoveredFace] = useState<string | null>(null)
  const [renderScene, setRenderScene] = useState<import('@/components/ThreeScene').RenderSceneKey>('studio_white')
  const [customScene, setCustomScene] = useState<import('@/components/ThreeScene').CustomSceneConfig>({
    bg: '#e8e8e8', floorColor: '#d0d0d0', floorRoughness: 0.8, floorMetalness: 0, lightTemp: 'neutral',
  })
  const [showReflection, setShowReflection] = useState(false)
  const [showDOF, setShowDOF] = useState(false)
  const [showMatControls, setShowMatControls] = useState(false)
  const [matControls, setMatControls] = useState<MatControls>(DEFAULT_MAT_CONTROLS)
  const [shelfLayout, setShelfLayout] = useState<'none' | 'shelf' | 'stack' | 'scattered'>('none')
  const [shelfCount, setShelfCount] = useState(3)
  const [showProductInside, setShowProductInside] = useState(false)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const dieline2DRef = useRef<HTMLDivElement>(null)

  const [lightingConfig, setLightingConfig] = useState<LightingConfig>(LIGHTING_DEFAULTS)
  const [postFXConfig, setPostFXConfig] = useState<PostFXConfig>(POST_FX_DEFAULTS)
  const [text3DConfig, setText3DConfig] = useState<Text3DConfig>(TEXT3D_DEFAULTS)
  const [text3DEnabled, setText3DEnabled] = useState(false)
  const [sceneCameraConfig, setSceneCameraConfig] = useState<SceneCameraConfig>(SCENE_CAMERA_DEFAULTS)

  const fold = useFoldAnimation()
  // #172 scroll-driven fold disabled — use the "Progression du pli" slider instead
  const foldProgressRef = useRef(fold.foldProgress)
  foldProgressRef.current = fold.foldProgress
  const physics = usePhysicsFold()
  const videoExport = useVideoExport()
  const multiAngle = useMultiAngleExport()
  const themeCtx = useTheme()
  const brandKit = useBrandKit()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showBrandKit, setShowBrandKit] = useState(false)
  const [showBatch, setShowBatch] = useState(false)
  const [showVersionCompare, setShowVersionCompare] = useState(false)
  const [showProjects, setShowProjects] = useState(false)
  const [showAR, setShowAR] = useState(false)
  const [showVariantCompare, setShowVariantCompare] = useState(false)
  const [showClientPortal, setShowClientPortal] = useState(false)
  const [showStructuralEditor, setShowStructuralEditor] = useState(false)
  const [showShopify, setShowShopify] = useState(false)
  const [showPrintSubmit, setShowPrintSubmit] = useState(false)
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('structure')
  const [showRenderDrawer, setShowRenderDrawer] = useState(false)
  const [mainView, setMainView] = useState<'2d' | '3d'>('3d')
  const [annotationMode, setAnnotationMode] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [proofingMode, setProofingMode] = useState(false)
  const projects = useProjects()
  const i18n = useLocale()
  const history = useHistory()
  const layers2D = useImageLayers({ params, activeTemplate })
  const collab = useCollaboration({
    state: { params, activeTemplate, imageLayers: layers2D.imageLayers },
    onRemoteUpdate: (s) => {
      setParams(s.params)
      setActiveTemplate(s.activeTemplate)
      layers2D.setImageLayers(s.imageLayers)
    },
  })
  const layout = usePanelLayout()
  const mat = useMaterials()

  useEffect(() => { preloadTextures() }, [])

  const handleObjLoad = useCallback((_name: string | null, content: string | null) => setObjContent(content), [])

  // ── History: watch all design state, push debounced snapshots ─────────────
  const applySnap = useCallback((snap: import('./_page/useHistory').Snapshot) => {
    setParams(snap.params)
    setActiveTemplate(snap.activeTemplate)
    layers2D.setImageLayers(snap.imageLayers)
    mat.setExteriorPresetId(snap.exteriorPresetId)
    mat.setInteriorPresetId(snap.interiorPresetId)
    mat.setExteriorCustomColor(snap.exteriorCustomColor)
    mat.setInteriorCustomColor(snap.interiorCustomColor)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    history.push({
      params, activeTemplate,
      imageLayers: layers2D.imageLayers,
      exteriorPresetId: mat.exteriorPresetId,
      interiorPresetId: mat.interiorPresetId,
      exteriorCustomColor: mat.exteriorCustomColor,
      interiorCustomColor: mat.interiorCustomColor,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, activeTemplate, layers2D.imageLayers, mat.exteriorPresetId, mat.interiorPresetId, mat.exteriorCustomColor, mat.interiorCustomColor])

  const handleParamChange = useCallback((key: keyof BoxParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  // #80: flute/substrate change — updates fluteType + auto-sets thickness
  const handleFluteChange = useCallback((fluteId: string) => {
    setParams(prev => ({ ...prev, fluteType: fluteId }))
  }, [])

  const handleLayerToggle = useCallback((key: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const handleTemplateChange = useCallback((t: TemplateType, dims?: { width: number; height: number; depth: number; packlyCode?: string }) => {
    setActiveTemplate(t)
    if (dims) {
      setParams(prev => ({ ...prev, width: dims.width, height: dims.height, depth: dims.depth }))
      if (dims.packlyCode) {
        setActivePacklyCode(dims.packlyCode)
        setImportedFoldNode(null)
      } else {
        setActivePacklyCode(null)
        setImportedFoldNode(null)
      }
    } else {
      setActivePacklyCode(null)
      setImportedFoldNode(null)
      if (t === 'snap-lock') {
        setParams(prev => ({ ...prev, height: 40 }))
      } else if (t === 'gable') {
        setParams(prev => ({ ...prev, width: 80, height: 140, depth: 80 }))
      } else {
        setParams(DEFAULT_PARAMS)
      }
    }
  }, [])

  const handleNewProject = useCallback(() => {
    if (!window.confirm('Créer un nouveau projet ? Toutes les modifications non sauvegardées seront perdues.')) return
    setParams(DEFAULT_PARAMS)
    setActiveTemplate('box')
    layers2D.setImageLayers([])
    fold.setFoldProgress(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fold.setFoldProgress, layers2D.setImageLayers])

  const handleUndo = useCallback(() => {
    const snap = history.undo()
    if (snap) applySnap(snap)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySnap])

  const handleRedo = useCallback(() => {
    const snap = history.redo()
    if (snap) applySnap(snap)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applySnap])

  // Backward-compat materialColors bridge for LeftPanel
  const materialColors: MaterialColors = { exterior: mat.exteriorActualColor, interior: mat.interiorActualColor }
  const setMaterialColors = (fn: ((prev: MaterialColors) => MaterialColors) | MaterialColors) => {
    const next = typeof fn === 'function' ? fn(materialColors) : fn
    mat.setExteriorCustomColor(next.exterior)
    mat.setInteriorCustomColor(next.interior)
    mat.setExteriorPresetId('personnalise')
    mat.setInteriorPresetId('personnalise')
  }

  // ── SVG dieline import ─────────────────────────────────────────────────────
  const [activePacklyCode, setActivePacklyCode] = useState<string | null>(null)
  const packlyFoldNode = useMemo(() => {
    if (!activePacklyCode) return null
    return buildPacklyFoldNode(activePacklyCode, params.width, params.height, params.depth)
  }, [activePacklyCode, params.width, params.height, params.depth])

  const [importedFoldNode, setImportedFoldNode] = useState<FoldNode | null>(null)
  const [importedSvg, setImportedSvg] = useState<ImportedSvgInfo | null>(null)
  const svgInputRef = useRef<HTMLInputElement>(null)

  const handleImportSVG = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const text = ev.target?.result as string
        const { parseSvgDieline }       = await import('@/lib/import/parseSvgDieline')
        const { buildFoldNodeFromSvg, deduceDimensions } = await import('@/lib/import/buildFoldNodeFromSvg')
        const parsed = parseSvgDieline(text)
        // Always show the raw SVG in the 2D view
        setImportedSvg({ raw: text, widthMm: parsed.widthMm, heightMm: parsed.heightMm })
        // Try to build a 3D fold node
        const foldNode = buildFoldNodeFromSvg(parsed)
        if (foldNode) {
          setImportedFoldNode(foldNode)
          const dims = deduceDimensions(parsed)
          if (dims) setParams(prev => ({ ...prev, width: dims.W, height: dims.H, depth: dims.D }))
        } else {
          setImportedFoldNode(null)
        }
      } catch (err) {
        console.error('SVG import error:', err)
        alert('Erreur lors de l\'import SVG.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  // ── Save / Load ────────────────────────────────────────────────────────────
  const loadInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProject = useCallback(() => {
    const project = {
      version: 1, params, layers, activeTemplate,
      imageLayers: layers2D.imageLayersRef.current,
      exteriorPresetId: mat.exteriorPresetId, interiorPresetId: mat.interiorPresetId,
      exteriorCustomColor: mat.exteriorCustomColor, interiorCustomColor: mat.interiorCustomColor,
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = `fold-studio-project-${Date.now()}.foldstudio`; a.click()
    URL.revokeObjectURL(url)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, layers, activeTemplate, mat.exteriorPresetId, mat.interiorPresetId, mat.exteriorCustomColor, mat.interiorCustomColor])

  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.params) setParams(data.params)
        if (data.layers) setLayers(data.layers)
        if (data.activeTemplate) setActiveTemplate(data.activeTemplate)
        if (data.imageLayers) layers2D.setImageLayers(data.imageLayers)
        if (data.exteriorPresetId) mat.setExteriorPresetId(data.exteriorPresetId)
        if (data.interiorPresetId) mat.setInteriorPresetId(data.interiorPresetId)
        if (data.exteriorCustomColor) mat.setExteriorCustomColor(data.exteriorCustomColor)
        if (data.interiorCustomColor) mat.setInteriorCustomColor(data.interiorCustomColor)
      } catch { console.error('Invalid project file') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── IndexedDB autosave (replaces localStorage 30s interval) ─────────────
  const { lastSaved } = useLocalPersistence(
    {
      params, layers, activeTemplate,
      imageLayers: layers2D.imageLayers,
      exteriorPresetId: mat.exteriorPresetId, interiorPresetId: mat.interiorPresetId,
      exteriorCustomColor: mat.exteriorCustomColor, interiorCustomColor: mat.interiorCustomColor,
    },
    (saved) => {
      // Restore on first load
      if (saved.params) setParams(saved.params)
      if (saved.layers) setLayers(saved.layers)
      if (saved.activeTemplate) setActiveTemplate(saved.activeTemplate)
      if (saved.imageLayers) layers2D.setImageLayers(saved.imageLayers)
      if (saved.exteriorPresetId) mat.setExteriorPresetId(saved.exteriorPresetId)
      if (saved.interiorPresetId) mat.setInteriorPresetId(saved.interiorPresetId)
      if (saved.exteriorCustomColor) mat.setExteriorCustomColor(saved.exteriorCustomColor)
      if (saved.interiorCustomColor) mat.setInteriorCustomColor(saved.interiorCustomColor)
    }
  )

  // Keyboard shortcuts: Ctrl+S, Ctrl+Z, Ctrl+Y/Shift+Z
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 's') { e.preventDefault(); handleSaveProject() }
      else if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo() }
    }
    const onOpenAR = () => setShowAR(true)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('fold-studio:open-ar', onOpenAR)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('fold-studio:open-ar', onOpenAR)
    }
  }, [handleSaveProject, handleUndo, handleRedo])

  // Physics takes priority when active; GSAP slider otherwise
  const activeFoldProgress = physics.isPhysicsActive ? physics.foldProgress : fold.foldProgress

  const isFold = activeTab === 'fold'
  const { leftW, centerW, renderW, isDraggingAny } = layout

  // Fade 3D panel content when switching fold ↔ unfold tabs
  const threePanelRef = useRef<HTMLDivElement>(null)
  const prevTabRef = useRef(activeTab)
  useEffect(() => {
    if (prevTabRef.current === activeTab) return
    prevTabRef.current = activeTab
    if (threePanelRef.current) {
      gsap.fromTo(threePanelRef.current, { opacity: 0.35 }, { opacity: 1, duration: 0.32, ease: 'power2.out' })
    }
  }, [activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f5f4f2' }}>
      <input ref={loadInputRef} type="file" accept=".foldstudio,.json" style={{ display: 'none' }} onChange={handleLoadProject} />
      <Nav activeTab={activeTab} onTabChange={setActiveTab} onSave={handleSaveProject} onLoad={() => loadInputRef.current?.click()} onUndo={handleUndo} onRedo={handleRedo} canUndo={history.canUndo} canRedo={history.canRedo} lastSaved={lastSaved} collaborators={collab.collaborators}
        onShowShortcuts={() => setShowShortcuts(true)}
        onToggleTheme={themeCtx.toggleTheme} theme={themeCtx.theme}
        onShowBrandKit={() => setShowBrandKit(true)}
        onShowBatch={() => setShowBatch(true)}
        onShowVersionCompare={() => setShowVersionCompare(true)}
        onShowProjects={() => setShowProjects(true)}
        onShowVariantCompare={() => setShowVariantCompare(true)}
        locale={i18n.locale} onLocaleChange={i18n.changeLocale}
        onToggleProofing={() => setProofingMode(v => !v)}
        proofingMode={proofingMode}
        onShowClientPortal={() => setShowClientPortal(true)}
        onShowStructuralEditor={() => setShowStructuralEditor(true)}
        onShowShopify={() => setShowShopify(true)}
        onShowPrintSubmit={() => setShowPrintSubmit(true)}
        onNewProject={handleNewProject}
        onShowRender={() => { setMainView('3d'); setShowRenderDrawer(v => !v) }}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', userSelect: isDraggingAny ? 'none' : 'auto' }}>

        {/* TOOLBAR STRIP — tool icons, far left like Illustrator toolbox */}
        <ToolbarStripDynamic active={activeCategory} onChange={setActiveCategory} exteriorColor={mat.exteriorActualColor} interiorColor={mat.interiorActualColor} />

        {/* MAIN AREA — split permanent 2D | 3D */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0, pointerEvents: isDraggingAny ? 'none' : 'auto' }}>

          {/* ── LEFT — 2D Dieline ──────────────────────────────── */}
          <div ref={dieline2DRef} style={{ flex: layout.splitW > 0 ? `0 0 ${layout.splitW}px` : 1, position: 'relative', overflow: 'hidden', minWidth: layout.MIN_2D }}>
            <DielineCanvas
              params={params} layers={layers} onLayerToggle={handleLayerToggle}
              mode={activeTab} objContent={objContent} activeTemplate={activeTemplate} unit={unit}
              importedSvg={importedSvg}
              imageLayers={layers2D.imageLayers}
              selectedLayerId={layers2D.selectedLayerId}
              selectedLayerIds={layers2D.selectedLayerIds}
              onSelectLayer={id => { layers2D.setSelectedLayerId(id); layers2D.setSelectedLayerIds(id ? [id] : []) }}
              onToggleSelectLayer={layers2D.handleToggleSelectLayer}
              onMoveImageLayer={layers2D.handleMoveImageLayer}
              onMoveSelectedLayers={layers2D.handleMoveSelectedLayers}
              onUpdateImageLayer={layers2D.handleUpdateImageLayer}
              externalHoveredFace={hoveredFace}
              onParamChange={handleParamChange}
            />
            <AnnotationLayer
              enabled={annotationMode}
              annotations={annotations}
              onAdd={a => setAnnotations(prev => [...prev, a])}
              onResolve={id => setAnnotations(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))}
              onDelete={id => setAnnotations(prev => prev.filter(a => a.id !== id))}
            />
            {annotationMode && (
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', fontSize: 10, padding: '4px 12px', borderRadius: 20, pointerEvents: 'none', zIndex: 35 }}>
                Mode annotation actif — Cliquez pour ajouter un commentaire
              </div>
            )}
            <button
              onClick={() => setAnnotationMode(v => !v)}
              title="Mode commentaires"
              style={{
                position: 'absolute', bottom: 8, right: 8, zIndex: 35,
                width: 32, height: 32, borderRadius: '50%', border: 'none',
                background: annotationMode ? '#e91e8c' : '#fff',
                color: annotationMode ? '#fff' : '#888',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 2h10a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5L2 13V3a1 1 0 0 1 1-1z" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Draggable split divider 2D | 3D */}
          <div
            onMouseDown={e => {
              const containerW = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect().width ?? window.innerWidth
              layout.startSplitDrag(e, dieline2DRef.current?.getBoundingClientRect().width ?? 500, containerW)
            }}
            style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#ddd8d2', zIndex: 10, transition: 'background 0.12s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#a0b4ff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ddd8d2' }}
          />

          {/* ── RIGHT — 3D Preview ─────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: layout.MIN_3D, transform: 'translateZ(0)', willChange: 'transform' }}>
            <div ref={threePanelRef} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              <ThreeViewHeader
                isFold={isFold} unfoldView={unfoldView} setUnfoldView={setUnfoldView}
                onImportSVG={() => svgInputRef.current?.click()}
                hasImportedDieline={!!importedSvg}
                onClearImport={() => { setImportedFoldNode(null); setImportedSvg(null) }}
              />

              {isFold && (
                <FoldProgressBar
                  foldProgress={activeFoldProgress}
                  setFoldProgress={v => { physics.setPosition(v); fold.setFoldProgress(v) }}
                  isAnimating={fold.isAnimating} setIsAnimating={fold.setIsAnimating}
                  onPhysicsDrop={physics.drop}
                  onPhysicsOpen={physics.open}
                  onPhysicsFlick={physics.flick}
                  isPhysicsActive={physics.isPhysicsActive}
                />
              )}

              {/* Outer wrapper — overflow:hidden clips the toolbar without deforming it */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                {/* Canvas container — clips only the WebGL canvas */}
                <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#f0ede9' }}>
                  {!isFold && unfoldView === 'mesh' && !objContent && <ObjEmptyState />}

                  <div style={{ position: 'absolute', inset: 0, filter: showDOF ? 'blur(1.5px)' : 'none', transition: 'filter 0.25s', pointerEvents: 'all' }}>
                    <ThreeScene
                      params={params} foldProgress={activeFoldProgress}
                      imageLayers={layers2D.imageLayers}
                      interiorColor={mat.interiorActualColor} exteriorColor={mat.exteriorActualColor}
                      exteriorPresetId={mat.exteriorPresetId} interiorPresetId={mat.interiorPresetId}
                      exteriorRoughness={mat.exteriorPreset.roughness} exteriorMetalness={mat.exteriorPreset.metalness}
                      interiorRoughness={mat.interiorPreset.roughness} interiorMetalness={mat.interiorPreset.metalness}
                      objContent={objContent}
                      viewMode={activeTab === 'unfold' ? unfoldView : 'folded'}
                      hoveredFace={hoveredFace} onHoverFace={setHoveredFace}
                      showGrid={showGrid} wireframe={wireframe}
                      activeTemplate={activeTemplate} autoRotate={autoRotate}
                      renderScene={renderScene} customScene={customScene}
                      showReflection={showReflection}
                      matControls={matControls}
                      shelfLayout={shelfLayout} shelfCount={shelfCount}
                      showProductInside={showProductInside}
                      lightingConfig={lightingConfig}
                      postFXConfig={postFXConfig}
                      text3DConfig={text3DConfig}
                      text3DEnabled={text3DEnabled}
                      sceneCameraConfig={sceneCameraConfig}
                      importedFoldNode={packlyFoldNode ?? importedFoldNode}
                    />
                    {/* Hidden SVG import input */}
                    <input
                      ref={svgInputRef} type="file" accept=".svg"
                      style={{ display: 'none' }}
                      onChange={handleImportSVG}
                    />
                  </div>

                  {showMatControls && <MatControlsPanel controls={matControls} onChange={setMatControls} onClose={() => setShowMatControls(false)} />}
                  {mat.showMaterialsPanel && (
                    <MaterialsPanel
                      materialFaceTab={mat.materialFaceTab} setMaterialFaceTab={mat.setMaterialFaceTab}
                      exteriorPresetId={mat.exteriorPresetId} setExteriorPresetId={mat.setExteriorPresetId}
                      interiorPresetId={mat.interiorPresetId} setInteriorPresetId={mat.setInteriorPresetId}
                      exteriorCustomColor={mat.exteriorCustomColor} setExteriorCustomColor={mat.setExteriorCustomColor}
                      interiorCustomColor={mat.interiorCustomColor} setInteriorCustomColor={mat.setInteriorCustomColor}
                      exteriorActualColor={mat.exteriorActualColor} interiorActualColor={mat.interiorActualColor}
                    />
                  )}

                  {videoExport.isExporting && <VideoExportOverlay progress={videoExport.exportProgress} stage={videoExport.exportStage} />}

                  {activeTab === 'unfold' && !objContent && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="#c8b8a0" strokeWidth="1.5" style={{ marginBottom: 12 }}>
                        <rect x="6" y="8" width="28" height="24" rx="3"/><path d="M14 20h12M20 14v12" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 11, color: '#b0a090', fontWeight: 500, letterSpacing: 0.3 }}>Import an .obj file</span>
                      <span style={{ fontSize: 10, color: '#c8b8a0', marginTop: 4 }}>Use the left panel to load a 3D mesh</span>
                    </div>
                  )}
                </div>

                {/* DimensionBar — top-right overlay */}
                {isFold && <DimensionBar params={params} unit={unit} />}

                {/* ThreeToolbar — absolute inside wrapper, clipped by overflow:hidden so it never bleeds into 2D */}
                <ThreeToolbar
                  showGrid={showGrid} setShowGrid={setShowGrid}
                  wireframe={wireframe} setWireframe={setWireframe}
                  showMaterialsPanel={mat.showMaterialsPanel} setShowMaterialsPanel={mat.setShowMaterialsPanel}
                  showMatControls={showMatControls} setShowMatControls={setShowMatControls}
                  autoRotate={autoRotate} setAutoRotate={setAutoRotate}
                  onExportVideo={opts => videoExport.startExport(v => { physics.setPosition(v); fold.setFoldProgress(v) }, opts)}
                  isExporting={videoExport.isExporting}
                  onExportAllAngles={multiAngle.exportAllAngles}
                  isExportingAngles={multiAngle.isExporting}
                  showReflection={showReflection} setShowReflection={setShowReflection}
                  showDOF={showDOF} setShowDOF={setShowDOF}
                  shelfLayout={shelfLayout} setShelfLayout={setShelfLayout}
                  shelfCount={shelfCount} setShelfCount={setShelfCount}
                  showProductInside={showProductInside} setShowProductInside={setShowProductInside}
                />
              </div>
            </div>
          </div>

          {/* Render drawer — overlay fixe */}
          {showRenderDrawer && (
            <div style={{
              position: 'fixed', top: 40, right: 0, bottom: 0, width: 280,
              background: '#fff', borderLeft: '1px solid #ddd8d2',
              boxShadow: '-6px 0 24px rgba(0,0,0,0.13)', zIndex: 200,
              display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 36, borderBottom: '1px solid #ddd8d2', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#444', letterSpacing: 1.2, textTransform: 'uppercase' }}>Render</span>
                <button onClick={() => setShowRenderDrawer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 18, lineHeight: 1, padding: '0 2px' }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <RenderPanel width={280} renderScene={renderScene} onSceneChange={setRenderScene} customScene={customScene} onCustomSceneChange={setCustomScene} params={params} />
              </div>
            </div>
          )}
        </div>

        {/* Drag handle Main↔Properties panel */}
        <div onMouseDown={e => layout.startDrag('right', e)}
          style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: '#e0dcd8', zIndex: 20, transition: 'background 0.12s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#a0b4ff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#e0dcd8' }}
        />

        {/* PROPERTIES PANEL — right side, like Illustrator */}
        <div style={{
          width: leftW > 0 ? leftW : 20,
          minHeight: 0, alignSelf: 'stretch', flexShrink: 0, overflow: 'hidden',
          transition: isDraggingAny ? 'none' : 'width 0.22s ease',
          pointerEvents: isDraggingAny ? 'none' : 'auto',
        }}>
          {leftW > 0 ? (
            <LeftPanel
              params={params} layers={layers}
              onParamChange={handleParamChange} onFluteChange={handleFluteChange} onLayerToggle={handleLayerToggle}
              onTemplateChange={handleTemplateChange} activeTemplate={activeTemplate}
              onOpenTemplates={() => setShowTemplates(true)}
              mode={activeTab}
              unit={unit} onUnitChange={setUnit}
              imageLayers={layers2D.imageLayers}
              selectedLayerId={layers2D.selectedLayerId}
              selectedLayerIds={layers2D.selectedLayerIds}
              onSelectLayer={id => { layers2D.setSelectedLayerId(id); layers2D.setSelectedLayerIds(id ? [id] : []) }}
              onAddImageLayer={layers2D.handleAddImageLayer}
              onUpdateImageLayer={layers2D.handleUpdateImageLayer}
              onDeleteImageLayer={layers2D.handleDeleteImageLayer}
              onDuplicateImageLayer={layers2D.handleDuplicateImageLayer}
              onReorderLayer={layers2D.handleReorderLayer}
              materialColors={materialColors}
              onMaterialColorsChange={setMaterialColors}
              onObjLoad={handleObjLoad}
              panelWidth={leftW}
              lightingConfig={lightingConfig}
              onLightingChange={setLightingConfig}
              postFXConfig={postFXConfig}
              onPostFXChange={setPostFXConfig}
              text3DConfig={text3DConfig}
              onText3DChange={setText3DConfig}
              text3DEnabled={text3DEnabled}
              onText3DToggle={() => setText3DEnabled(v => !v)}
              sceneCameraConfig={sceneCameraConfig}
              onSceneCameraChange={setSceneCameraConfig}
              onRestoreVersion={(restoredParams, restoredLayers) => {
                setParams(restoredParams)
                layers2D.setImageLayers(restoredLayers)
              }}
              activeCategory={activeCategory}
            />
          ) : (
            <div onClick={() => layout.setLeftW(DEFAULT_LEFT_W)} title="Restore panel"
              style={{ width: 20, height: '100%', background: '#f0ede9', borderLeft: '1px solid #ddd8d2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#bbb', letterSpacing: 1.2, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>PANEL</span>
            </div>
          )}
        </div>
      </div>

      <TemplateModal open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={handleTemplateChange} current={activeTemplate} />

      {/* #67: Keyboard shortcuts */}
      {showShortcuts && <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />}

      {/* #51: Brand kit */}
      {showBrandKit && <BrandKitPanel brandKit={brandKit} onApplyColor={c => mat.setExteriorCustomColor(c)} onClose={() => setShowBrandKit(false)} />}

      {/* #56: Batch generator */}
      {showBatch && <BatchGenerator baseParams={params} activeTemplate={activeTemplate} onClose={() => setShowBatch(false)} />}

      {/* #50: Version comparison */}
      {showVersionCompare && history.stack.length > 1 && (
        <VersionCompare
          current={{ params, activeTemplate, imageLayers: layers2D.imageLayers, exteriorPresetId: mat.exteriorPresetId, interiorPresetId: mat.interiorPresetId, exteriorCustomColor: mat.exteriorCustomColor, interiorCustomColor: mat.interiorCustomColor }}
          snapshots={history.stack.slice(0, -1)}
          onClose={() => setShowVersionCompare(false)}
        />
      )}

      {/* #52/#49: Projects panel + approval */}
      {showProjects && (
        <ProjectsPanel
          projects={projects.projects}
          folders={projects.folders}
          clients={projects.clients}
          currentParams={params}
          currentTemplate={activeTemplate}
          currentLayers={layers2D.imageLayers}
          exteriorColor={mat.exteriorActualColor}
          interiorColor={mat.interiorActualColor}
          onSave={(name, client, folder) => projects.saveProject({
            name, client, folder,
            params, activeTemplate, imageLayers: layers2D.imageLayers,
            exteriorColor: mat.exteriorActualColor, interiorColor: mat.interiorActualColor,
            approvalStatus: 'draft',
          })}
          onLoad={entry => {
            setParams(entry.params)
            setActiveTemplate(entry.activeTemplate)
            layers2D.setImageLayers(entry.imageLayers)
            mat.setExteriorCustomColor(entry.exteriorColor)
            mat.setInteriorCustomColor(entry.interiorColor)
            setShowProjects(false)
          }}
          onDelete={projects.deleteProject}
          onUpdateApproval={projects.updateApproval}
          onClose={() => setShowProjects(false)}
        />
      )}

      {/* #57: Variant comparison */}
      {showVariantCompare && (
        <VariantCompare baseParams={params} activeTemplate={activeTemplate} onClose={() => setShowVariantCompare(false)} />
      )}

      {/* #41: AR Preview */}
      {showAR && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ARPreviewButton onClose={() => setShowAR(false)} />
        </div>
      )}

      {/* #53: Proofing mode */}
      {proofingMode && (
        <ProofingModeOverlay
          params={params}
          activeTemplate={activeTemplate}
          exteriorColor={mat.exteriorActualColor}
          interiorColor={mat.interiorActualColor}
          onExit={() => setProofingMode(false)}
        />
      )}

      {/* #54: Client portal */}
      {showClientPortal && <ClientPortal onClose={() => setShowClientPortal(false)} />}

      {/* #55: Structural panel editor */}
      {showStructuralEditor && (
        <StructuralEditor
          params={params}
          activeTemplate={activeTemplate}
          onParamChange={handleParamChange}
          onClose={() => setShowStructuralEditor(false)}
        />
      )}

      {/* #62: Shopify sync */}
      {showShopify && (
        <ShopifyPanel
          params={params}
          activeTemplate={activeTemplate}
          exteriorColor={mat.exteriorActualColor}
          interiorColor={mat.interiorActualColor}
          onClose={() => setShowShopify(false)}
        />
      )}

      {/* #61: Print submission */}
      {showPrintSubmit && (
        <PrintSubmitPanel
          params={params}
          activeTemplate={activeTemplate}
          exteriorColor={mat.exteriorActualColor}
          interiorColor={mat.interiorActualColor}
          onClose={() => setShowPrintSubmit(false)}
        />
      )}
    </div>
  )
}
