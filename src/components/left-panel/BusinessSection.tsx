'use client'

// #104-108 White label / Business — STL export, printer dashboard, analytics, white label

import { useState } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface BusinessSectionProps {
  params: BoxParams
  activeTemplate: TemplateType
}

export function BusinessSection({ params, activeTemplate }: BusinessSectionProps) {
  const [stlStatus, setStlStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [brandName, setBrandName] = useState('')
  const [brandColor, setBrandColor] = useState('#5A6BD4')
  const [logoUrl, setLogoUrl] = useState('')
  const [analyticsData, setAnalyticsData] = useState<{ total: number; byEvent: Record<string, number> } | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [whitelabelApplied, setWhitelabelApplied] = useState(false)

  // #108 STL export
  async function exportSTL() {
    setStlStatus('loading')
    try {
      const res = await fetch('/api/export/stl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width: params.width, height: params.height, depth: params.depth, thickness: params.thickness }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fold_studio_${params.width}x${params.height}x${params.depth}.stl`
      a.click()
      URL.revokeObjectURL(url)
      setStlStatus('done')
    } catch {
      setStlStatus('error')
    }
  }

  // #104 White label — apply brand CSS vars + logo
  function applyWhiteLabel() {
    document.documentElement.style.setProperty('--fold-brand-color', brandColor)
    if (brandName) document.title = `${brandName} Studio`
    if (logoUrl) {
      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (favicon) favicon.href = logoUrl
    }
    setWhitelabelApplied(true)
  }

  // #106 Analytics
  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalyticsData(data)
    } catch { setAnalyticsData(null) } finally { setAnalyticsLoading(false) }
  }

  // Track template change event
  async function trackEvent(event: string) {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data: { template: activeTemplate, ...params } }),
    })
  }

  return (
    <CollapsibleSection label="Business & White Label">
      {/* #108 STL Export */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Export 3D</div>
        <button onClick={exportSTL} disabled={stlStatus === 'loading'}
          style={{ width: '100%', fontSize: fs.sm, fontWeight: 600, padding: '7px 0', borderRadius: r.md, border: 'none', background: stlStatus === 'loading' ? '#ccc' : '#1a1a1a', color: '#fff', cursor: stlStatus === 'loading' ? 'wait' : 'pointer' }}>
          {stlStatus === 'loading' ? 'Génération STL…' : '↓ Exporter STL'}
        </button>
        {stlStatus === 'done' && <div style={{ fontSize: 9, color: '#059669', marginTop: 4 }}>✓ Fichier STL téléchargé</div>}
        {stlStatus === 'error' && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 4 }}>✕ Erreur export STL</div>}
      </div>

      {/* #104 White Label */}
      <div style={{ marginBottom: 14, paddingTop: 10, borderTop: `1px solid ${c.borderLight}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>White Label</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="Nom de l'agence / marque"
            style={{ fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '5px 7px', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
              style={{ width: 36, height: 30, border: `1px solid ${c.borderLight}`, borderRadius: 7, cursor: 'pointer', padding: 2, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: c.textGhost }}>Couleur principale</span>
          </div>
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="URL du logo (favicon)"
            style={{ fontSize: fs.sm, border: `1px solid ${c.borderLight}`, borderRadius: r.md, padding: '5px 7px', fontFamily: 'inherit' }} />
          <button onClick={applyWhiteLabel}
            style={{ fontSize: fs.sm, fontWeight: 600, padding: '6px 0', borderRadius: r.md, border: 'none', background: brandColor, color: '#fff', cursor: 'pointer' }}>
            {whitelabelApplied ? '✓ White Label appliqué' : 'Appliquer White Label'}
          </button>
        </div>
      </div>

      {/* #105 Printer dashboard summary */}
      <div style={{ marginBottom: 14, paddingTop: 10, borderTop: `1px solid ${c.borderLight}` }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Tableau de bord imprimeur</div>
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ fontSize: 10, color: c.textMed }}>Dernière commande</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: c.ink, marginTop: 2 }}>
            {params.width}×{params.height}×{params.depth} mm — {activeTemplate}
          </div>
          <button onClick={() => trackEvent('printer_dashboard_view')}
            style={{ fontSize: 9, marginTop: 6, padding: '3px 8px', borderRadius: 7, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
            Envoyer au dashboard imprimeur
          </button>
        </div>
      </div>

      {/* #106 Analytics */}
      <div style={{ paddingTop: 10, borderTop: `1px solid ${c.borderLight}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase' }}>Analytics</div>
          <button onClick={loadAnalytics} disabled={analyticsLoading}
            style={{ fontSize: 9, padding: '2px 7px', borderRadius: 7, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
            {analyticsLoading ? '…' : 'Actualiser'}
          </button>
        </div>
        {analyticsData ? (
          <div>
            <div style={{ fontSize: 10, color: c.textMed, marginBottom: 4 }}>Total événements : <strong>{analyticsData.total}</strong></div>
            {Object.entries(analyticsData.byEvent).slice(0, 5).map(([evt, count]) => (
              <div key={evt} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: c.textGhost, padding: '2px 0' }}>
                <span>{evt}</span><span style={{ fontWeight: 700, color: c.textMed }}>{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 9, color: c.textGhost }}>Cliquez sur Actualiser pour charger les stats</div>
        )}
      </div>
    </CollapsibleSection>
  )
}
