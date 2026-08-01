// #77-81 Structural resistance — BCT/McKee/ECT formulas

export interface StrengthResult {
  ect: number        // kN/m Edge Crush Test
  bct: number        // kg  Box Compression Test (McKee)
  stackLoad: number  // kg  practical stacking load (60% of BCT)
  fragile: boolean
  warnings: string[]
}

// Flute nominal thickness (mm) and ECT base at 125 g/m²
const FLUTE: Record<string, { thickness: number; ectBase: number }> = {
  G:  { thickness: 0.5, ectBase: 2.2 },
  F:  { thickness: 0.8, ectBase: 2.8 },
  E:  { thickness: 1.5, ectBase: 3.5 },
  B:  { thickness: 3.0, ectBase: 5.5 },
  C:  { thickness: 4.0, ectBase: 6.8 },
  BC: { thickness: 6.5, ectBase: 11.0 },
  EB: { thickness: 4.5, ectBase: 8.5 },
}

// ECT scales roughly linearly with grammage
function calcECT(fluteId: string, grammage: number): number {
  const spec = FLUTE[fluteId] ?? FLUTE['B']
  return spec.ectBase * (grammage / 125)
}

// McKee simplified formula: BCT (N) = 5.874 × ECT × √(Z × t)
// Z = perimeter (m), t = flute thickness (m)
function mckee(ect_kNm: number, perimMm: number, thicknessMm: number): number {
  return 5.874 * ect_kNm * Math.sqrt((perimMm / 1000) * (thicknessMm / 1000))
}

export function calcStrength(
  w: number, h: number, d: number,
  fluteId = 'B',
  grammage = 125,
): StrengthResult {
  const spec = FLUTE[fluteId] ?? FLUTE['B']
  const perim = 2 * (w + d)
  const ect = calcECT(fluteId, grammage)
  const bctN = mckee(ect, perim, spec.thickness)
  const bct = bctN / 9.81
  const stackLoad = bct * 0.6

  const warnings: string[] = []
  if (bct < 30) warnings.push(`BCT très bas (${bct.toFixed(0)} kg) — fragilité critique`)
  if (bct < 80) warnings.push(`BCT faible (${bct.toFixed(0)} kg) — emballage fragile`)
  if (h / Math.min(w, d) > 4) warnings.push('Ratio H/base > 4 — risque de flambement latéral')
  if (d < w * 0.12) warnings.push('Profondeur < 12% de la largeur — faible résistance à la compression')

  return { ect, bct, stackLoad, fragile: bct < 80, warnings }
}

export const FLUTE_NAMES: Record<string, string> = {
  G: 'G micro', F: 'F micro', E: 'E mini', B: 'B standard', C: 'C standard', BC: 'BC double', EB: 'EB double'
}

export const GRAMMAGE_PRESETS = [100, 112, 125, 150, 175, 200] as const
