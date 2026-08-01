'use client'

import { useCallback, useRef, useState } from 'react'
import * as THREE from 'three'

// Camera positions for each angle (spherical: radius, phi, theta in degrees)
const ANGLES = [
  { name: 'Front',    pos: [0, 0.8, 3.8]    as [number, number, number] },
  { name: 'Back',     pos: [0, 0.8, -3.8]   as [number, number, number] },
  { name: 'Left',     pos: [-3.8, 0.8, 0]   as [number, number, number] },
  { name: 'Right',    pos: [3.8, 0.8, 0]    as [number, number, number] },
  { name: 'Top',      pos: [0, 4.5, 0.001]  as [number, number, number] },
  { name: 'Iso',      pos: [3.2, 2.4, 3.8]  as [number, number, number] },
]

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

export function useMultiAngleExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const exportAllAngles = useCallback(async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas || isExporting) return
    setIsExporting(true)
    setProgress(0)

    const captures: { name: string; dataUrl: string }[] = []

    for (let i = 0; i < ANGLES.length; i++) {
      const { name, pos } = ANGLES[i]
      // Move camera
      window.dispatchEvent(new CustomEvent('fold-studio:set-camera', { detail: { pos } }))
      await delay(180)
      // Capture
      const dataUrl = canvas.toDataURL('image/png')
      captures.push({ name, dataUrl })
      setProgress(Math.round(((i + 1) / ANGLES.length) * 100))
    }

    // Restore default camera
    window.dispatchEvent(new CustomEvent('fold-studio:set-camera', { detail: { pos: ANGLES[5].pos } }))

    // Build contact sheet: 3 columns × 2 rows
    const cols = 3, rows = 2
    const thumbW = canvas.width, thumbH = canvas.height
    const sheetW = thumbW * cols, sheetH = thumbH * rows

    const sheet = document.createElement('canvas')
    sheet.width = sheetW; sheet.height = sheetH
    const ctx = sheet.getContext('2d')!
    ctx.fillStyle = '#f5f3ef'
    ctx.fillRect(0, 0, sheetW, sheetH)

    await Promise.all(captures.map(({ name, dataUrl }, i) => {
      return new Promise<void>(resolve => {
        const img = new Image()
        img.onload = () => {
          const col = i % cols, row = Math.floor(i / cols)
          const x = col * thumbW, y = row * thumbH
          ctx.drawImage(img, x, y, thumbW, thumbH)
          // Label
          ctx.fillStyle = 'rgba(0,0,0,0.5)'
          ctx.fillRect(x + 8, y + thumbH - 28, 64, 20)
          ctx.fillStyle = '#fff'
          ctx.font = `bold ${thumbH * 0.035}px system-ui`
          ctx.fillText(name, x + 14, y + thumbH - 13)
          resolve()
        }
        img.src = dataUrl
      })
    }))

    const a = document.createElement('a')
    a.href = sheet.toDataURL('image/png')
    a.download = `fold-studio-angles-${Date.now()}.png`
    a.click()

    setIsExporting(false)
    setProgress(0)
  }, [isExporting])

  return { exportAllAngles, isExporting, progress }
}
