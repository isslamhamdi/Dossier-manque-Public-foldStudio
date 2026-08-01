// SVG Dieline Parser
// Parses SVG dieline files exported from Illustrator / ESKO / ArtiosCAD.
// Outputs a FoldNode tree compatible with DielineFaces.tsx.

import type { FoldNode, FaceName } from '../dieline/helpers'
import type { DielineData, Panel } from '../dieline/helpers'
import { MM_TO_PX, foldAxisFrom2D } from '../dieline/helpers'
import { classifySVGElement, type LineRole } from './lineClassifier'

const PX_TO_MM = 1 / MM_TO_PX   // 1 SVG px → mm

// ── Raw segment extracted from SVG ─────────────────────────────

export interface RawSegment {
  role: LineRole
  points: [number, number][]   // all in SVG px
}

// ── Parse SVG string → classified segments ─────────────────────

function svgPathToPoints(d: string): [number, number][] {
  const pts: [number, number][] = []
  let cx = 0, cy = 0

  // Simple command parser for M, L, H, V, Z (covers 95% of dieline paths)
  const re = /([MLHVZmlhvz])([^MLHVZmlhvz]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    const cmd = m[1]
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
    switch (cmd) {
      case 'M': case 'm':
        for (let i = 0; i < args.length; i += 2) {
          cx = cmd === 'M' ? args[i] : cx + args[i]
          cy = cmd === 'M' ? args[i+1] : cy + args[i+1]
          pts.push([cx, cy])
        }
        break
      case 'L': case 'l':
        for (let i = 0; i < args.length; i += 2) {
          cx = cmd === 'L' ? args[i] : cx + args[i]
          cy = cmd === 'L' ? args[i+1] : cy + args[i+1]
          pts.push([cx, cy])
        }
        break
      case 'H': cx = cmd === 'H' ? args[0] : cx + args[0]; pts.push([cx, cy]); break
      case 'h': cx += args[0]; pts.push([cx, cy]); break
      case 'V': cy = cmd === 'V' ? args[0] : cy + args[0]; pts.push([cx, cy]); break
      case 'v': cy += args[0]; pts.push([cx, cy]); break
      case 'Z': case 'z':
        if (pts.length > 0) pts.push(pts[0])
        break
    }
  }
  return pts
}

export function parseSVGSegments(svgContent: string): RawSegment[] {
  if (typeof window === 'undefined') return []  // SSR guard
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgContent, 'image/svg+xml')

  // Detect unit scale from viewBox vs width attribute
  let scale = 1
  const svgEl = doc.querySelector('svg')
  if (svgEl) {
    const vb = svgEl.getAttribute('viewBox')
    const w  = svgEl.getAttribute('width')
    if (vb && w) {
      const [,, vbW] = vb.split(/[\s,]+/).map(Number)
      const wNum = parseFloat(w)
      if (vbW && wNum && Math.abs(vbW - wNum) > 1) scale = wNum / vbW
    }
  }

  const segments: RawSegment[] = []
  const elems = doc.querySelectorAll('path, line, polyline, polygon, rect')

  elems.forEach(el => {
    const role = classifySVGElement(el)
    let points: [number, number][] = []

    const tag = el.tagName.toLowerCase()
    if (tag === 'path') {
      points = svgPathToPoints(el.getAttribute('d') ?? '')
    } else if (tag === 'line') {
      const x1 = parseFloat(el.getAttribute('x1') ?? '0')
      const y1 = parseFloat(el.getAttribute('y1') ?? '0')
      const x2 = parseFloat(el.getAttribute('x2') ?? '0')
      const y2 = parseFloat(el.getAttribute('y2') ?? '0')
      points = [[x1, y1], [x2, y2]]
    } else if (tag === 'polyline' || tag === 'polygon') {
      const raw = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/)
      for (let i = 0; i + 1 < raw.length; i += 2)
        points.push([parseFloat(raw[i]), parseFloat(raw[i+1])])
      if (tag === 'polygon' && points.length) points.push(points[0])
    } else if (tag === 'rect') {
      const x = parseFloat(el.getAttribute('x') ?? '0')
      const y = parseFloat(el.getAttribute('y') ?? '0')
      const rw = parseFloat(el.getAttribute('width') ?? '0')
      const rh = parseFloat(el.getAttribute('height') ?? '0')
      points = [[x, y], [x+rw, y], [x+rw, y+rh], [x, y+rh], [x, y]]
    }

    if (points.length > 0) {
      const scaled = points.map(([px, py]) => [px * scale, py * scale] as [number, number])
      segments.push({ role, points: scaled })
    }
  })

  return segments
}

// ── Geometry helpers ────────────────────────────────────────────

function segBBox(seg: RawSegment) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (const [x, y] of seg.points) {
    if (x < xMin) xMin = x; if (x > xMax) xMax = x
    if (y < yMin) yMin = y; if (y > yMax) yMax = y
  }
  return { xMin, xMax, yMin, yMax }
}

function isVertical(seg: RawSegment, tol = 2): boolean {
  const b = segBBox(seg)
  return (b.xMax - b.xMin) < tol
}

function isHorizontal(seg: RawSegment, tol = 2): boolean {
  const b = segBBox(seg)
  return (b.yMax - b.yMin) < tol
}

// ── Detect dieline bounding box from cut lines ──────────────────

function dielineBBox(segments: RawSegment[]) {
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (const seg of segments) {
    if (seg.role !== 'cut' && seg.role !== 'unknown') continue
    const b = segBBox(seg)
    if (b.xMin < xMin) xMin = b.xMin; if (b.xMax > xMax) xMax = b.xMax
    if (b.yMin < yMin) yMin = b.yMin; if (b.yMax > yMax) yMax = b.yMax
  }
  return { xMin, xMax, yMin, yMax }
}

// ── Build FoldNode tree from classified segments ────────────────
// Works for standard rectangular box dielines (RSC, tuck-end, etc.)
// where fold lines are all vertical or horizontal.

function snapToGrid(values: number[], tol = 3): number[] {
  const sorted = Array.from(new Set(values)).sort((a, b) => a - b)
  const groups: number[] = []
  for (const v of sorted) {
    if (groups.length === 0 || Math.abs(v - groups[groups.length - 1]) > tol) {
      groups.push(v)
    }
  }
  return groups
}

interface SimplePanel {
  id: string
  face: FaceName
  xMm: number; yMm: number; wMm: number; hMm: number
}

const FACE_ORDER: FaceName[] = ['left', 'front', 'right', 'back', 'glue']
const PI2 = Math.PI / 2

function buildFoldNodeFromPanels(panels: SimplePanel[], D: number): FoldNode {
  // Assume the largest-area panel that's not 'glue' is Front
  const nonGlue = panels.filter(p => p.face !== 'glue')
  const front = nonGlue.reduce((a, b) => (a.wMm * a.hMm >= b.wMm * b.hMm ? a : b))
  const H = front.hMm
  const W = front.wMm

  const body = panels.filter(p => p.face !== 'glue')
  const left  = body.find(p => p.face === 'left')
  const right = body.find(p => p.face === 'right')
  const back  = body.find(p => p.face === 'back')
  const top    = body.find(p => p.face === 'top')
  const bottom = body.find(p => p.face === 'bottom')

  const depthMm = left?.wMm ?? D

  const makeHinge = (
    face: FaceName,
    w: number, h: number,
    pivotPos: [number, number, number],
    panelPos: [number, number, number],
    axis: [number, number, number],
    angle: number,
    seq: [number, number],
    children: FoldNode[] = []
  ): FoldNode => ({
    id: face.charAt(0).toUpperCase() + face.slice(1),
    face, w, h,
    hinge: { pivotPos, panelPos, axis, angle, seq },
    children,
  })

  const children: FoldNode[] = []

  if (bottom) children.push(makeHinge('bottom', W, depthMm,
    [0, -H/2, 0], [0, -depthMm/2, 0], [1,0,0],  PI2, [0.00, 0.18]))

  if (top) children.push(makeHinge('top', W, depthMm,
    [0,  H/2, 0], [0,  depthMm/2, 0], [1,0,0], -PI2, [0.05, 0.25]))

  if (left) children.push(makeHinge('left', depthMm, H,
    [-W/2, 0, 0], [-depthMm/2, 0, 0], [0,1,0], -PI2, [0.20, 0.55]))

  const backChildren: FoldNode[] = back ? [makeHinge('back', W, H,
    [depthMm, 0, 0], [W/2, 0, 0], [0,1,0], PI2, [0.50, 0.85])] : []

  if (right) children.push(makeHinge('right', depthMm, H,
    [W/2, 0, 0], [depthMm/2, 0, 0], [0,1,0], PI2, [0.20, 0.55], backChildren))
  else if (back) children.push(makeHinge('back', W, H,
    [W/2 + depthMm, 0, 0], [W/2, 0, 0], [0,1,0], PI2, [0.50, 0.85]))

  return {
    id: 'Front', face: 'front', w: W, h: H,
    worldPos: [0, 0, depthMm / 2],
    children,
  }
}

// ── Main export: SVG string → DielineData with foldNode ─────────

export interface SVGImportResult {
  dielineData: DielineData
  error?: string
  stats: { cutSegs: number; foldSegs: number; detectedTemplate: string }
}

export function parseSVGDieline(svgContent: string): SVGImportResult {
  const error = (msg: string): SVGImportResult => ({
    dielineData: { svgWidth: 0, svgHeight: 0, cutPath: '', foldLines: [], gluePaths: [], bleedPath: '', panels: [] },
    error: msg,
    stats: { cutSegs: 0, foldSegs: 0, detectedTemplate: 'unknown' },
  })

  const segments = parseSVGSegments(svgContent)
  if (segments.length === 0) return error('Aucun segment trouvé dans le SVG')

  const cutSegs  = segments.filter(s => s.role === 'cut' || s.role === 'unknown')
  const foldSegs = segments.filter(s => s.role === 'fold')
  const glueSegs = segments.filter(s => s.role === 'glue')
  const bleedSegs = segments.filter(s => s.role === 'bleed')

  const bb = dielineBBox(segments)
  if (!isFinite(bb.xMin)) return error('Impossible de détecter le contour du dieline')

  // Convert cut path to a single SVG path string (just the outer bounding rect for now)
  const svgW = bb.xMax - bb.xMin
  const svgH = bb.yMax - bb.yMin

  const offsetX = -bb.xMin
  const offsetY = -bb.yMin

  const rebased = (pts: [number, number][]) =>
    pts.map(([x, y]) => [x + offsetX, y + offsetY] as [number, number])

  // Reconstruct cut path from all cut segments
  const cutPath = cutSegs.map(seg => {
    const pts = rebased(seg.points)
    return 'M ' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')
  }).join(' ')

  const foldLines = foldSegs.map(seg => {
    const pts = rebased(seg.points)
    return 'M ' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ')
  })

  const gluePaths = glueSegs.map(seg => {
    const pts = rebased(seg.points)
    return 'M ' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ') + ' Z'
  })

  const bleedPath = bleedSegs.length > 0
    ? bleedSegs.map(seg => {
        const pts = rebased(seg.points)
        return 'M ' + pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' L ') + ' Z'
      }).join(' ')
    : `M -3,-3 L ${svgW+3},-3 L ${svgW+3},${svgH+3} L -3,${svgH+3} Z`

  // ── Detect panels from fold lines ────────────────────────────
  // Find all vertical fold lines → horizontal cuts at regular x values
  const vertFolds = foldSegs.filter(isVertical)
  const horizFolds = foldSegs.filter(isHorizontal)

  const foldXs = snapToGrid(
    vertFolds.flatMap(s => s.points.map(([x]) => x + offsetX))
  )
  const foldYs = snapToGrid(
    horizFolds.flatMap(s => s.points.map(([, y]) => y + offsetY))
  )

  // Build panels from fold-line grid
  const panels: Panel[] = []
  const simplePanels: SimplePanel[] = []

  // Vertical layout: Left | Front | Right | Back | Glue (horizontal row)
  if (foldXs.length >= 2) {
    const allXs = [0, ...foldXs, svgW]
    const rowYs = foldYs.length >= 2
      ? [foldYs[0], foldYs[foldYs.length - 1]]
      : [0, svgH]
    const rowY = rowYs[0]
    const rowH = rowYs[rowYs.length - 1] - rowYs[0]

    const cols = allXs.slice(0, -1).map((x, i) => ({ x, w: allXs[i+1] - x }))

    const labelMap: FaceName[] = cols.length <= 5
      ? FACE_ORDER.slice(0, cols.length) as FaceName[]
      : [...Array(cols.length - 2).fill('flap' as FaceName), 'back', 'glue']

    cols.forEach((col, i) => {
      const face = labelMap[i] ?? 'flap'
      const xMm = col.x * PX_TO_MM, yMm = rowY * PX_TO_MM
      const wMm = col.w * PX_TO_MM, hMm = rowH * PX_TO_MM
      panels.push({ x: col.x, y: rowY, w: col.w, h: rowH, label: face })
      simplePanels.push({ id: `Panel_${i}`, face: face as FaceName, xMm, yMm, wMm, hMm })
    })

    // Check for top/bottom flaps (above/below the main row)
    if (foldYs.length >= 2) {
      const topY = 0, topH = foldYs[0]
      const botY = foldYs[foldYs.length - 1], botH = svgH - botY
      const midX = foldXs[0], midW = (foldXs[1] ?? svgW) - foldXs[0]

      if (topH > 2) {
        panels.push({ x: midX, y: topY, w: midW, h: topH, label: 'Top' })
        simplePanels.push({ id: 'Top', face: 'top', xMm: midX*PX_TO_MM, yMm: 0, wMm: midW*PX_TO_MM, hMm: topH*PX_TO_MM })
      }
      if (botH > 2) {
        panels.push({ x: midX, y: botY, w: midW, h: botH, label: 'Bottom' })
        simplePanels.push({ id: 'Bottom', face: 'bottom', xMm: midX*PX_TO_MM, yMm: botY*PX_TO_MM, wMm: midW*PX_TO_MM, hMm: botH*PX_TO_MM })
      }
    }
  }

  // ── Build FoldNode tree ──────────────────────────────────────
  const frontPanel = simplePanels.find(p => p.face === 'front')
  const leftPanel  = simplePanels.find(p => p.face === 'left')
  const D = (leftPanel?.wMm ?? svgW * PX_TO_MM * 0.25)

  let foldNode: FoldNode | undefined
  if (frontPanel) {
    try {
      foldNode = buildFoldNodeFromPanels(simplePanels, D)
    } catch (_) {
      foldNode = undefined
    }
  }

  const template = foldXs.length === 4 ? 'box (RSC)' : foldXs.length === 3 ? 'box (3-col)' : 'unknown'

  return {
    dielineData: {
      svgWidth: svgW, svgHeight: svgH,
      cutPath, foldLines, gluePaths, bleedPath, panels,
      foldNode,
    },
    stats: { cutSegs: cutSegs.length, foldSegs: foldSegs.length, detectedTemplate: template },
  }
}
