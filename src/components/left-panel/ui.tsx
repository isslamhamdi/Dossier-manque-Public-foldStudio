'use client'

import { useState } from 'react'
import { c, fs, fw, r } from '@/lib/tokens'
import { Slider } from '@/components/ui/slider'

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label?: string }) {
  return (
    <div>
      {label && <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 6 }}>{label}</div>}
      <button onClick={onToggle} style={{
        width: 36, height: 20, borderRadius: r.pill, border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? c.ink : c.border, transition: 'background 0.2s',
      }}>
        <div style={{ position: 'absolute', top: 3, left: on ? 17 : 3, width: 14, height: 14, borderRadius: '50%', background: c.white, transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

// ─── ColorPicker ──────────────────────────────────────────────────────────────
export function ColorPicker({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      {label && <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 4 }}>{label}</div>}
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
        <div style={{ width: 22, height: 22, borderRadius: r.sm, background: value, border: `1px solid ${c.border}`, flexShrink: 0 }} />
        <span style={{ fontSize: fs.xs, color: '#444', fontFamily: 'monospace' }}>{value.toUpperCase()}</span>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      </label>
    </div>
  )
}

// ─── FieldLabel ───────────────────────────────────────────────────────────────
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: fs.sm, color: c.textMuted, marginBottom: 4 }}>{children}</div>
}

// ─── CollapsibleSection — Illustrator-style ───────────────────────────────────
function getSectionIcon(label: string) {
  const l = label.toLowerCase()
  const S = { stroke: 'currentColor', strokeWidth: '1.2', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (l.includes('dimension') || l.includes('taille'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 2v10h10M2 12l3-3M2 12l3 3"/><path d="M5 2h7v7"/></svg>
  if (l.includes('mati'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="7" r="5"/><path d="M2 7Q4.5 5.5 7 7Q9.5 8.5 12 7"/><path d="M7 2Q5.5 4.5 5.5 7Q5.5 9.5 7 12"/></svg>
  if (l.includes('texte') || l.includes('text'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 3h10M7 3v8M4 11h6"/></svg>
  if (l.includes('code-barre') || l.includes('barcode'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 3v8M4 3v8M7 3v8M9 3v8M12 3v8M5 3v8M10 3v8"/></svg>
  if (l.includes('qr'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="2" width="4" height="4"/><rect x="8" y="2" width="4" height="4"/><rect x="2" y="8" width="4" height="4"/><rect x="9" y="9" width="1.5" height="1.5" fill="currentColor"/><rect x="11.5" y="9" width="1.5" height="1.5" fill="currentColor"/><rect x="9" y="11.5" width="3" height="1.5" fill="currentColor"/></svg>
  if (l.includes('dégradé') || l.includes('gradient'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="4" width="10" height="6" rx="1"/><line x1="4" y1="4" x2="4" y2="10" strokeOpacity="0.4"/><line x1="7" y1="4" x2="7" y2="10" strokeOpacity="0.7"/><line x1="10" y1="4" x2="10" y2="10"/></svg>
  if (l.includes('pattern') || l.includes('répétition'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="3.5" cy="3.5" r="1"/><circle cx="7" cy="3.5" r="1"/><circle cx="10.5" cy="3.5" r="1"/><circle cx="3.5" cy="7" r="1"/><circle cx="7" cy="7" r="1"/><circle cx="10.5" cy="7" r="1"/><circle cx="3.5" cy="10.5" r="1"/><circle cx="7" cy="10.5" r="1"/><circle cx="10.5" cy="10.5" r="1"/></svg>
  if (l.includes('pictogramm'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><polygon points="7,2 8.5,5.5 12,6 9.5,8.5 10,12 7,10.5 4,12 4.5,8.5 2,6 5.5,5.5"/></svg>
  if (l.includes('éclairage') || l.includes('lighting') || l.includes('lumière'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="5.5" r="2.5"/><path d="M7 9v2M4 10.5l-1 1M10 10.5l1 1M2.5 7H1M12.5 7H11M4.5 3.5L3.5 2.5M9.5 3.5L10.5 2.5"/></svg>
  if (l.includes('post-') || l.includes('effets') || l.includes('fx') || l.includes('post'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 12L7 2L12 12"/><path d="M4 9h6"/></svg>
  if (l.includes('3d') || (l.includes('3') && l.includes('boîte')))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1.5L12 4.5v5L7 12.5L2 9.5v-5L7 1.5Z"/><path d="M2 4.5l5 3L12 4.5M7 7.5V12.5"/></svg>
  if (l.includes('caméra') || l.includes('camera') || l.includes('scène'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="1" y="4" width="12" height="8" rx="1"/><circle cx="7" cy="8" r="2"/><path d="M5 4V3h4v1M11 6h1"/></svg>
  if (l.includes('encre') || l.includes('ink') || l.includes('couverture'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 2C7 2 3 6 3 9a4 4 0 0 0 8 0C11 6 7 2 7 2Z"/></svg>
  if (l.includes('impression') || l.includes('simulation') || l.includes('print'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M4 5V2h6v3"/><rect x="1" y="5" width="12" height="6" rx="1"/><rect x="3" y="9" width="8" height="4" rx="0.5"/><circle cx="11" cy="7.5" r="1" fill="currentColor" stroke="none"/></svg>
  if (l.includes('anti') || l.includes('contrefaç'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1.5L12 3.5v4C12 10 9.5 12.5 7 13C4.5 12.5 2 10 2 7.5v-4L7 1.5Z"/></svg>
  if (l.includes('durabilit') || l.includes('lca') || l.includes('éco') || l.includes('eco') || l.includes('sustain'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M11 1.5C9 1.5 5 3 3 7.5c1.5-.7 4-1.5 6-1.5C7 9 4 12 2 12"/><path d="M2 12c0-2.5 1-5 4-7.5"/></svg>
  if (l.includes('compliance') || l.includes('légal') || l.includes('legal'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="3" y="1.5" width="8" height="11" rx="1"/><path d="M5 5h4M5 7.5h4M5 10h2"/></svg>
  if (l.includes('smart') || l.includes('rfid') || l.includes('nfc'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="3" width="10" height="8" rx="1"/><path d="M5 6.5h4M5 8.5h2.5"/><circle cx="10" cy="5" r="1" fill="currentColor" stroke="none"/></svg>
  if (l.includes('passeport') || l.includes('numérique') || l.includes('dpp'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="2" width="10" height="10" rx="1"/><circle cx="7" cy="6" r="1.5"/><path d="M4 10.5c0-1.7 1.3-3 3-3s3 1.3 3 3"/></svg>
  if (l.includes('business') || l.includes('white label'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 11V8h2v3H2ZM5.5 11V6h2v5H5.5ZM9.5 11V4H12v7H9.5Z"/><path d="M1 11h12"/></svg>
  if (l.includes('marketplace') || l.includes('boutique'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 3h10l-1.5 5H3.5L2 3Z"/><path d="M3.5 8v3h7V8"/><circle cx="5" cy="12" r="0.8" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="0.8" fill="currentColor" stroke="none"/></svg>
  if (l.includes('mobile') || l.includes('touch'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="4" y="1" width="6" height="12" rx="1.5"/><circle cx="7" cy="11" r="0.8" fill="currentColor" stroke="none"/></svg>
  if (l.includes('accessib'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="3" r="1.5"/><path d="M7 5v4.5M5 7l-2 3M9 7l2 3M5.5 9.5l1 3M8.5 9.5l-1 3"/></svg>
  if (l.includes('résistance') || (l.includes('structural') && !l.includes('#')) || l.includes('structurel'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 2v10M2 7h10M4 4l6 6M10 4L4 10"/></svg>
  if (l.includes('retail') || (l.includes('marketing') && l.includes('retail')))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 3h10l-.5 6H2.5L2 3Z"/><path d="M5 3l.5-1.5h3L9 3"/><circle cx="4.5" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="11" r="1" fill="currentColor" stroke="none"/></svg>
  if (l.includes('collabor') || l.includes('export zip'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="4.5" cy="4.5" r="1.5"/><circle cx="9.5" cy="4.5" r="1.5"/><path d="M1 11c0-2 1.5-3.5 3.5-3.5S8 9 8 11"/><path d="M9 8c1.5 0 4 .8 4 3"/></svg>
  if (l.includes('version') || l.includes('historique'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="7" r="5"/><path d="M7 4v3.5L9 9"/><path d="M3.5 2L2 4l2 .5"/></svg>
  if (l.includes('food') || l.includes('alimentaire'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1.5L12 4v5.5L7 12L2 9.5V4L7 1.5Z"/><path d="M5 7l1.5 1.5L9.5 5.5"/></svg>
  if (l.includes('logistic') || l.includes('transport'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 4h7v5H2zM9 5.5l3 1.5V9h-3"/><circle cx="4" cy="10.5" r="1.2"/><circle cx="10" cy="10.5" r="1.2"/></svg>
  if (l.includes('branding') || l.includes('identité'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 2L8.5 6H13L9.5 8.5L10.5 12.5L7 10L3.5 12.5L4.5 8.5L1 6H5.5L7 2Z"/></svg>
  if (l.includes('sécurité') && l.includes('access'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="4" y="6" width="6" height="6" rx="0.8"/><path d="M5 6V4.5a2 2 0 0 1 4 0V6"/><circle cx="7" cy="9" r="0.8" fill="currentColor" stroke="none"/></svg>
  if (l.includes('e-commerce') || l.includes('ecommerce'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M1.5 2h1.5l1.5 6h5.5l1-4H4.5"/><circle cx="5.5" cy="11" r="1"/><circle cx="9.5" cy="11" r="1"/></svg>
  if (l.includes('workflow'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="3.5" r="1.5"/><circle cx="11" cy="10.5" r="1.5"/><path d="M4.5 7L9.5 3.5M4.5 7L9.5 10.5"/></svg>
  if (l.includes('sleeve') || l.includes('étiquette') || l.includes('label') || l.includes('manchon'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="3" y="2" width="8" height="10" rx="1"/><path d="M5 2V1M9 2V1M3 7h8"/></svg>
  if (l.includes('premium') || l.includes('unboxing') || l.includes('vieillissement'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1l1.5 3h3.5L9 6.5l1 3.5L7 8l-3 2 1-3.5L2 4h3.5L7 1Z"/></svg>
  if (l.includes('vdp') || l.includes('variable'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 5h2M2 7h3M2 9h2"/><rect x="6" y="3" width="6" height="8" rx="1"/><path d="M8 5h2M8 7h2M8 9h1"/></svg>
  if (l.includes('ai') || l.includes('génération'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1l1 3h3L8.5 6l1 3L7 7.5 4.5 9l1-3L3 4h3L7 1Z"/><path d="M11.5 9.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L9.5 11l1.5-.5.5-1.5Z"/></svg>
  if (l.includes('calque') || l.includes('layer'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M2 7.5l5-2.5 5 2.5-5 2.5L2 7.5Z"/><path d="M2 4.5l5-2.5 5 2.5M2 10.5l5 2.5 5-2.5"/></svg>
  if (l.includes('export') || l.includes('télécharg'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5"/><path d="M2 10.5v1.5h10v-1.5"/></svg>
  if (l.includes('pli') || l.includes('fold') || l.includes('séquence'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="3" width="4" height="8"/><rect x="8" y="3" width="4" height="8"/><path d="M6 7h2"/></svg>
  if (l.includes('nesting') || l.includes('imbrication'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="2" width="10" height="10" rx="1"/><rect x="4" y="4" width="3" height="4" rx="0.5"/><rect x="8" y="4" width="2" height="3" rx="0.5"/><rect x="4" y="9" width="2" height="2" rx="0.5"/><rect x="7" y="8" width="3" height="3" rx="0.5"/></svg>
  if (l.includes('prévol') || l.includes('preflight') || l.includes('contrôle') || l.includes('qualité'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="7" r="5"/><path d="M4.5 7l2 2 3-3.5"/></svg>
  if (l.includes('certif'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="7" cy="6.5" r="4"/><path d="M4.5 12l2.5-2 2.5 2V8.5"/></svg>
  if (l.includes('cmyk') || l.includes('séparation'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><circle cx="5.5" cy="5.5" r="3"/><circle cx="8.5" cy="5.5" r="3" strokeOpacity="0.5"/><circle cx="7" cy="8" r="3" strokeOpacity="0.3"/></svg>
  if (l.includes('structural') && l.includes('#'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><rect x="2" y="2" width="10" height="10" rx="1"/><path d="M5 2v10M9 2v10M2 5h3M2 9h3M9 5h3M9 9h3"/></svg>
  if (l.includes('food safety') || l.includes('sécurité alimentaire'))
    return <svg width="13" height="13" viewBox="0 0 14 14" {...S}><path d="M7 1.5L12 4v4C12 11 9.5 13 7 13.5C4.5 13 2 11 2 8V4L7 1.5Z"/><path d="M4.5 7l2 2 3-3"/></svg>
  // default
  return <svg width="13" height="13" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M7 4.5v1.5l1 1.5"/></svg>
}

export function CollapsibleSection({ label, children, right, defaultOpen = false }: {
  label: string; children: React.ReactNode; right?: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const icon = getSectionIcon(label)

  return (
    <div style={{ borderBottom: '1px solid #ddd8d2' }}>
      <button
        data-section-header={label}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 10px', height: 32,
          background: open ? '#ebe7e3' : '#ede9e5',
          border: 'none', cursor: 'pointer',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e0dbd5' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = open ? '#ebe7e3' : '#ede9e5' }}
      >
        <span style={{ flexShrink: 0, color: '#888', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{
          flex: 1, textAlign: 'left',
          fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: 0.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        {right && <span style={{ flexShrink: 0 }}>{right}</span>}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ flexShrink: 0, transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1L4 4L7 1" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </button>
      <div className={`fs-collapsible-outer${open ? ' open' : ''}`}>
        <div className="fs-collapsible-inner">
          <div style={{ background: '#f8f6f3', padding: '12px 12px 14px', borderBottom: '1px solid #ddd8d2' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: fs.sm, fontWeight: fw.heavy, color: c.textMuted,
      letterSpacing: 1.4, marginBottom: 10, textTransform: 'uppercase' as const,
    }}>{children}</div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: c.surface, border: `1px solid ${c.borderSep}`, borderRadius: r.lg, padding: '8px 10px' }}>
      <div style={{ fontSize: fs.xs, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, color: c.ink, fontWeight: fw.heavy, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ─── SliderRow ────────────────────────────────────────────────────────────────
export type UnitType = 'mm' | 'cm' | 'in' | 'pt'
export const UNITS: UnitType[] = ['mm', 'cm', 'in', 'pt']
const PT_PER_MM = 2.834645669

function toDisplay(mmVal: number, unit: UnitType): number {
  if (unit === 'cm') return Math.round(mmVal / 10 * 10) / 10
  if (unit === 'in') return Math.round(mmVal / 25.4 * 100) / 100
  if (unit === 'pt') return Math.round(mmVal * PT_PER_MM * 10) / 10
  return mmVal
}

function fromDisplay(dispVal: number, unit: UnitType): number {
  if (unit === 'cm') return dispVal * 10
  if (unit === 'in') return dispVal * 25.4
  if (unit === 'pt') return dispVal / PT_PER_MM
  return dispVal
}

export function SliderRow({ label, value, min, max, step, onChange, unit = 'mm' }: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (v: number) => void; unit?: UnitType
}) {
  const dispVal = toDisplay(value, unit)
  const dispStep = unit === 'cm' ? 0.1 : unit === 'in' ? 0.01 : unit === 'pt' ? 1 : step
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ color: c.textMed, fontSize: fs.md }}>{label}</span>
        <input
          type="number"
          value={dispVal}
          min={toDisplay(min, unit)} max={toDisplay(max, unit)} step={dispStep}
          onChange={e => onChange(fromDisplay(parseFloat(e.target.value) || 0, unit))}
          className="fs-input"
          style={{
            width: 52, background: c.surface, border: `1px solid ${c.borderLight}`,
            color: '#222', padding: '2px 5px', borderRadius: r.md,
            fontSize: fs.md, textAlign: 'right', outline: 'none',
          }}
        />
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </div>
  )
}

// ─── GeometryIcon ─────────────────────────────────────────────────────────────
export function GeometryIcon({ id, active }: { id: string; active: boolean }) {
  const iconStroke = active ? c.white : c.textMed
  const sw = 1.2
  switch (id) {
    case 'cube': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="4" y="7" width="9" height="9" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <path d="M4 7L7 4H16V13L13 16" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <path d="M13 7V16M4 7H13" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
      </svg>
    )
    case 'tetra': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,3 17,15 3,15" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <line x1="10" y1="3" x2="14" y2="10" stroke={iconStroke} strokeWidth={sw} strokeDasharray="2 1.5" />
        <line x1="3" y1="15" x2="14" y2="10" stroke={iconStroke} strokeWidth={sw} strokeDasharray="2 1.5" />
        <line x1="17" y1="15" x2="14" y2="10" stroke={iconStroke} strokeWidth={sw} strokeDasharray="2 1.5" />
      </svg>
    )
    case 'pyramid': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,3 17,14 3,14" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <polygon points="3,14 8,14 10,3" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
        <line x1="3" y1="14" x2="17" y2="14" stroke={iconStroke} strokeWidth={sw} />
      </svg>
    )
    case 'star': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 11.8,7.6 17.6,7.6 12.9,11.1 14.7,16.7 10,13.2 5.3,16.7 7.1,11.1 2.4,7.6 8.2,7.6" stroke={iconStroke} fill="none" strokeWidth={sw} />
      </svg>
    )
    case 'gear': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3.5" stroke={iconStroke} fill="none" strokeWidth={sw} />
        {[0,45,90,135,180,225,270,315].map(deg => {
          const rad = Math.PI * deg / 180
          const x1 = (10 + 5.5 * Math.cos(rad)).toFixed(1)
          const y1 = (10 + 5.5 * Math.sin(rad)).toFixed(1)
          const x2 = (10 + 7 * Math.cos(rad)).toFixed(1)
          const y2 = (10 + 7 * Math.sin(rad)).toFixed(1)
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={iconStroke} strokeWidth="2.5" strokeLinecap="round" />
        })}
        <circle cx="10" cy="10" r="5.5" stroke={iconStroke} fill="none" strokeWidth={sw} />
      </svg>
    )
    case 'icosa': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 16,7 14,14 6,14 4,7" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <polygon points="10,2 14,14 4,7 16,7 6,14" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
      </svg>
    )
    case 'dodeca': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 14.8,5.5 13.1,11 6.9,11 5.2,5.5" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <polygon points="10,18 14.8,14.5 13.1,9 6.9,9 5.2,14.5" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <line x1="10" y1="2" x2="10" y2="5" stroke={iconStroke} strokeWidth={sw} strokeDasharray="2 1.5" />
      </svg>
    )
    case 'bucky': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <path d="M10 2.5 L14 5.5 L14 10 L10 13 L6 10 L6 5.5Z" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
        <path d="M14 5.5 L17.5 8 M14 10 L17 12 M10 13 L10 17.5 M6 10 L2.5 12 M6 5.5 L2.5 8" stroke={iconStroke} fill="none" strokeWidth={sw} />
      </svg>
    )
    case 'cone': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L17 16 L3 16Z" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <ellipse cx="10" cy="16" rx="7" ry="2" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="3 2" />
      </svg>
    )
    case 'prism': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,3 17,14 3,14" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <polygon points="10,7 14,15 6,15" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
        <line x1="10" y1="3" x2="10" y2="7" stroke={iconStroke} strokeWidth={sw} />
        <line x1="17" y1="14" x2="14" y2="15" stroke={iconStroke} strokeWidth={sw} />
        <line x1="3" y1="14" x2="6" y2="15" stroke={iconStroke} strokeWidth={sw} />
      </svg>
    )
    case 'hex-torus': return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 15.2,5 15.2,11 10,14 4.8,11 4.8,5" stroke={iconStroke} fill="none" strokeWidth={sw} />
        <polygon points="10,5.5 13.2,7.25 13.2,10.75 10,12.5 6.8,10.75 6.8,7.25" stroke={iconStroke} fill="none" strokeWidth={sw} strokeDasharray="2 1.5" />
      </svg>
    )
    default: return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={iconStroke} fill="none" strokeWidth={sw} />
      </svg>
    )
  }
}
