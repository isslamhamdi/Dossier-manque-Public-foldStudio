// parseSvgDieline.ts — Shortcut SVG parser for rectangular professional dielines.
// Uses svgson to cleanly parse SVG XML, then extracts fold-line segments in mm.
// Handles unit conversion from width/height attributes (mm, px, pt, cm).

import { parseSync, type INode } from 'svgson'
import { normalizeTopology, type NormalizedTopology } from './topologyNormalizer'

export interface FoldSegment {
  x1: number   // mm
  y1: number   // mm
  x2: number   // mm
  y2: number   // mm
  isHorizontal: boolean
  isVertical:   boolean
}

export interface ParsedSVGDieline {
  widthMm:  number
  heightMm: number
  foldSegments: FoldSegment[]
  cutPath?: string          // raw 'd' string of outermost cut path (optional)
  sideHint?: number         // N-sided polygon hint extracted from layer naming (templatemaker.nl etc.)
  topology?: NormalizedTopology  // closed loops + open chains after 3-pass cleanup
}

// ── Unit conversion ─────────────────────────────────────────────

const UNIT_TO_MM: Record<string, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
  px: 25.4 / 96,
  '': 25.4 / 96,  // no unit → assume 96dpi px
}

function parseDimension(raw: string | undefined): number {
  if (!raw) return 0
  const m = raw.match(/^([\d.]+)\s*(mm|cm|in|pt|px)?$/)
  if (!m) return 0
  const value = parseFloat(m[1])
  const unit  = (m[2] ?? '') as keyof typeof UNIT_TO_MM
  return value * (UNIT_TO_MM[unit] ?? (25.4 / 96))
}

// ── Colour / layer heuristics for fold lines ────────────────────
// Accepts any blue-dominant, magenta, or tool-specific fold color.
// Also matches dashed strokes (stroke-dasharray) and common layer names.

function isFoldColor(stroke: string | undefined): boolean {
  if (!stroke || stroke === 'none') return false
  const s = stroke.toLowerCase().trim()
  // Named colors
  if (s === '#0000ff' || s === 'blue')    return true
  if (s === '#ff00ff' || s === 'magenta') return true
  if (s === '#ff0000' || s === 'red')     return true
  if (s === '#008000' || s === 'green')   return true
  if (s === '#00ffff' || s === 'cyan')    return true
  // Tool-specific colors (templatemaker.nl, Esko, etc.)
  if (s === '#00adee' || s === '#0070c0' || s === '#4488ff') return true
  if (s === '#0000cc' || s === '#0033cc' || s === '#003399') return true
  // Parse 6-digit hex and check if blue/magenta dominant
  const hex = s.match(/^#([0-9a-f]{6})$/)
  if (hex) {
    const r = parseInt(hex[1].slice(0, 2), 16)
    const g = parseInt(hex[1].slice(2, 4), 16)
    const b = parseInt(hex[1].slice(4, 6), 16)
    if (b > 140 && b > r * 1.4 && r < 120)  return true  // blue-dominant
    if (r > 140 && b > 140 && g < 80)        return true  // magenta-dominant
  }
  return false
}

function isCutLayer(id: string | undefined, classAttr: string | undefined): boolean {
  const text = ((id ?? '') + ' ' + (classAttr ?? '')).toLowerCase()
  return /\bcut\b|decoupe|découpe|outline|contour/.test(text)
}

function isFoldLayer(id: string | undefined, classAttr: string | undefined): boolean {
  const text = ((id ?? '') + ' ' + (classAttr ?? '')).toLowerCase()
  return /fold|crease|score|valle|pli|bend|montage|perforation/.test(text)
}

function hasDashArray(attr: string | undefined): boolean {
  if (!attr || attr === 'none' || attr === '0') return false
  return /\d/.test(attr)
}

// ── SVG path command parser (M/L/H/V only, absolute + relative) ─

function pathToSegments(d: string, scaleX: number, scaleY: number): [number, number, number, number][] {
  const segs: [number, number, number, number][] = []
  let cx = 0, cy = 0, startX = 0, startY = 0

  const re = /([MLHVZACSQTmlhvzacsqt])([^MLHVZACSQTmlhvzacsqt]*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(d)) !== null) {
    const cmd  = m[1]
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
    switch (cmd) {
      case 'M':
        for (let i = 0; i < args.length; i += 2) {
          const nx = args[i], ny = args[i + 1]
          if (i > 0) segs.push([cx * scaleX, cy * scaleY, nx * scaleX, ny * scaleY])
          cx = nx; cy = ny
          if (i === 0) { startX = cx; startY = cy }
        }
        break
      case 'm':
        for (let i = 0; i < args.length; i += 2) {
          const nx = cx + args[i], ny = cy + args[i + 1]
          if (i > 0) segs.push([cx * scaleX, cy * scaleY, nx * scaleX, ny * scaleY])
          cx = nx; cy = ny
          if (i === 0) { startX = cx; startY = cy }
        }
        break
      case 'L':
        for (let i = 0; i < args.length; i += 2) {
          const nx = args[i], ny = args[i + 1]
          segs.push([cx * scaleX, cy * scaleY, nx * scaleX, ny * scaleY])
          cx = nx; cy = ny
        }
        break
      case 'l':
        for (let i = 0; i < args.length; i += 2) {
          const nx = cx + args[i], ny = cy + args[i + 1]
          segs.push([cx * scaleX, cy * scaleY, nx * scaleX, ny * scaleY])
          cx = nx; cy = ny
        }
        break
      case 'H': segs.push([cx * scaleX, cy * scaleY, args[0] * scaleX, cy * scaleY]); cx = args[0]; break
      case 'h': segs.push([cx * scaleX, cy * scaleY, (cx + args[0]) * scaleX, cy * scaleY]); cx += args[0]; break
      case 'V': segs.push([cx * scaleX, cy * scaleY, cx * scaleX, args[0] * scaleY]); cy = args[0]; break
      case 'v': segs.push([cx * scaleX, cy * scaleY, cx * scaleX, (cy + args[0]) * scaleY]); cy += args[0]; break
      case 'Z': case 'z':
        if (cx !== startX || cy !== startY) {
          segs.push([cx * scaleX, cy * scaleY, startX * scaleX, startY * scaleY])
        }
        cx = startX; cy = startY
        break
    }
  }
  return segs
}

// ── Recursively walk svgson node tree ───────────────────────────

function walkNode(
  node: INode,
  scaleX: number,
  scaleY: number,
  parentIsFold: boolean,
  out: FoldSegment[]
) {
  const { name, attributes, children } = node

  // Detect if current group is a fold layer
  const dashed = hasDashArray(attributes['stroke-dasharray'])
  const isFold = parentIsFold
    || isFoldLayer(attributes.id, attributes.class)
    || isFoldColor(attributes.stroke)
    || (dashed && !isCutLayer(attributes.id, attributes.class))

  // Handle <line> elements
  if (name === 'line') {
    const x1 = parseFloat(attributes.x1 ?? '0') * scaleX
    const y1 = parseFloat(attributes.y1 ?? '0') * scaleY
    const x2 = parseFloat(attributes.x2 ?? '0') * scaleX
    const y2 = parseFloat(attributes.y2 ?? '0') * scaleY
    if (isFold || isFoldColor(attributes.stroke)) {
      const isH = Math.abs(y2 - y1) < 0.5
      const isV = Math.abs(x2 - x1) < 0.5
      out.push({ x1, y1, x2, y2, isHorizontal: isH, isVertical: isV })
    }
  }

  // Handle <path> elements that are fold lines
  if (name === 'path' && (isFold || isFoldColor(attributes.stroke))) {
    const d = attributes.d ?? ''
    const rawSegs = pathToSegments(d, scaleX, scaleY)
    for (const [x1, y1, x2, y2] of rawSegs) {
      if (x1 === x2 && y1 === y2) continue
      const isH = Math.abs(y2 - y1) < 0.5
      const isV = Math.abs(x2 - x1) < 0.5
      out.push({ x1, y1, x2, y2, isHorizontal: isH, isVertical: isV })
    }
  }

  for (const child of (children ?? [])) {
    walkNode(child, scaleX, scaleY, isFold, out)
  }
}

// ── Side-count hint extraction ───────────────────────────────────
// Reads the number of polygon sides from templatemaker.nl naming conventions:
// 1. element IDs like "merged-fold-base-i-5" → max index + 1 = 6 sides
// 2. URL parameter N= in dc:source metadata

function extractSideHint(svgContent: string): number | undefined {
  // Strategy 1: base-i-N pattern in element IDs
  let maxIdx = -1
  let m: RegExpExecArray | null
  const re = /base-i-(\d+)/g
  while ((m = re.exec(svgContent)) !== null) {
    const idx = parseInt(m[1])
    if (idx > maxIdx) maxIdx = idx
  }
  if (maxIdx >= 2) return maxIdx + 1

  // Strategy 2: N= parameter in source URL (templatemaker.nl etc.)
  const nMatch = svgContent.match(/[?&]N=(\d+)/)
  if (nMatch) {
    const n = parseInt(nMatch[1])
    if (n >= 3 && n <= 20) return n
  }

  return undefined
}

// ── Public API ──────────────────────────────────────────────────

export function parseSvgDieline(svgContent: string): ParsedSVGDieline {
  const root = parseSync(svgContent)
  const attrs = root.attributes

  // Determine document dimensions in mm
  const rawW = attrs.width  ?? attrs['inkscape:document-units'] ?? '0'
  const rawH = attrs.height ?? '0'

  let widthMm  = parseDimension(rawW)
  let heightMm = parseDimension(rawH)

  // Fallback: use viewBox if width/height missing or zero
  if ((widthMm < 1 || heightMm < 1) && attrs.viewBox) {
    const vb = attrs.viewBox.trim().split(/\s+/).map(Number)
    if (vb.length >= 4) {
      // No unit — assume px at 96dpi
      widthMm  = vb[2] * (25.4 / 96)
      heightMm = vb[3] * (25.4 / 96)
    }
  }

  // Scale from SVG user units to mm
  const vb      = (attrs.viewBox ?? '').trim().split(/\s+/).map(Number)
  const vbW     = vb[2] || (widthMm  * (96 / 25.4))
  const vbH     = vb[3] || (heightMm * (96 / 25.4))
  const scaleX  = widthMm  / vbW
  const scaleY  = heightMm / vbH

  // Walk tree collecting fold segments
  const foldSegments: FoldSegment[] = []
  for (const child of (root.children ?? [])) {
    walkNode(child, scaleX, scaleY, false, foldSegments)
  }

  const sideHint = extractSideHint(svgContent)

  // Run 3-pass topology cleanup so callers get clean closed loops + open chains
  const topology = normalizeTopology(
    foldSegments.map(s => ({ x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2, role: 'fold' as const }))
  )

  return { widthMm, heightMm, foldSegments, sideHint, topology }
}
