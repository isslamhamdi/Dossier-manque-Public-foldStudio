/**
 * Bitmap → SVG vector tracing.
 * Uses marching squares contour extraction + Ramer-Douglas-Peucker simplification.
 * Full Potrace quality (spline fitting, corner detection) requires the npm package;
 * this produces clean polyline output suitable for die-cut / sticker outlines.
 */

export interface TraceOptions {
  threshold?: number     // 0-255, default 128 (pixels darker than this = inside)
  simplify?: number      // RDP epsilon in px, default 1.5
  invert?: boolean       // trace light areas instead of dark
  paddingPx?: number     // expand/contract contour by N pixels, default 0
}

export interface TraceResult {
  svgPath: string        // SVG "d" attribute string
  width: number
  height: number
  contours: number       // number of separate shapes found
}

// ── Marching squares lookup ──────────────────────────────────────────────────

// Each cell has 4 corners: TL, TR, BR, BL (bits 3,2,1,0)
// Value = 1 if inside (dark), 0 if outside.
// 16 cases → list of edge midpoint pairs to draw.
// Midpoints: T=top, R=right, B=bottom, L=left (of cell)
const EDGES: Array<Array<[string, string]>> = [
  [],                         // 0000: all outside
  [['L', 'B']],              // 0001: BL inside
  [['B', 'R']],              // 0010: BR inside
  [['L', 'R']],              // 0011: BL+BR inside
  [['T', 'R']],              // 0100: TR inside (note: top-right bit = bit 2 in our ordering)
  [['L', 'B'], ['T', 'R']],  // 0101: ambiguous — two triangles
  [['T', 'B']],              // 0110: TR+BR inside
  [['L', 'T']],              // 0111: TR+BR+BL inside
  [['L', 'T']],              // 1000: TL inside
  [['T', 'B']],              // 1001: TL+BL inside
  [['L', 'T'], ['B', 'R']],  // 1010: ambiguous
  [['T', 'R']],              // 1011: TL+BR+BL
  [['L', 'R']],              // 1100: TL+TR
  [['B', 'R']],              // 1101: TL+TR+BL
  [['L', 'B']],              // 1110: TL+TR+BR
  [],                         // 1111: all inside
]

type Point = [number, number]

// Get midpoint coordinates for an edge type in a cell at (cx, cy)
function midpoint(edge: string, cx: number, cy: number): Point {
  switch (edge) {
    case 'T': return [cx + 0.5, cy]
    case 'B': return [cx + 0.5, cy + 1]
    case 'L': return [cx, cy + 0.5]
    case 'R': return [cx + 1, cy + 0.5]
    default:  return [cx + 0.5, cy + 0.5]
  }
}

// ── Ramer-Douglas-Peucker path simplification ────────────────────────────────

function rdpDist(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1])
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
}

function rdp(pts: Point[], eps: number): Point[] {
  if (pts.length <= 2) return pts
  let maxDist = 0, idx = 0
  for (let i = 1; i < pts.length - 1; i++) {
    const d = rdpDist(pts[i], pts[0], pts[pts.length - 1])
    if (d > maxDist) { maxDist = d; idx = i }
  }
  if (maxDist > eps) {
    return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
  }
  return [pts[0], pts[pts.length - 1]]
}

// ── Main trace function ──────────────────────────────────────────────────────

/**
 * Traces a bitmap image to SVG path.
 * `img` must be an HTMLImageElement that is already loaded.
 * Returns an SVG <path d="..."> string.
 */
export function traceImage(img: HTMLImageElement, opts: TraceOptions = {}): TraceResult {
  const { threshold = 128, simplify = 1.5, invert = false } = opts

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // Luminance grid: 1 = inside (dark), 0 = outside
  const grid = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3]
    if (a < 64) { grid[i] = invert ? 1 : 0; continue }
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    grid[i] = (lum < threshold) !== invert ? 1 : 0
  }

  const cell = (x: number, y: number) => (x >= 0 && x < width && y >= 0 && y < height) ? grid[y * width + x] : 0

  // Collect all edge segments from marching squares
  const segments: Array<[Point, Point]> = []
  for (let cy = 0; cy < height - 1; cy++) {
    for (let cx = 0; cx < width - 1; cx++) {
      const tl = cell(cx, cy), tr = cell(cx + 1, cy)
      const bl = cell(cx, cy + 1), br = cell(cx + 1, cy + 1)
      // Bit order: TL=3, TR=2, BR=1, BL=0
      const idx = (tl << 3) | (tr << 2) | (br << 1) | bl
      for (const [ea, eb] of EDGES[idx]) {
        segments.push([midpoint(ea, cx, cy), midpoint(eb, cx, cy)])
      }
    }
  }

  // Chain segments into polylines
  const polylines = chainSegments(segments)

  // Simplify and convert to SVG
  let svgPath = ''
  let contourCount = 0
  for (const poly of polylines) {
    if (poly.length < 3) continue
    const simplified = rdp(poly, simplify)
    if (simplified.length < 2) continue
    svgPath += `M ${simplified.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L ')} Z `
    contourCount++
  }

  return { svgPath: svgPath.trim(), width, height, contours: contourCount }
}

// ── Segment → polyline chaining ──────────────────────────────────────────────

function ptKey(p: Point): string { return `${p[0].toFixed(1)},${p[1].toFixed(1)}` }

function chainSegments(segs: Array<[Point, Point]>): Point[][] {
  // Build adjacency map
  const adj = new Map<string, Point[]>()
  for (const [a, b] of segs) {
    const ka = ptKey(a), kb = ptKey(b)
    if (!adj.has(ka)) adj.set(ka, [])
    if (!adj.has(kb)) adj.set(kb, [])
    adj.get(ka)!.push(b)
    adj.get(kb)!.push(a)
  }

  const visited = new Set<string>()
  const chains: Point[][] = []

  for (const startKey of Array.from(adj.keys())) {
    const neighbors = adj.get(startKey)!
    if (visited.has(startKey) || neighbors.length === 0) continue
    const chain: Point[] = []
    let curr = neighbors[0]
    let prev = startKey.split(',').map(Number) as unknown as Point
    chain.push(prev)

    while (true) {
      const k = ptKey(curr)
      if (visited.has(k)) break
      visited.add(k)
      chain.push(curr)
      const nexts = adj.get(k) ?? []
      const next = nexts.find(p => ptKey(p) !== ptKey(prev))
      if (!next) break
      prev = curr
      curr = next
    }

    if (chain.length >= 3) chains.push(chain)
  }

  return chains
}

// ── Browser entry point ──────────────────────────────────────────────────────

/**
 * Converts a File (PNG/JPG) to an SVG string via tracing.
 * Returns an SVG element as a string.
 */
export function traceFile(file: File, opts: TraceOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const result = traceImage(img, opts)
        URL.revokeObjectURL(url)
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${result.width}" height="${result.height}" viewBox="0 0 ${result.width} ${result.height}"><path d="${result.svgPath}" fill="#000" fill-rule="evenodd"/></svg>`
        resolve(svg)
      } catch (e) { reject(e) }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}
