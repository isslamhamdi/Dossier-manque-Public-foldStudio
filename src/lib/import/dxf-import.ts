// DXF Import — parse ArtiosCAD/ESKO .dxf files and reconstruct BoxParams + FoldNode
import type { BoxParams, TemplateType } from '@/lib/types'
import type { FoldNode } from '@/lib/dieline/helpers'
import { boxFoldNode } from '@/lib/dieline/box'
import { classifyByLayer } from './lineClassifier'

interface DXFEntity {
  type: string
  layer: string
  points: Array<[number, number]>
}

export interface DXFImportResult {
  params: Partial<BoxParams>
  template: TemplateType
  foldNode?: FoldNode
  entities: DXFEntity[]
  error?: string
  stats: { cutLines: number; foldLines: number; totalLength: number }
}

function parseDXFEntities(dxfText: string): DXFEntity[] {
  const entities: DXFEntity[] = []
  const lines = dxfText.split(/\r?\n/).map(l => l.trim())
  let i = 0

  // Find ENTITIES section
  while (i < lines.length && lines[i] !== 'ENTITIES') i++
  i++

  while (i < lines.length) {
    if (lines[i] === 'ENDSEC' || lines[i] === 'EOF') break

    if (lines[i] === '0') {
      i++
      const entityType = lines[i]
      i++

      if (entityType === 'LINE') {
        const ent: DXFEntity = { type: 'LINE', layer: '0', points: [] }
        let x1 = 0, y1 = 0, x2 = 0, y2 = 0
        while (i < lines.length && lines[i] !== '0') {
          const code = parseInt(lines[i]); i++
          const val = lines[i]; i++
          if (code === 8)  ent.layer = val
          if (code === 10) x1 = parseFloat(val)
          if (code === 20) y1 = parseFloat(val)
          if (code === 11) x2 = parseFloat(val)
          if (code === 21) y2 = parseFloat(val)
        }
        ent.points = [[x1, y1], [x2, y2]]
        entities.push(ent)

      } else if (entityType === 'LWPOLYLINE' || entityType === 'POLYLINE') {
        const ent: DXFEntity = { type: entityType, layer: '0', points: [] }
        let vtxCount = 0
        const xs: number[] = []
        const ys: number[] = []

        while (i < lines.length && lines[i] !== '0') {
          const code = parseInt(lines[i]); i++
          const val = lines[i]; i++
          if (code === 8)  ent.layer = val
          if (code === 90) vtxCount = parseInt(val)
          if (code === 10) xs.push(parseFloat(val))
          if (code === 20) ys.push(parseFloat(val))
        }

        ent.points = xs.map((x, k) => [x, ys[k] ?? 0])
        entities.push(ent)

      } else {
        // Skip unknown entity — advance until next entity marker
        while (i < lines.length && lines[i] !== '0') i++
      }
    } else {
      i++
    }
  }

  return entities
}

function layerToRole(layerName: string) { return classifyByLayer(layerName) }

function boundingBox(entities: DXFEntity[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (const ent of entities) {
    for (const [x, y] of ent.points) {
      if (x < xMin) xMin = x; if (x > xMax) xMax = x
      if (y < yMin) yMin = y; if (y > yMax) yMax = y
    }
  }
  return { xMin, xMax, yMin, yMax }
}

function totalPathLength(entities: DXFEntity[]): number {
  let len = 0
  for (const ent of entities) {
    for (let j = 1; j < ent.points.length; j++) {
      const dx = ent.points[j][0] - ent.points[j-1][0]
      const dy = ent.points[j][1] - ent.points[j-1][1]
      len += Math.sqrt(dx*dx + dy*dy)
    }
  }
  return len
}

function guessTemplate(w: number, h: number, foldCount: number): TemplateType {
  const ratio = Math.max(w, h) / Math.min(w, h)
  if (ratio > 4) return 'sleeve-insert'
  if (foldCount < 4) return 'tray-box'
  if (foldCount > 20) return 'tuck-end'
  return 'box'
}

export function parseDXF(dxfText: string): DXFImportResult {
  try {
    const entities = parseDXFEntities(dxfText)
    if (entities.length === 0) {
      return { params: {}, template: 'box', entities: [], error: 'Aucune entité trouvée dans le fichier DXF', stats: { cutLines: 0, foldLines: 0, totalLength: 0 } }
    }

    const cutEnts  = entities.filter(e => layerToRole(e.layer) === 'cut' || layerToRole(e.layer) === 'unknown')
    const foldEnts = entities.filter(e => layerToRole(e.layer) === 'fold')

    const bb = boundingBox(entities)
    const dieW = Math.abs(bb.xMax - bb.xMin)  // mm
    const dieH = Math.abs(bb.yMax - bb.yMin)  // mm

    // Heuristic: estimate box dimensions from dieline bounding box
    // For a standard RSC box: dieline W ≈ 2*(width+depth), dieline H ≈ height + depth + glueTab
    const depth   = Math.round(Math.min(dieW, dieH) * 0.2)
    const width   = Math.round((dieW - 2 * depth) / 2)
    const height  = Math.round(dieH * 0.6)
    const glueTab = Math.round(Math.max(10, Math.min(30, dieW * 0.05)))

    const params: Partial<BoxParams> = {
      width:     Math.max(20, width),
      height:    Math.max(20, height),
      depth:     Math.max(10, depth),
      glueTab:   glueTab,
      thickness: 3,
      bleed:     3,
    }

    const template = guessTemplate(dieW, dieH, foldEnts.length)
    const totalLength = Math.round(totalPathLength(entities))

    const foldNode = boxFoldNode(
      params.width  ?? 100,
      params.height ?? 100,
      params.depth  ?? 50,
    )

    return {
      params, template, foldNode, entities,
      stats: { cutLines: cutEnts.length, foldLines: foldEnts.length, totalLength },
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { params: {}, template: 'box', entities: [], error: `Erreur de lecture DXF: ${msg}`, stats: { cutLines: 0, foldLines: 0, totalLength: 0 } }
  }
}
