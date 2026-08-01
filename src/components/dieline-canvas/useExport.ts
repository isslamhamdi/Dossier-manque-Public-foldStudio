'use client'

import { useRef, useState, useEffect } from 'react'
import type { DielineData } from '@/lib/dieline'
import type { ImageLayer, LayerVisibility, BoxParams } from '@/lib/types'
import { MM_TO_PX } from './constants'
import { downloadDxf } from '@/lib/export/dxf'
import { downloadPrintReadyPdf } from '@/lib/export/pdf'

interface Options {
  dieline: DielineData
  imageLayers: ImageLayer[]
  layers: LayerVisibility
  params: BoxParams
}

export function useExport({ dieline, imageLayers, layers, params }: Options) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  function handleDownloadSVG() {
    if (!svgRef.current) return
    const svgStr = new XMLSerializer().serializeToString(svgRef.current)
    const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'fold-studio-dieline.svg'; a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  function handleDownloadPDF() {
    if (!svgRef.current) return
    const svgStr = new XMLSerializer().serializeToString(svgRef.current)
    const w = dieline.svgWidth / MM_TO_PX
    const h = dieline.svgHeight / MM_TO_PX
    const html = `<!DOCTYPE html><html><head><style>@page{size:${w}mm ${h}mm;margin:0}body{margin:0;padding:0}</style></head><body>${svgStr}</body></html>`
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    const win = window.open(url)
    if (win) setTimeout(() => { win.print(); URL.revokeObjectURL(url) }, 800)
    setShowExportMenu(false)
  }

  function handleDownloadDxf() {
    downloadDxf(dieline)
    setShowExportMenu(false)
  }

  async function handleDownloadPrintPdf() {
    await downloadPrintReadyPdf(dieline, imageLayers)
    setShowExportMenu(false)
  }

  function handleDownloadFold() {
    const foldData = {
      version: '0.3', file_spec: 1.2, file_author: 'Fold Studio', file_title: 'Fold Studio Dieline',
      vertices_coords: dieline.panels.flatMap(p => [
        [p.x / MM_TO_PX, p.y / MM_TO_PX],
        [(p.x + p.w) / MM_TO_PX, p.y / MM_TO_PX],
        [(p.x + p.w) / MM_TO_PX, (p.y + p.h) / MM_TO_PX],
        [p.x / MM_TO_PX, (p.y + p.h) / MM_TO_PX],
      ]),
      faces_vertices: dieline.panels.map((_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3]),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(foldData, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'fold-studio-dieline.fold'; a.click()
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  function handleDownloadPNG() {
    if (!svgRef.current) return
    const DPI = 300
    const pxPerMm = DPI / 25.4
    const w = Math.round(dieline.svgWidth / MM_TO_PX * pxPerMm)
    const h = Math.round(dieline.svgHeight / MM_TO_PX * pxPerMm)

    const cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${dieline.svgWidth} ${dieline.svgHeight}">
      <rect width="${dieline.svgWidth}" height="${dieline.svgHeight}" fill="white"/>
      ${dieline.foldLines.map(p => `<path d="${p}" stroke="#4488ff" stroke-width="0.5" stroke-dasharray="3 2" fill="none"/>`).join('')}
      <path d="${dieline.cutPath}" stroke="#e91e8c" stroke-width="0.8" fill="none"/>
      ${imageLayers.filter(l => l.visible).map(layer => {
        const xPx = layer.x * MM_TO_PX, yPx = layer.y * MM_TO_PX
        const wPx = layer.width * layer.scale * MM_TO_PX, hPx = layer.height * layer.scale * MM_TO_PX
        const cxPx = xPx + wPx / 2, cyPx = yPx + hPx / 2
        return `<image href="${layer.src}" x="${xPx}" y="${yPx}" width="${wPx}" height="${hPx}" opacity="${layer.opacity ?? 1}" transform="rotate(${layer.rotation},${cxPx},${cyPx})" preserveAspectRatio="xMidYMid meet"/>`
      }).join('')}
    </svg>`

    const img = new Image()
    const url = URL.createObjectURL(new Blob([cleanSvg], { type: 'image/svg+xml' }))
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = 'fold-studio-dieline-300dpi.png'; a.click()
        URL.revokeObjectURL(a.href)
      }, 'image/png')
    }
    img.src = url
    setShowExportMenu(false)
  }

  // fold-studio:export event dispatcher
  useEffect(() => {
    const handler = (e: Event) => {
      const fmt = (e as CustomEvent).detail?.format as string
      if (fmt === 'SVG') handleDownloadSVG()
      else if (fmt === 'PDF') handleDownloadPDF()
      else if (fmt === 'PRINT_PDF') handleDownloadPrintPdf()
      else if (fmt === 'PNG') handleDownloadPNG()
      else if (fmt === 'DXF') handleDownloadDxf()
      else if (fmt === 'FOLD') handleDownloadFold()
    }
    window.addEventListener('fold-studio:export', handler)
    return () => window.removeEventListener('fold-studio:export', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { svgRef, showExportMenu, setShowExportMenu, handleDownloadSVG, handleDownloadPDF, handleDownloadFold, handleDownloadPNG, handleDownloadDxf, handleDownloadPrintPdf }
}
