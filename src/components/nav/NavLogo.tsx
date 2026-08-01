'use client'

import { c, fs, fw, r } from '@/lib/tokens'

export function NavLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 180 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" fill={c.ink}/>
        <path d="M8 3L13 6V10L8 13L3 10V6L8 3Z" fill="none" stroke="white" strokeWidth="1"/>
        <path d="M8 3L8 13M3 6L13 10M13 6L3 10" stroke="white" strokeWidth="0.5" opacity="0.5"/>
      </svg>
      <span style={{ fontWeight: fw.bold, fontSize: fs.lg, color: c.ink, letterSpacing: 0.1 }}>
        Fold Studio
      </span>
      <span style={{
        fontSize: fs.micro, fontWeight: fw.heavy, color: '#999',
        background: '#f0f0f0', borderRadius: r.sm, padding: '1px 5px', letterSpacing: 0.8,
      }}>ALPHA</span>
    </div>
  )
}
