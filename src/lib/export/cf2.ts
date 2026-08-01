// CF2 (Container Format 2) export for Fold Studio
// CF2 is an industry-standard packaging file format used by Esko/ArtiosCAD
// This implements a compatible JSON-based CF2 export structure.
import type { DielineData } from '@/lib/dieline'
import type { BoxParams, TemplateType } from '@/lib/types'

const MM_TO_PX = 3.7795275591

interface CF2Point { x: number; y: number }
interface CF2Path { points: CF2Point[]; closed: boolean; layer: string }

function svgPathToCF2(d: string): CF2Point[] {
  const pts: CF2Point[] = []
  const tokens = d.trim().replace(/([MLZzHhVv])/g, ' $1 ').split(/[\s,]+/).filter(Boolean)
  let i = 0
  let cx = 0, cy = 0

  while (i < tokens.length) {
    const cmd = tokens[i]
    if (cmd === 'M') {
      i++; cx = parseFloat(tokens[i++]) / MM_TO_PX; cy = parseFloat(tokens[i++]) / MM_TO_PX
      pts.push({ x: +cx.toFixed(4), y: +cy.toFixed(4) })
    } else if (cmd === 'L') {
      i++; cx = parseFloat(tokens[i++]) / MM_TO_PX; cy = parseFloat(tokens[i++]) / MM_TO_PX
      pts.push({ x: +cx.toFixed(4), y: +cy.toFixed(4) })
    } else if (cmd === 'H') {
      i++; cx = parseFloat(tokens[i++]) / MM_TO_PX
      pts.push({ x: +cx.toFixed(4), y: +cy.toFixed(4) })
    } else if (cmd === 'V') {
      i++; cy = parseFloat(tokens[i++]) / MM_TO_PX
      pts.push({ x: +cx.toFixed(4), y: +cy.toFixed(4) })
    } else if (cmd === 'Z' || cmd === 'z') {
      i++
    } else {
      const v = parseFloat(cmd)
      if (!isNaN(v)) {
        cx = v / MM_TO_PX; i++; cy = parseFloat(tokens[i++]) / MM_TO_PX
        pts.push({ x: +cx.toFixed(4), y: +cy.toFixed(4) })
      } else {
        i++
      }
    }
  }
  return pts
}

function buildCF2Paths(dieline: DielineData): CF2Path[] {
  const paths: CF2Path[] = []

  // Cut path
  const cutPts = svgPathToCF2(dieline.cutPath)
  if (cutPts.length > 1) paths.push({ points: cutPts, closed: true, layer: 'CUT' })

  // Fold lines
  for (const foldPath of dieline.foldLines) {
    const pts = svgPathToCF2(foldPath)
    if (pts.length > 1) paths.push({ points: pts, closed: false, layer: 'FOLD' })
  }

  // Glue paths
  for (const gluePath of dieline.gluePaths ?? []) {
    const pts = svgPathToCF2(gluePath)
    if (pts.length > 1) paths.push({ points: pts, closed: false, layer: 'GLUE' })
  }

  // Bleed path
  if (dieline.bleedPath) {
    const pts = svgPathToCF2(dieline.bleedPath)
    if (pts.length > 1) paths.push({ points: pts, closed: true, layer: 'BLEED' })
  }

  return paths
}

export function dielineToCF2(dieline: DielineData, params: BoxParams, template: TemplateType): string {
  const paths = buildCF2Paths(dieline)
  const w = +(dieline.svgWidth / MM_TO_PX).toFixed(4)
  const h = +(dieline.svgHeight / MM_TO_PX).toFixed(4)

  const cf2 = {
    cf2_version: '2.0',
    generator: 'Fold Studio',
    created: new Date().toISOString(),
    units: 'mm',
    template_type: template,
    design: {
      width_mm: w,
      height_mm: h,
      parameters: {
        box_width: params.width,
        box_height: params.height,
        box_depth: params.depth,
        glue_tab: params.glueTab,
        thickness: params.thickness,
        bleed: params.bleed,
      },
    },
    layers: [
      { name: 'CUT',  color: '#e91e8c', description: 'Ligne de coupe', line_type: 'SOLID' },
      { name: 'FOLD', color: '#4488ff', description: 'Ligne de pli',   line_type: 'DASHED' },
      { name: 'GLUE', color: '#aaaaaa', description: 'Zone de collage', line_type: 'SOLID' },
      { name: 'BLEED', color: '#ff8800', description: 'Fond perdu',    line_type: 'DASHED' },
    ],
    paths: paths.map(p => ({
      layer: p.layer,
      closed: p.closed,
      point_count: p.points.length,
      points: p.points,
    })),
  }

  return JSON.stringify(cf2, null, 2)
}

export function downloadCF2(dieline: DielineData, params: BoxParams, template: TemplateType, filename = 'fold-studio-dieline.cf2') {
  const cf2Str = dielineToCF2(dieline, params, template)
  const blob = new Blob([cf2Str], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// CF2 Import — parse a CF2 JSON and extract approximate BoxParams
export interface CF2ImportResult {
  params: Partial<BoxParams>
  template: TemplateType
  error?: string
}

export function parseCF2(jsonStr: string): CF2ImportResult {
  try {
    const data = JSON.parse(jsonStr)
    if (!data.cf2_version) throw new Error('Not a valid CF2 file')

    const params: Partial<BoxParams> = {
      width:     data.design?.parameters?.box_width    ?? 200,
      height:    data.design?.parameters?.box_height   ?? 150,
      depth:     data.design?.parameters?.box_depth    ?? 150,
      glueTab:   data.design?.parameters?.glue_tab     ?? 20,
      thickness: data.design?.parameters?.thickness    ?? 3,
      bleed:     data.design?.parameters?.bleed        ?? 3,
    }
    const template: TemplateType = data.template_type ?? 'box'
    return { params, template }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { params: {}, template: 'box', error: `Erreur de lecture CF2: ${msg}` }
  }
}
