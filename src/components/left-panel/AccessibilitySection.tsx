'use client'

// #115 Filtre daltonisme / accessibilité couleur

import { useState, useEffect } from 'react'
import { CollapsibleSection } from './ui'
import { c, fs } from '@/lib/tokens'

type CBMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia'

const MODES: { id: CBMode; label: string; desc: string }[] = [
  { id: 'none',          label: 'Normal',       desc: 'Vision couleur normale' },
  { id: 'protanopia',    label: 'Protanopie',   desc: 'Insensibilité au rouge (8% hommes)' },
  { id: 'deuteranopia',  label: 'Deutéranopie', desc: 'Insensibilité au vert (5% hommes)' },
  { id: 'tritanopia',    label: 'Tritanopie',   desc: 'Insensibilité au bleu (0.01%)' },
  { id: 'achromatopsia', label: 'Achromatopsie',desc: 'Vision en niveaux de gris' },
]

// CSS filter matrices for color blindness simulation
const CSS_FILTERS: Record<CBMode, string> = {
  none: 'none',
  protanopia:    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'p\'><feColorMatrix type=\'matrix\' values=\'0.567 0.433 0 0 0 0.558 0.442 0 0 0 0 0.242 0.758 0 0 0 0 0 1 0\'/></filter></svg>#p")',
  deuteranopia:  'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'d\'><feColorMatrix type=\'matrix\' values=\'0.625 0.375 0 0 0 0.7 0.3 0 0 0 0 0.3 0.7 0 0 0 0 0 1 0\'/></filter></svg>#d")',
  tritanopia:    'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\'><filter id=\'t\'><feColorMatrix type=\'matrix\' values=\'0.95 0.05 0 0 0 0 0.433 0.567 0 0 0 0.475 0.525 0 0 0 0 0 1 0\'/></filter></svg>#t")',
  achromatopsia: 'grayscale(100%)',
}

export function AccessibilitySection() {
  const [mode, setMode] = useState<CBMode>('none')
  const [contrastRatio, setContrastRatio] = useState<number | null>(null)

  useEffect(() => {
    const canvas = document.getElementById('dieline-canvas-svg') as SVGElement | null
    if (canvas) {
      canvas.style.filter = CSS_FILTERS[mode] ?? 'none'
    }
    const three = document.querySelector('canvas') as HTMLCanvasElement | null
    if (three) {
      three.style.filter = CSS_FILTERS[mode] ?? 'none'
    }
    return () => {
      if (canvas) canvas.style.filter = 'none'
      if (three) three.style.filter = 'none'
    }
  }, [mode])

  // WCAG contrast ratio for two hex colors
  function calcContrast(hex1: string, hex2: string): number {
    function lum(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      const linear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
    }
    const l1 = lum(hex1), l2 = lum(hex2)
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  const [color1, setColor1] = useState('#ffffff')
  const [color2, setColor2] = useState('#000000')

  useEffect(() => {
    setContrastRatio(calcContrast(color1, color2))
  }, [color1, color2])

  const wcag = contrastRatio !== null ? (contrastRatio >= 7 ? 'AAA' : contrastRatio >= 4.5 ? 'AA' : contrastRatio >= 3 ? 'AA Large' : 'Échec') : null
  const wcagColor = wcag === 'AAA' ? '#059669' : wcag === 'AA' ? '#0ea5e9' : wcag === 'AA Large' ? '#f59e0b' : '#ef4444'

  return (
    <CollapsibleSection label="Accessibilité couleur">
      <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        Simulation daltonisme
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
              borderRadius: 8, border: `1px solid ${mode === m.id ? '#5A6BD4' : c.borderLight}`,
              background: mode === m.id ? 'rgba(90,107,212,0.08)' : c.white,
              cursor: 'pointer', textAlign: 'left',
            }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: mode === m.id ? '#5A6BD4' : c.borderLight, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: mode === m.id ? 700 : 500, color: mode === m.id ? '#5A6BD4' : c.ink }}>{m.label}</div>
              <div style={{ fontSize: 8, color: c.textGhost }}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* WCAG contrast checker */}
      <div style={{ borderTop: `1px solid ${c.borderLight}`, paddingTop: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Ratio de contraste WCAG
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 9, color: c.textGhost }}>Couleur 1</span>
            <input type="color" value={color1} onChange={e => setColor1(e.target.value)}
              style={{ width: '100%', height: 32, borderRadius: 7, border: `1px solid ${c.borderLight}`, cursor: 'pointer', padding: 2 }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ fontSize: 9, color: c.textGhost }}>Couleur 2</span>
            <input type="color" value={color2} onChange={e => setColor2(e.target.value)}
              style={{ width: '100%', height: 32, borderRadius: 7, border: `1px solid ${c.borderLight}`, cursor: 'pointer', padding: 2 }} />
          </label>
        </div>
        {contrastRatio !== null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 8, background: `${wcagColor}15`, border: `1px solid ${wcagColor}40` }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: wcagColor }}>{contrastRatio.toFixed(2)}:1</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: wcagColor }}>{wcag}</span>
          </div>
        )}
        <div style={{ fontSize: 8, color: c.textGhost, marginTop: 4, textAlign: 'center' }}>
          AA ≥ 4.5:1 · AA Large ≥ 3:1 · AAA ≥ 7:1
        </div>
      </div>
    </CollapsibleSection>
  )
}
