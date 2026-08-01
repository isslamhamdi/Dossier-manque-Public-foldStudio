'use client'

import { useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ImageLayer } from '@/lib/types'
import { SectionLabel } from './ui'
import { c, fs, r } from '@/lib/tokens'
import { LayerRow } from './LayerRow'
import { LayerInspector } from './LayerInspector'
import { traceFile } from '@/lib/trace/imageTrace'

function replaceColorInSvgLayer(src: string, fromHex: string, toHex: string): string {
  if (!src.includes('svg')) return src
  try {
    const raw = src.startsWith('data:image/svg+xml;base64,')
      ? decodeURIComponent(escape(atob(src.split(',')[1])))
      : decodeURIComponent(src.split(',')[1])
    const from = fromHex.toLowerCase()
    const replaced = raw.replace(new RegExp(from.replace('#', '#?'), 'gi'), toHex)
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(replaced)))
  } catch { return src }
}

export function LayersPanel({
  imageLayers,
  selectedLayerId,
  selectedLayerIds = [],
  onSelectLayer,
  onAddImageLayer,
  onUpdateImageLayer,
  onDeleteImageLayer,
  onDuplicateImageLayer,
  onReorderLayer,
}: {
  imageLayers: ImageLayer[]
  selectedLayerId: string | null
  selectedLayerIds?: string[]
  onSelectLayer: (id: string | null) => void
  onAddImageLayer: (layer: ImageLayer) => void
  onUpdateImageLayer: (id: string, updates: Partial<ImageLayer>) => void
  onDeleteImageLayer: (id: string) => void
  onDuplicateImageLayer?: (id: string) => void
  onReorderLayer?: (id: string, direction: 'up' | 'down') => void
}) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const vectorInputRef = useRef<HTMLInputElement>(null)
  const [isTracing, setIsTracing] = useState(false)
  const [layerFilter, setLayerFilter] = useState<'all' | 'artwork' | 'structure'>('all')
  const [colorFrom, setColorFrom] = useState('#000000')
  const [colorTo, setColorTo] = useState('#e91e8c')
  const [colorReplaceCount, setColorReplaceCount] = useState<number | null>(null)
  const selectedLayer = imageLayers.find(l => l.id === selectedLayerId) ?? null

  const handleColorReplace = () => {
    let count = 0
    imageLayers.forEach(l => {
      if (!l.src.includes('svg')) return
      const next = replaceColorInSvgLayer(l.src, colorFrom, colorTo)
      if (next !== l.src) { onUpdateImageLayer(l.id, { src: next }); count++ }
    })
    setColorReplaceCount(count)
  }

  const handleGroup = () => {
    const gid = uuidv4()
    selectedLayerIds.forEach(id => onUpdateImageLayer(id, { groupId: gid }))
  }

  const handleUngroup = () => {
    selectedLayerIds.forEach(id => onUpdateImageLayer(id, { groupId: undefined }))
  }

  const filteredLayers = imageLayers.filter(l => {
    if (layerFilter === 'all') return true
    if (layerFilter === 'structure') return l.kind === 'barcode' || l.kind === 'qr' || l.kind === 'picto'
    return l.kind !== 'barcode' && l.kind !== 'qr' && l.kind !== 'picto'
  })

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const src = ev.target?.result as string
      const img = new Image()
      img.onload = () => {
        const naturalW = img.naturalWidth
        const naturalH = img.naturalHeight
        const maxMM = 100
        const ratio = naturalW / naturalH
        const w = ratio >= 1 ? maxMM : maxMM * ratio
        const h = ratio >= 1 ? maxMM / ratio : maxMM
        onAddImageLayer({
          id: `img-${Date.now()}`,
          name: file.name,
          src,
          x: 10, y: 10,
          width: w, height: h,
          scale: 1, rotation: 0,
          visible: true, locked: false,
          faceAssignment: 'auto',
        })
      }
      img.src = src
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleVectorize = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsTracing(true)
    try {
      const svgStr = await traceFile(file, { threshold: 140, simplify: 1.2 })
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`
      const img = new Image()
      img.onload = () => {
        const maxMM = 100
        const ratio = img.naturalWidth / img.naturalHeight
        const w = ratio >= 1 ? maxMM : maxMM * ratio
        const h = ratio >= 1 ? maxMM / ratio : maxMM
        onAddImageLayer({
          id: `vec-${Date.now()}`,
          name: `${file.name} (vectorisé)`,
          src: dataUrl,
          x: 10, y: 10, width: w, height: h,
          scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto',
        })
        setIsTracing(false)
      }
      img.src = dataUrl
    } catch { setIsTracing(false) }
  }

  return (
    <div style={{ marginTop: 4, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionLabel>Calques ({imageLayers.length})</SectionLabel>
        <button
          onClick={() => imageInputRef.current?.click()}
          className="fs-btn-ghost"
          title="Ajouter une image"
          style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="2" width="12" height="10" rx="1"/>
            <circle cx="4.5" cy="5.5" r="1" fill="currentColor" stroke="none"/>
            <path d="M1 10l3-3.5 2.5 2 2-2.5L13 10"/>
          </svg>
        </button>
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageImport} />
        <button
          onClick={() => vectorInputRef.current?.click()}
          disabled={isTracing}
          title="Vectoriser une image (bitmap → contour SVG)"
          className="fs-btn-ghost"
          style={{ background: 'none', border: 'none', color: isTracing ? '#e91e8c' : c.textMuted, cursor: isTracing ? 'wait' : 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }}
        >
          {isTracing ? '…' : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="1" width="5" height="5" rx="0.5" strokeDasharray="2 1.2"/>
              <path d="M7.5 3.5h2M8.5 2.5l1.5 1-1.5 1"/>
              <path d="M8 11C8.5 9 10.5 8 13 8"/>
              <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/>
              <circle cx="13" cy="8" r="1" fill="currentColor" stroke="none"/>
            </svg>
          )}
        </button>
        <input ref={vectorInputRef} type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: 'none' }} onChange={handleVectorize} />
      </div>

      {/* Layer type filter #40 */}
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {(['all', 'artwork', 'structure'] as const).map(f => (
          <button key={f} onClick={() => setLayerFilter(f)}
            style={{
              flex: 1, fontSize: 9, padding: '3px 0', cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${layerFilter === f ? '#1a1a1a' : '#e0e0e0'}`,
              borderRadius: 3, background: layerFilter === f ? '#1a1a1a' : '#fff',
              color: layerFilter === f ? '#fff' : '#888', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.3,
            }}>
            {f === 'all' ? 'Tous' : f === 'artwork' ? 'Artwork' : 'Structure'}
          </button>
        ))}
      </div>

      {/* Global color replace #367 — SVG layers only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
        <input type="color" value={colorFrom} onChange={e => { setColorFrom(e.target.value); setColorReplaceCount(null) }}
          style={{ width: 22, height: 22, border: '1px solid #e0e0e0', borderRadius: 3, cursor: 'pointer', padding: 0 }} title="Couleur source" />
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#999" strokeWidth="1.3"><path d="M2 5h6M6 3l2 2-2 2"/></svg>
        <input type="color" value={colorTo} onChange={e => { setColorTo(e.target.value); setColorReplaceCount(null) }}
          style={{ width: 22, height: 22, border: '1px solid #e0e0e0', borderRadius: 3, cursor: 'pointer', padding: 0 }} title="Couleur cible" />
        <button onClick={handleColorReplace} title="Remplacer la couleur dans tous les calques SVG"
          style={{ flex: 1, fontSize: 9, padding: '3px 0', cursor: 'pointer', fontFamily: 'inherit', border: '1px solid #e0e0e0', borderRadius: 3, background: '#f8f8f8', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
          Remplacer
        </button>
        {colorReplaceCount !== null && (
          <span style={{ fontSize: 9, color: colorReplaceCount > 0 ? '#22a' : '#888' }}>{colorReplaceCount}✓</span>
        )}
      </div>

      {filteredLayers.map((layer, idx) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          idx={idx}
          totalCount={imageLayers.length}
          selectedLayerId={selectedLayerId}
          selectedLayerIds={selectedLayerIds}
          onSelectLayer={onSelectLayer}
          onUpdateImageLayer={onUpdateImageLayer}
          onDeleteImageLayer={onDeleteImageLayer}
          onDuplicateImageLayer={onDuplicateImageLayer}
          onReorderLayer={onReorderLayer}
        />
      ))}

      {/* Vector layer placeholder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 6px', borderRadius: 4, marginBottom: 2 }}>
        <span style={{ color: c.textGhost, fontSize: fs.sm, flexShrink: 0 }}>⠿</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#999" strokeWidth="1.2" style={{ flexShrink: 0 }}>
          <rect x="1" y="1" width="4.5" height="4.5" rx="0.6"/>
          <rect x="7.5" y="1" width="4.5" height="4.5" rx="0.6"/>
          <rect x="1" y="7.5" width="4.5" height="4.5" rx="0.6"/>
          <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.6"/>
        </svg>
        <span style={{ fontSize: fs.md, color: c.textMed, flex: 1 }}>Vec...</span>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="#bbb" strokeWidth="1.2">
          <rect x="2" y="5" width="7" height="5" rx="1"/>
          <path d="M3.5 5V3.5a2 2 0 0 1 4 0V5"/>
        </svg>
      </div>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:reset-view'))}
        className="fs-btn-default"
        style={{
          width: '100%', background: c.surface, border: `1px solid ${c.borderLight}`,
          color: '#444', borderRadius: r.lg, padding: '7px 10px', fontSize: fs.md,
          fontWeight: 500, cursor: 'pointer', marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="2" y="3" width="9" height="7" rx="1"/>
          <path d="M5 3V2M8 3V2" strokeLinecap="round"/>
        </svg>
        Vue de face
      </button>

      {selectedLayerIds.length > 1 && (() => {
        const sel = imageLayers.filter(l => selectedLayerIds.includes(l.id))
        const minX = Math.min(...sel.map(l => l.x))
        const maxX = Math.max(...sel.map(l => l.x + l.width * l.scale))
        const minY = Math.min(...sel.map(l => l.y))
        const maxY = Math.max(...sel.map(l => l.y + l.height * l.scale))
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2

        const alignActions: Array<{ title: string; icon: React.ReactNode; action: () => void }> = [
          { title: 'Aligner à gauche', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="2" x2="2" y2="12"/><rect x="3" y="4" width="8" height="6" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { x: minX })) },
          { title: 'Centrer horizontalement', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="7" y1="2" x2="7" y2="12"/><rect x="3" y="4" width="8" height="6" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { x: centerX - (l.width * l.scale) / 2 })) },
          { title: 'Aligner à droite', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="12" y1="2" x2="12" y2="12"/><rect x="3" y="4" width="8" height="6" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { x: maxX - l.width * l.scale })) },
          { title: 'Aligner en haut', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="2" x2="12" y2="2"/><rect x="4" y="3" width="6" height="8" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { y: minY })) },
          { title: 'Centrer verticalement', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="7" x2="12" y2="7"/><rect x="4" y="3" width="6" height="8" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { y: centerY - (l.height * l.scale) / 2 })) },
          { title: 'Aligner en bas', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="12" x2="12" y2="12"/><rect x="4" y="3" width="6" height="8" rx="1"/></svg>, action: () => sel.forEach(l => onUpdateImageLayer(l.id, { y: maxY - l.height * l.scale })) },
        ]
        const sorted = [...sel].sort((a, b) => a.x - b.x)
        const distributeH = () => {
          if (sorted.length < 3) return
          const totalW = sorted.reduce((s, l) => s + l.width * l.scale, 0)
          const gap = (maxX - minX - totalW) / (sorted.length - 1)
          let curX = minX
          sorted.forEach(l => { onUpdateImageLayer(l.id, { x: curX }); curX += l.width * l.scale + gap })
        }
        return (
          <div style={{ marginTop: 10 }}>
            <div style={{ padding: '7px 10px', background: c.accentBg, border: `1px solid ${c.accentBorder}`, borderRadius: r.xl, fontSize: fs.md, color: '#4455cc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span><strong>{selectedLayerIds.length}</strong> calques — Alignement</span>
              <button onClick={() => onSelectLayer(null)} className="fs-btn-ghost" style={{ background: 'none', border: 'none', color: '#4455cc', cursor: 'pointer', fontWeight: 700, fontSize: fs.lg, padding: 0, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {alignActions.map(({ title, icon, action }) => (
                <button key={title} onClick={action} title={title}
                  style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, padding: '4px 9px', fontSize: 12, cursor: 'pointer', color: '#555', fontFamily: 'inherit' }}>
                  {icon}
                </button>
              ))}
              <button onClick={distributeH} title="Distribuer horizontalement"
                style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, padding: '4px 9px', fontSize: 10, cursor: 'pointer', color: '#555', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><line x1="2" y1="2" x2="2" y2="12"/><line x1="12" y1="2" x2="12" y2="12"/><rect x="5" y="4" width="4" height="6" rx="1"/></svg>
                Distr.
              </button>
              <button onClick={handleGroup} title="Grouper les calques"
                style={{ background: '#eef0ff', border: '1px solid #ccd0ff', borderRadius: 4, padding: '4px 9px', fontSize: 10, cursor: 'pointer', color: '#445', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="2" y="2" width="4" height="4" rx="0.8"/><rect x="8" y="2" width="4" height="4" rx="0.8"/><rect x="2" y="8" width="4" height="4" rx="0.8"/><rect x="8" y="8" width="4" height="4" rx="0.8"/><rect x="3" y="3" width="8" height="8" rx="1" strokeDasharray="2 1.5"/></svg>
                Gp.
              </button>
              <button onClick={handleUngroup} title="Dégrouper"
                style={{ background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 4, padding: '4px 9px', fontSize: 10, cursor: 'pointer', color: '#555', fontFamily: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2 1.5"><rect x="2" y="2" width="10" height="10" rx="1"/></svg>
                DGp.
              </button>
            </div>
          </div>
        )
      })()}

      {selectedLayer && selectedLayerIds.length <= 1 && (
        <LayerInspector layer={selectedLayer} onUpdateImageLayer={onUpdateImageLayer} />
      )}
    </div>
  )
}
