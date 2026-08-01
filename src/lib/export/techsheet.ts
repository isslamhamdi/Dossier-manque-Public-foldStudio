import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { BoxParams, ImageLayer } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'

const MM_TO_PX = 3.7795275591

const PX_TO_MM = 1 / 3.7795275591

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

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


// Pre-transform SVG path d coordinates to pdf-lib's drawSvgPath intermediate space.
// drawSvgPath internally applies CTM(1,0,0,-1,0,0), so we pass coords where:
//   i_x = scale*svg_x + tx   →  pdf_x = i_x = scale*svg_x + tx
//   i_y = scale*svg_y - ty   →  pdf_y = -i_y = ty - scale*svg_y  (y-flip)
function transformSvgPath(d: string, scale: number, tx: number, ty: number): string {
  const tfX = (x: number) => scale * x + tx
  const tfY = (y: number) => scale * y - ty

  const tokens: (string | number)[] = []
  const re = /([MmLlHhVvCcSsQqZz])|([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    if (m[1]) tokens.push(m[1])
    else tokens.push(parseFloat(m[2]))
  }

  let i = 0
  let cx = 0, cy = 0
  let out = ''
  const num = () => tokens[i++] as number

  while (i < tokens.length) {
    const cmd = tokens[i++] as string
    switch (cmd) {
      case 'M': {
        const x = num(), y = num(); cx = x; cy = y
        out += `M ${tfX(x)} ${tfY(y)} `
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x2 = num(), y2 = num(); cx = x2; cy = y2
          out += `L ${tfX(x2)} ${tfY(y2)} `
        }
        break
      }
      case 'm': {
        cx += num(); cy += num()
        out += `M ${tfX(cx)} ${tfY(cy)} `
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx += num(); cy += num()
          out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      }
      case 'L':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x = num(), y = num(); cx = x; cy = y
          out += `L ${tfX(x)} ${tfY(y)} `
        }
        break
      case 'l':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx += num(); cy += num()
          out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      case 'H':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx = num(); out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      case 'h':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx += num(); out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      case 'V':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cy = num(); out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      case 'v':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cy += num(); out += `L ${tfX(cx)} ${tfY(cy)} `
        }
        break
      case 'C':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num()
          cx = x; cy = y
          out += `C ${tfX(x1)} ${tfY(y1)} ${tfX(x2)} ${tfY(y2)} ${tfX(x)} ${tfY(y)} `
        }
        break
      case 'c':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const dx1 = num(), dy1 = num(), dx2 = num(), dy2 = num(), dx = num(), dy = num()
          out += `C ${tfX(cx+dx1)} ${tfY(cy+dy1)} ${tfX(cx+dx2)} ${tfY(cy+dy2)} ${tfX(cx+dx)} ${tfY(cy+dy)} `
          cx += dx; cy += dy
        }
        break
      case 'Q':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x1 = num(), y1 = num(), x = num(), y = num()
          cx = x; cy = y
          out += `Q ${tfX(x1)} ${tfY(y1)} ${tfX(x)} ${tfY(y)} `
        }
        break
      case 'q':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const dx1 = num(), dy1 = num(), dx = num(), dy = num()
          out += `Q ${tfX(cx+dx1)} ${tfY(cy+dy1)} ${tfX(cx+dx)} ${tfY(cy+dy)} `
          cx += dx; cy += dy
        }
        break
      case 'S':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x2 = num(), y2 = num(), x = num(), y = num()
          cx = x; cy = y
          out += `S ${tfX(x2)} ${tfY(y2)} ${tfX(x)} ${tfY(y)} `
        }
        break
      case 's':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const dx2 = num(), dy2 = num(), dx = num(), dy = num()
          out += `S ${tfX(cx+dx2)} ${tfY(cy+dy2)} ${tfX(cx+dx)} ${tfY(cy+dy)} `
          cx += dx; cy += dy
        }
        break
      case 'Z': case 'z': out += 'Z '; break
    }
  }
  return out.trim()
}

export async function exportTechSheet(
  params: BoxParams,
  dieline: DielineData,
  imageLayers: ImageLayer[],
  exteriorColor: string,
  interiorColor: string,
  templateName: string,
  projectName = 'UNTITLED BOX',
): Promise<void> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595.28, 841.89]) // A4
  const { width, height } = page.getSize()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)

  const col = {
    black: rgb(0.1, 0.1, 0.1),
    gray:  rgb(0.5, 0.5, 0.5),
    light: rgb(0.9, 0.9, 0.9),
  }
  let y = height - 40

  // ── Header ──────────────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: height - 60, width, height: 60, color: col.black })
  // Reference: FT-{TEMPLATE}-{YYYYMMDD}-{HHMMSS}
  const now = new Date()
  const pad = (n: number, l = 2) => String(n).padStart(l, '0')
  const ref = `FT-${templateName.replace(/\s+/g, '-').toUpperCase()}-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

  const subtitleBase = "FICHE TECHNIQUE  PATRON D'EMBALLAGE"
  const subtitleW = font.widthOfTextAtSize(subtitleBase, 8)
  page.drawText('FOLD STUDIO', { x: 24, y: height - 24, size: 16, font: fontBold, color: rgb(1,1,1) })
  page.drawText(`Ref : ${ref}`, { x: width - 230, y: height - 10, size: 7, font, color: rgb(0.55,0.55,0.55) })
  page.drawText(subtitleBase, { x: 24, y: height - 42, size: 8, font, color: rgb(0.7,0.7,0.7) })
  page.drawText(`(${projectName.toUpperCase()})`, { x: 24 + subtitleW + 5, y: height - 42, size: 8, font: fontBold, color: rgb(0.85,0.85,0.85) })
  y = height - 80

  // ── Template name ────────────────────────────────────────────────────────────
  page.drawText(`Modele : ${templateName.toUpperCase()}`, { x: 24, y, size: 14, font: fontBold, color: col.black })
  y -= 22

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const drawSection = (title: string) => {
    y -= 6
    page.drawRectangle({ x: 24, y: y - 2, width: width - 48, height: 18, color: col.light })
    page.drawText(title, { x: 28, y, size: 9, font: fontBold, color: col.gray })
    y -= 20
  }

  const drawRow = (label: string, value: string, highlight = false) => {
    if (highlight) page.drawRectangle({ x: 24, y: y - 2, width: width - 48, height: 14, color: rgb(0.97, 0.97, 0.97) })
    page.drawText(label, { x: 28, y, size: 8, font, color: col.gray })
    page.drawText(value, { x: 220, y, size: 8, font: fontBold, color: col.black })
    y -= 14
  }

  // Row with colored square indicator (for fabrication lines)
  const SWATCH = 9 // square size in pt
  const drawFabRow = (
    label: string,
    lineHex: string,
    desc: string,
    hatch: boolean,
    highlight = false,
  ) => {
    if (highlight) page.drawRectangle({ x: 24, y: y - 2, width: width - 48, height: 14, color: rgb(0.97, 0.97, 0.97) })
    const [sr, sg, sb] = hexToRgb(lineHex)
    // Colored square
    page.drawRectangle({
      x: 28, y: y - 1, width: SWATCH, height: SWATCH,
      color: rgb(sr, sg, sb),
      borderColor: rgb(sr * 0.6, sg * 0.6, sb * 0.6),
      borderWidth: 0.5,
    })
    // Hatch lines inside the square (for glue)
    if (hatch) {
      for (let hx = 1; hx < SWATCH; hx += 3) {
        page.drawLine({
          start: { x: 28 + hx, y: y - 1 },
          end:   { x: 28 + hx, y: y - 1 + SWATCH },
          thickness: 0.7, color: rgb(1, 1, 1),
        })
      }
    }
    page.drawText(label, { x: 42, y, size: 8, font, color: col.gray })
    page.drawText(`${lineHex.toUpperCase()}  ${desc}`, { x: 220, y, size: 8, font: fontBold, color: col.black })
    y -= 14
  }

  // ── DIMENSIONS ───────────────────────────────────────────────────────────────
  drawSection('DIMENSIONS')
  drawRow('Largeur (Width)',  `${params.width} mm  /  ${(params.width/10).toFixed(1)} cm  /  ${(params.width/25.4).toFixed(3)}"`)
  drawRow('Hauteur (Height)', `${params.height} mm  /  ${(params.height/10).toFixed(1)} cm  /  ${(params.height/25.4).toFixed(3)}"`, true)
  drawRow('Profondeur (Depth)',`${params.depth} mm  /  ${(params.depth/10).toFixed(1)} cm  /  ${(params.depth/25.4).toFixed(3)}"`)
  drawRow('Languette de collage', `${params.glueTab} mm`, true)
  drawRow('Fond perdu (Bleed)', `${params.bleed} mm`)
  drawRow('Epaisseur matiere', `${params.thickness} mm`, true)
  const dieW = Math.round(dieline.svgWidth * PX_TO_MM)
  const dieH = Math.round(dieline.svgHeight * PX_TO_MM)
  drawRow('Surface developpee (patron)', `${dieW} x ${dieH} mm`)
  drawRow('Surface totale patron', `${((dieW * dieH) / 100).toFixed(0)} cm²`, true)

  // ── COULEURS ─────────────────────────────────────────────────────────────────
  drawSection('COULEURS')
  const [ec, em, ey, ek] = hexToCmyk(exteriorColor)
  const [ic, im, iy, ik] = hexToCmyk(interiorColor)
  const extRgb = hexToRgb(exteriorColor)
  const intRgb = hexToRgb(interiorColor)

  // Exterior color swatch + row
  page.drawRectangle({ x: 28, y: y - 1, width: SWATCH, height: SWATCH, color: rgb(...extRgb), borderColor: rgb(0.7,0.7,0.7), borderWidth: 0.5 })
  page.drawText('Couleur exterieure', { x: 42, y, size: 8, font, color: col.gray })
  page.drawText(`${exteriorColor.toUpperCase()}  /  C${ec} M${em} J${ey} N${ek}`, { x: 220, y, size: 8, font: fontBold, color: col.black })
  y -= 14

  // Interior color swatch + row
  page.drawRectangle({ x: 24, y: y - 2, width: width - 48, height: 14, color: rgb(0.97, 0.97, 0.97) })
  page.drawRectangle({ x: 28, y: y - 1, width: SWATCH, height: SWATCH, color: rgb(...intRgb), borderColor: rgb(0.7,0.7,0.7), borderWidth: 0.5 })
  page.drawText('Couleur interieure', { x: 42, y, size: 8, font, color: col.gray })
  page.drawText(`${interiorColor.toUpperCase()}  /  C${ic} M${im} J${iy} N${ik}`, { x: 220, y, size: 8, font: fontBold, color: col.black })
  y -= 14

  drawRow('TIC exterieure (couverture encre)', `${ec+em+ey+ek}%  ${ec+em+ey+ek > 320 ? '! ELEVE' : 'OK'}`)
  drawRow('Nombre de calques artwork', `${imageLayers.length}`, true)

  // ── LIGNES DE FABRICATION ────────────────────────────────────────────────────
  drawSection('LIGNES DE FABRICATION')
  drawFabRow('Decoupe',       '#E91E8C', '1 couleur spot (trait continu)',    false, false)
  drawFabRow('Pli montagne',  '#4488FF', 'en pointille (tirets bleus)',        false, true)
  drawFabRow('Zone de collage','#AAAAAA', 'zone hachuree (gris)',              true,  false)
  drawFabRow('Fond perdu',    '#FF8800', 'en pointille (tirets oranges)',       false, true)

  // ── FICHIERS EXPORT DISPONIBLES ──────────────────────────────────────────────
  drawSection('FICHIERS EXPORT DISPONIBLES')
  drawRow('SVG vectoriel',             'Editable  calques separes')
  drawRow('GLB (3D)',                  'Compatible AR iOS/Android', true)
  drawRow('PDF print-ready',           'CMJN, reperes de coupe inclus')
  drawRow('DXF (decoupe laser)',        'Calques CUT / FOLD / BLEED / GLUE', true)
  drawRow('PNG (1:1 resolution ecran)','Pour maquette numerique')

  // ── 2D PATRON DIELINE — vrais chemins vectoriels PDF (editables dans Illustrator) ──
  drawSection('PATRON 2D — APERCU FABRICATION')
  const previewW  = width - 48
  const annotStripH = 36   // annotation strip below the preview box
  const footerReserve = 32
  const previewH  = Math.max(120, y - footerReserve - annotStripH)
  const previewY  = y - previewH

  // White box + border
  page.drawRectangle({ x: 24, y: previewY, width: previewW, height: previewH, color: rgb(1,1,1), borderColor: rgb(0.88,0.88,0.88), borderWidth: 0.5 })

  // ── Coordinate transform: SVG px → PDF pt ──────────────────────────────────
  // viewBox includes bleed margin on all 4 sides
  const bleedPx2 = params.bleed * MM_TO_PX
  const vx2 = -bleedPx2, vy2 = -bleedPx2
  const vw2 = dieline.svgWidth  + 2 * bleedPx2
  const vh2 = dieline.svgHeight + 2 * bleedPx2

  const dieScale = Math.min(previewW / vw2, previewH / vh2) * 0.95
  const drawDieW = vw2 * dieScale
  const drawDieH = vh2 * dieScale
  const dieLeft  = 24 + (previewW - drawDieW) / 2
  const dieTop   = previewY + previewH - (previewH - drawDieH) / 2

  // pdf_x = dieScale * svg_x + dieTx
  // pdf_y = -dieScale * svg_y + dieTy   (y-flip: SVG y-down → PDF y-up)
  const dieTx = dieLeft - dieScale * vx2
  const dieTy = dieTop  + dieScale * vy2

  // ── 1. Image layers (raster, PNG/JPEG embedded as PDF objects) ──────────────
  for (const layer of imageLayers.filter(l => l.visible)) {
    const src = layer.src as string
    const isPng  = src.startsWith('data:image/png')
    const isJpeg = src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')
    if (!isPng && !isJpeg) continue
    try {
      const b64   = src.split(',')[1]
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
      const pdfImg = isJpeg ? await doc.embedJpg(bytes) : await doc.embedPng(bytes)

      const svgX = layer.x * MM_TO_PX,  svgY = layer.y * MM_TO_PX
      const svgW = layer.width  * layer.scale * MM_TO_PX
      const svgH = layer.height * layer.scale * MM_TO_PX

      const pdfX    = dieScale * svgX + dieTx
      const pdfTopY = -dieScale * svgY + dieTy
      const pdfW    = dieScale * svgW
      const pdfH    = dieScale * svgH

      page.drawImage(pdfImg, { x: pdfX, y: pdfTopY - pdfH, width: pdfW, height: pdfH })
    } catch { /* skip unsupported layers */ }
  }

  // ── 2. Vector structural paths — editable in Illustrator ───────────────────
  // Pre-transform each path to pdf-lib's intermediate coordinate system so
  // drawSvgPath's internal y-flip lands the geometry in the right PDF position.

  if (dieline.bleedPath) {
    page.drawSvgPath(transformSvgPath(dieline.bleedPath, dieScale, dieTx, dieTy), {
      borderColor: rgb(1, 0.533, 0),
      borderWidth: 0.8,
      borderDashArray: [5, 3],
    })
  }

  for (const p of dieline.gluePaths ?? []) {
    page.drawSvgPath(transformSvgPath(p, dieScale, dieTx, dieTy), {
      borderColor: rgb(0.667, 0.667, 0.667),
      borderWidth: 1.2,
      borderOpacity: 0.6,
      borderDashArray: [3, 2],
    })
  }

  for (const p of dieline.foldLines) {
    page.drawSvgPath(transformSvgPath(p, dieScale, dieTx, dieTy), {
      borderColor: rgb(0.267, 0.533, 1),
      borderWidth: 0.8,
      borderDashArray: [6, 3],
    })
  }

  page.drawSvgPath(transformSvgPath(dieline.cutPath, dieScale, dieTx, dieTy), {
    borderColor: rgb(0.914, 0.118, 0.549),
    borderWidth: 1.2,
  })

  // ── 3. Dimension annotation strip below preview ─────────────────────────────
  const midX = 24 + previewW / 2
  page.drawLine({ start: { x: 24, y: previewY - 1 }, end: { x: 24 + previewW, y: previewY - 1 }, thickness: 0.4, color: col.light })
  page.drawText(`Patron : ${dieW} x ${dieH} mm`, { x: midX - 40, y: previewY - 13, size: 7, font, color: col.gray })
  page.drawText(`Larg. ${params.width} mm  |  Haut. ${params.height} mm  |  Prof. ${params.depth} mm`, {
    x: midX - 95, y: previewY - 27, size: 9, font: fontBold, color: rgb(0.1, 0.29, 0.55),
  })

  // ── Footer ───────────────────────────────────────────────────────────────────
  page.drawLine({ start: { x: 24, y: 20 }, end: { x: width - 24, y: 20 }, thickness: 0.5, color: col.light })
  page.drawText('Genere par Fold Studio  Tous droits reserves', { x: 24, y: 8, size: 7, font, color: col.gray })
  page.drawText(`Patron : ${dieW} x ${dieH} mm`, { x: width - 180, y: 8, size: 7, font, color: col.gray })

  // ── Save & download ──────────────────────────────────────────────────────────
  const bytes = await doc.save()
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fiche-technique-(${projectName.replace(/\s+/g, '-')})-${Date.now()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
