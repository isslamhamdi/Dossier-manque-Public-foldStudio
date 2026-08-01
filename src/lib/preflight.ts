/**
 * Preflight checks for print-ready packaging production.
 * Validates dimensions, bleed, ink coverage, and image resolution.
 */

import type { BoxParams, ImageLayer } from './types'
import type { DielineData } from './dieline'

export type PreflightSeverity = 'error' | 'warning' | 'info'

export interface PreflightIssue {
  id: string
  severity: PreflightSeverity
  title: string
  detail: string
  fix?: string
}

function hexToCmykTIC(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const k = 1 - Math.max(r, g, b)
  if (k === 1) return 100
  const c = (1 - r - k) / (1 - k)
  const m = (1 - g - k) / (1 - k)
  const y = (1 - b - k) / (1 - k)
  return Math.round((c + m + y + k) * 100)
}

function estimateImageDpi(layer: ImageLayer): number {
  // Estimate: if original image is ~96dpi screen, actual print DPI at current size
  // width in mm → inches
  const physicalWidthInch = (layer.width * layer.scale) / 25.4
  if (physicalWidthInch === 0) return 0
  // Assume original pixel width ≈ naturalWidth stored, else guess 800px
  const estimatedPx = layer.naturalWidth ?? 800
  return Math.round(estimatedPx / physicalWidthInch)
}

export function runPreflight(
  params: BoxParams,
  dieline: DielineData,
  imageLayers: ImageLayer[],
  exteriorColor: string,
  interiorColor: string,
): PreflightIssue[] {
  const issues: PreflightIssue[] = []

  // ── Dimensions ─────────────────────────────────────────────────────────────
  if (params.width < 30 || params.height < 30 || params.depth < 10) {
    issues.push({
      id: 'dim-too-small',
      severity: 'error',
      title: 'Dimensions trop petites',
      detail: `L=${params.width}mm H=${params.height}mm P=${params.depth}mm — risque de pli impossible`,
      fix: 'Augmenter au moins une dimension à ≥30mm',
    })
  }

  if (params.width > 600 || params.height > 600 || params.depth > 400) {
    issues.push({
      id: 'dim-too-large',
      severity: 'warning',
      title: 'Grandes dimensions',
      detail: `Vérifier que la feuille d'impression supporte ${params.width}×${params.height}mm`,
    })
  }

  // ── Bleed ──────────────────────────────────────────────────────────────────
  if (params.bleed < 3) {
    issues.push({
      id: 'bleed-low',
      severity: 'error',
      title: `Fond perdu insuffisant (${params.bleed}mm)`,
      detail: 'Le fond perdu standard pour offset est 3mm minimum',
      fix: 'Passer le fond perdu à 3mm',
    })
  } else if (params.bleed < 5) {
    issues.push({
      id: 'bleed-standard',
      severity: 'info',
      title: `Fond perdu ${params.bleed}mm`,
      detail: 'Correct pour impression offset. Pour numérique, 5mm recommandé',
    })
  }

  // ── Ink coverage ───────────────────────────────────────────────────────────
  const extTIC = hexToCmykTIC(exteriorColor)
  const intTIC = hexToCmykTIC(interiorColor)
  if (extTIC > 320) {
    issues.push({
      id: 'ink-ext-high',
      severity: 'error',
      title: `Couverture encre extérieure trop haute (TIC ${extTIC}%)`,
      detail: 'TIC > 320% provoque des problèmes de séchage et de repiquage',
      fix: 'Réduire la saturation ou augmenter la valeur de noir K',
    })
  }
  if (intTIC > 280) {
    issues.push({
      id: 'ink-int-high',
      severity: 'warning',
      title: `Couverture encre intérieure (TIC ${intTIC}%)`,
      detail: 'Intérieur avec forte couverture peut coller aux produits emballés',
    })
  }

  // ── Glue tab ───────────────────────────────────────────────────────────────
  if (params.glueTab < 8) {
    issues.push({
      id: 'glue-small',
      severity: 'warning',
      title: `Languette de collage petite (${params.glueTab}mm)`,
      detail: 'Collage difficile en dessous de 8mm. Minimum recommandé : 10mm',
    })
  }

  // ── Image layers ───────────────────────────────────────────────────────────
  for (const layer of imageLayers) {
    if (layer.opacity !== undefined && layer.opacity < 0.3) {
      issues.push({
        id: `layer-opacity-${layer.id}`,
        severity: 'warning',
        title: `Calque "${layer.id.slice(0, 8)}" : opacité faible (${Math.round(layer.opacity * 100)}%)`,
        detail: 'Les calques très transparents peuvent disparaître à l\'impression',
      })
    }

    const dpi = estimateImageDpi(layer)
    if (dpi > 0 && dpi < 150) {
      issues.push({
        id: `layer-res-${layer.id}`,
        severity: 'error',
        title: `Image à basse résolution (~${dpi} dpi)`,
        detail: `La taille d'impression actuelle est trop grande pour l'image. Min. recommandé : 300 dpi`,
        fix: 'Réduire la taille du calque ou utiliser une image plus grande',
      })
    } else if (dpi > 0 && dpi < 300) {
      issues.push({
        id: `layer-res-warn-${layer.id}`,
        severity: 'warning',
        title: `Image résolution moyenne (~${dpi} dpi)`,
        detail: 'Acceptable pour grands formats (>400mm), mais 300dpi conseillé',
      })
    }

    // Check if layer goes outside dieline bounds (outside bleed zone)
    const bleedMm = params.bleed
    if (layer.x < -bleedMm || layer.y < -bleedMm ||
        layer.x + layer.width * layer.scale > dieline.svgWidth + bleedMm ||
        layer.y + layer.height * layer.scale > dieline.svgHeight + bleedMm) {
      issues.push({
        id: `layer-overflow-${layer.id}`,
        severity: 'warning',
        title: 'Calque hors zone de découpe',
        detail: 'Un élément dépasse la zone de fond perdu et sera rogné',
      })
    }
  }

  // ── Structural integrity ─────────────────────────────────────────────
  // Aspect ratio: box too flat (depth << min(width,height)) or too tall
  const minDim = Math.min(params.width, params.depth)
  const aspectH = params.height / minDim
  if (aspectH > 5) {
    issues.push({
      id: 'struct-too-tall',
      severity: 'warning',
      title: `Boîte très haute (ratio H/min = ${aspectH.toFixed(1)})`,
      detail: 'Un ratio hauteur/base > 5 rend la boîte instable et difficile à fermer',
      fix: 'Réduire la hauteur ou augmenter la largeur/profondeur',
    })
  }
  if (params.depth < params.width * 0.1 || params.depth < 10) {
    issues.push({
      id: 'struct-too-flat',
      severity: 'error',
      title: 'Profondeur trop faible pour la structure',
      detail: `P=${params.depth}mm — la boîte ne peut pas se tenir ouverte`,
      fix: 'Augmenter la profondeur à ≥ 10% de la largeur et ≥ 10mm',
    })
  }

  // Glue tab vs depth — tab must be < depth to fold cleanly
  if (params.glueTab > params.depth * 0.8) {
    issues.push({
      id: 'struct-glue-vs-depth',
      severity: 'warning',
      title: `Languette (${params.glueTab}mm) trop grande vs profondeur (${params.depth}mm)`,
      detail: 'La languette de colle peut interférer avec les panneaux latéraux',
      fix: 'Réduire la languette à < 80% de la profondeur',
    })
  }

  // Wall area check: very wide, very shallow box = weak walls
  const wallArea = params.height * params.depth
  const baseArea = params.width * params.depth
  if (wallArea < baseArea * 0.15) {
    issues.push({
      id: 'struct-weak-walls',
      severity: 'info',
      title: 'Parois latérales réduites',
      detail: 'La surface des parois est faible par rapport à la base — rigidité limitée',
    })
  }

  // ── Thickness ──────────────────────────────────────────────────────────────
  if (params.thickness > 2) {
    issues.push({
      id: 'thickness-high',
      severity: 'info',
      title: `Épaisseur carton élevée (${params.thickness}mm)`,
      detail: 'Au-delà de 2mm, les lignes de pli peuvent craqueler si non rainées',
    })
  }

  // OK case
  if (issues.length === 0) {
    issues.push({
      id: 'all-ok',
      severity: 'info',
      title: 'Prêt pour production',
      detail: 'Aucun problème critique détecté. Fichier conforme pour impression.',
    })
  }

  return issues
}
