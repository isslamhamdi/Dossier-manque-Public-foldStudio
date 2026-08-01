'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'
import type { BoxParams } from '@/lib/types'
import type { ImageLayer } from '@/lib/types'

type Tab = 'unboxing' | 'drop' | 'vibration' | 'aging' | 'weathering' | 'asmr'

const TAB_LABELS: Record<Tab, string> = {
  unboxing: 'Unboxing',
  drop: 'Drop',
  vibration: 'Vibration',
  aging: 'Aging',
  weathering: 'Weather',
  asmr: 'ASMR',
}

function TabPills({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
      {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            padding: '3px 8px',
            borderRadius: 20,
            fontSize: 9,
            fontWeight: 600,
            border: active === t ? 'none' : `1px solid ${c.borderLight}`,
            background: active === t ? c.ink : c.white,
            color: active === t ? c.white : c.textMuted,
            cursor: 'pointer',
          }}
        >
          {TAB_LABELS[t]}
        </button>
      ))}
    </div>
  )
}

function UnboxingTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1)

  const W = 280
  const H = 220
  const bW = Math.min(140, Math.max(60, (params.width / (params.width + params.depth)) * 180))
  const bH = Math.min(160, Math.max(60, (params.height / (params.height + params.depth)) * 180))
  const bX = (W - bW) / 2
  const bY = (H - bH) / 2 + 20

  const drawFrame = useCallback((lidAngle: number, prog: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)

    ctx.fillStyle = '#a0b4c8'
    ctx.fillRect(bX, bY + 20, bW, bH)
    ctx.strokeStyle = '#7a94a8'
    ctx.lineWidth = 1.5
    ctx.strokeRect(bX, bY + 20, bW, bH)

    ctx.fillStyle = '#b0c4d8'
    ctx.fillRect(bX - 8, bY + 12, bW + 16, 12)
    ctx.strokeStyle = '#7a94a8'
    ctx.strokeRect(bX - 8, bY + 12, bW + 16, 12)

    if (prog > 0.15) {
      const innerAlpha = Math.min(1, (prog - 0.15) / 0.5)
      ctx.fillStyle = `rgba(255,250,235,${innerAlpha * 0.9})`
      ctx.fillRect(bX + 4, bY + 24, bW - 8, bH - 8)
      if (prog > 0.6) {
        const sparkle = Math.min(1, (prog - 0.6) / 0.3)
        const sparks = ['*', '+', '◆', '*']
        sparks.forEach((s, i) => {
          const sx = bX + 20 + i * ((bW - 40) / 3)
          const sy = bY + 40 + Math.sin(i * 1.5) * 15
          ctx.globalAlpha = sparkle
          ctx.font = '14px sans-serif'
          ctx.fillText(s, sx, sy)
        })
        ctx.globalAlpha = 1
      }
    }

    ctx.save()
    ctx.translate(bX - 8, bY + 12)
    ctx.rotate((lidAngle * Math.PI) / 180)
    ctx.fillStyle = '#c8dce8'
    ctx.fillRect(0, -(bH * 0.45), bW + 16, bH * 0.45)
    ctx.strokeStyle = '#7a94a8'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0, -(bH * 0.45), bW + 16, bH * 0.45)
    ctx.restore()
  }, [bX, bY, bW, bH])

  const animate = useCallback((ts: number) => {
    if (!startRef.current) startRef.current = ts
    const elapsed = (ts - startRef.current) * speed
    const duration = 1500
    const t = Math.min(elapsed / duration, 1)
    const lidAngle = -110 * t
    setProgress(t)
    drawFrame(lidAngle, t)
    if (t < 1) {
      rafRef.current = requestAnimationFrame(animate)
    } else {
      setPlaying(false)
    }
  }, [speed, drawFrame])

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    startRef.current = 0
    setPlaying(true)
    setProgress(0)
    rafRef.current = requestAnimationFrame(animate)
  }, [animate])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPlaying(false)
  }, [])

  useEffect(() => {
    drawFrame(0, 0)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [drawFrame])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        UNBOXING SIMULATOR
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <button
          onClick={playing ? stop : play}
          style={{
            flex: 1, fontSize: fs.sm, fontWeight: fw.bold, padding: '4px 0', borderRadius: r.md,
            border: 'none', background: playing ? '#e53935' : c.ink, color: c.white, cursor: 'pointer',
          }}
        >
          {playing ? 'Stop' : 'Play'}
        </button>
        {(['0.5', '1', '2'] as const).map(s => (
          <button key={s} onClick={() => setSpeed(Number(s) as 0.5 | 1 | 2)} style={{
            padding: '4px 8px', borderRadius: r.md, fontSize: fs.xs, fontWeight: fw.bold, cursor: 'pointer',
            border: speed === Number(s) ? 'none' : `1px solid ${c.borderLight}`,
            background: speed === Number(s) ? '#5a6bd4' : c.white,
            color: speed === Number(s) ? c.white : c.textMuted,
          }}>{s}×</button>
        ))}
      </div>
      <div style={{ height: 6, background: c.borderXLight, borderRadius: r.pill, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress * 100}%`, background: '#5a6bd4', transition: 'width 0.05s linear', borderRadius: r.pill }} />
      </div>
    </div>
  )
}

function DropTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [dropH, setDropH] = useState(1.2)
  const [boxMass, setBoxMass] = useState(0.5)
  const [angle, setAngle] = useState<0 | 30 | 45>(0)
  const [playing, setPlaying] = useState(false)

  const W = 300
  const H = 250
  const g = 9.81
  const deltaT = 0.01

  const impact = (boxMass * g * dropH) / deltaT
  const impactKN = (impact / 1000).toFixed(2)

  const draw = useCallback((boxY: number, phase: 'fall' | 'impact' | 'rest', impactFrame: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, W, H)

    const groundY = H - 20
    ctx.fillStyle = '#888'
    ctx.fillRect(0, groundY, W, 2)

    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(W / 2, 20)
    ctx.lineTo(W / 2, groundY)
    ctx.stroke()
    ctx.setLineDash([])

    const bW2 = 40
    const bH2 = 50
    const bX = W / 2 - bW2 / 2

    let scaleX = 1
    let scaleY = 1
    if (phase === 'impact' && impactFrame < 4) {
      scaleX = 1.1
      scaleY = 0.9
    }

    ctx.save()
    ctx.translate(W / 2, boxY + bH2 / 2)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.scale(scaleX, scaleY)

    if (phase === 'impact') {
      ctx.fillStyle = 'rgba(255,50,0,0.8)'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('IMPACT', 0, -bH2 / 2 - 14)
    }

    ctx.fillStyle = '#7ab4cc'
    ctx.fillRect(-bW2 / 2, -bH2 / 2, bW2, bH2)
    ctx.strokeStyle = '#4a84ac'
    ctx.lineWidth = 1.5
    ctx.strokeRect(-bW2 / 2, -bH2 / 2, bW2, bH2)
    ctx.restore()

    ctx.fillStyle = '#666'
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`F = ${impactKN} kN`, 8, H - 6)
    ctx.fillText(`h = ${dropH}m  m = ${boxMass}kg  Δt = ${deltaT}s`, 8, 14)
  }, [angle, dropH, boxMass, impactKN])

  const animate = useCallback(() => {
    const groundY = H - 20
    const bH2 = 50
    const startY = 30
    const endY = groundY - bH2
    const fallPx = endY - startY
    const fallDuration = 60
    let frame = 0
    let impactCount = 0

    const loop = () => {
      frame++
      if (frame <= fallDuration) {
        const t = frame / fallDuration
        const y = startY + fallPx * (t * t)
        draw(y, 'fall', 0)
        rafRef.current = requestAnimationFrame(loop)
      } else if (impactCount < 8) {
        draw(endY, 'impact', impactCount)
        impactCount++
        rafRef.current = requestAnimationFrame(loop)
      } else {
        draw(endY, 'rest', 0)
        setPlaying(false)
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [draw])

  const play = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPlaying(true)
    animate()
  }, [animate])

  useEffect(() => {
    draw(30, 'fall', 0)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [draw])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        Drop Test Visualizer (ISTA 2A)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>Hauteur chute (m)</FieldLabel>
          <input type="number" value={dropH} min={0.1} max={3} step={0.1} onChange={e => setDropH(Number(e.target.value))}
            style={{ width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`, borderRadius: r.md, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Masse (kg)</FieldLabel>
          <input type="number" value={boxMass} min={0.1} max={20} step={0.1} onChange={e => setBoxMass(Number(e.target.value))}
            style={{ width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`, borderRadius: r.md, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>
      <FieldLabel>Angle d&apos;impact</FieldLabel>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {([0, 30, 45] as const).map(a => (
          <button key={a} onClick={() => setAngle(a)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
            border: angle === a ? 'none' : `1px solid ${c.borderLight}`,
            background: angle === a ? c.ink : c.white,
            color: angle === a ? c.white : c.textMuted,
          }}>{a === 0 ? 'Plat' : `${a}°`}</button>
        ))}
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <button
        onClick={play}
        disabled={playing}
        style={{
          width: '100%', fontSize: fs.sm, fontWeight: fw.bold, padding: '4px 0', borderRadius: r.md,
          border: 'none', background: c.ink, color: c.white, cursor: playing ? 'wait' : 'pointer', opacity: playing ? 0.6 : 1,
        }}
      >
        {playing ? 'Simulation…' : 'Simuler chute'}
      </button>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginTop: 6 }}>
        Force d&apos;impact F = m×g×h/Δt = <strong>{impactKN} kN</strong>
      </div>
    </div>
  )
}

const TRANSPORT: Record<string, { label: string; grms: number }> = {
  truck:    { label: 'Camion',    grms: 0.52 },
  aircraft: { label: 'Avion',    grms: 1.09 },
  ship:     { label: 'Maritime', grms: 0.37 },
}

function VibrationTab({ params }: { params: BoxParams }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [transport, setTransport] = useState<'truck' | 'aircraft' | 'ship'>('truck')
  const [duration, setDuration] = useState(24)
  const [bct, setBct] = useState(800)
  const [playing, setPlaying] = useState(false)

  const grms = TRANSPORT[transport].grms
  const bctDynamic = bct * 0.65
  const margin = bctDynamic / (bct * 0.3)
  const marginal = margin < 1.5

  const drawPSD = useCallback((phase: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W2 = 300
    const H2 = 150
    ctx.clearRect(0, 0, W2, H2)

    ctx.fillStyle = c.surface
    ctx.fillRect(0, 0, W2, H2)

    ctx.strokeStyle = c.borderXLight
    ctx.lineWidth = 0.5
    for (let i = 0; i < 5; i++) {
      const y = 20 + i * (H2 - 30) / 4
      ctx.beginPath()
      ctx.moveTo(30, y)
      ctx.lineTo(W2 - 10, y)
      ctx.stroke()
    }

    ctx.fillStyle = '#aaa'
    ctx.font = '7px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Hz', W2 / 2, H2 - 4)
    ctx.textAlign = 'right'
    ctx.fillText('G²/Hz', 28, 14)

    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let x = 0; x < W2 - 40; x++) {
      const freq = (x / (W2 - 40)) * 500
      const psd = grms * 0.3 * Math.exp(-((freq - 30) ** 2) / 800)
        + grms * 0.15 * Math.exp(-((freq - 100) ** 2) / 2000)
        + grms * 0.05 * Math.exp(-((freq - 250) ** 2) / 5000)
        + Math.sin(x * 0.2 + phase) * grms * 0.01
      const y = H2 - 20 - psd * 200
      x === 0 ? ctx.moveTo(30 + x, Math.max(15, y)) : ctx.lineTo(30 + x, Math.max(15, y))
    }
    ctx.stroke()

    ctx.fillStyle = c.ink
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`G_RMS = ${grms}G — ${TRANSPORT[transport].label}`, 34, 14)
  }, [grms, transport])

  useEffect(() => {
    drawPSD(0)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [drawPSD])

  const animate = useCallback(() => {
    setPlaying(true)
    let phase = 0
    const loop = () => {
      phase += 0.1
      drawPSD(phase)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [drawPSD])

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setPlaying(false)
    drawPSD(0)
  }

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        Vibration Transit Simulator
      </div>
      <FieldLabel>Mode transport</FieldLabel>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {(Object.keys(TRANSPORT) as Array<'truck' | 'aircraft' | 'ship'>).map(t => (
          <button key={t} onClick={() => setTransport(t)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
            border: transport === t ? 'none' : `1px solid ${c.borderLight}`,
            background: transport === t ? c.ink : c.white,
            color: transport === t ? c.white : c.textMuted,
          }}>{TRANSPORT[t].label}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>Durée (heures)</FieldLabel>
          <input type="number" value={duration} min={1} max={720} onChange={e => setDuration(Number(e.target.value))}
            style={{ width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`, borderRadius: r.md, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>BCT statique (N)</FieldLabel>
          <input type="number" value={bct} min={100} max={5000} onChange={e => setBct(Number(e.target.value))}
            style={{ width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`, borderRadius: r.md, fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
      </div>
      <canvas ref={canvasRef} width={300} height={150} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button onClick={playing ? stop : animate} style={{
          flex: 1, fontSize: fs.sm, fontWeight: fw.bold, padding: '4px 0', borderRadius: r.md,
          border: 'none', background: playing ? '#e53935' : c.ink, color: c.white, cursor: 'pointer',
        }}>{playing ? 'Stop' : 'Animer PSD'}</button>
      </div>
      <div style={{
        fontSize: fs.xs, padding: '6px 8px', borderRadius: r.md,
        background: marginal ? 'rgba(230,92,0,0.07)' : 'rgba(0,180,0,0.07)',
        border: `1px solid ${marginal ? 'rgba(230,92,0,0.3)' : 'rgba(0,180,0,0.3)'}`,
        color: marginal ? '#e65c00' : '#1a7a1a',
      }}>
        BCT dynamique = {bctDynamic.toFixed(0)} N (×0.65)<br />
        {marginal ? '⚠ Marge insuffisante — risque affaissement' : '✓ Résistance vibratoire suffisante'}
      </div>
    </div>
  )
}

function AgingTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [aging, setAging] = useState(50)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W2 = 300
    const H2 = 200
    ctx.clearRect(0, 0, W2, H2)

    const src = imageLayers[0]?.src
    const render = (bg?: HTMLImageElement) => {
      if (bg) {
        ctx.drawImage(bg, 0, 0, W2, H2)
      } else {
        const grad = ctx.createLinearGradient(0, 0, W2, H2)
        grad.addColorStop(0, '#f5f0e8')
        grad.addColorStop(1, '#e8dfc8')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W2, H2)
        ctx.fillStyle = '#ccc'
        ctx.fillRect(30, 30, W2 - 60, H2 - 60)
        ctx.strokeStyle = '#bbb'
        ctx.strokeRect(30, 30, W2 - 60, H2 - 60)
        ctx.fillStyle = '#aaa'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Packaging', W2 / 2, H2 / 2)
      }

      const ageFactor = aging / 100
      const imageData = ctx.getImageData(0, 0, W2, H2)
      const d = imageData.data
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, d[i] + 30 * ageFactor)
        d[i + 1] = Math.min(255, d[i + 1] + 10 * ageFactor)
        d[i + 2] = Math.max(0, d[i + 2] - 20 * ageFactor)
        const noise = (Math.random() - 0.5) * 30 * ageFactor
        d[i] = Math.min(255, Math.max(0, d[i] + noise))
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + noise * 0.8))
      }
      ctx.putImageData(imageData, 0, 0)

      if (ageFactor > 0.2) {
        const edgeAlpha = ageFactor * 0.6
        const edgeGrad = ctx.createRadialGradient(W2 / 2, H2 / 2, W2 * 0.3, W2 / 2, H2 / 2, W2 * 0.7)
        edgeGrad.addColorStop(0, 'rgba(0,0,0,0)')
        edgeGrad.addColorStop(1, `rgba(60,40,10,${edgeAlpha})`)
        ctx.fillStyle = edgeGrad
        ctx.fillRect(0, 0, W2, H2)
      }

      const yearsText = aging < 20 ? '< 1 an' : aging < 50 ? '~2 ans' : aging < 80 ? '~5 ans' : '10+ ans'
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`Après ${yearsText} en entrepôt`, W2 / 2, H2 - 8)
    }

    if (src) {
      const img = new Image()
      img.onload = () => render(img)
      img.src = src
    } else {
      render()
    }
  }, [aging, imageLayers])

  useEffect(() => { draw() }, [draw])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        Aging Simulation
      </div>
      <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <div>
        <FieldLabel>Vieillissement: {aging}%</FieldLabel>
        <input type="range" min={0} max={100} step={1} value={aging} onChange={e => setAging(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#8b5e2a', height: 3 }} />
      </div>
    </div>
  )
}

type WeatherType = 'rain' | 'sun' | 'frost'
const MATERIALS: Record<string, string> = {
  kraft: 'Kraft papier: dégradation ~3 mois extérieur',
  pe: 'PE polyéthylène: ~2 ans extérieur',
  aluminum: 'Aluminium: 5+ ans extérieur',
}

function WeatheringTab({ imageLayers }: { imageLayers: ImageLayer[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [weatherType, setWeatherType] = useState<WeatherType>('rain')
  const [intensity, setIntensity] = useState(50)
  const [material, setMaterial] = useState('kraft')

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W2 = 300
    const H2 = 200
    ctx.clearRect(0, 0, W2, H2)

    const src = imageLayers[0]?.src
    const render = (bg?: HTMLImageElement) => {
      if (bg) {
        ctx.drawImage(bg, 0, 0, W2, H2)
      } else {
        ctx.fillStyle = '#e8e0d0'
        ctx.fillRect(0, 0, W2, H2)
        ctx.fillStyle = '#ccc'
        ctx.fillRect(40, 30, W2 - 80, H2 - 60)
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('Packaging', W2 / 2, H2 / 2)
      }

      const factor = intensity / 100

      if (weatherType === 'rain') {
        ctx.strokeStyle = `rgba(100,150,255,${factor * 0.6})`
        ctx.lineWidth = 1
        for (let i = 0; i < 60 * factor; i++) {
          const rx = Math.random() * W2
          const ry = Math.random() * H2
          ctx.beginPath()
          ctx.moveTo(rx, ry)
          ctx.lineTo(rx - 4, ry + 10)
          ctx.stroke()
        }
        ctx.fillStyle = `rgba(80,130,255,${factor * 0.12})`
        ctx.fillRect(0, 0, W2, H2)
      } else if (weatherType === 'sun') {
        const imageData = ctx.getImageData(0, 0, W2, H2)
        const d = imageData.data
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, d[i] + 40 * factor)
          d[i + 1] = Math.min(255, d[i + 1] + 35 * factor)
          d[i + 2] = Math.min(255, d[i + 2] + 20 * factor)
          const blend = 1 - factor * 0.4
          d[i] = Math.min(255, 128 + (d[i] - 128) * blend)
          d[i + 1] = Math.min(255, 128 + (d[i + 1] - 128) * blend)
          d[i + 2] = Math.min(255, 128 + (d[i + 2] - 128) * blend)
        }
        ctx.putImageData(imageData, 0, 0)
      } else if (weatherType === 'frost') {
        const frostGrad = ctx.createLinearGradient(0, 0, 0, H2)
        frostGrad.addColorStop(0, `rgba(200,230,255,${factor * 0.5})`)
        frostGrad.addColorStop(1, `rgba(255,255,255,${factor * 0.3})`)
        ctx.fillStyle = frostGrad
        ctx.fillRect(0, 0, W2, H2)
        ctx.fillStyle = `rgba(220,240,255,${factor * 0.7})`
        for (let i = 0; i < 80 * factor; i++) {
          const fx = Math.random() * W2
          const fy = Math.random() * H2
          const fs2 = 1 + Math.random() * 3
          ctx.beginPath()
          ctx.arc(fx, fy, fs2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    if (src) {
      const img = new Image()
      img.onload = () => render(img)
      img.src = src
    } else {
      render()
    }
  }, [weatherType, intensity, imageLayers])

  useEffect(() => { draw() }, [draw])

  const monthsCalc = weatherType === 'rain' ? Math.round(12 * (1 - intensity / 100)) + 1 : weatherType === 'sun' ? Math.round(24 * (1 - intensity / 100)) + 1 : Math.round(6 * (1 - intensity / 100)) + 1

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        Weathering Simulator
      </div>
      <FieldLabel>Type d&apos;intempérie</FieldLabel>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {([['rain', 'Pluie'], ['sun', 'Soleil'], ['frost', 'Givre']] as [WeatherType, string][]).map(([wt, label]) => (
          <button key={wt} onClick={() => setWeatherType(wt)} style={{
            padding: '3px 8px', borderRadius: 20, fontSize: 9, fontWeight: 600, cursor: 'pointer',
            border: weatherType === wt ? 'none' : `1px solid ${c.borderLight}`,
            background: weatherType === wt ? c.ink : c.white,
            color: weatherType === wt ? c.white : c.textMuted,
          }}>{label}</button>
        ))}
      </div>
      <FieldLabel>Matériau</FieldLabel>
      <select value={material} onChange={e => setMaterial(e.target.value)}
        style={{ width: '100%', fontSize: fs.md, padding: '3px 6px', border: `1px solid ${c.borderLight}`, borderRadius: r.md, fontFamily: 'inherit', marginBottom: 8 }}>
        <option value="kraft">Kraft papier</option>
        <option value="pe">PE polyéthylène</option>
        <option value="aluminum">Aluminium</option>
      </select>
      <canvas ref={canvasRef} width={300} height={200} style={{ width: '100%', borderRadius: r.lg, border: `1px solid ${c.borderXLight}`, display: 'block', marginBottom: 8 }} />
      <div>
        <FieldLabel>Intensité: {intensity}%</FieldLabel>
        <input type="range" min={0} max={100} step={1} value={intensity} onChange={e => setIntensity(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#4488ff', height: 3, marginBottom: 8 }} />
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted }}>
        {MATERIALS[material]}<br />
        Dégradation estimée: <strong>{monthsCalc} mois</strong> à cette intensité
      </div>
    </div>
  )
}

function ASMRTab() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const [active, setActive] = useState(false)
  const [status, setStatus] = useState('Cliquez pour activer le son')

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      analyserRef.current = audioCtxRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.connect(audioCtxRef.current.destination)
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    setActive(true)
    setStatus('Son activé — jouez les effets')
  }, [])

  const drawOscilloscope = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W2 = 280
    const H2 = 80
    ctx.clearRect(0, 0, W2, H2)
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, W2, H2)

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteTimeDomainData(dataArray)

    ctx.strokeStyle = '#00ff88'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    const sliceWidth = W2 / bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0
      const y = (v * H2) / 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      x += sliceWidth
    }
    ctx.stroke()
    rafRef.current = requestAnimationFrame(drawOscilloscope)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#111'
    ctx.fillRect(0, 0, 280, 80)
    ctx.strokeStyle = '#00ff8844'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 40)
    ctx.lineTo(280, 40)
    ctx.stroke()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const playCrinkle = useCallback(() => {
    ensureCtx()
    const ctx = audioCtxRef.current
    if (!ctx || !analyserRef.current) return
    const bufSize = ctx.sampleRate * 0.3
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3))
    }
    const src = ctx.createBufferSource()
    src.buffer = buf
    const biquad = ctx.createBiquadFilter()
    biquad.type = 'bandpass'
    biquad.frequency.value = 800
    biquad.Q.value = 0.5
    const gain = ctx.createGain()
    gain.gain.value = 0.6
    src.connect(biquad)
    biquad.connect(gain)
    gain.connect(analyserRef.current)
    src.start()
    drawOscilloscope()
  }, [ensureCtx, drawOscilloscope])

  const playTape = useCallback(() => {
    ensureCtx()
    const ctx = audioCtxRef.current
    if (!ctx || !analyserRef.current) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(analyserRef.current)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    drawOscilloscope()
  }, [ensureCtx, drawOscilloscope])

  const playBubble = useCallback(() => {
    ensureCtx()
    const ctx = audioCtxRef.current
    if (!ctx || !analyserRef.current) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1000
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(analyserRef.current)
    osc.start()
    osc.stop(ctx.currentTime + 0.05)
    drawOscilloscope()
  }, [ensureCtx, drawOscilloscope])

  return (
    <div>
      <div style={{ fontSize: fs.xs, color: '#5a6bd4', marginBottom: 10, padding: '4px 8px', background: 'rgba(90,107,212,0.06)', borderRadius: 6 }}>
        Unboxing ASMR Mode
      </div>
      <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 10, textAlign: 'center' }}>
        {status}
      </div>
      <canvas ref={canvasRef} width={280} height={80} style={{ width: '100%', borderRadius: r.md, display: 'block', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Carton', action: playCrinkle, color: '#8b5e2a' },
          { label: 'Scotch', action: playTape, color: '#4488ff' },
          { label: 'Bulles', action: playBubble, color: '#e91e8c' },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            style={{
              flex: 1, fontSize: fs.sm, fontWeight: fw.bold, padding: '6px 0', borderRadius: r.md,
              border: 'none', background: btn.color, color: c.white, cursor: 'pointer',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {!active && (
        <button
          onClick={ensureCtx}
          style={{
            marginTop: 8, width: '100%', fontSize: fs.sm, fontWeight: fw.bold, padding: '5px 0', borderRadius: r.md,
            border: `1px solid ${c.borderLight}`, background: c.surface, cursor: 'pointer', color: c.textMuted,
          }}
        >
          Activer le son
        </button>
      )}
    </div>
  )
}

export function PremiumFXSection({ params, imageLayers }: { params: BoxParams; imageLayers: ImageLayer[] }) {
  const [tab, setTab] = useState<Tab>('unboxing')
  return (
    <CollapsibleSection label="Premium FX & Simulation">
      <TabPills active={tab} onChange={setTab} />
      {tab === 'unboxing'   && <UnboxingTab params={params} />}
      {tab === 'drop'       && <DropTab params={params} />}
      {tab === 'vibration'  && <VibrationTab params={params} />}
      {tab === 'aging'      && <AgingTab imageLayers={imageLayers} />}
      {tab === 'weathering' && <WeatheringTab imageLayers={imageLayers} />}
      {tab === 'asmr'       && <ASMRTab />}
    </CollapsibleSection>
  )
}
