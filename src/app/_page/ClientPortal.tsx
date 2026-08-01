'use client'

import { useState } from 'react'

interface ClientPortalProps {
  onClose: () => void
}

type PortalState = 'login' | 'portal'

export function ClientPortal({ onClose }: ClientPortalProps) {
  const [state, setState] = useState<PortalState>('login')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'revision' | ''>('')
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleLogin = async () => {
    if (!email || !pin) { setError('Email et PIN requis'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Identifiants invalides'); return }
      setClientEmail(data.email)
      setState('portal')
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (d: 'approved' | 'rejected' | 'revision') => {
    setDecision(d)
    setLoading(true)
    try {
      await fetch('/api/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'current', decision: d, note }),
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  }
  const panel: React.CSSProperties = {
    background: '#fff', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
    width: 380, padding: 32, position: 'relative', fontFamily: 'inherit',
  }
  const input: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #e0e0e0',
    fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  }
  const btn = (color: string): React.CSSProperties => ({
    width: '100%', padding: '10px 0', borderRadius: 7, border: 'none',
    background: color, color: '#fff', fontSize: 13, fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    fontFamily: 'inherit',
  })

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={panel}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#aaa' }}>×</button>

        {state === 'login' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5A6BD4', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>Portail client</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#222', marginBottom: 20 }}>Accès client sécurisé</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
              Connectez-vous pour consulter et approuver les projets qui vous ont été partagés.
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@entreprise.com" style={input} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>Code PIN</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="••••" maxLength={8} style={input} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>

            {error && <div style={{ fontSize: 11, color: '#e53e3e', marginBottom: 12 }}>{error}</div>}

            <button onClick={handleLogin} disabled={loading} style={btn('#5A6BD4')}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>

            <div style={{ marginTop: 12, fontSize: 10, color: '#aaa', textAlign: 'center' }}>
              PIN fourni par votre studio de packaging
            </div>
          </>
        )}

        {state === 'portal' && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#5A6BD4', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 }}>Portail client</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#5A6BD4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                {clientEmail[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{clientEmail}</div>
                <div style={{ fontSize: 10, color: '#888' }}>Session active · 24h</div>
              </div>
            </div>

            {submitted ? (
              <div style={{ background: decision === 'approved' ? '#f0fdf4' : decision === 'rejected' ? '#fef2f2' : '#fffbeb', border: `1px solid ${decision === 'approved' ? '#86efac' : decision === 'rejected' ? '#fca5a5' : '#fde68a'}`, borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{decision === 'approved' ? '✓' : decision === 'rejected' ? '✗' : '↩'}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: decision === 'approved' ? '#16a34a' : decision === 'rejected' ? '#dc2626' : '#d97706' }}>
                  {decision === 'approved' ? 'Projet approuvé' : decision === 'rejected' ? 'Projet refusé' : 'Révision demandée'}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Votre décision a été transmise au studio.</div>
              </div>
            ) : (
              <>
                <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: '#555', lineHeight: 1.5 }}>
                  Projet en cours de révision. Examinez les visuels et indiquez votre décision ci-dessous.
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 }}>Commentaire (optionnel)</label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Vos remarques ou demandes de modification…" style={{ ...input, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleDecision('revision')} disabled={loading} style={{ ...btn('#f59e0b'), flex: 1 }}>↩ Révision</button>
                  <button onClick={() => handleDecision('rejected')} disabled={loading} style={{ ...btn('#ef4444'), flex: 1 }}>✗ Refuser</button>
                  <button onClick={() => handleDecision('approved')} disabled={loading} style={{ ...btn('#22c55e'), flex: 1 }}>✓ Approuver</button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
