export interface MatControls {
  tiling: number
  displacementScale: number
  normalScale: number
  roughnessMult: number
  metalnessMult: number
  envIntensity: number
  sunIntensity: number
  varnishIntensity: number   // 0 = off, 1 = full spot UV on printed zones
}

export const DEFAULT_MAT_CONTROLS: MatControls = {
  tiling: 2,
  displacementScale: 1,
  normalScale: 1,
  roughnessMult: 1,
  metalnessMult: 1,
  envIntensity: 1,
  sunIntensity: 1,
  varnishIntensity: 0,
}
