'use client'

import { useState, useEffect } from 'react'
import { c, fw, fs, r } from '@/lib/tokens'
import type { BoxParams, TemplateType, ImageLayer, MaterialColors } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'
import type { LightingConfig } from '@/components/three-scene/AdvancedLighting'
import type { PostFXConfig } from '@/components/three-scene/EffectsLayer'
import type { Text3DConfig } from '@/components/three-scene/Text3DLayer'
import type { SceneCameraConfig } from './SceneCameraSection'

// Design advanced
import { AIDesignSection } from './AIDesignSection'
import { TextFlowSection } from './TextFlowSection'
import { GradientSection } from './GradientSection'
import { PatternSection } from './PatternSection'
import { VDPSection } from './VDPSection'
import { PictogramSection } from './PictogramSection'

// Material advanced
import { CmykSeparationSection } from './CmykSeparationSection'
import { InkCoverageSection } from './InkCoverageSection'
import { PostFXSection } from './PostFXSection'
import { Text3DSection } from './Text3DSection'
import { SceneCameraSection } from './SceneCameraSection'

// Print advanced
import { NestingSection } from './NestingSection'
import { PrintSimSection } from './PrintSimSection'
import { PrintQASection } from './PrintQASection'
import { AntiCounterfeitSection } from './AntiCounterfeitSection'
import { StrengthSection } from './StrengthSection'

// Éco
import { SustainabilitySection } from './SustainabilitySection'
import { FoodSafetySection } from './FoodSafetySection'
import { CertificationSection } from './CertificationSection'
import { StructuralSection } from './StructuralSection'
import { EcoExtendedSection } from './EcoExtendedSection'

// Business
import { BusinessSection } from './BusinessSection'
import { WorkflowSection } from './WorkflowSection'
import { MarketplaceSection } from './MarketplaceSection'
import { RetailSection } from './RetailSection'
import { MarketingSection } from './MarketingSection'
import { EcommerceSection } from './EcommerceSection'
import { BrandingSection } from './BrandingSection'
import { SafetySection } from './SafetySection'
import { SleeveLabelSection } from './SleeveLabelSection'
import { PremiumFXSection } from './PremiumFXSection'
import { LogisticsSection } from './LogisticsSection'

// Collab
import { CollaborationSection } from './CollaborationSection'
import { VersioningSection } from './VersioningSection'
import { ComplianceSection } from './ComplianceSection'
import { SmartPackagingSection } from './SmartPackagingSection'
import { DPPSection } from './DPPSection'
import { MobileSection } from './MobileSection'
import { AccessibilitySection } from './AccessibilitySection'

type TabId = 'advanced' | 'eco' | 'business' | 'collab'

const TABS: Array<{ id: TabId; label: string; count: number; color: string }> = [
  { id: 'advanced', label: 'Avancé',   count: 11, color: '#6366f1' },
  { id: 'eco',      label: 'Éco',      count: 5,  color: '#10b981' },
  { id: 'business', label: 'Business', count: 11, color: '#f59e0b' },
  { id: 'collab',   label: 'Collab',   count: 7,  color: '#e91e8c' },
]

export interface AdvancedPanelProps {
  onClose: () => void
  params: BoxParams
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
  materialColors: MaterialColors
  dieline: DielineData
  onAddImageLayer: (layer: ImageLayer) => void
  onTemplateChange: (t: TemplateType) => void
  onRestoreVersion?: (params: BoxParams, layers: ImageLayer[]) => void
  postFXConfig?: PostFXConfig
  onPostFXChange?: (c: PostFXConfig) => void
  text3DConfig?: Text3DConfig
  onText3DChange?: (c: Text3DConfig) => void
  text3DEnabled?: boolean
  onText3DToggle?: () => void
  sceneCameraConfig?: SceneCameraConfig
  onSceneCameraChange?: (c: SceneCameraConfig) => void
  defaultTab?: TabId
}

export function AdvancedPanel({
  onClose, params, activeTemplate, imageLayers, materialColors, dieline,
  onAddImageLayer, onTemplateChange, onRestoreVersion,
  postFXConfig, onPostFXChange,
  text3DConfig, onText3DChange, text3DEnabled = false, onText3DToggle,
  sceneCameraConfig, onSceneCameraChange,
  defaultTab,
}: AdvancedPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab ?? 'advanced')

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab)
  }, [defaultTab])

  const patronW = params.width + 2 * params.depth
  const patronH = params.height + params.depth

  return (
    /* Panel — fixed, glisse à gauche de la sidebar, sans backdrop */
    <div style={{
      position: 'fixed', top: 0, right: 240, bottom: 0,
      width: 260, background: '#f5f4f2',
      borderLeft: '1px solid #ddd8d2',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-6px 0 20px rgba(0,0,0,0.08)',
      zIndex: 9990,
      animation: 'slideInFromRight 0.15s ease-out',
    }}>
        {/* Header */}
        <div style={{
          padding: '10px 12px 0', flexShrink: 0,
          borderBottom: '1px solid #ddd8d2',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: fs.sm, fontWeight: fw.heavy, color: c.ink, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Sections avancées
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textGhost, padding: 2, borderRadius: r.sm }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/>
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, paddingBottom: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '5px 2px 7px', border: 'none', background: 'none',
                  cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab.id ? tab.color : 'transparent'}`,
                  transition: 'border-color 0.15s',
                }}
              >
                <span style={{
                  display: 'block', fontSize: 9, fontWeight: activeTab === tab.id ? fw.heavy : fw.medium,
                  color: activeTab === tab.id ? tab.color : c.textGhost,
                  transition: 'color 0.15s',
                }}>{tab.label}</span>
                <span style={{ display: 'block', fontSize: 7.5, color: activeTab === tab.id ? tab.color : '#ccc', marginTop: 1 }}>
                  {tab.count} outils
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>

          {activeTab === 'advanced' && (
            <>
              <AIDesignSection onAddImageLayer={onAddImageLayer} params={params} activeTemplate={activeTemplate} onTemplateChange={onTemplateChange} />
              <TextFlowSection params={params} dieline={dieline ?? null} onAddLayer={onAddImageLayer} />
              <GradientSection params={params} activeTemplate={activeTemplate} onAddLayer={onAddImageLayer} />
              <PatternSection params={params} activeTemplate={activeTemplate} onAddLayer={onAddImageLayer} />
              <VDPSection onAddLayer={onAddImageLayer} />
              <PictogramSection onAddLayer={onAddImageLayer} />
              <CmykSeparationSection exteriorColor={materialColors.exterior} interiorColor={materialColors.interior} />
              <InkCoverageSection imageLayers={imageLayers} patronWidth={patronW} patronHeight={patronH} />
              {postFXConfig && onPostFXChange && <PostFXSection config={postFXConfig} onChange={onPostFXChange} />}
              {text3DConfig && onText3DChange && onText3DToggle && (
                <Text3DSection config={text3DConfig} onChange={onText3DChange} enabled={text3DEnabled} onToggle={onText3DToggle} />
              )}
              {sceneCameraConfig && onSceneCameraChange && (
                <SceneCameraSection
                  config={sceneCameraConfig} onChange={onSceneCameraChange}
                  onSetCamera={pos => window.dispatchEvent(new CustomEvent('fold-studio:set-camera', { detail: { pos } }))}
                  onHighResCapture={res => window.dispatchEvent(new CustomEvent('fold-studio:highres-capture', { detail: { res } }))}
                  on360Capture={() => window.dispatchEvent(new CustomEvent('fold-studio:360-capture'))}
                />
              )}
              <NestingSection params={params} activeTemplate={activeTemplate} />
              <PrintSimSection imageLayers={imageLayers} patronWidth={patronW} patronHeight={patronH} onAddLayer={onAddImageLayer} />
              <PrintQASection imageLayers={imageLayers} />
              <AntiCounterfeitSection onAddLayer={onAddImageLayer} />
              <StrengthSection params={params} />
            </>
          )}

          {activeTab === 'eco' && (
            <>
              <SustainabilitySection params={params} onAddLayer={onAddImageLayer} />
              <FoodSafetySection params={params} />
              <CertificationSection />
              <StructuralSection params={params} dieline={dieline} />
              <EcoExtendedSection params={params} />
            </>
          )}

          {activeTab === 'business' && (
            <>
              <BusinessSection params={params} activeTemplate={activeTemplate} />
              <WorkflowSection params={params} activeTemplate={activeTemplate} />
              <MarketplaceSection />
              <RetailSection imageLayers={imageLayers} params={params} />
              <MarketingSection imageLayers={imageLayers} />
              <EcommerceSection params={params} imageLayers={imageLayers} />
              <BrandingSection params={params} />
              <SafetySection params={params} />
              <SleeveLabelSection params={params} />
              <PremiumFXSection params={params} imageLayers={imageLayers} />
              <LogisticsSection params={params} />
            </>
          )}

          {activeTab === 'collab' && (
            <>
              <CollaborationSection params={params} imageLayers={imageLayers} />
              {onRestoreVersion && (
                <VersioningSection params={params} imageLayers={imageLayers} onRestore={onRestoreVersion} />
              )}
              <ComplianceSection onAddLayer={onAddImageLayer} />
              <SmartPackagingSection onAddLayer={onAddImageLayer} />
              <DPPSection onAddLayer={onAddImageLayer} />
              <MobileSection onAddLayer={onAddImageLayer} />
              <AccessibilitySection />
            </>
          )}
        </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(16px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
