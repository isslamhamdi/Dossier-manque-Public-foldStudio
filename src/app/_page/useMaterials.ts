'use client'

import { useState, useEffect } from 'react'
import { MATERIAL_PRESETS } from '@/lib/types'

export function useMaterials() {
  const [exteriorPresetId, setExteriorPresetId] = useState('brillant')
  const [interiorPresetId, setInteriorPresetId] = useState('carton')
  const [exteriorCustomColor, setExteriorCustomColor] = useState('#FFFFFF')
  const [interiorCustomColor, setInteriorCustomColor] = useState('#F0EDE8')
  const [materialFaceTab, setMaterialFaceTab] = useState<'exterior' | 'interior'>('exterior')
  const [showMaterialsPanel, setShowMaterialsPanel] = useState(false)

  useEffect(() => {
    if (!showMaterialsPanel) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-materials-panel]') && !target.closest('[data-toolbar]')) {
        setShowMaterialsPanel(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [showMaterialsPanel])

  const exteriorPreset = MATERIAL_PRESETS.find(p => p.id === exteriorPresetId) || MATERIAL_PRESETS[2]
  const interiorPreset = MATERIAL_PRESETS.find(p => p.id === interiorPresetId) || MATERIAL_PRESETS[0]
  const exteriorActualColor = exteriorPresetId === 'personnalise' ? exteriorCustomColor : exteriorPreset.color
  const interiorActualColor = interiorPresetId === 'personnalise' ? interiorCustomColor : interiorPreset.color

  return {
    exteriorPresetId, setExteriorPresetId,
    interiorPresetId, setInteriorPresetId,
    exteriorCustomColor, setExteriorCustomColor,
    interiorCustomColor, setInteriorCustomColor,
    materialFaceTab, setMaterialFaceTab,
    exteriorPreset, interiorPreset,
    exteriorActualColor, interiorActualColor,
    showMaterialsPanel, setShowMaterialsPanel,
  }
}
