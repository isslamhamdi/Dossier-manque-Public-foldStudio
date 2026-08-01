// #294 Prefetch routes Next.js — page préfetchée depuis la nav principale

import Link from 'next/link'

export const metadata = { title: 'Changelog — Fold Studio' }

const ENTRIES = [
  { v: '0.5.0', date: '2026-07-21', notes: 'Features 136–305 : 3D avancé, tests, performance' },
  { v: '0.4.0', date: '2026-06-01', notes: 'Features 70–135 : export, IA design, collaboration' },
  { v: '0.3.0', date: '2026-04-01', notes: 'Features 35–69 : PWA, offline, accessibilité' },
  { v: '0.2.0', date: '2026-02-01', notes: 'Features 1–34 : éditeur patron 2D/3D de base' },
]

export default function ChangelogPage() {
  return (
    <div style={{ maxWidth: 640, margin: '60px auto', padding: '0 24px', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/" style={{ fontSize: 13, color: '#e91e8c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 32 }}>
        ← Retour à Fold Studio
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 8 }}>Changelog</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 36 }}>Historique des versions</p>
      {ENTRIES.map(e => (
        <div key={e.v} style={{ borderLeft: '3px solid #e91e8c', paddingLeft: 20, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>v{e.v}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>{e.date}</span>
          </div>
          <p style={{ fontSize: 14, color: '#444', margin: 0 }}>{e.notes}</p>
        </div>
      ))}
    </div>
  )
}
