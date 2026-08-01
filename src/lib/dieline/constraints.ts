// Manufacturing constraint solver — the "2D = 3D" invariant enforcer.
// Both the 2D dieline canvas and the 3D renderer call this same validator.
// Any parameter change that would produce a physically non-manufacturable
// patron is rejected here before it reaches either view.
// Rules are derived from FEFCO/ECMA-PIRA industrial standards.

import type { BoxParams, TemplateType } from '../types'

export interface ConstraintViolation {
  rule:     string               // machine-readable ID: 'MIN_PANEL_W', 'BEND_RADIUS', …
  severity: 'error' | 'warning' // error = blocks render; warning = shown but allowed
  message:  string               // human-readable French diagnostic
  face?:    string               // which panel/face is affected
}

// ── Material-specific limits ──────────────────────────────────────────────────

// Minimum bend radius = T × factor.  Below this, the outer liner tears at the crease.
// Source: FEFCO Design Guide §3.2, ECMA-PIRA Technical Manual.
const BEND_FACTOR: Record<string, number> = {
  flat_sbs: 1.0, flat_cuk: 1.0, flat_gd2: 1.2, flat_fp: 1.0,
  N: 2.0, F: 2.5, E: 3.0, B: 4.0, C: 5.0, BC: 7.0,
}

// Minimum panel size that a die-cutting press can cleanly punch.
// Corrugated boards need wider minimum zones because the flutes collapse on tight cuts.
const MIN_PANEL: Record<string, number> = {
  flat_sbs: 18, flat_cuk: 18, flat_gd2: 20, flat_fp: 18,
  N: 20, F: 22, E: 22, B: 25, C: 28, BC: 35,
}

// ── Template families ─────────────────────────────────────────────────────────

const BOX_FAMILY = new Set<TemplateType>([
  'box', 'tuck-end', 'seal-end', 'snap-lock', 'mailer',
  'reverse-tuck', 'flip-top', 'window-box', 'crash-lock-bottom', 'auto-bottom',
  'hsc-box', 'osc-box', 'fol-box', 'fefco-rsc', 'fefco-0713',
])

const TRAY_FAMILY = new Set<TemplateType>(['tray-box', 'fefco-tray', 'display'])

const RIGID_FAMILY = new Set<TemplateType>([
  'book-box', 'fourreau-rigide', 'drawer-box', 'lid-box',
])

const LABEL_FAMILY = new Set<TemplateType>([
  'shrink-sleeve', 'iml-label', 'flow-wrap', 'blister-pack',
  'sleeve-insert', 'thermoform-tray',
])

// ── Main validator ────────────────────────────────────────────────────────────

export function validateManufacturing(
  params: BoxParams,
  template: TemplateType = 'box',
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = []
  const { width: W, height: H, depth: D, glueTab: G, thickness: T } = params
  const fluteId   = params.fluteType ?? 'flat_sbs'
  const minPanel  = MIN_PANEL[fluteId]   ?? 20
  const bendFactor = BEND_FACTOR[fluteId] ?? 2.0
  const minBendR  = T * bendFactor

  // ── Universal rules (every template) ─────────────────────────────────────

  if (W < minPanel) violations.push({
    rule: 'MIN_PANEL_W', severity: 'error',
    message: `Largeur ${W}mm < minimum ${minPanel}mm (${fluteId}) — découpe impossible`,
    face: 'front',
  })

  if (H < minPanel) violations.push({
    rule: 'MIN_PANEL_H', severity: 'error',
    message: `Hauteur ${H}mm < minimum ${minPanel}mm (${fluteId}) — découpe impossible`,
    face: 'front',
  })

  if (!LABEL_FAMILY.has(template) && D < minPanel) violations.push({
    rule: 'MIN_PANEL_D', severity: 'error',
    message: `Profondeur ${D}mm < minimum ${minPanel}mm (${fluteId}) — pli de caissin impossible`,
    face: 'left',
  })

  if (T < 0.3) violations.push({
    rule: 'MIN_THICKNESS', severity: 'error',
    message: `Épaisseur ${T}mm < 0.3mm — matériau hors catalogue industriel`,
  })

  if (T > 12) violations.push({
    rule: 'MAX_THICKNESS', severity: 'error',
    message: `Épaisseur ${T}mm > 12mm — hors plage massicot standard`,
  })

  // Minimum bend radius: if depth is smaller than 2 × minBendR, the
  // 180° fold at the crease tears the outer liner.  depth ≥ 2 × minBendR is
  // required because a full side panel folds through a 90° arc of radius T/2,
  // and the crease itself must accommodate radius minBendR on the outside.
  if (!LABEL_FAMILY.has(template) && D < 2 * minBendR) violations.push({
    rule: 'BEND_RADIUS', severity: 'warning',
    message: `Profondeur ${D}mm : rayon de pli min = ${minBendR.toFixed(1)}mm (T×${bendFactor}) — déchirement liner possible`,
    face: 'left',
  })

  // ── Box-family rules ────────────────────────────────────────────────────

  if (BOX_FAMILY.has(template)) {
    const flapH = D / 2

    // Glue tab minimum: adhesion requires ≥ 10mm contact; corrugated needs more.
    const minGlue = Math.max(10, T * 5)
    if (G < minGlue) violations.push({
      rule: 'MIN_GLUE_TAB', severity: G < 6 ? 'error' : 'warning',
      message: `Patte de collage ${G.toFixed(1)}mm < ${minGlue.toFixed(0)}mm — adhérence insuffisante en usine`,
      face: 'glue',
    })

    // Flap closure: flap height = D/2.  Below 12mm the closure is unreliable;
    // below 8mm the erecting machine cannot grip the flap.
    if (flapH < 12) violations.push({
      rule: 'FLAP_TOO_SHORT', severity: flapH < 8 ? 'error' : 'warning',
      message: `Rabat ${flapH.toFixed(0)}mm (D/2) trop court — fermeture non fiable. Minimum D = 24mm`,
      face: 'top',
    })

    // Stack stability (FEFCO guideline EN 15902)
    const hBase = H / Math.min(W, D)
    if (hBase > 8) violations.push({
      rule: 'ASPECT_TOO_TALL', severity: 'error',
      message: `Ratio H/base = ${hBase.toFixed(1)} > 8 — instabilité en palettisation`,
    })
    if (hBase < 0.15 && H > 0) violations.push({
      rule: 'ASPECT_TOO_FLAT', severity: 'warning',
      message: `Ratio H/base = ${hBase.toFixed(2)} < 0.15 — tenue verticale difficile à la mise en boîte`,
    })

    // Total flat sheet dimensions vs. press maximum
    // Tube perimeter + glue tab in width; H + top&bottom flaps in height
    const sheetW = 2 * (W + D) + G
    const sheetH = H + D
    if (sheetW > 1600) violations.push({
      rule: 'SHEET_TOO_WIDE', severity: 'error',
      message: `Patron déplié ${sheetW.toFixed(0)}mm × … > 1600mm — hors format presse standard`,
    })
    if (sheetH > 1200) violations.push({
      rule: 'SHEET_TOO_TALL', severity: 'error',
      message: `Patron déplié … × ${sheetH.toFixed(0)}mm > 1200mm — hors format presse standard`,
    })
  }

  // ── Tray-family rules ───────────────────────────────────────────────────

  if (TRAY_FAMILY.has(template)) {
    if (H < 15) violations.push({
      rule: 'TRAY_WALL_LOW', severity: 'warning',
      message: `Paroi ${H}mm < 15mm — plateau fragile, maintien produit insuffisant`,
      face: 'front',
    })
    if (H > D * 4) violations.push({
      rule: 'TRAY_WALL_HIGH', severity: 'warning',
      message: `Ratio H/D = ${(H / D).toFixed(1)} > 4 — parois trop hautes pour un plateau, préférer une boîte`,
    })
  }

  // ── Rigid box rules (lid-box, book-box, fourreau-rigide) ───────────────

  if (RIGID_FAMILY.has(template) && T < 1.5) violations.push({
    rule: 'RIGID_BOX_THIN', severity: 'warning',
    message: `Épaisseur ${T}mm trop fine pour boîte rigide — minimum 1.5mm pour structure stablee`,
  })

  return violations
}

// Convenience: first blocking error string (backwards-compatible with old getDielineError)
export function getBlockingError(violations: ConstraintViolation[]): string | null {
  return violations.find(v => v.severity === 'error')?.message ?? null
}
