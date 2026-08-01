'use client'

interface ExportMenuProps {
  showExportMenu: boolean
  setShowExportMenu: (v: boolean | ((prev: boolean) => boolean)) => void
  handleDownloadPNG: () => void
  handleDownloadSVG: () => void
  handleDownloadPDF: () => void
  handleDownloadFold: () => void
  handleDownloadDxf?: () => void
  handleDownloadPrintPdf?: () => void
}

import { DownloadIcon } from './icons'

export function ExportMenu({
  showExportMenu, setShowExportMenu,
  handleDownloadPNG, handleDownloadSVG, handleDownloadPDF, handleDownloadFold,
  handleDownloadDxf, handleDownloadPrintPdf,
}: ExportMenuProps) {
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowExportMenu(v => !v)}
        title="Export"
        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
      >
        <DownloadIcon />
      </button>
      {showExportMenu && (
        <div
          style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: '#ffffff', border: '1px solid #e8e8e8',
            borderRadius: 7, boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            zIndex: 50, minWidth: 210, overflow: 'hidden',
          }}
          onMouseLeave={() => setShowExportMenu(false)}
        >
          {[
            { label: 'Export PNG (300 dpi)', icon: 'dl', action: handleDownloadPNG },
            { label: 'Export SVG Dieline', icon: 'doc', action: handleDownloadSVG },
            ...(handleDownloadPrintPdf ? [{ label: 'Export PDF Print-Ready ★', icon: 'print', action: handleDownloadPrintPdf }] : []),
            { label: 'Export PDF (imprimer)', icon: 'doc', action: handleDownloadPDF },
            ...(handleDownloadDxf ? [{ label: 'Export DXF (laser/découpe)', icon: 'dl', action: handleDownloadDxf }] : []),
            { label: 'Export .fold format', icon: 'dl', action: handleDownloadFold },
          ].map(({ label, icon, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', textAlign: 'left',
                padding: '9px 14px', fontSize: 12, color: '#333',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', borderBottom: '1px solid #f5f5f5',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              {icon === 'doc' ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#888" strokeWidth="1.2">
                  <rect x="2" y="1" width="9" height="11" rx="1.2"/>
                  <path d="M4 5h5M4 7h5M4 9h3" strokeLinecap="round"/>
                </svg>
              ) : icon === 'print' ? (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#e91e8c" strokeWidth="1.2">
                  <rect x="3" y="7" width="7" height="5" rx="0.8"/>
                  <path d="M3 7V3h7v4" strokeLinecap="round"/>
                  <rect x="1" y="5" width="11" height="5" rx="1"/>
                  <circle cx="10" cy="7.5" r="0.6" fill="#e91e8c"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#888" strokeWidth="1.2">
                  <path d="M6.5 2v7M4 6.5l2.5 2.5L9 6.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 11h9" strokeLinecap="round"/>
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
