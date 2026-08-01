'use client'

import { useState } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { TEMPLATES } from '@/lib/templates'

interface PrintSubmitPanelProps {
  params: BoxParams
  activeTemplate: TemplateType
  exteriorColor: string
  interiorColor: string
  onClose: () => void
}

// #61: Print submission panel — send project to printer via webhook
export function PrintSubmitPanel({ params, activeTemplate, exteriorColor, interiorColor, onClose }: PrintSubmitPanelProps) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [printerName, setPrinterName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; sentAt?: string } | null>(null)

  const dieline = computeDieline(params, activeTemplate)
  const template = TEMPLATES.find(t => t.id === activeTemplate)
  const area = dieline ? ((dieline.svgWidth * dieline.svgHeight) / 100).toFixed(0) : '—'

  const handleSubmit = async () => {
    if (!webhookUrl) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/webhook/printer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          printerName,
          notes,
          project: {
            template: activeTemplate,
            templateName: template?.name,
            params,
            exteriorColor,
            interiorColor,
            area,
            sentAt: new Date().toISOString(),
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) setResult({ error: data.error ?? 'Erreur d\'envoi' })
      else setResult({ success: true, sentAt: data.sentAt ?? new Date().toISOString() })
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: '1px solid #e0e0e0', borderRadius: 6,
    fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 420, padding: '24px 24px 20px', position: 'relative', fontFamily: 'inherit' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.4">
              <rect x="2" y="3" width="10" height="8" rx="1"/>
              <path d="M4 3V2h6v1M4 9v3h6V9" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#222' }}>Soumettre à l&#39;imprimeur</div>
            <div style={{ fontSize: 10, color: '#888' }}>Envoi via webhook</div>
          </div>
        </div>

        {/* Project summary */}
        <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', marginBottom: 8 }}>
            {[['L', params.width], ['H', params.height], ['P', params.depth]].map(([label, val]) => (
              <div key={label as string}>
                <div style={{ fontSize: 9, color: '#aaa' }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{val}</div>
                <div style={{ fontSize: 8, color: '#bbb' }}>mm</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#666', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span>Modèle : <strong>{template?.name ?? activeTemplate}</strong></span>
            <span>Surface : <strong>{area} cm²</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Couleur : <span style={{ width: 12, height: 12, borderRadius: 2, background: exteriorColor, border: '1px solid #ccc', display: 'inline-block', marginLeft: 2 }} />
            </span>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Webhook imprimeur *</label>
          <input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://printer.example.com/api/orders" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nom imprimeur (optionnel)</label>
          <input type="text" value={printerName} onChange={e => setPrinterName(e.target.value)} placeholder="ex: PrintCorp Paris" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notes de production</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Instructions spéciales, quantité, délai…" rows={3}
            style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }} />
        </div>

        {result && (
          <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 7, background: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fca5a5' : '#86efac'}` }}>
            {result.error ? (
              <div style={{ fontSize: 11, color: '#dc2626' }}>Erreur : {result.error}</div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 2 }}>✓ Soumis avec succès</div>
                <div style={{ fontSize: 10, color: '#166534' }}>Envoyé le {result.sentAt ? new Date(result.sentAt).toLocaleString('fr-FR') : '—'}</div>
              </>
            )}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading || !webhookUrl}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 7, border: 'none',
            background: loading || !webhookUrl ? '#e0e0e0' : '#1a1a1a',
            color: loading || !webhookUrl ? '#999' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading || !webhookUrl ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
          {loading ? 'Envoi en cours…' : 'Envoyer à l\'imprimeur'}
        </button>

        <div style={{ marginTop: 10, fontSize: 9, color: '#bbb', textAlign: 'center' }}>
          Les données projet, dimensions et couleurs seront envoyées en JSON signé HMAC.
        </div>
      </div>
    </div>
  )
}
