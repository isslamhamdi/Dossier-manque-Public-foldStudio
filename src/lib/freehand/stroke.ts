/**
 * Perfect-freehand stroke algorithm — native implementation.
 * Port of steveruizok/perfect-freehand core math.
 * Input: array of [x, y] or [x, y, pressure] points.
 * Output: outline polygon as [x, y][] that forms a smooth variable-width stroke.
 */

export interface StrokeOptions {
  size?: number          // base stroke width (default 8)
  thinning?: number      // width reduction at start/end, 0-1 (default 0.5)
  smoothing?: number     // outline smoothing, 0-1 (default 0.5)
  streamline?: number    // input streamlining 0-1 (default 0.5)
  easing?: (t: number) => number
  simulatePressure?: boolean
  start?: { taper?: number; easing?: (t: number) => number }
  end?: { taper?: number; easing?: (t: number) => number }
  last?: boolean         // is this the final update?
}

type Pt = [number, number, number]  // x, y, pressure

const neg  = (a: Pt): Pt => [-a[0], -a[1], 0]
const add  = (a: Pt, b: Pt): Pt => [a[0]+b[0], a[1]+b[1], 0]
const sub  = (a: Pt, b: Pt): Pt => [a[0]-b[0], a[1]-b[1], 0]
const mul  = (a: Pt, t: number): Pt => [a[0]*t, a[1]*t, 0]
const per  = (a: Pt): Pt => [a[1], -a[0], 0]   // perpendicular
const lrp  = (a: Pt, b: Pt, t: number): Pt => add(mul(a, 1-t), mul(b, t))
const len  = (a: Pt) => Math.sqrt(a[0]*a[0] + a[1]*a[1])
const uni  = (a: Pt): Pt => { const l = len(a) || 1; return [a[0]/l, a[1]/l, 0] }
const dist = (a: Pt, b: Pt) => Math.sqrt((b[0]-a[0])**2 + (b[1]-a[1])**2)

function med(a: Pt, b: Pt): Pt { return [(a[0]+b[0])/2, (a[1]+b[1])/2, 0] }

// Cubic Bezier approximation for smooth curves
function toSvgPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  const d: string[] = [`M ${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`]
  for (let i = 1; i < pts.length - 1; i++) {
    const c = med(pts[i], pts[i+1])
    d.push(`Q ${pts[i][0].toFixed(2)},${pts[i][1].toFixed(2)} ${c[0].toFixed(2)},${c[1].toFixed(2)}`)
  }
  d.push(`L ${pts[pts.length-1][0].toFixed(2)},${pts[pts.length-1][1].toFixed(2)}`)
  return d.join(' ')
}

function getOutline(pts: Pt[], opts: Required<StrokeOptions>): Pt[] {
  const { size, thinning, smoothing, simulatePressure } = opts
  if (pts.length < 2) return []

  const left: Pt[] = [], right: Pt[] = []
  let prevVec = sub(pts[1], pts[0])

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i-1]
    const curr = pts[i]
    const vec = uni(sub(curr, prev))
    const mVec = uni(add(prevVec, vec))

    const vel = simulatePressure
      ? Math.min(dist(prev, curr) / (size * 2), 1)
      : curr[2]

    const pressure = simulatePressure
      ? Math.min(1, 1 - vel)
      : curr[2] || 0.5

    const t = Math.min(1, i / (pts.length - 1))
    const sp = Math.max(size - thinning * size, 0)
    const ep = size * (1 + thinning * (pressure - 1))
    const sw = sp + (ep - sp) * (smoothing * pressure + (1 - smoothing))

    const taperStart = (opts.start.taper && opts.start.easing) ? 1 - opts.start.easing(Math.min(1, t * (pts.length / opts.start.taper))) : 1
    const taperEnd   = (opts.end.taper   && opts.end.easing)   ? 1 - opts.end.easing(Math.min(1, (1-t) * (pts.length / opts.end.taper)))   : 1
    const taper = Math.min(taperStart, taperEnd)

    const half = mul(per(mVec), sw * taper * 0.5)
    left.push(add(curr, half))
    right.push(sub(curr, half))
    prevVec = vec
  }

  return [...left, ...right.reverse()]
}

export function getStroke(
  rawPts: Array<[number, number] | [number, number, number]>,
  opts: StrokeOptions = {}
): Pt[] {
  const {
    size = 8, thinning = 0.5, smoothing = 0.5, streamline = 0.5,
    easing = (t: number) => t,
    simulatePressure = true, last = false,
  } = opts

  const start = { taper: opts.start?.taper ?? 0, easing: opts.start?.easing ?? easing }
  const end   = { taper: opts.end?.taper   ?? 0, easing: opts.end?.easing   ?? easing }

  // Streamline (moving average)
  const pts: Pt[] = []
  for (let i = 0; i < rawPts.length; i++) {
    const [x, y, p = 0.5] = rawPts[i] as [number, number, number]
    if (i === 0) { pts.push([x, y, p]); continue }
    const prev = pts[pts.length - 1]
    pts.push([
      prev[0] + (x - prev[0]) * (1 - streamline),
      prev[1] + (y - prev[1]) * (1 - streamline),
      prev[2] + (p - prev[2]) * (1 - streamline),
    ])
  }

  const fullOpts = { size, thinning, smoothing, streamline, easing, simulatePressure, last, start, end }
  return getOutline(pts, fullOpts)
}

/** Convert getStroke output to SVG path "d" attribute */
export function strokeToSvgPath(outline: Pt[]): string {
  return toSvgPath(outline)
}

/** Convert getStroke output to closed polygon SVG path */
export function strokeToClosedPath(outline: Pt[]): string {
  if (outline.length < 2) return ''
  const path = outline.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  return path + ' Z'
}
