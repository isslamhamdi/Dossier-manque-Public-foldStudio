// Print-ready PDF export for Fold Studio dielines using pdf-lib.
// Generates: crop marks, bleed zone, registration marks, fold/cut layers.
import { PDFDocument, rgb, PDFPage } from 'pdf-lib'
import type { DielineData } from '@/lib/dieline'
import type { ImageLayer } from '@/lib/types'

const MM_TO_PX = 3.7795275591
const PT_PER_MM = 2.834645669   // 1mm = 2.8346pt (PDF uses points)

// SVG path "M x,y L x,y Z" → array of pdf-lib points [{x,y}]
function svgPathToSegments(d: string, scale: number): Array<Array<{x: number; y: number}>> {
  const segments: Array<Array<{x: number; y: number}>> = []
  let current: Array<{x: number; y: number}> = []
  const tokens = d.trim().replace(/([MLZz])/g, ' $1 ').split(/[\s,]+/).filter(Boolean)
  let i = 0
  while (i < tokens.length) {
    const cmd = tokens[i]
    if (cmd === 'M' || cmd === 'm') {
      if (current.length > 0) segments.push(current)
      current = []
      i++
      current.push({ x: parseFloat(tokens[i++]) * scale, y: parseFloat(tokens[i++]) * scale })
    } else if (cmd === 'L' || cmd === 'l') {
      i++
      current.push({ x: parseFloat(tokens[i++]) * scale, y: parseFloat(tokens[i++]) * scale })
    } else if (cmd === 'Z' || cmd === 'z') {
      if (current.length > 0) { current.push({ ...current[0] }); segments.push(current); current = [] }
      i++
    } else {
      const x = parseFloat(cmd)
      if (!isNaN(x)) { i++; current.push({ x: x * scale, y: parseFloat(tokens[i++]) * scale }) }
      else i++
    }
  }
  if (current.length > 1) segments.push(current)
  return segments
}

function drawPathOnPage(page: PDFPage, d: string, scalePerPx: number, pageH: number, color: [number,number,number], dashArray?: number[], lineWidth = 0.5) {
  const segs = svgPathToSegments(d, scalePerPx)
  const { drawLine } = page.doc as any  // avoid typing issues
  for (const seg of segs) {
    for (let i = 0; i < seg.length - 1; i++) {
      const x1 = seg[i].x, y1 = pageH - seg[i].y
      const x2 = seg[i+1].x, y2 = pageH - seg[i+1].y
      page.drawLine({
        start: { x: x1, y: y1 }, end: { x: x2, y: y2 },
        thickness: lineWidth,
        color: rgb(color[0], color[1], color[2]),
        dashArray: dashArray,
        dashPhase: 0,
      })
    }
  }
}

// Crop mark: small line outside the trim box
function drawCropMark(page: PDFPage, x: number, y: number, dx: number, dy: number, pageH: number) {
  const len = 5 * PT_PER_MM
  const gap = 3 * PT_PER_MM
  page.drawLine({
    start: { x: x + dx * gap, y: pageH - y + dy * gap },
    end:   { x: x + dx * (gap + len), y: pageH - y + dy * (gap + len) },
    thickness: 0.25,
    color: rgb(0, 0, 0),
  })
}

// Registration mark (crosshair + circle)
function drawRegMark(page: PDFPage, cx: number, cy: number, pageH: number) {
  const r = 3 * PT_PER_MM
  const pcy = pageH - cy
  page.drawCircle({ x: cx, y: pcy, size: r, borderColor: rgb(0,0,0), borderWidth: 0.25, color: undefined })
  page.drawLine({ start: { x: cx - r*1.5, y: pcy }, end: { x: cx + r*1.5, y: pcy }, thickness: 0.25, color: rgb(0,0,0) })
  page.drawLine({ start: { x: cx, y: pcy - r*1.5 }, end: { x: cx, y: pcy + r*1.5 }, thickness: 0.25, color: rgb(0,0,0) })
}

export async function dielineToPrintReadyPdf(
  dieline: DielineData,
  imageLayers: ImageLayer[] = [],
  options: { includeArtwork?: boolean } = {}
): Promise<Uint8Array> {
  const bleedMm = 3    // 3mm bleed margin outside crop marks
  const markZone = (5 + 3 + 3) * PT_PER_MM   // gap + mark + padding

  const dielineW_mm = dieline.svgWidth  / MM_TO_PX
  const dielineH_mm = dieline.svgHeight / MM_TO_PX

  // Page = dieline + bleed + mark zone on each side
  const pageW_pt = (dielineW_mm + 2 * bleedMm) * PT_PER_MM + 2 * markZone
  const pageH_pt = (dielineH_mm + 2 * bleedMm) * PT_PER_MM + 2 * markZone

  // Offset of the trim box (dieline origin) in page coords
  const originX = markZone + bleedMm * PT_PER_MM
  const originY = markZone + bleedMm * PT_PER_MM

  const pdfDoc = await PDFDocument.create()
  pdfDoc.setTitle('Fold Studio — Patron Print-Ready')
  pdfDoc.setAuthor('Fold Studio')
  pdfDoc.setCreator('Fold Studio (pdf-lib)')

  const page = pdfDoc.addPage([pageW_pt, pageH_pt])

  // White background
  page.drawRectangle({ x: 0, y: 0, width: pageW_pt, height: pageH_pt, color: rgb(1,1,1) })

  // Scale: 1 SVG px → pt
  const scale = PT_PER_MM / MM_TO_PX   // (pt/mm) / (px/mm) = pt/px
  const pH = pageH_pt  // convenience

  // Helper: draw any path with offset applied
  const drawDieline = (d: string, color: [number,number,number], dash?: number[], lw = 0.5) => {
    // Translate each point by (originX, originY)
    const segs = svgPathToSegments(d, scale)
    for (const seg of segs) {
      for (let i = 0; i < seg.length - 1; i++) {
        const x1 = seg[i].x + originX, y1 = pH - (seg[i].y + originY)
        const x2 = seg[i+1].x + originX, y2 = pH - (seg[i+1].y + originY)
        page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: lw, color: rgb(...color), dashArray: dash, dashPhase: 0 })
      }
    }
  }

  // Bleed zone: light orange fill rectangle
  const bleedPx = bleedMm * PT_PER_MM
  page.drawRectangle({
    x: originX - bleedPx, y: pH - (originY - bleedPx) - (dielineH_mm * PT_PER_MM + 2 * bleedPx),
    width: dielineW_mm * PT_PER_MM + 2 * bleedPx,
    height: dielineH_mm * PT_PER_MM + 2 * bleedPx,
    color: rgb(1, 0.95, 0.88),
    borderColor: rgb(1, 0.6, 0.2),
    borderWidth: 0.3,
  })

  // White dieline area (trim box)
  page.drawRectangle({
    x: originX, y: pH - originY - dielineH_mm * PT_PER_MM,
    width: dielineW_mm * PT_PER_MM, height: dielineH_mm * PT_PER_MM,
    color: rgb(1, 1, 1),
  })

  // Fold lines (blue dashed)
  for (const foldPath of dieline.foldLines) {
    drawDieline(foldPath, [0.27, 0.53, 1.0], [3, 2], 0.4)
  }

  // Glue zones (gray)
  for (const gluePath of dieline.gluePaths ?? []) {
    drawDieline(gluePath, [0.7, 0.7, 0.7], undefined, 0.3)
  }

  // Cut path (magenta, solid, thicker)
  drawDieline(dieline.cutPath, [0.91, 0.12, 0.55], undefined, 0.8)

  // Crop marks — 4 corners of the trim box
  const tx0 = originX, ty0 = originY
  const tx1 = originX + dielineW_mm * PT_PER_MM
  const ty1 = originY + dielineH_mm * PT_PER_MM
  // Top-left
  drawCropMark(page, tx0, ty0, -1, 0, pH); drawCropMark(page, tx0, ty0, 0, -1, pH)
  // Top-right
  drawCropMark(page, tx1, ty0,  1, 0, pH); drawCropMark(page, tx1, ty0, 0, -1, pH)
  // Bottom-left
  drawCropMark(page, tx0, ty1, -1, 0, pH); drawCropMark(page, tx0, ty1, 0,  1, pH)
  // Bottom-right
  drawCropMark(page, tx1, ty1,  1, 0, pH); drawCropMark(page, tx1, ty1, 0,  1, pH)

  // Registration marks — centered on each side outside the bleed
  const midX = originX + dielineW_mm * PT_PER_MM / 2
  const midY = originY + dielineH_mm * PT_PER_MM / 2
  const regOffset = markZone * 0.55
  drawRegMark(page, midX, ty0 - regOffset, pH)
  drawRegMark(page, midX, ty1 + regOffset, pH)
  drawRegMark(page, tx0 - regOffset, midY, pH)
  drawRegMark(page, tx1 + regOffset, midY, pH)

  // Label
  page.drawText('Fold Studio — Patron Print-Ready', {
    x: 6, y: pageH_pt - 14,
    size: 7, color: rgb(0.5, 0.5, 0.5),
  })
  page.drawText(`Dimensions: ${dielineW_mm.toFixed(1)}×${dielineH_mm.toFixed(1)}mm  |  Fond perdu: ${bleedMm}mm`, {
    x: 6, y: pageH_pt - 24,
    size: 6, color: rgb(0.6, 0.6, 0.6),
  })

  return pdfDoc.save()
}

export async function downloadPrintReadyPdf(dieline: DielineData, imageLayers: ImageLayer[] = []) {
  const bytes = await dielineToPrintReadyPdf(dieline, imageLayers)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'fold-studio-print-ready.pdf'; a.click()
  URL.revokeObjectURL(url)
}
