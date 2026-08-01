'use client'

import { useState, useRef } from 'react'
import type { ImageLayer } from '@/lib/types'
import { FieldLabel, CollapsibleSection } from './ui'

type CsvRow = Record<string, string>

function extractVars(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g) || []
  const seen = new Set<string>()
  return matches.map(m => m.slice(2, -2)).filter(v => { if (seen.has(v)) return false; seen.add(v); return true })
}

function resolveTemplate(template: string, row: CsvRow): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => row[k] ?? `{{${k}}}`)
}

function renderTextToDataUrl(text: string): string {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 200
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 400, 200)
  ctx.fillStyle = '#000000'
  ctx.font = '24px Arial'
  ctx.textBaseline = 'top'
  const lines = text.split('\n')
  lines.forEach((line, i) => ctx.fillText(line, 12, 12 + i * 30, 376))
  return canvas.toDataURL('image/png')
}

async function generateQrDataUrl(url: string): Promise<string | null> {
  try {
    const QRCode = (await import('qrcode')).default
    const canvas = document.createElement('canvas')
    await QRCode.toCanvas(canvas, url, { width: 240, margin: 2 })
    return canvas.toDataURL('image/png')
  } catch { return null }
}

export function VDPSection({ onAddLayer }: { onAddLayer: (layer: ImageLayer) => void }) {
  const [template, setTemplate] = useState('')
  const [csvData, setCsvData] = useState<CsvRow[]>([])
  const [rowIndex, setRowIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const vars = extractVars(template)
  const currentRow = csvData[rowIndex] ?? {}
  const preview = template ? resolveTemplate(template, currentRow) : ''
  const headers = csvData.length > 0 ? Object.keys(csvData[0]) : []

  async function handleCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const Papa = (await import('papaparse')).default
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setCsvData(result.data as CsvRow[])
        setRowIndex(0)
        setError(null)
      },
      error: () => setError('Erreur de lecture CSV'),
    })
    e.target.value = ''
  }

  async function handleAddLayer() {
    if (!template.trim()) { setError('Le template est vide'); return }
    setLoading(true)
    setError(null)
    const row = csvData.length > 0 ? currentRow : {}
    const resolved = resolveTemplate(template, row)

    if (vars.includes('qr_url')) {
      const qrUrl = row['qr_url'] ?? ''
      if (qrUrl) {
        const qrSrc = await generateQrDataUrl(qrUrl)
        if (qrSrc) {
          onAddLayer({
            id: `vdp-qr-${Date.now()}`, name: `VDP QR: ${qrUrl.slice(0, 20)}`,
            src: qrSrc, x: 20, y: 20, width: 40, height: 40,
            scale: 1, rotation: 0, visible: true, locked: false,
            faceAssignment: 'auto', kind: 'qr',
          })
        }
      }
    }

    const src = renderTextToDataUrl(resolved)
    onAddLayer({
      id: `vdp-text-${Date.now()}`, name: `VDP: ${resolved.slice(0, 24)}${resolved.length > 24 ? '…' : ''}`,
      src, x: 20, y: 20, width: 80, height: 40,
      scale: 1, rotation: 0, visible: true, locked: false,
      faceAssignment: 'auto', kind: 'text',
    })
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#fff', border: '1px solid #d0d0d0',
    color: '#333', borderRadius: 4, padding: '5px 8px', fontSize: 11,
    outline: 'none', boxSizing: 'border-box',
  }

  const btnBase: React.CSSProperties = {
    border: '1px solid #d0d0d0', borderRadius: 4, padding: '5px 10px',
    fontSize: 11, cursor: 'pointer', background: '#f5f5f5', color: '#333',
  }

  return (
    <CollapsibleSection label="VDP — IMPRESSION VARIABLE">

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>TEMPLATE HANDLEBARS</FieldLabel>
        <textarea
          value={template}
          placeholder={"Bonjour {{prenom}} !\nRéf: {{ref}}"}
          onChange={e => { setTemplate(e.target.value); setError(null) }}
          rows={4}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', lineHeight: 1.5 }}
        />
      </div>

      {vars.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>VARIABLES DÉTECTÉES</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {vars.map(v => (
              <span key={v} style={{ background: '#f0f4ff', border: '1px solid #c8d4f0', borderRadius: 3, padding: '1px 6px', fontSize: 10, color: '#3a5aad', fontFamily: 'monospace' }}>
                {'{{'}{v}{'}}'}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>DONNÉES CSV</FieldLabel>
        <button onClick={() => fileRef.current?.click()} style={btnBase}>
          ↑ Importer CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
        {csvData.length > 0 && (
          <span style={{ marginLeft: 8, fontSize: 10, color: '#777' }}>{csvData.length} ligne{csvData.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {csvData.length > 0 && headers.length > 0 && (
        <div style={{ marginBottom: 8, overflowX: 'auto' }}>
          <FieldLabel>APERÇU (3 premières lignes)</FieldLabel>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
            <thead>
              <tr>{headers.map(h => (
                <th key={h} style={{ border: '1px solid #e0e0e0', padding: '2px 5px', background: '#f5f5f5', color: '#555', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {csvData.slice(0, 3).map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  {headers.map(h => (
                    <td key={h} style={{ border: '1px solid #e0e0e0', padding: '2px 5px', color: '#333', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[h]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {csvData.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <FieldLabel>LIGNE DE PRÉVISUALISATION</FieldLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setRowIndex(i => Math.max(0, i - 1))} style={{ ...btnBase, padding: '4px 8px' }}>‹</button>
            <span style={{ fontSize: 11, color: '#555', flex: 1, textAlign: 'center' }}>{rowIndex + 1} / {csvData.length}</span>
            <button onClick={() => setRowIndex(i => Math.min(csvData.length - 1, i + 1))} style={{ ...btnBase, padding: '4px 8px' }}>›</button>
          </div>
        </div>
      )}

      {preview && (
        <div style={{ marginBottom: 8, background: '#f8f8f8', border: '1px solid #e8e8e8', borderRadius: 4, padding: '6px 8px', fontSize: 11, color: '#333', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {preview}
        </div>
      )}

      {error && <div style={{ fontSize: 10, color: '#e53935', marginBottom: 6 }}>{error}</div>}

      <button
        onClick={handleAddLayer}
        disabled={loading}
        className="fs-btn-primary"
        style={{
          width: '100%', background: loading ? '#999' : '#1a1a1a', color: '#fff',
          border: 'none', borderRadius: 5, padding: '8px 0', fontSize: 11,
          fontWeight: 600, cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Génération...' : '+ Ajouter calque VDP'}
      </button>
    </CollapsibleSection>
  )
}
