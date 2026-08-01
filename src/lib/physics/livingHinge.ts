// Living Hinge — flexible plastic hinge simulation.
//
// A living hinge is an ultra-thin zone in a plastic sheet that flexes
// instead of snapping. Common in PP, HDPE, and PET packaging.
//
// Physics model:
//   • Exterior surface (outside of bend): tensile stretch
//     ε_ext = (θ/2) × (t/2 + hingeT/2) / neutral_radius
//   • Interior surface (inside of bend): compressive strain
//     ε_int = −(θ/2) × (t/2 − hingeT/2) / neutral_radius
//   where neutral_radius = hingeT/2 for an ideal thin hinge.
//
// The neutral axis shifts toward the interior during large-angle bends.
// We model this with a material-specific neutral shift coefficient η:
//   η = 0 → neutral axis centered (linear elastic)
//   η = 0.4 → axis shifted 40% toward interior (PP behavior)
//
// Stress whitening:
//   When ε_ext exceeds the whitening threshold, the material appears white
//   (crazing of the polymer matrix). Modeled as a Gaussian bell on the GPU
//   in stressWhiteningShader.ts.

export type PlasticType = 'pp' | 'hdpe' | 'pet' | 'pla' | 'abs' | 'default'

export interface LivingHingeCoeffs {
  // Neutral axis shift (0=center, 1=fully interior)
  neutralShift: number
  // Whitening strain threshold — above this, crazing becomes visible
  whiteningThreshold: number
  // Max allowable strain before fracture
  fractureStrain: number
  // Bending stiffness multiplier (relative to card stock = 1.0)
  stiffness: number
}

const PLASTIC_COEFFS: Record<PlasticType, LivingHingeCoeffs> = {
  pp:      { neutralShift: 0.38, whiteningThreshold: 0.08, fractureStrain: 0.60, stiffness: 0.12 },
  hdpe:    { neutralShift: 0.30, whiteningThreshold: 0.12, fractureStrain: 0.50, stiffness: 0.18 },
  pet:     { neutralShift: 0.20, whiteningThreshold: 0.05, fractureStrain: 0.25, stiffness: 0.40 },
  pla:     { neutralShift: 0.10, whiteningThreshold: 0.03, fractureStrain: 0.08, stiffness: 0.65 },
  abs:     { neutralShift: 0.15, whiteningThreshold: 0.04, fractureStrain: 0.30, stiffness: 0.35 },
  default: { neutralShift: 0.25, whiteningThreshold: 0.08, fractureStrain: 0.40, stiffness: 0.25 },
}

export function plasticTypeFromFluteType(fluteType?: string): PlasticType {
  if (!fluteType) return 'default'
  const f = fluteType.toLowerCase()
  if (f.includes('pp'))   return 'pp'
  if (f.includes('hdpe')) return 'hdpe'
  if (f.includes('pet'))  return 'pet'
  if (f.includes('pla'))  return 'pla'
  if (f.includes('abs'))  return 'abs'
  return 'default'
}

export function getLivingHingeCoeffs(plasticType: PlasticType): LivingHingeCoeffs {
  return PLASTIC_COEFFS[plasticType] ?? PLASTIC_COEFFS.default
}

export interface LivingHingeState {
  // Strain at exterior surface (positive = tension)
  exteriorStrain: number
  // Strain at interior surface (negative = compression)
  interiorStrain: number
  // 0-1: how much whitening (0=none, 1=fully white/crazed)
  whiteningIntensity: number
  // true if strain exceeds fracture threshold
  isFractured: boolean
  // Effective stiffness torque (normalized, for animation easing)
  stiffnessTorque: number
}

/**
 * Compute the living hinge state for a given fold angle and material.
 *
 * @param thetaRad    - current fold angle in radians
 * @param hingeThickMm - living hinge zone thickness in mm (thinner = more flex)
 * @param panelThickMm - full panel thickness in mm
 * @param plasticType  - material type
 */
export function computeLivingHinge(
  thetaRad: number,
  hingeThickMm: number,
  panelThickMm: number,
  plasticType: PlasticType = 'default',
): LivingHingeState {
  const coeffs = getLivingHingeCoeffs(plasticType)
  const absTheta = Math.abs(thetaRad)

  // Neutral radius = half the hinge zone thickness
  const rn = hingeThickMm / 2

  // Neutral axis offset toward interior
  const offset = coeffs.neutralShift * rn

  // Half-thickness of panel at hinge zone
  const halfT = panelThickMm / 2

  // Exterior strain (tension) — axis shifted inward → exterior surface is farther
  const rExt = rn + offset + halfT
  const exteriorStrain = absTheta > 0 ? (rExt * absTheta / 2) / rn : 0

  // Interior strain (compression) — axis shifted inward → interior surface is closer
  const rInt = Math.max(rn - offset - halfT, rn * 0.01)
  const interiorStrain = absTheta > 0 ? -(rInt * absTheta / 2) / rn : 0

  // Whitening: Gaussian bell centered at whitening threshold
  const strainExcess = Math.max(0, exteriorStrain - coeffs.whiteningThreshold)
  // Bell width = 0.5 × (fracture - whitening)
  const bellWidth = Math.max(0.02, (coeffs.fractureStrain - coeffs.whiteningThreshold) * 0.5)
  const whiteningIntensity = Math.min(1, strainExcess / bellWidth)

  const isFractured = exteriorStrain >= coeffs.fractureStrain

  // Stiffness torque: resisting moment (normalized to 1 at 180°)
  // Uses tanh for soft-stop effect — PP yields at ~20-30°, then becomes compliant
  const stiffnessTorque = coeffs.stiffness * Math.tanh(absTheta * 2)

  return {
    exteriorStrain,
    interiorStrain,
    whiteningIntensity,
    isFractured,
    stiffnessTorque,
  }
}

/**
 * Per-vertex Z deformation for the living hinge zone.
 * The hinge zone (within hingeZoneMm of the crease) gets a smooth
 * convex bow: max displacement = halfT × sin(θ/2).
 */
export function applyLivingHingeDeformation(
  posArr: Float32Array,
  vertCount: number,
  fw: number,
  fh: number,
  thetaRad: number,
  hingeEdge: 'top' | 'bottom' | 'left' | 'right',
  hingeZoneMm: number,
  plasticType: PlasticType = 'default',
): void {
  const coeffs   = getLivingHingeCoeffs(plasticType)
  const absTheta = Math.abs(thetaRad)
  if (absTheta < 0.01) return

  const zoneLen = hingeZoneMm / 100   // mm → scene units
  const bow = (1 - coeffs.neutralShift) * Math.sin(absTheta / 2) * zoneLen * 0.3

  for (let i = 0; i < vertCount; i++) {
    const xi = i * 3
    const x  = posArr[xi]
    const y  = posArr[xi + 1]

    let dist = 0
    switch (hingeEdge) {
      case 'top':    dist = fh / 2 - y; break
      case 'bottom': dist = y + fh / 2; break
      case 'left':   dist = x + fw / 2; break
      case 'right':  dist = fw / 2 - x; break
    }

    if (dist < 0 || dist > zoneLen) continue

    const t  = 1 - dist / zoneLen
    // Smooth inward bow (opposite sign to crush)
    posArr[xi + 2] += bow * t * (1 - t) * 4
  }
}
