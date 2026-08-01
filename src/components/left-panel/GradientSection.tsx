'use client'

import { useState } from 'react'
import type { ImageLayer, BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { CollapsibleSection, ColorPicker, FieldLabel } from './ui'
import { Select } from '@/components/ui/select'

const GRAD_TYPES = [
  { value: 'linear', label: 'Linéaire' },
  { value: 'radial', label: 'Radial' },
  { value: 'diagonal', label: 'Diagonal' },
]

const ANGLE_OPTS = [
  { value: '0', label: '→ Horizontal' },
  { value: '90', label: '↓ Vertical' },
  { value: '45', label: '↘ Diagonal' },
  { value: '135', label: '↙ Contre-diag' },
]

function buildGradientSvg(w: number, h: number, color1: string, color2: string, type: string, angle: number): string {
  if (type === 'radial') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
</svg>`
  }
  const rad = (angle * Math.PI) / 180
  const x2 = 50 + Math.round(Math.cos(rad) * 50)
  const y2 = 50 + Math.round(Math.sin(rad) * 50)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="50%" y1="50%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
</svg>`
}

interface Props {
  params: BoxParams
  activeTemplate: TemplateType
  onAddLayer: (layer: ImageLayer) => void
}

export function GradientSection({ params, activeTemplate, onAddLayer }: Props) {
  const [color1, setColor1] = useState('#e91e8c')
  const [color2, setColor2] = useState('#7c3aed')
  const [gradType, setGradType] = useState('linear')
  const [angle, setAngle] = useState('90')

  const handleAdd = () => {
    const MM_TO_PX = 3.7795275591
    const dieline = computeDieline(params, activeTemplate)
    const frontPanel = dieline.panels.find(p => p.label === 'Front')
    const xMm = frontPanel ? frontPanel.x / MM_TO_PX : params.depth
    const yMm = frontPanel ? frontPanel.y / MM_TO_PX : params.depth / 2
    const wMm = frontPanel ? frontPanel.w / MM_TO_PX : params.width
    const hMm = frontPanel ? frontPanel.h / MM_TO_PX : params.height
    const svgStr = buildGradientSvg(1000, 1000, color1, color2, gradType, Number(angle))
    const src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
    onAddLayer({
      id: `grad-${Date.now()}`, name: 'Dégradé',
      src, x: xMm, y: yMm, width: wMm, height: hMm,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'front', opacity: 0.85, kind: 'image',
    })
  }

  return (
    <CollapsibleSection label="Dégradé">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <ColorPicker label="COULEUR 1" value={color1} onChange={setColor1} />
        <ColorPicker label="COULEUR 2" value={color2} onChange={setColor2} />
      </div>

      {/* Live preview */}
      <div style={{
        height: 28, borderRadius: 4, marginBottom: 8,
        background: gradType === 'radial'
          ? `radial-gradient(circle, ${color1}, ${color2})`
          : `linear-gradient(${angle}deg, ${color1}, ${color2})`,
        border: '1px solid #e0e0e0',
      }} />

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE</FieldLabel>
        <Select value={gradType} options={GRAD_TYPES} onChange={setGradType} />
      </div>

      {gradType !== 'radial' && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>DIRECTION</FieldLabel>
          <Select value={angle} options={ANGLE_OPTS} onChange={setAngle} />
        </div>
      )}

      <button onClick={handleAdd} className="fs-btn-primary" style={{
        width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 6, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
      }}>+ Ajouter le dégradé</button>
    </CollapsibleSection>
  )
}
