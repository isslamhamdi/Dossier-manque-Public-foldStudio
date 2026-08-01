'use client'

import { useState } from 'react'
import type { BoxParams, TemplateType } from '@/lib/types'

interface ShopifyPanelProps {
  params: BoxParams
  activeTemplate: TemplateType
  exteriorColor: string
  interiorColor: string
  projectName?: string
  onClose: () => void
}

// #62: Shopify integration UI panel
export function ShopifyPanel({ params, activeTemplate, exteriorColor, interiorColor, projectName = 'Fold Studio Project', onClose }: ShopifyPanelProps) {
  const [store, setStore] = useState('')
  const [token, setToken] = useState('')
  const [productId, setProductId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url?: string; productId?: number; error?: string } | null>(null)

  const handleSync = async () => {
    if (!store || !token) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          shopifyStore: store,
          accessToken: token,
          productId: productId ? Number(productId) : undefined,
          params,
          dieline: null,
        }),
      })
      const data = await res.json()
      if (!res.ok) setResult({ error: data.error ?? 'Sync failed' })
      else setResult({ url: data.url, productId: data.productId })
    } catch (e) {
      setResult({ error: String(e) })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: 6,
    fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: 400, padding: '24px 24px 20px', position: 'relative', fontFamily: 'inherit' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#96bf48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M11 2c-.1-.7-.7-1-1.2-1-.5 0-.9.3-1 .7l-.2.5C8.1 2 7.5 2 7 2.2L6.8 1.7C6.7 1.3 6.2 1 5.8 1c-.5 0-1 .3-1.2 1L3 12l9 1.6L14 4.5 11 2z" fill="white"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#222' }}>Sync Shopify</div>
            <div style={{ fontSize: 10, color: '#888' }}>Intégration boutique</div>
          </div>
        </div>

        {/* Current params summary */}
        <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 12px', marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, textAlign: 'center' }}>
          {[['L', params.width], ['H', params.height], ['P', params.depth]].map(([label, val]) => (
            <div key={label as string}>
              <div style={{ fontSize: 9, color: '#aaa' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333' }}>{val}</div>
              <div style={{ fontSize: 8, color: '#bbb' }}>mm</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Boutique Shopify</label>
          <input type="text" value={store} onChange={e => setStore(e.target.value)} placeholder="my-store.myshopify.com" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Token d&#39;accès admin</label>
          <input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="shpat_xxxxx" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>ID produit (optionnel — crée si vide)</label>
          <input type="text" value={productId} onChange={e => setProductId(e.target.value)} placeholder="123456789" style={inputStyle} />
        </div>

        {result && (
          <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 7, background: result.error ? '#fef2f2' : '#f0fdf4', border: `1px solid ${result.error ? '#fca5a5' : '#86efac'}` }}>
            {result.error ? (
              <div style={{ fontSize: 11, color: '#dc2626' }}>Erreur : {result.error}</div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>✓ Synchronisé avec succès</div>
                <div style={{ fontSize: 10, color: '#166534' }}>Produit #{result.productId}</div>
                {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#0070f3', display: 'block', marginTop: 2 }}>Voir dans Shopify Admin →</a>}
              </>
            )}
          </div>
        )}

        <button onClick={handleSync} disabled={loading || !store || !token}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 7, border: 'none',
            background: loading || !store || !token ? '#e0e0e0' : '#96bf48',
            color: loading || !store || !token ? '#999' : '#fff',
            fontSize: 13, fontWeight: 700, cursor: loading || !store || !token ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}>
          {loading ? 'Synchronisation…' : 'Synchroniser avec Shopify'}
        </button>

        <div style={{ marginTop: 10, fontSize: 9, color: '#bbb', textAlign: 'center' }}>
          Les dimensions, couleurs et le patron SVG seront enregistrés en métachamps Shopify.
        </div>
      </div>
    </div>
  )
}
