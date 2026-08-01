'use client'
// #368 — Texte continu inter-faces: text flows across dieline panels
import { useRef, useState, useCallback } from 'react'
import type { BoxParams } from '@/lib/types'
import type { DielineData } from '@/lib/dieline/helpers'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'

interface TextFlowSectionProps {
  params: BoxParams
  dieline: DielineData | null
  onAddLayer: (layer: ImageLayer) => void
}

const FONTS = ['Arial', 'Georgia', 'Courier New', 'Trebuchet MS', 'Impact', 'Verdana']
const MM_TO_PX = 3.7795275591

export function TextFlowSection({ params, dieline, onAddLayer }: TextFlowSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('FOLD STUDIO')
  const [font, setFont] = useState('Impact')
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#1a1a1a')
  const [selectedPanels, setSelectedPanels] = useState<string[]>([])
  const [offsetY, setOffsetY] = useState(50)
  const [preview, setPreview] = useState(false)

  const togglePanel = (label: string) => {
    setSelectedPanels(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const panels = dieline?.panels ?? []

  const handleGenerate = useCallback(() => {
    const cv = canvasRef.current
    if (!cv || !dieline) return

    const activePanels = panels.filter(p => selectedPanels.includes(p.label))
    if (!activePanels.length) return

    // Compute bounding box of selected panels
    const minX = Math.min(...activePanels.map(p => p.x))
    const minY = Math.min(...activePanels.map(p => p.y))
    const maxX = Math.max(...activePanels.map(p => p.x + p.w))
    const maxY = Math.max(...activePanels.map(p => p.y + p.h))

    const totalW = Math.round((maxX - minX) * MM_TO_PX)
    const totalH = Math.round((maxY - minY) * MM_TO_PX)

    cv.width = totalW
    cv.height = totalH
    const ctx = cv.getContext('2d')!

    // Draw each panel as a region
    for (const p of activePanels) {
      const px = (p.x - minX) * MM_TO_PX
      const py = (p.y - minY) * MM_TO_PX
      const pw = p.w * MM_TO_PX
      const ph = p.h * MM_TO_PX
      ctx.fillStyle = '#f8f6f2'
      ctx.fillRect(px, py, pw, ph)
      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(px, py, pw, ph)
      ctx.fillStyle = '#bbb'
      ctx.font = `11px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText(p.label, px + pw / 2, py + 16)
    }

    // Draw fold lines between panels
    if (dieline) {
      ctx.strokeStyle = '#4fc3f7'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      const coordRe = /[ML]\s*([\d.]+),([\d.]+)/g
      for (const path of dieline.foldLines) {
        ctx.beginPath()
        let first = true
        let m: RegExpExecArray | null
        coordRe.lastIndex = 0
        while ((m = coordRe.exec(path)) !== null) {
          const x = (parseFloat(m[1]) - minX * MM_TO_PX)
          const y = (parseFloat(m[2]) - minY * MM_TO_PX)
          first ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
          first = false
        }
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    // Draw the flowing text across all panels
    ctx.save()
    ctx.font = `bold ${fontSize}px ${font}`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'

    // Clip to union of active panels
    ctx.beginPath()
    for (const p of activePanels) {
      const px = (p.x - minX) * MM_TO_PX
      const py = (p.y - minY) * MM_TO_PX
      ctx.rect(px, py, p.w * MM_TO_PX, p.h * MM_TO_PX)
    }
    ctx.clip()

    // Draw text at given Y offset % across total width
    const yPos = (offsetY / 100) * totalH
    ctx.fillText(text, 0, yPos)
    ctx.restore()

    setPreview(true)
  }, [dieline, selectedPanels, panels, text, font, fontSize, color, offsetY])

  const handleAddAsLayer = useCallback(() => {
    const cv = canvasRef.current
    if (!cv) return
    const dataUrl = cv.toDataURL('image/png')
    const id = `textflow-${Date.now()}`

    const activePanels = panels.filter(p => selectedPanels.includes(p.label))
    if (!activePanels.length) return
    const minX = Math.min(...activePanels.map(p => p.x))
    const minY = Math.min(...activePanels.map(p => p.y))

    onAddLayer({
      id,
      name: `Text flow: ${text}`,
      src: dataUrl,
      x: minX,
      y: minY,
      width: cv.width / MM_TO_PX,
      height: cv.height / MM_TO_PX,
      scale: 1,
      opacity: 1,
      rotation: 0,
      locked: false,
      visible: true,
      faceAssignment: 'auto',
      kind: 'text',
    })
  }, [panels, selectedPanels, onAddLayer])

  return (
    <CollapsibleSection label="TEXTE INTER-FACES">
      <div style={{ fontSize: 9, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: -6 }}>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TEXTE</FieldLabel>
        <input
          type="text" value={text} onChange={e => setText(e.target.value)}
          style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 8px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div>
          <FieldLabel>POLICE</FieldLabel>
          <select value={font} onChange={e => setFont(e.target.value)}
            style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 6px', fontSize: 11, outline: 'none', background: '#fff' }}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>TAILLE (px)</FieldLabel>
          <input type="number" min={12} max={200} value={fontSize} onChange={e => setFontSize(+e.target.value)}
            style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 8px', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>COULEUR</FieldLabel>
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          style={{ width: '100%', height: 32, border: '1px solid #d0d0d0', borderRadius: 4, padding: 2, cursor: 'pointer' }} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>POSITION Y ({offsetY}%)</FieldLabel>
        <input type="range" min={5} max={95} value={offsetY} onChange={e => setOffsetY(+e.target.value)} style={{ width: '100%' }} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <FieldLabel>FACES (sélectionner les faces à traverser)</FieldLabel>
        {panels.length === 0 && (
          <div style={{ fontSize: 10, color: '#aaa', padding: '8px 0' }}>Aucun patron chargé</div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {panels.map(p => (
            <button
              key={p.label}
              onClick={() => togglePanel(p.label)}
              style={{
                padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                border: selectedPanels.includes(p.label) ? 'none' : '1px solid #d0d0d0',
                background: selectedPanels.includes(p.label) ? '#1a1a1a' : '#f5f5f5',
                color: selectedPanels.includes(p.label) ? '#fff' : '#555',
                cursor: 'pointer',
              }}
            >{p.label}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          onClick={handleGenerate}
          disabled={!selectedPanels.length || !dieline}
          style={{
            flex: 1, background: selectedPanels.length && dieline ? '#1a1a1a' : '#bbb',
            color: '#fff', border: 'none', borderRadius: 5, padding: '8px 0',
            fontSize: 11, fontWeight: 600, cursor: selectedPanels.length && dieline ? 'pointer' : 'default',
          }}
        >
          Prévisualiser
        </button>
        {preview && (
          <button onClick={handleAddAsLayer} style={{
            flex: 1, background: '#2d6a2d', color: '#fff', border: 'none',
            borderRadius: 5, padding: '8px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            Ajouter calque
          </button>
        )}
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 6, border: '1px solid #e0e0e0', display: 'block' }} />

      {!dieline && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textAlign: 'center' }}>
          Sélectionnez un template pour voir les faces disponibles
        </div>
      )}
    </CollapsibleSection>
  )
}
