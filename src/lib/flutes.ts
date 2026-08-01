// #80: Cardboard substrate database — inspired by florianfesti/boxes material DB
// https://github.com/florianfesti/boxes

export type FluteId =
  | 'flat_sbs'    // Solid Bleached Sulfate — luxury carton, white
  | 'flat_cuk'    // Coated Unbleached Kraft — brown kraft board
  | 'flat_gd2'    // Grey Duplex Board — recycled grey board
  | 'flat_fp'     // Folding Boxboard — high-end retail carton
  | 'N'           // Micro-flute N — 0.5mm, 90 flutes/30cm
  | 'F'           // Micro-flute F — 0.8mm, 128 flutes/30cm
  | 'E'           // E-flute — 1.2mm, 94 flutes/30cm (retail boxes)
  | 'B'           // B-flute — 3.0mm, 47 flutes/30cm (standard shipping)
  | 'C'           // C-flute — 4.0mm, 38 flutes/30cm (heavy shipping)
  | 'BC'          // Double-wall BC — 6.0mm, high-load

export interface FluteSpec {
  id: FluteId
  label: string
  shortLabel: string
  thickness: number       // mm — total board thickness
  flutesPer30cm: number   // 0 for flat board
  corrugated: boolean
  liners: number          // number of flat liner sheets (1 = mono, 2 = standard, 3 = double-wall)
  roughness: number       // PBR roughness of face liner
  bumpScale: number       // corrugation height for normal map
  color: string           // natural board color hex
  gsm: [number, number]   // typical grammage range g/m²
  description: string
  maxWeight: number        // max load per box (kg, typical)
  stackStrength: string   // qualitative: 'low' | 'medium' | 'high' | 'very-high'
  // UV texture repeat per 100mm of face width (calibrated from Cardboard-Side texture, 40 periods = 256mm tile at B-flute reference)
  texRepeatPer100mm: number
  // Tint factor for cross-section color mix (0=pure diffuse, 1=pure board color)
  rimTint: number
}

// texRepeatPer100mm: calibrated from Cardboard-Side_diffuse texture
// Texture tile = 40 periods × 6.4mm (B-flute pitch) = 256mm
// repeat = (pitch_B / pitch_flute) × (100 / 256) × 40 = 100 / (pitch_mm * 40/6.4 * 256/40)
// = 100 / (pitch_mm / 6.4 * 256) simplifies to: (6.4/pitch_mm) × (100/256) = 6.4/pitch_mm × 0.390625
const _r = (pitchMm: number) => pitchMm === 0 ? 0 : parseFloat((6.4 / pitchMm * 0.390625).toFixed(3))

export const FLUTE_SPECS: Record<FluteId, FluteSpec> = {
  flat_sbs: {
    id: 'flat_sbs', label: 'Carton SBS', shortLabel: 'SBS',
    thickness: 0.35, flutesPer30cm: 0, corrugated: false, liners: 1,
    roughness: 0.18, bumpScale: 0, texRepeatPer100mm: 0, rimTint: 0.9,
    color: '#F5F0E8',
    gsm: [250, 450], maxWeight: 1.5, stackStrength: 'low',
    description: 'Solid Bleached Sulfate — carton blanc luxe, impression offset haut de gamme',
  },
  flat_cuk: {
    id: 'flat_cuk', label: 'Carton Kraft', shortLabel: 'CUK',
    thickness: 0.5, flutesPer30cm: 0, corrugated: false, liners: 1,
    roughness: 0.88, bumpScale: 0, texRepeatPer100mm: 0, rimTint: 0.2,
    color: '#B08040',
    gsm: [200, 450], maxWeight: 2, stackStrength: 'low',
    description: 'Coated Unbleached Kraft — kraft naturel enduit, solide et écologique',
  },
  flat_gd2: {
    id: 'flat_gd2', label: 'Duplex gris', shortLabel: 'GD2',
    thickness: 0.7, flutesPer30cm: 0, corrugated: false, liners: 1,
    roughness: 0.92, bumpScale: 0, texRepeatPer100mm: 0, rimTint: 0.6,
    color: '#9A9080',
    gsm: [300, 600], maxWeight: 3, stackStrength: 'medium',
    description: 'Grey Duplex Board — carton gris recyclé, bon rapport rigidité/prix',
  },
  flat_fp: {
    id: 'flat_fp', label: 'Carton plié', shortLabel: 'FBB',
    thickness: 0.4, flutesPer30cm: 0, corrugated: false, liners: 1,
    roughness: 0.22, bumpScale: 0, texRepeatPer100mm: 0, rimTint: 0.9,
    color: '#F8F4EE',
    gsm: [220, 380], maxWeight: 1, stackStrength: 'low',
    description: 'Folding Boxboard — carton multicouche blanc, standard emballage alimentaire',
  },
  N: {
    id: 'N', label: 'N-flute (micro)', shortLabel: 'N',
    thickness: 0.5, flutesPer30cm: 90, corrugated: true, liners: 2,
    roughness: 0.82, bumpScale: 0.012, texRepeatPer100mm: _r(30/90), rimTint: 0.15,
    color: '#D4B896',
    gsm: [300, 450], maxWeight: 4, stackStrength: 'medium',
    description: 'Micro-cannelure N — très fin, idéal pour étuis et boîtes de présentation',
  },
  F: {
    id: 'F', label: 'F-flute (micro)', shortLabel: 'F',
    thickness: 0.8, flutesPer30cm: 128, corrugated: true, liners: 2,
    roughness: 0.80, bumpScale: 0.018, texRepeatPer100mm: _r(30/128), rimTint: 0.15,
    color: '#C8A878',
    gsm: [350, 500], maxWeight: 6, stackStrength: 'medium',
    description: 'Micro-cannelure F — équilibre finesse/résistance, boîtes retail premium',
  },
  E: {
    id: 'E', label: 'E-flute', shortLabel: 'E',
    thickness: 1.6, flutesPer30cm: 94, corrugated: true, liners: 2,
    roughness: 0.78, bumpScale: 0.028, texRepeatPer100mm: _r(30/94), rimTint: 0.12,
    color: '#C4A06A',
    gsm: [400, 650], maxWeight: 12, stackStrength: 'medium',
    description: 'Cannelure E — standard boîtes retail et e-commerce, très utilisé',
  },
  B: {
    id: 'B', label: 'B-flute', shortLabel: 'B',
    thickness: 3.0, flutesPer30cm: 47, corrugated: true, liners: 2,
    roughness: 0.90, bumpScale: 0.055, texRepeatPer100mm: _r(30/47), rimTint: 0.10,
    color: '#B89060',
    gsm: [500, 800], maxWeight: 20, stackStrength: 'high',
    description: 'Cannelure B — résistance accrue, transport et stockage industriel',
  },
  C: {
    id: 'C', label: 'C-flute', shortLabel: 'C',
    thickness: 4.0, flutesPer30cm: 38, corrugated: true, liners: 2,
    roughness: 0.92, bumpScale: 0.070, texRepeatPer100mm: _r(30/38), rimTint: 0.10,
    color: '#AA8458',
    gsm: [600, 1000], maxWeight: 30, stackStrength: 'high',
    description: 'Cannelure C — standard expédition, excellente résistance à l\'écrasement',
  },
  BC: {
    id: 'BC', label: 'Double paroi BC', shortLabel: 'BC',
    thickness: 6.0, flutesPer30cm: 38, corrugated: true, liners: 3,
    roughness: 0.93, bumpScale: 0.090, texRepeatPer100mm: _r(30/38), rimTint: 0.10,
    color: '#9A7850',
    gsm: [900, 1500], maxWeight: 60, stackStrength: 'very-high',
    description: 'Double paroi BC — charges lourdes, export, protection maximale',
  },
}

export const FLUTE_ORDER: FluteId[] = ['flat_sbs', 'flat_fp', 'flat_cuk', 'flat_gd2', 'N', 'F', 'E', 'B', 'C', 'BC']

export function getFluteSpec(id: FluteId | string | undefined): FluteSpec {
  return FLUTE_SPECS[(id as FluteId) ?? 'E'] ?? FLUTE_SPECS['E']
}

// Corrugation normal map: sine-wave bump frequency based on flute pitch
export function getFlutePitch(spec: FluteSpec): number {
  if (!spec.corrugated || spec.flutesPer30cm === 0) return 0
  return 30 / spec.flutesPer30cm // mm per flute period
}
