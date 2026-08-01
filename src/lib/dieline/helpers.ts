import type { BoxParams } from '../types'

export const MM_TO_PX = 3.7795275591

export function mmToPx(mm: number) {
  return mm * MM_TO_PX
}

export type FaceName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'flap' | 'glue'

// FoldNode — one node in the fold tree that drives 3D animation.
// The root node (anchor) sets worldPos; all others carry a hinge descriptor.
// polygon2D is populated by the SVG/DXF import pipeline for non-rectangular panels.
// Describes a non-rectangular panel shape for alpha-map clipping in 3D.
// Matches Packly's alpha-*.jpg technique but generated client-side via Canvas 2D.
export type AlphaShapeSpec =
  | { type: 'triangle'; tipEdge: 'top' | 'bottom' | 'left' | 'right' }
  | { type: 'tuckTongue'; roundFrac?: number }          // rounded-bottom tuck tab
  | { type: 'archCut'; radiusFrac: number; archEdge: 'top' | 'bottom' }  // handle arch die-cut
  | { type: 'roundedCorners'; radiusFrac?: number }     // all-corner rounding

export interface FoldNode {
  id: string                             // unique id: 'Front', 'Left', 'Panel_3'...
  label?: string                         // display name (optional)
  face?: FaceName                        // texture slot
  w: number                              // mm — panel width  (bounding box)
  h: number                              // mm — panel height
  polygon2D?: [number, number][]         // mm — exact contour in dieline plane (import only)
  worldPos?: [number, number, number]    // mm — world center (anchor only)
  hinge?: {
    pivotPos: [number, number, number]   // mm — hinge point in parent fold-group space
    panelPos: [number, number, number]   // mm — panel center relative to pivot
    axis:     [number, number, number]   // unit vector — rotation axis
    angle:    number                     // radians — target when foldProgress = 1
    seq:      [number, number]           // [start, end] in 0–1 animation range
    easing?:  'linear' | 'quad' | 'cubic' | 'easeIn' | 'easeInCubic' | 'easeOut' | 'easeOutCubic' | 'elastic' | 'back'
  }
  children: FoldNode[]
  isGlue?: boolean
  hingeRadius?: number         // mm — crease radius override (defaults to T/2)
  isLivingHinge?: boolean      // true for PP/HDPE/PET flexible plastics
  hingeThickness?: number      // mm — local thickness at living hinge zone
  uvOffset?: [number, number]  // UV origin shift for inter-panel continuity (0–1 in dieline space)
  uvScale?:  [number, number]  // UV scale for inter-panel continuity (1 = full dieline width/height)
  alphaShape?: AlphaShapeSpec  // non-rectangular panel shape — generates canvas alpha map at runtime
}

export interface DielineData {
  svgWidth: number
  svgHeight: number
  cutPath: string
  foldLines: string[]
  gluePaths: string[]
  bleedPath: string
  panels: Panel[]
  foldNode?: FoldNode   // when present, DielineFaces uses this tree to drive 3D fold
}

export interface Panel {
  x: number
  y: number
  w: number
  h: number
  label: string
}

// Convert a 2D fold-line direction (in SVG/dieline px) to a 3D rotation axis.
// Convention: SVG x→3D x, SVG y-down → 3D y-up (flip sign).
// Purely horizontal line → [1,0,0]; purely vertical → [0,1,0]; diagonal → normalized.
export function foldAxisFrom2D(
  p1: [number, number],
  p2: [number, number]
): [number, number, number] {
  const dx = p2[0] - p1[0]
  const dy = p2[1] - p1[1]    // SVG y is positive-down
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < 1e-6) return [0, 1, 0]
  // Flip y so SVG-down maps to Three.js +Y for the vertical axis
  return [dx / len, -dy / len, 0]
}

export function bleedRect(totalW: number, totalH: number, b: number) {
  return `M ${-b},${-b} L ${totalW+b},${-b} L ${totalW+b},${totalH+b} L ${-b},${totalH+b} Z`
}

export type ComputeFn = (p: BoxParams) => DielineData
