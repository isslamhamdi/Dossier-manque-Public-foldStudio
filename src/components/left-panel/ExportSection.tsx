'use client'

import { useMemo } from 'react'
import { CollapsibleSection } from './ui'
import { CostSection } from './CostSection'
import type { BoxParams, ImageLayer, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { TEMPLATES } from '@/lib/templates'
import { c, r, fw, fs } from '@/lib/tokens'

const FORMATS = [
  { label: 'SVG', format: 'SVG', icon: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="6" cy="6" r="4.5"/><path d="M3.5 6h5M6 3.5v5"/></svg>
  )},
  { label: 'PDF', format: 'PRINT_PDF', icon: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="2" y="1" width="8" height="10" rx="1"/><path d="M4 4h4M4 6h4M4 8h2"/></svg>
  )},
  { label: 'DXF', format: 'DXF', icon: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 9L5 3l3 6M3.5 7h3"/></svg>
  )},
  { label: 'PNG', format: 'PNG', icon: (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2.5" width="9" height="7" rx="1"/><path d="M1.5 7.5l2.5-2.5 2 2 2-2.5 2.5 3"/></svg>
  )},
] as const

interface Props {
  params?: BoxParams
  activeTemplate?: TemplateType
  imageLayers?: ImageLayer[]
  exteriorColor?: string
  interiorColor?: string
  projectName?: string
}

export function ExportSection({ params, activeTemplate = 'box', imageLayers = [], exteriorColor = '#ffffff', interiorColor = '#f0ede8', projectName = 'UNTITLED BOX' }: Props) {
  const dieline = useMemo(() => params ? computeDieline(params, activeTemplate) : null, [params, activeTemplate])
  const templateName = TEMPLATES.find(t => t.id === activeTemplate)?.name ?? activeTemplate

  const handleTechSheet = async () => {
    if (!params || !dieline) return
    try {
      const { exportTechSheet } = await import('@/lib/export/techsheet')
      await exportTechSheet(params, dieline, imageLayers, exteriorColor, interiorColor, templateName, projectName)
    } catch (e) { console.error('Tech sheet export failed', e) }
  }

  const handleCF2 = async () => {
    if (!params || !dieline) return
    try {
      const { downloadCF2 } = await import('@/lib/export/cf2')
      downloadCF2(dieline, params, activeTemplate)
    } catch (e) { console.error('CF2 export failed', e) }
  }

  return (
    <CollapsibleSection label="Export">
      {/* Standard formats */}
      <div style={{ fontSize: 9, color: c.textGhost, marginBottom: 6, fontWeight: fw.bold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Formats vectoriels
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
        {FORMATS.map(({ label, format, icon }) => (
          <button
            key={format}
            title={`Export ${label}`}
            onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:export', { detail: { format } }))}
            className="fs-btn-default"
            style={{
              background: '#f8f8f8', border: `1px solid ${c.borderLight}`,
              color: '#444', borderRadius: r.md, padding: '7px 0',
              fontSize: fs.sm, fontWeight: fw.bold, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* PRO formats */}
      <div style={{ fontSize: 9, color: c.textGhost, marginBottom: 6, fontWeight: fw.bold, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        Formats pro
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
        {/* CF2 export */}
        <button
          onClick={handleCF2}
          disabled={!params}
          className="fs-btn-default"
          style={{
            background: params ? '#eff6ff' : '#fafafa',
            border: `1px solid ${params ? '#bfdbfe' : c.borderLight}`,
            color: params ? '#1d4ed8' : '#bbb',
            borderRadius: r.md, padding: '7px 0',
            fontSize: fs.sm, fontWeight: fw.bold, cursor: params ? 'pointer' : 'default',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <rect x="1.5" y="1.5" width="9" height="9" rx="1"/>
            <path d="M4 6h4M6 4v4"/>
          </svg>
          CF2
        </button>

        {/* FOLD format */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:export', { detail: { format: 'FOLD' } }))}
          className="fs-btn-default"
          style={{
            background: '#fdf4ff', border: '1px solid #e9d5ff',
            color: '#7c3aed', borderRadius: r.md, padding: '7px 0',
            fontSize: fs.sm, fontWeight: fw.bold, cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M2 6h8M6 2l4 4-4 4"/>
          </svg>
          FOLD
        </button>
      </div>

      {/* Tech sheet */}
      <button
        onClick={handleTechSheet}
        disabled={!params}
        className="fs-btn-default"
        style={{
          width: '100%', background: params ? '#f8f8f8' : '#fafafa',
          border: `1px solid ${c.borderLight}`, color: params ? '#444' : '#bbb',
          borderRadius: r.md, padding: '8px 0', fontSize: fs.sm, fontWeight: fw.bold,
          cursor: params ? 'pointer' : 'default', fontFamily: 'inherit', marginBottom: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <rect x="2" y="1" width="8" height="10" rx="1"/>
          <path d="M4 4h4M4 6h4M4 8h2"/>
        </svg>
        Fiche technique PDF
      </button>

      {/* AR Preview */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('fold-studio:open-ar'))}
        className="fs-btn-default"
        style={{
          width: '100%', background: '#f8f8f8', border: `1px solid ${c.borderLight}`,
          color: '#444', borderRadius: r.md, padding: '8px 0', fontSize: fs.sm, fontWeight: fw.bold,
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <path d="M2 4V2h2M8 2h2v2M2 8v2h2M8 10h2V8"/>
          <path d="M6 4L4 5.2V7.8L6 9l2-1.2V5.2L6 4z" strokeLinejoin="round"/>
        </svg>
        Aperçu AR
      </button>

      {/* PDF info note */}
      <div style={{ fontSize: 8, color: c.textGhost, lineHeight: 1.4, marginBottom: 8, padding: '5px 7px', background: '#fafafa', borderRadius: r.md, border: `1px solid ${c.borderLight}` }}>
        PDF Print-Ready : calques Découpe · Pli · Collage · Fond perdu + repères de coupe pro + marques de repérage
      </div>

      {params && dieline && (
        <CostSection params={params} dieline={dieline} />
      )}
    </CollapsibleSection>
  )
}
