'use client'

import { useState, useRef } from 'react'
import { CollapsibleSection } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import type { BoxParams, TemplateType } from '@/lib/types'

interface Props {
  onImport: (params: Partial<BoxParams>, template: TemplateType) => void
}

type ImportStatus = { type: 'idle' } | { type: 'success'; message: string } | { type: 'error'; message: string }

export function ImportSection({ onImport }: Props) {
  const [status, setStatus] = useState<ImportStatus>({ type: 'idle' })
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    setStatus({ type: 'idle' })

    try {
      const text = await file.text()

      if (ext === 'dxf') {
        const { parseDXF } = await import('@/lib/import/dxf-import')
        const result = parseDXF(text)
        if (result.error) {
          setStatus({ type: 'error', message: result.error })
          return
        }
        onImport(result.params, result.template)
        setStatus({
          type: 'success',
          message: `DXF importé — ${result.stats.cutLines} entités coupe, ${result.stats.foldLines} plis, ${result.stats.totalLength} mm total`,
        })

      } else if (ext === 'cf2') {
        const { parseCF2 } = await import('@/lib/export/cf2')
        const result = parseCF2(text)
        if (result.error) {
          setStatus({ type: 'error', message: result.error })
          return
        }
        onImport(result.params, result.template)
        setStatus({ type: 'success', message: 'Fichier CF2 importé avec succès' })

      } else {
        setStatus({ type: 'error', message: `Format non supporté: .${ext} — utilisez .dxf ou .cf2` })
      }
    } catch (e) {
      setStatus({ type: 'error', message: `Erreur lecture fichier: ${String(e)}` })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <CollapsibleSection label="Import DXF / CF2">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : c.borderLight}`,
          borderRadius: r.lg,
          padding: '18px 12px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(59,130,246,0.05)' : c.white,
          transition: 'all 0.15s',
          marginBottom: 8,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".dxf,.cf2"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#3b82f6' : c.textGhost} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 6 }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <div style={{ fontSize: fs.sm, fontWeight: fw.bold, color: dragging ? '#3b82f6' : c.textMed, marginBottom: 3 }}>
          Déposer un fichier ici
        </div>
        <div style={{ fontSize: 9, color: c.textGhost }}>
          .dxf (ArtiosCAD, Illustrator) ou .cf2 (Fold Studio)
        </div>
      </div>

      {/* Format info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
        {[
          { fmt: 'DXF', desc: 'ArtiosCAD · AI · AutoCAD', color: '#f59e0b' },
          { fmt: 'CF2', desc: 'Fold Studio natif', color: '#3b82f6' },
        ].map(({ fmt, desc, color }) => (
          <div key={fmt} style={{ padding: '6px 8px', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: '#fafafa' }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.heavy, color }}>{fmt}</div>
            <div style={{ fontSize: 8, color: c.textGhost, marginTop: 1 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Status */}
      {status.type !== 'idle' && (
        <div style={{
          padding: '7px 10px', borderRadius: r.md,
          background: status.type === 'success' ? '#f0fdf4' : '#fff5f5',
          border: `1px solid ${status.type === 'success' ? '#86efac' : '#fca5a5'}`,
          fontSize: 9, color: status.type === 'success' ? '#166534' : '#991b1b',
          lineHeight: 1.4,
        }}>
          {status.type === 'success' ? (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginRight: 4, flexShrink: 0, verticalAlign: 'middle' }}><polyline points="2 6 5 9 10 3"/></svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ marginRight: 4, flexShrink: 0, verticalAlign: 'middle' }}><line x1="6" y1="2" x2="6" y2="7"/><circle cx="6" cy="10" r="0.5" fill="currentColor"/></svg>
          )}
          {status.message}
        </div>
      )}

      <div style={{ fontSize: 8, color: c.textGhost, lineHeight: 1.4, marginTop: 6 }}>
        L&apos;import DXF reconstruit les dimensions approximatives à partir de la géométrie. Vérifiez les valeurs après import.<br/>
        <strong style={{ color: '#b45309' }}>CF2 Fold Studio</strong> : ouvrez uniquement via cette zone — les fichiers .cf2 ne s&apos;ouvrent pas depuis le Finder.
      </div>
    </CollapsibleSection>
  )
}
