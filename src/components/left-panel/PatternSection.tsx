'use client'

import { useState } from 'react'
import type { ImageLayer, BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { CollapsibleSection, ColorPicker, FieldLabel } from './ui'
import { Select } from '@/components/ui/select'

const PATTERN_TYPES = [
  { value: 'dots',       label: '● Pois' },
  { value: 'stripes',    label: '≡ Rayures' },
  { value: 'crosshatch', label: '# Hachures croisées' },
]
const SIZE_OPTS = [
  { value: '3',  label: '3mm — Fin' },
  { value: '6',  label: '6mm — Normal' },
  { value: '12', label: '12mm — Large' },
  { value: '20', label: '20mm — Très large' },
]
const ANGLE_OPTS = [
  { value: '0',  label: '0° — Horizontal' },
  { value: '45', label: '45° — Diagonal' },
  { value: '90', label: '90° — Vertical' },
]

interface Props {
  params: BoxParams
  activeTemplate: TemplateType
  onAddLayer: (layer: ImageLayer) => void
}

function buildPatternSvg(w: number, h: number, type: string, fgColor: string, bgColor: string, sizeMm: number, angle: number): string {
  const sizePx = sizeMm * 4
  let shapeSvg = ''
  if (type === 'dots') {
    shapeSvg = `<circle cx="${sizePx / 2}" cy="${sizePx / 2}" r="${sizePx * 0.22}" fill="${fgColor}"/>`
  } else if (type === 'stripes') {
    shapeSvg = `<line x1="${sizePx / 2}" y1="0" x2="${sizePx / 2}" y2="${sizePx}" stroke="${fgColor}" stroke-width="${sizePx * 0.28}"/>`
  } else {
    shapeSvg = `<line x1="${sizePx / 2}" y1="0" x2="${sizePx / 2}" y2="${sizePx}" stroke="${fgColor}" stroke-width="${sizePx * 0.14}"/>
    <line x1="0" y1="${sizePx / 2}" x2="${sizePx}" y2="${sizePx / 2}" stroke="${fgColor}" stroke-width="${sizePx * 0.14}"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 4}" height="${h * 4}">
  <defs>
    <pattern id="pat" x="0" y="0" width="${sizePx}" height="${sizePx}" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})">
      <rect width="${sizePx}" height="${sizePx}" fill="${bgColor}"/>
      ${shapeSvg}
    </pattern>
  </defs>
  <rect width="${w * 4}" height="${h * 4}" fill="url(#pat)"/>
</svg>`
}

export function PatternSection({ params, activeTemplate, onAddLayer }: Props) {
  const [patType, setPatType]   = useState('dots')
  const [fgColor, setFgColor]   = useState('#e91e8c')
  const [bgColor, setBgColor]   = useState('#ffffff')
  const [size, setSize]         = useState('6')
  const [angle, setAngle]       = useState('0')

  const handleAdd = () => {
    const MM_TO_PX = 3.7795275591
    const dieline = computeDieline(params, activeTemplate)
    const frontPanel = dieline.panels.find(p => p.label === 'Front')
    const xMm = frontPanel ? frontPanel.x / MM_TO_PX : params.depth
    const yMm = frontPanel ? frontPanel.y / MM_TO_PX : params.depth / 2
    const wMm = frontPanel ? frontPanel.w / MM_TO_PX : params.width
    const hMm = frontPanel ? frontPanel.h / MM_TO_PX : params.height
    const svgStr = buildPatternSvg(wMm, hMm, patType, fgColor, bgColor, Number(size), Number(angle))
    const src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
    onAddLayer({
      id: `pat-${Date.now()}`, name: `Pattern: ${patType}`,
      src, x: xMm, y: yMm, width: wMm, height: hMm,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'front', opacity: 0.9, kind: 'image',
    })
  }

  // Live preview style
  const previewStyle: React.CSSProperties = (() => {
    const s = Number(size)
    if (patType === 'dots') return {
      backgroundImage: `radial-gradient(circle, ${fgColor} 22%, transparent 22%)`,
      backgroundSize: `${s * 4}px ${s * 4}px`,
      backgroundPosition: '0 0',
      backgroundColor: bgColor,
    }
    if (patType === 'stripes') return {
      backgroundImage: `repeating-linear-gradient(${Number(angle) + 90}deg, ${fgColor} 0, ${fgColor} ${s * 1.1}px, ${bgColor} ${s * 1.1}px, ${bgColor} ${s * 4}px)`,
    }
    return {
      backgroundImage: `repeating-linear-gradient(${Number(angle) + 90}deg, ${fgColor} 0, ${fgColor} ${s * 0.6}px, transparent ${s * 0.6}px, transparent ${s * 4}px), repeating-linear-gradient(${Number(angle)}deg, ${fgColor} 0, ${fgColor} ${s * 0.6}px, ${bgColor} ${s * 0.6}px, ${bgColor} ${s * 4}px)`,
    }
  })()

  return (
    <CollapsibleSection label="Pattern / Répétition">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <ColorPicker label="MOTIF" value={fgColor} onChange={setFgColor} />
        <ColorPicker label="FOND" value={bgColor} onChange={setBgColor} />
      </div>

      {/* Live preview */}
      <div style={{ height: 36, borderRadius: 4, marginBottom: 8, border: '1px solid #e0e0e0', ...previewStyle }} />

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TYPE</FieldLabel>
        <Select value={patType} options={PATTERN_TYPES} onChange={setPatType} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>TAILLE</FieldLabel>
          <Select value={size} options={SIZE_OPTS} onChange={setSize} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>ANGLE</FieldLabel>
          <Select value={angle} options={ANGLE_OPTS} onChange={setAngle} />
        </div>
      </div>

      <button onClick={handleAdd} className="fs-btn-primary" style={{
        width: '100%', background: '#1a1a1a', color: '#fff', border: 'none',
        borderRadius: 6, padding: '7px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
      }}>+ Ajouter le pattern</button>
    </CollapsibleSection>
  )
}
