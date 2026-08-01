'use client'

// #94-98 Mobile & Touch — camera scan, stylus, mobile UX

import { useState, useRef, useEffect } from 'react'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface MobileSectionProps {
  onAddLayer: (layer: ImageLayer) => void
}

export function MobileSection({ onAddLayer }: MobileSectionProps) {
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState('')
  const [stylusEnabled, setStylusEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // #96 Camera scan — capture photo as artwork layer
  async function startScan() {
    setScanError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
    } catch {
      setScanError('Caméra non disponible')
    }
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const src = canvas.toDataURL('image/jpeg', 0.9)
    onAddLayer({
      id: `cam-${Date.now()}`, name: 'Photo caméra',
      src, x: 10, y: 10, width: 100, height: 100,
      scale: 1, rotation: 0, visible: true, locked: false, faceAssignment: 'auto',
    })
    stopScan()
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setScanning(false)
  }

  // #95 Stylus — enable pressure-sensitive indicator
  function toggleStylus() {
    setStylusEnabled(v => !v)
    if (!stylusEnabled) {
      document.documentElement.setAttribute('data-stylus', 'true')
    } else {
      document.documentElement.removeAttribute('data-stylus')
    }
  }

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => { setIsMobile(/Mobi|Android|iPhone/i.test(navigator.userAgent)) }, [])

  return (
    <CollapsibleSection label="Mobile & Touch">
      {/* #96 Camera scan */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Scanner caméra</div>
        {!scanning ? (
          <button onClick={startScan}
            style={{ width: '100%', fontSize: fs.sm, fontWeight: 600, padding: '7px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="3"/>
              <rect x="1" y="3" width="12" height="9" rx="1.5"/>
              <path d="M5 1h4"/>
            </svg>
            Activer caméra
          </button>
        ) : (
          <div>
            <video ref={videoRef} playsInline muted style={{ width: '100%', borderRadius: 8, background: '#000', display: 'block', maxHeight: 160, objectFit: 'cover' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button onClick={capture} style={{ flex: 2, fontSize: fs.sm, fontWeight: 700, padding: '7px 0', borderRadius: r.md, border: 'none', background: '#5A6BD4', color: '#fff', cursor: 'pointer' }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M1 5h2l1.5-2h5L11 5h2v7H1z"/><circle cx="6.5" cy="8.5" r="2"/></svg>
                Capturer
              </button>
              <button onClick={stopScan} style={{ flex: 1, fontSize: fs.sm, padding: '7px 0', borderRadius: r.md, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
                Annuler
              </button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        {scanError && <div style={{ fontSize: 9, color: '#ef4444', marginTop: 4 }}>{scanError}</div>}
      </div>

      {/* #95 Stylus */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Stylet (Pointer Events)</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={stylusEnabled} onChange={toggleStylus} style={{ accentColor: '#5A6BD4' }} />
          <div>
            <div style={{ fontSize: fs.sm, color: c.textMed, fontWeight: stylusEnabled ? 700 : 400 }}>
              {stylusEnabled ? '✓ Mode stylet activé' : 'Activer stylet/Apple Pencil'}
            </div>
            <div style={{ fontSize: 8, color: c.textGhost }}>Détection pression via Pointer Events API</div>
          </div>
        </label>
      </div>

      {/* #94 Touch gestures info */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Gestes tactiles</div>
        <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px' }}>
          {[
            { icon: '✌', label: 'Pinch-to-zoom (3D)' },
            { icon: '☝', label: 'Tap — sélection calque' },
            { icon: '✋', label: 'Swipe — défilement panneau' },
            { icon: '↺', label: 'Rotation 2 doigts (3D)' },
          ].map(g => (
            <div key={g.label} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0' }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{g.icon}</span>
              <span style={{ fontSize: 9, color: c.textMed }}>{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* #97 Mobile UX indicator */}
      <div style={{ padding: '5px 8px', borderRadius: 8, background: isMobile ? 'rgba(5,150,105,0.07)' : 'rgba(0,0,0,0.03)', border: `1px solid ${isMobile ? 'rgba(5,150,105,0.2)' : c.borderLight}` }}>
        <div style={{ fontSize: 9, color: isMobile ? '#059669' : c.textGhost }}>
          {isMobile ? '✓ Interface mobile détectée — UI optimisée' : 'Interface desktop'}
        </div>
      </div>
    </CollapsibleSection>
  )
}
