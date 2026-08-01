// Crush-Factor — physical cardboard deformation at fold creases.
// Models the micro-buckling of flute walls as a panel folds.
// Each vertex near a hinge receives a perpendicular inward displacement
// proportional to sin²(θ/2), peaking at 90° and zero at flat/fully folded.
//
// γ (gamma) is the material-specific max crush depth as a fraction of panel width.
// Source: FEFCO structural test data & empirical packaging lab measurements.

export type MaterialClass = 'sbs' | 'cuk' | 'ondule' | 'kraft' | 'pp' | 'pet' | 'default'

// Max crush fraction γ (perpendicular displacement / crease zone width)
const GAMMA: Record<MaterialClass, number> = {
  sbs:    0.10,  // Solid Bleached Sulphate — stiff, low crush
  cuk:    0.12,  // Coated Unbleached Kraft
  ondule: 0.40,  // Corrugated — flutes collapse significantly
  kraft:  0.28,  // Recycled kraft / Testliner
  pp:     0.05,  // Polypropylene — near-zero crush (plastic hinge → livingHinge.ts)
  pet:    0.04,  // PET — minimal deformation
  default: 0.15,
}

// Width of the crush influence zone around each crease, in mm.
// Outside this zone, no deformation is applied.
const CREASE_ZONE_MM = 8

export function materialClassFromFluteType(fluteType?: string): MaterialClass {
  if (!fluteType) return 'default'
  const f = fluteType.toLowerCase()
  if (f.includes('sbs'))     return 'sbs'
  if (f.includes('cuk'))     return 'cuk'
  if (f.includes('gd') || f.includes('fp')) return 'cuk'
  if (f === 'b' || f === 'c' || f === 'e' || f === 'f' || f === 'n' || f === 'bc') return 'ondule'
  if (f.includes('kraft'))   return 'kraft'
  if (f.includes('pp'))      return 'pp'
  if (f.includes('pet'))     return 'pet'
  return 'default'
}

/**
 * Compute per-vertex crush deformation for a rectangular panel.
 *
 * @param posArr   - Float32Array of vertex positions [x,y,z, x,y,z, ...]
 * @param vertCount - number of vertices
 * @param fw       - panel width in scene units
 * @param fh       - panel height in scene units
 * @param angle    - current fold angle in radians (from DielineFaces useFrame)
 * @param hingeEdge - which edge is attached to the parent hinge: 'top'|'bottom'|'left'|'right'
 * @param matClass - material class for γ selection
 */
export function computeCrushDeformation(
  posArr: Float32Array,
  vertCount: number,
  fw: number,
  fh: number,
  angle: number,
  hingeEdge: 'top' | 'bottom' | 'left' | 'right',
  matClass: MaterialClass = 'default',
): void {
  const gamma   = GAMMA[matClass]
  const zoneLen = CREASE_ZONE_MM / 100   // mm → scene units (SC = 1/100)

  // sin²(θ/2) peaks at 90° — zero at flat (0°) and full fold (180°)
  const s  = Math.sin(angle / 2)
  const intensity = gamma * s * s

  if (intensity < 1e-5) return

  for (let i = 0; i < vertCount; i++) {
    const xi = i * 3
    const x = posArr[xi]
    const y = posArr[xi + 1]

    // Distance from the hinge edge (in scene units)
    let dist = 0
    switch (hingeEdge) {
      case 'top':    dist = fh / 2 - y; break
      case 'bottom': dist = y + fh / 2; break
      case 'left':   dist = x + fw / 2; break
      case 'right':  dist = fw / 2 - x; break
    }

    if (dist < 0 || dist > zoneLen) continue

    // Smooth falloff: 1 at crease → 0 at zone boundary
    const t = 1 - dist / zoneLen
    const dz = -intensity * t * t   // inward (negative Z)
    posArr[xi + 2] += dz
  }
}
