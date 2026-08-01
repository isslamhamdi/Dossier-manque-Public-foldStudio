'use client'

import { useRef, useState } from 'react'
import * as d3 from 'd3'
import type { ImageLayer } from '@/lib/types'
import { CollapsibleSection, FieldLabel } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

interface InkCoverageSectionProps {
  imageLayers: ImageLayer[]
  patronWidth: number
  patronHeight: number
}

interface Stats {
  totalPct: number
  tacWarning: boolean
  zones: { label: string; pct: number }[]
}

const CANVAS_W = 200

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function computeHeatmap(
  imageLayers: ImageLayer[],
  patronWidth: number,
  patronHeight: number,
  outCanvas: HTMLCanvasElement
) {
  const canvasH = Math.round(CANVAS_W * (patronHeight / patronWidth))
  outCanvas.width = CANVAS_W
  outCanvas.height = canvasH

  const ctx = outCanvas.getContext('2d')!
  ctx.clearRect(0, 0, CANVAS_W, canvasH)

  const mmToPx = CANVAS_W / patronWidth

  const visible = imageLayers.filter(l => l.visible)
  for (const layer of visible) {
    try {
      const img = await loadImage(layer.src)
      const lx = layer.x * mmToPx
      const ly = layer.y * mmToPx
      const lw = layer.width * layer.scale * mmToPx
      const lh = layer.height * layer.scale * mmToPx
      ctx.save()
      ctx.globalAlpha = layer.opacity ?? 1
      ctx.drawImage(img, lx, ly, lw, lh)
      ctx.restore()
    } catch {
      // skip unloadable layer
    }
  }

  const imageData = ctx.getImageData(0, 0, CANVAS_W, canvasH)
  const data = imageData.data

  const colorScale = d3.scaleLinear<string>()
    .domain([0, 0.5, 1])
    .range(['#00ff00', '#ffff00', '#ff0000'])

  const heatData = ctx.createImageData(CANVAS_W, canvasH)
  const hd = heatData.data

  let totalDensity = 0
  const zoneSize = Math.ceil(canvasH / 3)
  const zoneDensity = [0, 0, 0]
  const zoneCount = [0, 0, 0]

  for (let i = 0; i < CANVAS_W * canvasH; i++) {
    const ri = data[i * 4]
    const gi = data[i * 4 + 1]
    const bi = data[i * 4 + 2]

    const density = ((255 - ri) + (255 - gi) + (255 - bi)) / (3 * 255)

    totalDensity += density

    const row = Math.floor(i / CANVAS_W)
    const zoneIdx = Math.min(2, Math.floor(row / zoneSize))
    zoneDensity[zoneIdx] += density
    zoneCount[zoneIdx] += 1

    const hex = colorScale(density)
    const parsed = d3.color(hex)!.rgb()
    hd[i * 4]     = parsed.r
    hd[i * 4 + 1] = parsed.g
    hd[i * 4 + 2] = parsed.b
    hd[i * 4 + 3] = 200
  }

  ctx.putImageData(heatData, 0, 0)

  const pixelCount = CANVAS_W * canvasH
  const totalPct = (totalDensity / pixelCount) * 100

  const tacEstimate = totalPct * 4
  const tacWarning = tacEstimate > 300

  const zoneLabels = ['Haut', 'Milieu', 'Bas']
  const zones = [0, 1, 2].map(idx => ({
    label: zoneLabels[idx],
    pct: zoneCount[idx] > 0 ? (zoneDensity[idx] / zoneCount[idx]) * 100 : 0,
  }))

  return { totalPct, tacWarning, zones } as Stats
}

export function InkCoverageSection({ imageLayers, patronWidth, patronHeight }: InkCoverageSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [hasResult, setHasResult] = useState(false)

  const handleCompute = async () => {
    if (!canvasRef.current) return
    setLoading(true)
    setStats(null)
    try {
      const result = await computeHeatmap(imageLayers, patronWidth, patronHeight, canvasRef.current)
      setStats(result)
      setHasResult(true)
    } finally {
      setLoading(false)
    }
  }

  const canvasH = patronWidth > 0
    ? Math.round(CANVAS_W * (patronHeight / patronWidth))
    : CANVAS_W

  return (
    <CollapsibleSection label="Couverture Encre">
      {imageLayers.length === 0 ? (
        <div style={{ fontSize: fs.sm, color: c.textMuted, padding: '8px 0', textAlign: 'center' }}>
          Aucun calque image disponible
        </div>
      ) : (
        <>
          <button
            onClick={handleCompute}
            disabled={loading}
            className="fs-btn-primary"
            style={{
              width: '100%',
              background: loading ? '#999' : c.ink,
              color: c.white,
              border: 'none',
              borderRadius: r.lg,
              padding: '8px 0',
              fontSize: fs.md,
              fontWeight: fw.bold,
              cursor: loading ? 'default' : 'pointer',
              marginBottom: 10,
            }}
          >
            {loading ? 'Calcul en cours...' : 'Calculer heatmap'}
          </button>

          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={canvasH}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: r.md,
              border: `1px solid ${c.borderLight}`,
              display: hasResult ? 'block' : 'none',
              marginBottom: 10,
            }}
          />

          {!hasResult && !loading && (
            <div style={{
              width: '100%',
              height: 80,
              background: c.surface,
              borderRadius: r.md,
              border: `1px solid ${c.borderLight}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}>
              <span style={{ fontSize: fs.sm, color: c.textMuted }}>Cliquer pour générer</span>
            </div>
          )}

          {stats && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: c.surface,
                border: `1px solid ${c.borderSep}`,
                borderRadius: r.lg,
                padding: '7px 10px',
              }}>
                <FieldLabel>Couverture totale</FieldLabel>
                <span style={{ fontSize: fs.lg, fontWeight: fw.heavy, color: c.ink }}>
                  {stats.totalPct.toFixed(1)}%
                </span>
              </div>

              {stats.tacWarning && (
                <div style={{
                  background: '#fff8e1',
                  border: '1px solid #f57c0030',
                  borderRadius: r.md,
                  padding: '6px 9px',
                  fontSize: fs.sm,
                  color: '#f57c00',
                  fontWeight: fw.bold,
                }}>
                  ⚠ TAC estimé &gt; 300% — risque de maculation
                </div>
              )}

              <div>
                <FieldLabel>Répartition par zone</FieldLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {stats.zones.map(zone => (
                    <div key={zone.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: fs.xs, color: c.textMed }}>{zone.label}</span>
                        <span style={{ fontSize: fs.xs, color: c.textMed, fontWeight: fw.bold }}>
                          {zone.pct.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ height: 5, background: c.borderLight, borderRadius: r.pill, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min(100, zone.pct)}%`,
                          background: zone.pct > 70 ? '#e53935' : zone.pct > 40 ? '#f57c00' : '#388e3c',
                          borderRadius: r.pill,
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </CollapsibleSection>
  )
}
