'use client'

import { useRef, useState, useMemo, useDeferredValue, useEffect } from 'react'
import type { ToolCategory } from './ToolbarStrip'
import type { BoxParams, LayerVisibility, TemplateType, ImageLayer, MaterialColors } from '@/lib/types'
import { TEMPLATES } from '@/lib/templates'
import { c, fs, fw, r } from '@/lib/tokens'

import { PanelHeader } from './left-panel/PanelHeader'
import { CollapsibleSection } from './left-panel/ui'
import { DimensionsSection } from './left-panel/DimensionsSection'
import { LayersPanel } from './left-panel/LayersPanel'
import { TextSection } from './left-panel/TextSection'
import { BarcodeSection } from './left-panel/BarcodeSection'
import { QRSection } from './left-panel/QRSection'
import { MaterialSection } from './left-panel/MaterialSection'
import { PreflightSection } from './left-panel/PreflightSection'
import { FoldSequenceSection } from './left-panel/FoldSequenceSection'
import { ExportSection } from './left-panel/ExportSection'
import { LightingSection } from './left-panel/LightingSection'
import { FEFCOSection } from './left-panel/FEFCOSection'
import { ImportSection } from './left-panel/ImportSection'
import { UnfoldPanel } from './left-panel/UnfoldPanel'

// Design avancé
import { AIDesignSection } from './left-panel/AIDesignSection'
import { TextFlowSection } from './left-panel/TextFlowSection'
import { GradientSection } from './left-panel/GradientSection'
import { PatternSection } from './left-panel/PatternSection'
import { VDPSection } from './left-panel/VDPSection'
import { PictogramSection } from './left-panel/PictogramSection'

// Material avancé
import { CmykSeparationSection } from './left-panel/CmykSeparationSection'
import { InkCoverageSection } from './left-panel/InkCoverageSection'
import { PostFXSection } from './left-panel/PostFXSection'
import { Text3DSection } from './left-panel/Text3DSection'
import { SceneCameraSection } from './left-panel/SceneCameraSection'

// Print avancé
import { NestingSection } from './left-panel/NestingSection'
import { PrintSimSection } from './left-panel/PrintSimSection'
import { PrintQASection } from './left-panel/PrintQASection'
import { AntiCounterfeitSection } from './left-panel/AntiCounterfeitSection'
import { StrengthSection } from './left-panel/StrengthSection'

// Éco
import { SustainabilitySection } from './left-panel/SustainabilitySection'
import { FoodSafetySection } from './left-panel/FoodSafetySection'
import { CertificationSection } from './left-panel/CertificationSection'
import { StructuralSection } from './left-panel/StructuralSection'
import { EcoExtendedSection } from './left-panel/EcoExtendedSection'

// Business
import { BusinessSection } from './left-panel/BusinessSection'
import { WorkflowSection } from './left-panel/WorkflowSection'
import { MarketplaceSection } from './left-panel/MarketplaceSection'
import { RetailSection } from './left-panel/RetailSection'
import { MarketingSection } from './left-panel/MarketingSection'
import { EcommerceSection } from './left-panel/EcommerceSection'
import { BrandingSection } from './left-panel/BrandingSection'
import { SafetySection } from './left-panel/SafetySection'
import { SleeveLabelSection } from './left-panel/SleeveLabelSection'
import { PremiumFXSection } from './left-panel/PremiumFXSection'
import { LogisticsSection } from './left-panel/LogisticsSection'

// Collab
import { CollaborationSection } from './left-panel/CollaborationSection'
import { VersioningSection } from './left-panel/VersioningSection'
import { ComplianceSection } from './left-panel/ComplianceSection'
import { SmartPackagingSection } from './left-panel/SmartPackagingSection'
import { DPPSection } from './left-panel/DPPSection'
import { MobileSection } from './left-panel/MobileSection'
import { AccessibilitySection } from './left-panel/AccessibilitySection'

import { computeDieline } from '@/lib/dieline'
import { Select } from '@/components/ui/select'
import type { LightingConfig } from './three-scene/AdvancedLighting'
import type { PostFXConfig } from './three-scene/EffectsLayer'
import type { Text3DConfig } from './three-scene/Text3DLayer'
import type { SceneCameraConfig } from './left-panel/SceneCameraSection'

interface LeftPanelProps {
  params: BoxParams
  layers: LayerVisibility
  onParamChange: (key: keyof BoxParams, value: number) => void
  onFluteChange?: (fluteId: string) => void
  onLayerToggle: (key: keyof LayerVisibility) => void
  onTemplateChange: (t: TemplateType) => void
  activeTemplate: TemplateType
  onOpenTemplates: () => void
  mode: 'fold' | 'unfold'
  imageLayers: ImageLayer[]
  selectedLayerId: string | null
  selectedLayerIds?: string[]
  onSelectLayer: (id: string | null) => void
  onAddImageLayer: (layer: ImageLayer) => void
  onUpdateImageLayer: (id: string, updates: Partial<ImageLayer>) => void
  onDeleteImageLayer: (id: string) => void
  onDuplicateImageLayer?: (id: string) => void
  onReorderLayer?: (id: string, direction: 'up' | 'down') => void
  materialColors: MaterialColors
  onMaterialColorsChange: (c: MaterialColors) => void
  onObjLoad?: (name: string | null, content: string | null) => void
  panelWidth?: number
  unit: import('@/components/left-panel/ui').UnitType
  onUnitChange: (u: import('@/components/left-panel/ui').UnitType) => void
  lightingConfig?: LightingConfig
  onLightingChange?: (c: LightingConfig) => void
  postFXConfig?: PostFXConfig
  onPostFXChange?: (c: PostFXConfig) => void
  text3DConfig?: Text3DConfig
  onText3DChange?: (c: Text3DConfig) => void
  text3DEnabled?: boolean
  onText3DToggle?: () => void
  sceneCameraConfig?: SceneCameraConfig
  onSceneCameraChange?: (c: SceneCameraConfig) => void
  onRestoreVersion?: (params: BoxParams, layers: ImageLayer[]) => void
  activeCategory?: ToolCategory
}

export default function LeftPanel({
  params, layers, onParamChange, onFluteChange, onLayerToggle, onTemplateChange,
  activeTemplate, onOpenTemplates, mode,
  imageLayers, selectedLayerId, selectedLayerIds = [], onSelectLayer,
  onAddImageLayer, onUpdateImageLayer, onDeleteImageLayer, onDuplicateImageLayer, onReorderLayer,
  materialColors, onMaterialColorsChange,
  onObjLoad, panelWidth = 240, unit, onUnitChange,
  lightingConfig, onLightingChange,
  postFXConfig, onPostFXChange,
  text3DConfig, onText3DChange,
  text3DEnabled = false, onText3DToggle,
  sceneCameraConfig, onSceneCameraChange,
  onRestoreVersion,
  activeCategory,
}: LeftPanelProps) {
  const show = (cat: ToolCategory) => !activeCategory || activeCategory === cat

  const svgInputRef = useRef<HTMLInputElement>(null)
  const [projectName, setProjectName] = useState('UNTITLED BOX')
  const [unfoldMeshName, setUnfoldMeshName] = useState<string | null>(null)
  const deferredParams = useDeferredValue(params)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dieline = useMemo(() => computeDieline(deferredParams, activeTemplate), [deferredParams.width, deferredParams.height, deferredParams.depth, deferredParams.glueTab, deferredParams.bleed, activeTemplate])

  useEffect(() => {
    const handler = (e: Event) => {
      const label = (e as CustomEvent).detail?.label as string | undefined
      if (!label) return
      const tryScroll = (attempt = 0) => {
        const btn = document.querySelector(`[data-section-header="${label}"]`) as HTMLButtonElement | null
        if (btn) {
          btn.scrollIntoView({ behavior: 'smooth', block: 'start' })
          const outer = btn.nextElementSibling
          if (outer && !outer.classList.contains('open')) btn.click()
        } else if (attempt < 2) {
          setTimeout(() => tryScroll(attempt + 1), 160)
        }
      }
      setTimeout(() => tryScroll(), 80)
    }
    window.addEventListener('fold-studio:focus-section', handler)
    return () => window.removeEventListener('fold-studio:focus-section', handler)
  }, [])

  const unfoldTitle = unfoldMeshName
    ? unfoldMeshName.replace(/\.obj$/i, '').toUpperCase()
    : 'UNTITLED UNFOLD'

  const workflowPhase =
    activeCategory === 'design' || activeCategory === 'material' ? 1 :
    activeCategory === 'print' || activeCategory === 'eco' ? 2 : 0

  const patronW = params.width + 2 * params.depth
  const patronH = params.height + params.depth

  return (
    <div style={{
      width: panelWidth, height: '100%', minHeight: 0, background: '#f5f4f2',
      borderLeft: '1px solid #ddd8d2',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
    }}>
      <PanelHeader mode={mode} unfoldTitle={unfoldTitle} onOpenTemplates={onOpenTemplates} projectTitle={projectName} onProjectTitleChange={setProjectName} />

      {/* Workflow step indicator */}
      {mode === 'fold' && (
        <div style={{ display: 'flex', background: '#ede9e5', borderBottom: '1px solid #ddd8d2', flexShrink: 0 }}>
          {(['Créer', 'Design', 'Exporter'] as const).map((step, i) => (
            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 4px 4px', position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 6, fontSize: 9, color: '#ccc', lineHeight: 1 }}>›</div>}
              <span style={{ fontSize: 9, fontWeight: i === workflowPhase ? 700 : 400, color: i === workflowPhase ? '#3b82f6' : i < workflowPhase ? '#aaa' : '#bbb', transition: 'all 0.15s' }}>
                {i < workflowPhase ? '✓ ' : ''}{step}
              </span>
              <div style={{ marginTop: 3, height: 2, width: '60%', borderRadius: 1, background: i === workflowPhase ? '#3b82f6' : 'transparent', transition: 'background 0.15s' }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'scroll', paddingBottom: 40 }}>
        {mode === 'unfold' ? (
          <UnfoldPanel meshName={unfoldMeshName} onMeshNameChange={setUnfoldMeshName} onObjLoad={onObjLoad} />
        ) : (
          <>
            {/* ── SVG Import button ──────────────────────────────── */}
            {show('layers') && (
              <button
                onClick={() => svgInputRef.current?.click()}
                className="fs-btn-default"
                style={{
                  width: '100%', background: c.white, border: `1px solid ${c.border}`,
                  color: '#333', borderRadius: r.lg, padding: '8px 0', fontSize: fs.md,
                  fontWeight: fw.medium, cursor: 'pointer', marginBottom: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <span style={{ fontSize: fs.lg }}>↑</span> Importer SVG
              </button>
            )}
            <input
              ref={svgInputRef} type="file" accept=".svg,image/svg+xml" style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const src = ev.target?.result as string
                  const frontPanel = dieline.panels.find(p => p.label === 'Front')
                  const MM_TO_PX = 3.7795275591
                  const xMm = frontPanel ? frontPanel.x / MM_TO_PX : params.depth
                  const yMm = frontPanel ? frontPanel.y / MM_TO_PX : params.depth / 2
                  const wMm = frontPanel ? Math.min(frontPanel.w / MM_TO_PX, params.width) : params.width
                  const hMm = frontPanel ? Math.min(frontPanel.h / MM_TO_PX, params.height) : params.height
                  onAddImageLayer({ id: `svg-${Date.now()}`, name: file.name, src, x: xMm, y: yMm, width: wMm, height: hMm, scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto' })
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />

            {/* ── STRUCTURE ─────────────────────────────────────── */}
            {show('structure') && (
              <div style={{ padding: '10px 10px 4px', background: '#ede9e5', borderBottom: '1px solid #ddd8d2' }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#888', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>Modèle</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Select
                    value={activeTemplate}
                    options={TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
                    onChange={v => onTemplateChange(v as TemplateType)}
                    style={{ flex: 1 }}
                  />
                  <button onClick={onOpenTemplates} className="fs-btn-ghost" style={{ background: '#ddd8d2', border: '1px solid #ccc8c2', color: '#666', borderRadius: r.md, padding: '0 9px', cursor: 'pointer', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                      <rect x="1" y="1" width="5" height="5" rx="0.8"/><rect x="8" y="1" width="5" height="5" rx="0.8"/>
                      <rect x="1" y="8" width="5" height="5" rx="0.8"/><rect x="8" y="8" width="5" height="5" rx="0.8"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {show('structure') && (
              <CollapsibleSection label="Dimensions" defaultOpen>
                <DimensionsSection params={params} onParamChange={onParamChange} onFluteChange={onFluteChange} activeTemplate={activeTemplate} unit={unit} onUnitChange={onUnitChange} showLabel={false} />
              </CollapsibleSection>
            )}
            {show('structure') && (
              <FEFCOSection
                activeTemplate={activeTemplate}
                onSelectTemplate={(template, defaultParams) => {
                  onTemplateChange(template)
                  if (defaultParams) {
                    const keys = ['width', 'height', 'depth', 'glueTab', 'thickness', 'bleed'] as const
                    keys.forEach(k => { if (defaultParams[k] !== undefined) onParamChange(k, defaultParams[k]!) })
                  }
                }}
              />
            )}
            {show('structure') && <FoldSequenceSection params={params} activeTemplate={activeTemplate} />}
            {show('structure') && <StrengthSection params={params} />}

            {/* ── LAYERS ────────────────────────────────────────── */}
            {show('layers') && (
              <CollapsibleSection label="Calques" defaultOpen>
                <LayersPanel
                  imageLayers={imageLayers} selectedLayerId={selectedLayerId} selectedLayerIds={selectedLayerIds}
                  onSelectLayer={onSelectLayer} onAddImageLayer={onAddImageLayer}
                  onUpdateImageLayer={onUpdateImageLayer} onDeleteImageLayer={onDeleteImageLayer}
                  onDuplicateImageLayer={onDuplicateImageLayer} onReorderLayer={onReorderLayer}
                />
              </CollapsibleSection>
            )}

            {/* ── DESIGN ────────────────────────────────────────── */}
            {show('design') && <TextSection onAddLayer={onAddImageLayer} />}
            {show('design') && <BarcodeSection onAddLayer={onAddImageLayer} />}
            {show('design') && <QRSection onAddLayer={onAddImageLayer} />}
            {show('design') && <AIDesignSection onAddImageLayer={onAddImageLayer} params={params} activeTemplate={activeTemplate} onTemplateChange={onTemplateChange} />}
            {show('design') && <TextFlowSection params={params} dieline={dieline ?? null} onAddLayer={onAddImageLayer} />}
            {show('design') && <GradientSection params={params} activeTemplate={activeTemplate} onAddLayer={onAddImageLayer} />}
            {show('design') && <PatternSection params={params} activeTemplate={activeTemplate} onAddLayer={onAddImageLayer} />}
            {show('design') && <VDPSection onAddLayer={onAddImageLayer} />}
            {show('design') && <PictogramSection onAddLayer={onAddImageLayer} />}

            {/* ── MATERIAL ──────────────────────────────────────── */}
            {show('material') && <MaterialSection materialColors={materialColors} onMaterialColorsChange={onMaterialColorsChange} />}
            {show('material') && lightingConfig && onLightingChange && (
              <LightingSection config={lightingConfig} onChange={onLightingChange} />
            )}
            {show('material') && <CmykSeparationSection exteriorColor={materialColors.exterior} interiorColor={materialColors.interior} />}
            {show('material') && <InkCoverageSection imageLayers={imageLayers} patronWidth={patronW} patronHeight={patronH} />}
            {show('material') && postFXConfig && onPostFXChange && (
              <PostFXSection config={postFXConfig} onChange={onPostFXChange} />
            )}
            {show('material') && text3DConfig && onText3DChange && onText3DToggle && (
              <Text3DSection config={text3DConfig} onChange={onText3DChange} enabled={text3DEnabled} onToggle={onText3DToggle} />
            )}
            {show('material') && sceneCameraConfig && onSceneCameraChange && (
              <SceneCameraSection
                config={sceneCameraConfig} onChange={onSceneCameraChange}
                onSetCamera={pos => window.dispatchEvent(new CustomEvent('fold-studio:set-camera', { detail: { pos } }))}
                onHighResCapture={res => window.dispatchEvent(new CustomEvent('fold-studio:highres-capture', { detail: { res } }))}
                on360Capture={() => window.dispatchEvent(new CustomEvent('fold-studio:360-capture'))}
              />
            )}

            {/* ── PRINT ─────────────────────────────────────────── */}
            {show('print') && (
              <ImportSection
                onImport={(importedParams, template) => {
                  onTemplateChange(template)
                  const keys = ['width', 'height', 'depth', 'glueTab', 'thickness', 'bleed'] as const
                  keys.forEach(k => { if (importedParams[k] !== undefined) onParamChange(k, importedParams[k]!) })
                }}
              />
            )}
            {show('print') && (
              <ExportSection
                params={params} activeTemplate={activeTemplate}
                imageLayers={imageLayers}
                exteriorColor={materialColors.exterior} interiorColor={materialColors.interior}
                projectName={projectName}
              />
            )}
            {show('print') && (
              <PreflightSection
                params={params} dieline={dieline} imageLayers={imageLayers}
                exteriorColor={materialColors.exterior} interiorColor={materialColors.interior}
              />
            )}
            {show('print') && <NestingSection params={params} activeTemplate={activeTemplate} />}
            {show('print') && <PrintSimSection imageLayers={imageLayers} patronWidth={patronW} patronHeight={patronH} onAddLayer={onAddImageLayer} />}
            {show('print') && <PrintQASection imageLayers={imageLayers} />}
            {show('print') && <AntiCounterfeitSection onAddLayer={onAddImageLayer} />}

            {/* ── ÉCO ───────────────────────────────────────────── */}
            {show('eco') && <SustainabilitySection params={params} onAddLayer={onAddImageLayer} />}
            {show('eco') && <FoodSafetySection params={params} />}
            {show('eco') && <CertificationSection />}
            {show('eco') && <StructuralSection params={params} dieline={dieline} />}
            {show('eco') && <EcoExtendedSection params={params} />}

            {/* ── BUSINESS ──────────────────────────────────────── */}
            {show('business') && <BusinessSection params={params} activeTemplate={activeTemplate} />}
            {show('business') && <WorkflowSection params={params} activeTemplate={activeTemplate} />}
            {show('business') && <MarketplaceSection />}
            {show('business') && <RetailSection imageLayers={imageLayers} params={params} />}
            {show('business') && <MarketingSection imageLayers={imageLayers} />}
            {show('business') && <EcommerceSection params={params} imageLayers={imageLayers} />}
            {show('business') && <BrandingSection params={params} />}
            {show('business') && <SafetySection params={params} />}
            {show('business') && <SleeveLabelSection params={params} />}
            {show('business') && <PremiumFXSection params={params} imageLayers={imageLayers} />}
            {show('business') && <LogisticsSection params={params} />}

            {/* ── COLLAB ────────────────────────────────────────── */}
            {show('collab') && <CollaborationSection params={params} imageLayers={imageLayers} />}
            {show('collab') && onRestoreVersion && (
              <VersioningSection params={params} imageLayers={imageLayers} onRestore={onRestoreVersion} />
            )}
            {show('collab') && <ComplianceSection onAddLayer={onAddImageLayer} />}
            {show('collab') && <SmartPackagingSection onAddLayer={onAddImageLayer} />}
            {show('collab') && <DPPSection onAddLayer={onAddImageLayer} />}
            {show('collab') && <MobileSection onAddLayer={onAddImageLayer} />}
            {show('collab') && <AccessibilitySection />}
          </>
        )}
      </div>
    </div>
  )
}
