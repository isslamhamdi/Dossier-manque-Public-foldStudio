'use client'

import { useState, useRef, useCallback } from 'react'

export type ToolCategory = 'structure' | 'layers' | 'design' | 'material' | 'print' | 'eco' | 'business' | 'collab'

const GROUPS = [
  [
    { id: 'structure' as ToolCategory, label: 'Structure' },
    { id: 'layers'    as ToolCategory, label: 'Layers'    },
  ],
  [
    { id: 'design'   as ToolCategory, label: 'Design'   },
    { id: 'material' as ToolCategory, label: 'Material'  },
  ],
  [
    { id: 'print' as ToolCategory, label: 'Print' },
    { id: 'eco'   as ToolCategory, label: 'Eco'   },
  ],
  [
    { id: 'business' as ToolCategory, label: 'Business' },
    { id: 'collab'   as ToolCategory, label: 'Collab'   },
  ],
]

// label = display text, section = exact CollapsibleSection label (data-section-header)
const FLYOUTS: Record<ToolCategory, { label: string; section: string }[]> = {
  structure: [
    { label: 'Dimensions',             section: 'Dimensions' },
    { label: 'Séquence de pliage',     section: 'Séquence de pliage' },
    { label: 'Résistance structurelle',section: 'Résistance structurelle' },
  ],
  layers: [
    { label: 'Calques',                section: 'Calques' },
  ],
  design: [
    { label: 'Texte',                  section: 'Texte' },
    { label: 'Texte inter-faces',      section: 'TEXTE INTER-FACES' },
    { label: 'Dégradé',               section: 'Dégradé' },
    { label: 'Pattern / Répétition',   section: 'Pattern / Répétition' },
    { label: 'Codes-barres',           section: 'Codes-barres' },
    { label: 'QR Code',               section: 'QR Code' },
    { label: 'VDP — Impression variable', section: 'VDP — IMPRESSION VARIABLE' },
    { label: 'Pictogrammes',           section: 'Pictogrammes' },
  ],
  material: [
    { label: 'Matière',               section: 'Matière' },
    { label: 'Couverture Encre',       section: 'Couverture Encre' },
    { label: 'Éclairage avancé',      section: 'Éclairage avancé' },
    { label: 'Post-processing',        section: 'Post-processing' },
    { label: 'Texte 3D sur boîte',     section: 'Texte 3D sur boîte' },
    { label: 'Scène & Caméra avancée', section: 'Scène & Caméra avancée' },
  ],
  print: [
    { label: 'Export',                 section: 'Export' },
    { label: 'Imposition / Nesting',   section: 'Imposition / Nesting' },
    { label: 'Contrôle pré-impression',section: 'Contrôle pré-impression' },
    { label: 'Simulation impression',  section: 'SIMULATION IMPRESSION' },
    { label: 'Contrôle qualité',       section: 'CONTRÔLE QUALITÉ IMPRESSION' },
    { label: 'Anti-contrefaçon',       section: 'ANTI-CONTREFAÇON' },
  ],
  eco: [
    { label: 'Durabilité & LCA',       section: 'Durabilité & LCA' },
    { label: 'Food Safety',            section: 'Food Safety' },
    { label: 'Logistics',              section: 'Logistics' },
  ],
  business: [
    { label: 'Marketplace',            section: 'Marketplace' },
    { label: 'Business & White Label', section: 'Business & White Label' },
    { label: 'Retail & Marketing',     section: 'RETAIL & MARKETING' },
    { label: 'Marketing & Consumer',   section: 'Marketing & Consumer' },
    { label: 'E-commerce',             section: 'E-commerce' },
    { label: 'Workflow production',    section: 'Workflow production' },
    { label: 'Branding & Identité',    section: 'BRANDING & IDENTITÉ' },
    { label: 'Sécurité & Accessibilité', section: 'Sécurité & Accessibilité' },
    { label: 'Sleeve & Label',         section: 'Sleeve & Label' },
    { label: 'Premium FX',            section: 'Premium FX & Simulation' },
  ],
  collab: [
    { label: 'Compliance & Légal',     section: 'Compliance & Légal' },
    { label: 'Smart Packaging',        section: 'SMART PACKAGING' },
    { label: 'Passeport Numérique',    section: 'Passeport Produit Numérique' },
    { label: 'Mobile & Touch',         section: 'Mobile & Touch' },
    { label: 'Accessibilité couleur',  section: 'Accessibilité couleur' },
    { label: 'Collaboration',          section: 'Collaboration & Export ZIP' },
    { label: 'Versioning',             section: 'Versioning Local' },
  ],
}

const s12 = { stroke: '#888', strokeWidth: '1.25', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Dimensions':              <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="3" width="10" height="6" rx="0.8"/><path d="M1 6h10M6 3v6" strokeDasharray="1.5 1"/></svg>,
  'Séquence de pliage':     <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 9l3-6 2.5 5 2-3"/><circle cx="10" cy="6" r="1" fill="#888" stroke="none"/></svg>,
  'Résistance structurelle': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1l4 2v3.5C10 8.5 8.5 10.5 6 11 3.5 10.5 2 8.5 2 6.5V3z"/></svg>,
  'Calques':                 <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M1 4l5-2.5L11 4M1 7l5 2.5L11 7M1 10l5 2.5L11 10"/></svg>,
  'Texte':                   <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 3h8M6 3v6" strokeLinecap="round"/><path d="M4 9h4"/></svg>,
  'TEXTE INTER-FACES':       <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M1 5h4M5 5V3M3 3h4"/><path d="M7 7h4M9 7v2"/><path d="M5.5 6L6.5 6" strokeDasharray="1 0.7"/></svg>,
  'Dégradé':                <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="3" width="10" height="6" rx="1"/><path d="M1 6h10" stroke="none"/><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stopColor="#888"/><stop offset="1" stopColor="#ddd"/></linearGradient></defs><rect x="1" y="3" width="10" height="6" rx="1" fill="url(#g)" stroke="#888" strokeWidth="1.25"/></svg>,
  'Pattern / Répétition':    <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="3" cy="3" r="1"/><circle cx="6" cy="3" r="1"/><circle cx="9" cy="3" r="1"/><circle cx="3" cy="6" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="3" cy="9" r="1"/><circle cx="6" cy="9" r="1"/><circle cx="9" cy="9" r="1"/></svg>,
  'Codes-barres':            <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 3v6M4 3v6M5.5 3v6M7 3v6M8.5 3v6M10 3v6"/><path d="M3 3v6" strokeWidth="2.2"/><path d="M6.5 3v6" strokeWidth="1.8"/></svg>,
  'QR Code':                 <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="1" width="4" height="4" rx="0.5"/><rect x="7" y="1" width="4" height="4" rx="0.5"/><rect x="1" y="7" width="4" height="4" rx="0.5"/><rect x="7.5" y="7.5" width="1.5" height="1.5" fill="#888" stroke="none"/><path d="M9.5 7.5v1.5h1.5M9.5 9.5h1.5" strokeLinecap="square"/></svg>,
  'VDP — IMPRESSION VARIABLE': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 4h3M2 6h5M2 8h3"/><path d="M8 3l2 3-2 3" strokeWidth="1.1"/></svg>,
  'Pictogrammes':            <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1.5l1.3 2.7L10.5 4.6l-2.3 2.2.5 3.2L6 8.5l-2.7 1.5.5-3.2L1.5 4.6l3.2-.4z"/></svg>,
  'Matière':                <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="6" r="4.5"/><path d="M6 1.5a4.5 4.5 0 0 1 0 9z" fill="#888" stroke="none"/></svg>,
  'Couverture Encre':        <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 2C6 2 3 5 3 7.5a3 3 0 0 0 6 0C9 5 6 2 6 2z"/></svg>,
  'Éclairage avancé':       <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="5.5" r="2.5"/><path d="M6 1v1M6 10v1M1.5 5.5h1M9.5 5.5h1M3 3l.7.7M8.3 8.3l.7.7M3 8l.7-.7M8.3 2.7l.7-.7"/></svg>,
  'Post-processing':         <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1.5l.8 2.4 2.4.8-2.4.8L6 8l-.8-2.5L2.8 4.7l2.4-.8z"/><path d="M9 7.5l.4 1.2 1.1.3-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.3z"/></svg>,
  'Texte 3D sur boîte':     <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 8.5V4L6 2l4 2v4.5L6 10z"/><path d="M2 4l4 2M6 10V6M10 4L6 6"/></svg>,
  'Scène & Caméra avancée': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="3" width="7" height="6" rx="1"/><path d="M8 5.5l3-1.5v4l-3-1.5z"/></svg>,
  'Export':                  <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1v7M3.5 5.5L6 8l2.5-2.5"/><path d="M2 10h8"/></svg>,
  'Imposition / Nesting':    <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="1" width="4" height="4" rx="0.5"/><rect x="7" y="1" width="4" height="4" rx="0.5"/><rect x="1" y="7" width="4" height="4" rx="0.5"/><rect x="7" y="7" width="4" height="4" rx="0.5"/></svg>,
  'Contrôle pré-impression': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="2" y="1" width="8" height="10" rx="1"/><path d="M4 4.5l1.5 1.5L8 3.5M4 7.5h4"/></svg>,
  'SIMULATION IMPRESSION':   <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M3 4V2h6v2"/><rect x="1" y="4" width="10" height="5" rx="0.8"/><path d="M3 7h6v4H3z"/></svg>,
  'CONTRÔLE QUALITÉ IMPRESSION': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="6" r="4.5"/><path d="M3.5 6l2 2 3-3"/></svg>,
  'ANTI-CONTREFAÇON':        <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1l4 2v3C10 8.5 8.2 10.5 6 11 3.8 10.5 2 8.5 2 6V3z"/><path d="M4.5 6l1.5 1.5 2-2"/></svg>,
  'Durabilité & LCA':        <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M10 2c0 0-3 0-5 3C3.5 7.2 3.5 10 3.5 11"/><path d="M2 11c0 0 .5-3 3-5"/><path d="M3.5 11c0-1.5.5-3.5 3-4.5"/></svg>,
  'Food Safety':             <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1l4 2v3C10 8.5 8.2 10.5 6 11 3.8 10.5 2 8.5 2 6V3z"/><path d="M4.5 5.5a2 2 0 0 0 3 3"/></svg>,
  'Logistics':               <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="4" width="7" height="5" rx="0.8"/><path d="M8 6h2l1.5 2.5V9h-3.5"/><circle cx="3" cy="9.5" r="1"/><circle cx="9.5" cy="9.5" r="1"/></svg>,
  'Marketplace':             <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M1 3h10l-1 3H2z"/><path d="M2 6v4h8V6"/><path d="M5 9V6.5M7 9V6.5"/></svg>,
  'Business & White Label':  <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="4" width="10" height="7" rx="1"/><path d="M4 4V3a2 2 0 0 1 4 0v1"/></svg>,
  'RETAIL & MARKETING':      <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M2 2h1.5l1 5.5h5l1-4H4"/><circle cx="5.5" cy="9.5" r="1"/><circle cx="8.5" cy="9.5" r="1"/></svg>,
  'Marketing & Consumer':    <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="4" r="2"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeLinecap="round"/></svg>,
  'E-commerce':              <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="1" width="10" height="10" rx="1"/><path d="M4 5c0-1.1.9-2 2-2s2 .9 2 2"/><path d="M2.5 5h7l-1 4h-5z"/></svg>,
  'Workflow production':     <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="2.5" cy="6" r="1.5"/><circle cx="6" cy="3" r="1.5"/><circle cx="9.5" cy="6" r="1.5"/><path d="M4 6H3.5M7.5 4.2L8.5 5.2M4 4.2L3 5.2"/></svg>,
  'BRANDING & IDENTITÉ':     <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1l1.5 3.5H11L8 7l1 3.5L6 8.5 3 10.5l1-3.5L1 4.5h3.5z"/></svg>,
  'Sécurité & Accessibilité':<svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="3" y="5" width="6" height="5" rx="0.8"/><path d="M4 5V4a2 2 0 0 1 4 0v1"/><path d="M6 7.5v1"/></svg>,
  'Sleeve & Label':          <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M3 1.5h6v9H3z"/><path d="M4.5 4h3M4.5 6h2"/></svg>,
  'Premium FX & Simulation': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><path d="M6 1.5l.9 2.7L9.8 5l-2.7.9-.9 2.6-.9-2.6L2.2 5l2.9-.8z"/><path d="M9.5 8l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z"/></svg>,
  'Compliance & Légal':      <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="2" y="1" width="8" height="10" rx="1"/><path d="M4 4h4M4 6h4M4 8h2"/></svg>,
  'SMART PACKAGING':         <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1" y="3" width="6" height="6" rx="0.8"/><path d="M8 5h2.5M8 7h1.5"/><circle cx="10.5" cy="5" r="1"/><circle cx="10" cy="7" r="1"/></svg>,
  'Passeport Produit Numérique': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="1.5" y="1" width="9" height="10" rx="1"/><circle cx="6" cy="5" r="2"/><path d="M3 9.5c0-1.7 1.3-3 3-3s3 1.3 3 3" strokeLinecap="round"/></svg>,
  'Mobile & Touch':          <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="3.5" y="1" width="5" height="9" rx="1.2"/><circle cx="6" cy="8.5" r="0.7" fill="#888" stroke="none"/></svg>,
  'Accessibilité couleur':   <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="6" r="4.5"/><path d="M1.5 6h9M6 1.8a5 5 0 0 1 0 8.4M6 1.8a5 5 0 0 0 0 8.4" strokeDasharray="0"/></svg>,
  'Collaboration & Export ZIP': <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="3" cy="3.5" r="1.5"/><circle cx="9" cy="3.5" r="1.5"/><path d="M1 9.5c0-1.5 1-2.5 2-2.5M8 9.5c0-1.5 1-2.5 2-2.5"/><path d="M4.5 10c0-1 .7-1.5 1.5-1.5s1.5.5 1.5 1.5"/></svg>,
  'Versioning Local':        <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><circle cx="6" cy="2" r="1.5"/><circle cx="6" cy="10" r="1.5"/><path d="M6 3.5v5"/><path d="M3 8.5L6 10M9 8.5L6 10" strokeDasharray="1 0.8"/></svg>,
}

function FlyoutItemIcon({ section }: { section: string }) {
  return SECTION_ICONS[section] ?? (
    <svg width="12" height="12" viewBox="0 0 12 12" {...s12}><rect x="2" y="2" width="8" height="8" rx="1"/></svg>
  )
}

// Tabler-style icons — 24px viewBox, stroke 1.8, round caps/joins
function TablerIcon({ id, active }: { id: ToolCategory; active: boolean }) {
  const c = active ? '#3b82f6' : '#6b7280'
  const s = { stroke: c, strokeWidth: '1.8', fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (id) {
    case 'structure': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M12 3L22 8.5V15.5L12 21L2 15.5V8.5L12 3Z"/>
        <path d="M2 8.5L12 14L22 8.5"/>
        <path d="M12 14V21"/>
      </svg>
    )
    case 'layers': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M12 2L22 7L12 12L2 7L12 2Z"/>
        <path d="M2 12L12 17L22 12"/>
        <path d="M2 17L12 22L22 17"/>
      </svg>
    )
    case 'design': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M3 21L12.5 4L22 21"/>
        <path d="M3 21h19"/>
        <path d="M7 14h10"/>
      </svg>
    )
    case 'material': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M12 21C16.418 21 20 17.418 20 13C20 11 18 8 15 6C14 8 13 9.5 11 10C11 7 10 5 8 3C5.5 5 4 8.5 4 13C4 17.418 7.582 21 12 21Z"/>
        <path d="M12 21C12 21 8 17 8 13"/>
      </svg>
    )
    case 'print': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M6 9V5H18V9"/>
        <rect x="3" y="9" width="18" height="9" rx="1.5"/>
        <rect x="6" y="14" width="12" height="6" rx="0.75"/>
        <path d="M7.5 13H8.5"/>
      </svg>
    )
    case 'eco': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M20 4C20 4 14 4 10 10C7 14.5 7 19 7 21"/>
        <path d="M4 21C4 21 5 16 10 10"/>
        <path d="M7 21C7 18 8 14 12 11"/>
      </svg>
    )
    case 'business': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <path d="M3 18V13H7V18H3Z"/>
        <path d="M9 18V9H13V18H9Z"/>
        <path d="M15 18V5H19V18H15Z"/>
        <path d="M2 18H22"/>
      </svg>
    )
    case 'collab': return (
      <svg width="20" height="20" viewBox="0 0 24 24" {...s}>
        <circle cx="7" cy="7" r="3"/>
        <circle cx="17" cy="7" r="3"/>
        <path d="M1 21C1 17 3.5 14 7 14"/>
        <path d="M23 21C23 17 20.5 14 17 14"/>
        <path d="M7 14C7 14 9.5 12 12 14C14.5 12 17 14 17 14"/>
        <path d="M9.5 21C9.5 18 10.5 16 12 16C13.5 16 14.5 18 14.5 21"/>
      </svg>
    )
  }
}

function Divider() {
  return <div style={{ width: 28, height: 1, background: '#ddd8d2', margin: '4px auto' }} />
}

interface Props {
  active: ToolCategory
  onChange: (c: ToolCategory) => void
  exteriorColor?: string
  interiorColor?: string
}

export function ToolbarStrip({ active, onChange, exteriorColor = '#ffffff', interiorColor = '#f0ede9' }: Props) {
  const [flyout, setFlyout] = useState<{ id: ToolCategory; y: number } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isOverFlyout = useRef(false)

  // collapsed = 64px icon+label strip | expanded = 200px full section list
  const W = expanded ? 200 : 64

  const openFlyout = useCallback((id: ToolCategory, btnEl: HTMLElement) => {
    const rect = btnEl.getBoundingClientRect()
    setFlyout({ id, y: rect.top })
  }, [])

  const closeFlyout = useCallback(() => {
    if (!isOverFlyout.current) setFlyout(null)
  }, [])

  const handleBtnEnter = useCallback((id: ToolCategory, e: React.MouseEvent<HTMLButtonElement>) => {
    if (expanded) return // no flyout in expanded mode
    const btn = e.currentTarget
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => openFlyout(id, btn), 320)
  }, [openFlyout, expanded])

  const handleBtnLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setTimeout(closeFlyout, 80)
  }, [closeFlyout])

  const toggleBtn = (
    <button
      onClick={() => { setExpanded(v => !v); setFlyout(null) }}
      title={expanded ? 'Réduire' : 'Étendre la barre d\'outils'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#999', padding: '2px 5px', display: 'flex', alignItems: 'center',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#555' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#999' }}
    >
      {expanded
        ? /* << collapse */
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,1 1,6 6,11"/><polyline points="13,1 8,6 13,11"/>
          </svg>
        : /* >> expand */
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1,1 6,6 1,11"/><polyline points="8,1 13,6 8,11"/>
          </svg>
      }
    </button>
  )

  return (
    <div style={{
      width: W, height: '100%', background: '#f0ede9',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, borderRight: '1px solid #ddd8d2',
      position: 'relative',
      transition: 'width 0.2s ease',
      overflow: 'hidden',
    }}>

      {/* ── COLLAPSED MODE — icon strip ─────────────────────── */}
      {!expanded && (
        <>
          {/* Header */}
          <div style={{ width: '100%', height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #ddd8d2', marginBottom: 4 }}>
            {toggleBtn}
          </div>

          {/* Icons */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {GROUPS.map((group, gi) => (
              <div key={gi} style={{ width: '100%' }}>
                {gi > 0 && <Divider />}
                {group.map(cat => {
                  const isActive = active === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { onChange(cat.id); setFlyout(null) }}
                      title={cat.label}
                      onMouseEnter={e => handleBtnEnter(cat.id, e)}
                      onMouseLeave={handleBtnLeave}
                      style={{
                        position: 'relative', width: '100%', height: 48,
                        border: 'none', cursor: 'pointer', borderRadius: 0,
                        background: isActive ? 'rgba(59,130,246,0.1)' : (flyout?.id === cat.id ? 'rgba(0,0,0,0.06)' : 'transparent'),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                        transition: 'background 0.1s',
                      }}
                    >
                      {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', width: 2, height: '60%', background: '#3b82f6', borderRadius: '0 2px 2px 0' }} />}
                      <TablerIcon id={cat.id} active={isActive} />
                      <span style={{ fontSize: 8, fontWeight: isActive ? 700 : 500, color: isActive ? '#3b82f6' : '#888', letterSpacing: 0.2 }}>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div style={{ width: 28, height: 1, background: '#ddd8d2', margin: '8px auto' }} />
          <div style={{ position: 'relative', width: 30, height: 28, marginBottom: 4, marginLeft: 9 }}>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, background: interiorColor, border: '1.5px solid #bbb', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: 18, height: 18, background: exteriorColor, border: '1.5px solid #999', borderRadius: 2 }} />
          </div>
          <div style={{ flex: 1 }} />
          <button title="AI Design" onClick={() => onChange('design')} style={{ width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(59,130,246,0.35)', color: '#fff', flexShrink: 0, margin: '0 auto 4px' }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0 6.8 5.2 12 6 6.8 6.8 6 12 5.2 6.8 0 6 5.2 5.2z"/></svg>
          </button>
        </>
      )}

      {/* ── EXPANDED MODE — full section list ───────────────── */}
      {expanded && (
        <>
          {/* Header */}
          <div style={{ width: '100%', height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px 0 12px', borderBottom: '1px solid #ddd8d2', marginBottom: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase' }}>Outils</span>
            {toggleBtn}
          </div>

          {/* Scrollable section list */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
            {GROUPS.map((group, gi) => (
              <div key={gi}>
                {gi > 0 && <div style={{ height: 1, background: '#ddd8d2', margin: '4px 0' }} />}
                {group.map(cat => {
                  const isActive = active === cat.id
                  return (
                    <div key={cat.id}>
                      {/* Category row */}
                      <button
                        onClick={() => onChange(cat.id)}
                        style={{
                          width: '100%', height: 32, border: 'none', cursor: 'pointer',
                          background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                          display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
                          transition: 'background 0.1s', position: 'relative',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        {isActive && <div style={{ position: 'absolute', left: 0, top: '20%', width: 2, height: '60%', background: '#3b82f6', borderRadius: '0 2px 2px 0' }} />}
                        <TablerIcon id={cat.id} active={isActive} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? '#3b82f6' : '#555', letterSpacing: 0.2 }}>{cat.label}</span>
                      </button>
                      {/* Section items */}
                      {FLYOUTS[cat.id].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            onChange(cat.id)
                            window.dispatchEvent(new CustomEvent('fold-studio:focus-section', { detail: { label: item.section } }))
                          }}
                          style={{
                            width: '100%', height: 26, border: 'none', cursor: 'pointer',
                            background: 'transparent',
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '0 10px 0 28px',
                            transition: 'background 0.08s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.07)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                        >
                          <FlyoutItemIcon section={item.section} />
                          <span style={{ fontSize: 10.5, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer swatches + AI */}
          <div style={{ padding: '6px 10px', borderTop: '1px solid #ddd8d2', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 30, height: 24 }}>
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, background: interiorColor, border: '1.5px solid #bbb', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: 0, left: 0, width: 16, height: 16, background: exteriorColor, border: '1.5px solid #999', borderRadius: 2 }} />
            </div>
            <div style={{ flex: 1 }} />
            <button title="AI Design" onClick={() => onChange('design')} style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(59,130,246,0.35)', color: '#fff' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0 6.8 5.2 12 6 6.8 6.8 6 12 5.2 6.8 0 6 5.2 5.2z"/></svg>
            </button>
          </div>
        </>
      )}

      {/* Flyout menu */}
      {flyout && (() => {
        const itemCount = FLYOUTS[flyout.id].length
        const estHeight = 34 + itemCount * 30 + 8
        const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 800) - estHeight - 8
        const flyoutTop = Math.max(8, Math.min(flyout.y - 4, maxTop))
        return (
        <div
          onMouseEnter={() => { isOverFlyout.current = true }}
          onMouseLeave={() => { isOverFlyout.current = false; setFlyout(null) }}
          style={{
            position: 'fixed',
            left: W,
            top: flyoutTop,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid #ddd8d2',
            borderRadius: 6,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            minWidth: 220,
            padding: '4px 0',
            pointerEvents: 'auto',
            maxHeight: 'calc(100vh - 16px)',
            overflowY: 'auto',
          }}
        >
          {/* Category header */}
          <div style={{
            padding: '5px 12px 6px',
            fontSize: 9, fontWeight: 700, color: '#aaa',
            letterSpacing: 1.2, textTransform: 'uppercase',
            borderBottom: '1px solid #f0ede9',
          }}>
            {flyout.id}
          </div>

          {/* Items */}
          {FLYOUTS[flyout.id].map((item, i) => (
            <button
              key={i}
              onClick={() => {
                onChange(flyout.id)
                window.dispatchEvent(new CustomEvent('fold-studio:focus-section', { detail: { label: item.section } }))
                setFlyout(null)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 12, color: '#333',
                transition: 'background 0.08s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
            >
              <FlyoutItemIcon section={item.section} />
              {item.label}
            </button>
          ))}
        </div>
        )
      })()}
    </div>
  )
}
