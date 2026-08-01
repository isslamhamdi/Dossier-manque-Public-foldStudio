export function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
export function clamp01(t: number) { return Math.max(0, Math.min(1, t)) }

// ── Easing functions ────────────────────────────────────────────

// Quadratic in-out (legacy — tight & snappy)
export function easeIO(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }

// Cubic in-out — heavier, more realistic for thick cardboard panels
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// Ease In — panel resists at start, then gives (stiff cardboard)
export function easeIn(t: number): number { return t * t }
export function easeInCubic(t: number): number { return t * t * t }

// Ease Out — decelerates at end (panel settling)
export function easeOut(t: number): number { return t * (2 - t) }
export function easeOutCubic(t: number): number { return (--t) * t * t + 1 }

// Elastic out — slight bounce at end (rigid panel snapping into place)
export function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const c4 = (2 * Math.PI) / 3
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

// Back out — overshoots slightly then settles (spring-loaded lock flap)
export function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// ── Named easing registry ───────────────────────────────────────

export type EaseFnName =
  | 'linear'
  | 'quad'
  | 'cubic'
  | 'easeIn'
  | 'easeInCubic'
  | 'easeOut'
  | 'easeOutCubic'
  | 'elastic'
  | 'back'

const EASE_FNS: Record<EaseFnName, (t: number) => number> = {
  linear:      t => t,
  quad:        easeIO,
  cubic:       easeInOutCubic,
  easeIn:      easeIn,
  easeInCubic: easeInCubic,
  easeOut:     easeOut,
  easeOutCubic: easeOutCubic,
  elastic:     easeOutElastic,
  back:        easeOutBack,
}

// Map global foldProgress → local [0,1] for a [start,end] window.
// Defaults to 'cubic' for realistic cardboard weight.
export function seqT(
  global: number,
  start: number,
  end: number,
  easeFn: EaseFnName = 'cubic'
): number {
  if (global <= start) return 0
  if (global >= end)   return 1
  return EASE_FNS[easeFn]((global - start) / (end - start))
}

// ── SLERP helper ────────────────────────────────────────────────
// Use SLERP (not Euler lerp) when blending between two known orientations.
// import { slerpQuats } from './animationUtils'
// ref.quaternion.copy(slerpQuats(startQuat, endQuat, t))
import * as THREE from 'three'

const _q = new THREE.Quaternion()
export function slerpQuats(
  a: THREE.Quaternion,
  b: THREE.Quaternion,
  t: number
): THREE.Quaternion {
  return _q.slerpQuaternions(a, b, t)
}
