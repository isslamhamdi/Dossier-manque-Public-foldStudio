'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

function hexToCmyk(hex: string): [number, number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return [0, 0, 0, 100]
  return [
    Math.round(((1 - r - k) / (1 - k)) * 100),
    Math.round(((1 - g - k) / (1 - k)) * 100),
    Math.round(((1 - b - k) / (1 - k)) * 100),
    Math.round(k * 100),
  ]
}

function cmykGamutWarning(c: number, m: number, y: number, k: number): string | null {
  const tic = c + m + y + k
  if (tic > 320) return `Encre totale ${tic}% > 320% (risque de séchage)`
  if (tic > 280 && k > 80) return `Noir riche + TIC élevé — préférer K seul`
  return null
}

function hexToHsb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [Math.round(h * 360), Math.round((max === 0 ? 0 : d / max) * 100), Math.round(max * 100)]
}

function hsbToHex(h: number, s: number, b: number): string {
  const S = s / 100, B = b / 100
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return B * (1 - S * Math.max(0, Math.min(k, 4 - k, 1)))
  }
  return '#' + [f(5), f(3), f(1)].map(v => Math.round(Math.max(0, Math.min(255, v * 255))).toString(16).padStart(2, '0')).join('')
}

const SWATCHES = [
  // Noir → blanc
  '#000000','#333333','#555555','#777777','#999999','#bbbbbb','#dddddd','#ffffff',
  // CMYK purs
  '#00aeef','#ec008c','#ffcb00','#231f20',
  // Chauds
  '#e63946','#f4845f','#f9c74f','#90be6d',
  // Froids
  '#43aa8b','#277da1','#1a3a6b','#4a0080',
  // Packaging
  '#ffffff','#f5f2ec','#c4984e','#8b4513','#3d2b1f','#2d5a1b',
]

export function ColorSwatch({ label, value, onChange }: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  // non-null only while user is typing in the hex text input
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  const squareRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const currentHRef = useRef(0)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const isValidHex = /^#[0-9a-fA-F]{6}$/.test(value)
  const safeValue = isValidHex ? value : '#000000'
  const [h, s, b] = hexToHsb(safeValue)
  currentHRef.current = h

  // Derives from value whenever the user isn't typing in the hex field
  const displayHex = hexDraft !== null ? hexDraft : safeValue.replace('#', '')

  const updateFromSquare = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = squareRef.current?.getBoundingClientRect()
    if (!rect) return
    const newS = Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * 100)
    const newB = Math.round(Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height)) * 100)
    onChangeRef.current(hsbToHex(currentHRef.current, newS, newB))
  }, [])

  useEffect(() => {
    if (!open) return
    const onUp = () => { isDragging.current = false }
    const onMove = (e: MouseEvent) => { if (isDragging.current) updateFromSquare(e) }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mouseup', onUp); window.removeEventListener('mousemove', onMove) }
  }, [open, updateFromSquare])

  const rgb = [
    parseInt(safeValue.slice(1, 3), 16),
    parseInt(safeValue.slice(3, 5), 16),
    parseInt(safeValue.slice(5, 7), 16),
  ]
  const [cmykC, cmykM, cmykY, cmykK] = hexToCmyk(safeValue)
  const gamutWarn = cmykGamutWarning(cmykC, cmykM, cmykY, cmykK)

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div onClick={() => setOpen(v => !v)} className="fs-swatch-trigger" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <div style={{ width: 20, height: 20, borderRadius: 3, background: safeValue, border: '1px solid #d0d0d0', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#444', fontFamily: 'monospace', fontWeight: 500 }}>{safeValue.toUpperCase()}</span>
        <span style={{ fontSize: 9, color: '#bbb', marginLeft: 'auto' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 6, padding: 10, marginTop: 6 }}>
          <div
            ref={squareRef}
            onMouseDown={e => { isDragging.current = true; updateFromSquare(e) }}
            style={{ width: '100%', height: 120, position: 'relative', borderRadius: 4, cursor: 'crosshair', marginBottom: 8, background: `hsl(${h}, 100%, 50%)` }}
          >
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'linear-gradient(to right, #fff, transparent)' }} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: 4, background: 'linear-gradient(to bottom, transparent, #000)' }} />
            <div style={{
              position: 'absolute', left: `${s}%`, top: `${100 - b}%`,
              width: 10, height: 10, borderRadius: '50%',
              border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              transform: 'translate(-50%, -50%)', pointerEvents: 'none',
            }} />
          </div>

          <div
            style={{
              position: 'relative', height: 10, marginBottom: 8, borderRadius: 5, cursor: 'pointer',
              background: 'linear-gradient(to right, hsl(0,100%,50%),hsl(30,100%,50%),hsl(60,100%,50%),hsl(90,100%,50%),hsl(120,100%,50%),hsl(150,100%,50%),hsl(180,100%,50%),hsl(210,100%,50%),hsl(240,100%,50%),hsl(270,100%,50%),hsl(300,100%,50%),hsl(330,100%,50%),hsl(360,100%,50%))',
            }}
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const newH = Math.round(((e.clientX - rect.left) / rect.width) * 360)
              onChange(hsbToHex(newH, s, b))
            }}
          >
            <div style={{
              position: 'absolute', left: `${h / 360 * 100}%`, top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: `hsl(${h},100%,50%)`,
              border: '2px solid white', boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* CMYK display + gamut warning */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 6, padding: '5px 6px', background: '#f7f7f7', borderRadius: 4 }}>
            {(['C', 'M', 'J', 'N'] as const).map((ch, i) => {
              const val = [cmykC, cmykM, cmykY, cmykK][i]
              const clr = ['#00aeef', '#ec008c', '#ffcb00', '#000'][i]
              return (
                <div key={ch} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 8, color: clr, fontWeight: 700, marginBottom: 1 }}>{ch}</div>
                  <div style={{ fontSize: 10, color: '#333', fontFamily: 'monospace' }}>{val}</div>
                </div>
              )
            })}
          </div>
          {gamutWarn && (
            <div style={{ display: 'flex', gap: 5, alignItems: 'flex-start', padding: '4px 6px', background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 4, marginBottom: 6 }}>
              <span style={{ fontSize: 11, flexShrink: 0 }}>⚠</span>
              <span style={{ fontSize: 9, color: '#7a5c00', lineHeight: 1.4 }}>{gamutWarn}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {(['R', 'G', 'B'] as const).map((ch, i) => (
              <div key={ch} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#999', marginBottom: 2 }}>{ch}</div>
                <input
                  type="number" min={0} max={255} value={rgb[i]}
                  onChange={e => {
                    const comps = [...rgb]; comps[i] = Math.max(0, Math.min(255, Number(e.target.value) || 0))
                    onChange('#' + comps.map(v => v.toString(16).padStart(2, '0')).join(''))
                  }}
                  className="fs-input" style={{ width: '100%', textAlign: 'center', fontSize: 10, border: '1px solid #e0e0e0', borderRadius: 3, padding: '2px 0', outline: 'none', background: '#fafafa' }}
                />
              </div>
            ))}
          </div>

          {/* Color swatches */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 8, color: '#aaa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Nuancier</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {SWATCHES.map(sw => (
                <div
                  key={sw}
                  title={sw.toUpperCase()}
                  onClick={() => onChange(sw)}
                  style={{
                    width: 16, height: 16, borderRadius: 3, cursor: 'pointer', flexShrink: 0,
                    background: sw, border: sw.toLowerCase() === safeValue.toLowerCase() ? '2px solid #333' : '1px solid rgba(0,0,0,0.15)',
                    boxSizing: 'border-box',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 2, background: safeValue, border: '1px solid #d0d0d0', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#aaa' }}>#</span>
            <input
              type="text"
              value={displayHex.toUpperCase()}
              onFocus={() => setHexDraft(safeValue.replace('#', ''))}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                setHexDraft(val)
                if (val.length === 6) onChange('#' + val)
              }}
              onBlur={() => setHexDraft(null)}
              className="fs-input" style={{ flex: 1, fontSize: 11, border: '1px solid #e0e0e0', borderRadius: 3, padding: '2px 6px', outline: 'none', fontFamily: 'monospace' }}
            />
            {/* #29: EyeDropper API */}
            {'EyeDropper' in window && (
              <button
                title="Pipette (sélectionner couleur à l'écran)"
                onClick={async () => {
                  try {
                    const ed = new (window as any).EyeDropper()
                    const { sRGBHex } = await ed.open()
                    onChange(sRGBHex)
                  } catch { /* user cancelled */ }
                }}
                style={{ background:'none', border:'1px solid #e0e0e0', borderRadius:3, padding:'2px 4px', cursor:'pointer', display:'flex', alignItems:'center', color:'#888' }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <path d="M9 1.5L10.5 3 4.5 9l-3 .5.5-3z"/>
                  <circle cx="10" cy="2" r=".8" fill="currentColor" stroke="none"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
