'use client'

import { useState } from 'react'

export type VideoFormat = 'webm' | 'mp4_ffmpeg'

export interface VideoExportOptions {
  durationMs?: number   // total animation duration in ms (default 2500)
  fps?: number          // capture fps for stream (default 30)
  direction?: 'open' | 'close' | 'open-close'
}

export function useVideoExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStage, setExportStage] = useState('')

  async function startExport(
    setFoldProgress: (v: number) => void,
    { durationMs = 2500, fps = 30, direction = 'open-close' }: VideoExportOptions = {}
  ) {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) { console.warn('[VideoExport] No canvas found'); return }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4'

    setIsExporting(true)
    setExportProgress(0)
    setExportStage('Préparation…')

    try {
      const stream = canvas.captureStream(fps)
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 })
      const chunks: BlobPart[] = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }

      // Build keyframes: progress values over time
      const keyframes = buildKeyframes(direction)

      recorder.start(100) // collect data every 100ms

      const startTime = performance.now()
      const totalDuration = direction === 'open-close' ? durationMs * 2 : durationMs

      await new Promise<void>(resolve => {
        function tick() {
          const elapsed = performance.now() - startTime
          const t = Math.min(elapsed / totalDuration, 1)
          setExportProgress(Math.round(t * 90))
          setExportStage(`Enregistrement… ${Math.round(t * 100)}%`)

          // Interpolate keyframes
          const progress = interpolateKeyframes(keyframes, t)
          setFoldProgress(progress)

          if (t < 1) {
            requestAnimationFrame(tick)
          } else {
            setFoldProgress(keyframes[keyframes.length - 1].value)
            resolve()
          }
        }
        requestAnimationFrame(tick)
      })

      setExportStage('Finalisation…')
      setExportProgress(95)

      recorder.stop()

      await new Promise<void>(resolve => { recorder.onstop = () => resolve() })

      const ext = mimeType.startsWith('video/mp4') ? 'mp4' : 'webm'
      const blob = new Blob(chunks, { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fold-studio-animation.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      setExportProgress(100)

    } catch (err) {
      console.error('[VideoExport] error:', err)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
        setExportStage('')
      }, 600)
    }
  }

  return { isExporting, exportProgress, exportStage, startExport }
}

// Keyframe animation curves
function buildKeyframes(direction: 'open' | 'close' | 'open-close') {
  if (direction === 'open') {
    return [
      { t: 0, value: 0 },
      { t: 0.15, value: 0.05 },
      { t: 0.85, value: 0.95 },
      { t: 1, value: 1 },
    ]
  }
  if (direction === 'close') {
    return [
      { t: 0, value: 1 },
      { t: 0.15, value: 0.95 },
      { t: 0.85, value: 0.05 },
      { t: 1, value: 0 },
    ]
  }
  // open-close: 0 → 1 → 0 with ease in/out
  return [
    { t: 0,    value: 0 },
    { t: 0.08, value: 0.02 },
    { t: 0.42, value: 0.98 },
    { t: 0.5,  value: 1 },
    { t: 0.58, value: 0.98 },
    { t: 0.92, value: 0.02 },
    { t: 1,    value: 0 },
  ]
}

function interpolateKeyframes(kf: { t: number; value: number }[], t: number): number {
  if (t <= kf[0].t) return kf[0].value
  if (t >= kf[kf.length - 1].t) return kf[kf.length - 1].value
  for (let i = 0; i < kf.length - 1; i++) {
    if (t >= kf[i].t && t <= kf[i + 1].t) {
      const alpha = (t - kf[i].t) / (kf[i + 1].t - kf[i].t)
      const ease = alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2
      return kf[i].value + ease * (kf[i + 1].value - kf[i].value)
    }
  }
  return kf[kf.length - 1].value
}
