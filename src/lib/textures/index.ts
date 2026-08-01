import * as THREE from 'three'
import { mkTex } from './helpers'
import { cardboardCanvas } from './cardboard'
import { kraftCanvas } from './kraft'
import { metallicCanvas, aluminumCanvas } from './metallic'
import { marbleCanvas, leatherCanvas } from './organic'
import { holographicBumpCanvas } from './special'
import { getBitmap } from './preload'

export { normalMapFromHeightMap } from './special'
export { preloadTextures } from './preload'

let _cardColor: THREE.CanvasTexture | null = null
let _cardBump:  THREE.CanvasTexture | null = null
let _kraftColor: THREE.CanvasTexture | null = null
let _kraftBump:  THREE.CanvasTexture | null = null
let _metalColor: THREE.CanvasTexture | null = null
let _metalBump:  THREE.CanvasTexture | null = null
let _alColor: THREE.CanvasTexture | null = null
let _alBump:  THREE.CanvasTexture | null = null
let _marbleColor: THREE.CanvasTexture | null = null
let _marbleBump:  THREE.CanvasTexture | null = null
let _leatherColor: THREE.CanvasTexture | null = null
let _leatherBump:  THREE.CanvasTexture | null = null
let _holoBump: THREE.CanvasTexture | null = null

function mkTexFromBitmap(bitmap: ImageBitmap, repeat = 1): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(bitmap as unknown as HTMLCanvasElement)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  if (repeat !== 1) t.repeat.set(repeat, repeat)
  t.needsUpdate = true
  return t
}

export function getCardboardColorMap() {
  if (!_cardColor) {
    const bm = getBitmap('cardColor')
    _cardColor = bm ? mkTexFromBitmap(bm) : mkTex(cardboardCanvas(42, false))
  }
  return _cardColor!
}
export function getCardboardBumpMap() {
  if (!_cardBump) {
    const bm = getBitmap('cardBump')
    _cardBump = bm ? mkTexFromBitmap(bm) : mkTex(cardboardCanvas(29, true))
  }
  return _cardBump!
}
export function getKraftColorMap() {
  if (!_kraftColor) {
    const bm = getBitmap('kraftColor')
    _kraftColor = bm ? mkTexFromBitmap(bm) : mkTex(kraftCanvas(168,126,79,55,false))
    _kraftColor.repeat.set(.5,.5)
  }
  return _kraftColor!
}
export function getKraftBumpMap() {
  if (!_kraftBump) {
    const bm = getBitmap('kraftBump')
    _kraftBump = bm ? mkTexFromBitmap(bm) : mkTex(kraftCanvas(160,160,160,111,true))
    _kraftBump.repeat.set(.5,.5)
  }
  return _kraftBump!
}
export function getMetallicColorMap() {
  if (!_metalColor) {
    const bm = getBitmap('metalColor')
    _metalColor = bm ? mkTexFromBitmap(bm) : mkTex(metallicCanvas(200, false))
  }
  return _metalColor!
}
export function getMetallicBumpMap() {
  if (!_metalBump) {
    const bm = getBitmap('metalBump')
    _metalBump = bm ? mkTexFromBitmap(bm) : mkTex(metallicCanvas(210, true))
  }
  return _metalBump!
}
export function getAluminumColorMap() {
  if (!_alColor) {
    const bm = getBitmap('alColor')
    _alColor = bm ? mkTexFromBitmap(bm) : mkTex(aluminumCanvas(300, false))
  }
  return _alColor!
}
export function getAluminumBumpMap() {
  if (!_alBump) {
    const bm = getBitmap('alBump')
    _alBump = bm ? mkTexFromBitmap(bm) : mkTex(aluminumCanvas(310, true))
  }
  return _alBump!
}
export function getMarbleColorMap() {
  if (!_marbleColor) {
    const bm = getBitmap('marbleColor')
    _marbleColor = bm ? mkTexFromBitmap(bm) : mkTex(marbleCanvas(400, false))
  }
  return _marbleColor!
}
export function getMarbleBumpMap() {
  if (!_marbleBump) {
    const bm = getBitmap('marbleBump')
    _marbleBump = bm ? mkTexFromBitmap(bm) : mkTex(marbleCanvas(410, true))
  }
  return _marbleBump!
}
export function getLeatherColorMap() {
  if (!_leatherColor) {
    const bm = getBitmap('leatherColor')
    _leatherColor = bm ? mkTexFromBitmap(bm, 0.5) : mkTex(leatherCanvas(500, false), 0.5)
    _leatherColor.repeat.set(.5,.5)
  }
  return _leatherColor!
}
export function getLeatherBumpMap() {
  if (!_leatherBump) {
    const bm = getBitmap('leatherBump')
    _leatherBump = bm ? mkTexFromBitmap(bm, 0.5) : mkTex(leatherCanvas(510, true), 0.5)
    _leatherBump.repeat.set(.5,.5)
  }
  return _leatherBump!
}
export function getHolographicBumpMap() {
  if (!_holoBump) {
    const bm = getBitmap('holoBump')
    _holoBump = bm ? mkTexFromBitmap(bm) : mkTex(holographicBumpCanvas())
  }
  return _holoBump!
}

export function disposeAllTextures() {
  for (const t of [_cardColor,_cardBump,_kraftColor,_kraftBump,_metalColor,_metalBump,_alColor,_alBump,_marbleColor,_marbleBump,_leatherColor,_leatherBump,_holoBump,_cardPbrColor,_cardPbrNormal,_cardPbrRoughness,_kraftPbrColor,_kraftPbrNormal,_kraftPbrRoughness,_gd2PbrColor,_gd2PbrNormal,_gd2PbrRoughness]) t?.dispose()
  _cardColor=_cardBump=_kraftColor=_kraftBump=_metalColor=_metalBump=_alColor=_alBump=_marbleColor=_marbleBump=_leatherColor=_leatherBump=_holoBump=null
  _cardPbrColor=_cardPbrNormal=_cardPbrRoughness=_kraftPbrColor=_kraftPbrNormal=_kraftPbrRoughness=null
  _gd2PbrColor=_gd2PbrNormal=_gd2PbrRoughness=null
}

// ── aitextured.com cardboard variants ──────────────────────────────────────
// Source: https://aitextured.com/textures/seamless-pbr-cardboard-textures/ (free commercial)
// Place files at: public/textures/{variant}/{color,normal,roughness}.jpg
// Variants: cardboard-fibre, cardboard-vieilli, cardboard-recycle, cardboard-froisse, cardboard-corrugue, kraft-fibre
const _variantCache = new Map<string, THREE.Texture>()

export function getCardboardVariantTex(variant: string, mapType: 'color' | 'normal' | 'roughness'): THREE.Texture {
  const key = `${variant}:${mapType}`
  if (!_variantCache.has(key)) {
    const colorSpace = mapType === 'color' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace
    const tex = new THREE.TextureLoader().load(`/textures/${variant}/${mapType}.jpg`)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = colorSpace
    _variantCache.set(key, tex)
  }
  return _variantCache.get(key)!
}

// ── PBR face textures (CC0, ambientCG — Cardboard004 + Paper005) ─────────────
// Place files at:
//   public/textures/cardboard/pbr/{color,normal,roughness}.jpg  (Cardboard004 2K)
//   public/textures/kraft/{color,normal}.jpg                     (Paper005 2K)
// TextureLoader is async — returns placeholder until image loaded, no crash on 404.

function loadPBR(path: string, colorSpace: THREE.ColorSpace): THREE.Texture {
  // Set colorSpace only INSIDE onLoad — the THREE.js colorSpace setter calls needsUpdate=true,
  // which triggers "Texture marked for update but no image data found" if called before load.
  const tex = new THREE.TextureLoader().load(path, (t) => {
    t.colorSpace = colorSpace  // safe: image is loaded, needsUpdate=true is fine here
    t.needsUpdate = true
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

let _cardPbrColor: THREE.Texture | null = null
let _cardPbrNormal: THREE.Texture | null = null
let _cardPbrRoughness: THREE.Texture | null = null
let _kraftPbrColor: THREE.Texture | null = null
let _kraftPbrNormal: THREE.Texture | null = null

export function getCardboardPbrColor(): THREE.Texture {
  if (!_cardPbrColor) _cardPbrColor = loadPBR('/textures/cardboard/pbr/color.jpg', THREE.SRGBColorSpace)
  return _cardPbrColor
}
export function getCardboardPbrNormal(): THREE.Texture {
  if (!_cardPbrNormal) _cardPbrNormal = loadPBR('/textures/cardboard/pbr/normal.jpg', THREE.LinearSRGBColorSpace)
  return _cardPbrNormal
}
export function getCardboardPbrRoughness(): THREE.Texture {
  if (!_cardPbrRoughness) _cardPbrRoughness = loadPBR('/textures/cardboard/pbr/roughness.jpg', THREE.LinearSRGBColorSpace)
  return _cardPbrRoughness
}
export function getKraftPbrColor(): THREE.Texture {
  if (!_kraftPbrColor) _kraftPbrColor = loadPBR('/textures/kraft/color.jpg', THREE.SRGBColorSpace)
  return _kraftPbrColor
}
export function getKraftPbrNormal(): THREE.Texture {
  if (!_kraftPbrNormal) _kraftPbrNormal = loadPBR('/textures/kraft/normal.jpg', THREE.LinearSRGBColorSpace)
  return _kraftPbrNormal
}

let _kraftPbrRoughness: THREE.Texture | null = null
export function getKraftPbrRoughness(): THREE.Texture {
  if (!_kraftPbrRoughness) _kraftPbrRoughness = loadPBR('/textures/kraft/roughness.jpg', THREE.LinearSRGBColorSpace)
  return _kraftPbrRoughness
}

// ── GD2 / Chipboard (Chipboard001, ambientCG CC0) ─────────────────────────────
let _gd2PbrColor: THREE.Texture | null = null
let _gd2PbrNormal: THREE.Texture | null = null
let _gd2PbrRoughness: THREE.Texture | null = null

export function getGD2PbrColor(): THREE.Texture {
  if (!_gd2PbrColor) _gd2PbrColor = loadPBR('/textures/gd2/color.jpg', THREE.SRGBColorSpace)
  return _gd2PbrColor
}
export function getGD2PbrNormal(): THREE.Texture {
  if (!_gd2PbrNormal) _gd2PbrNormal = loadPBR('/textures/gd2/normal.jpg', THREE.LinearSRGBColorSpace)
  return _gd2PbrNormal
}
export function getGD2PbrRoughness(): THREE.Texture {
  if (!_gd2PbrRoughness) _gd2PbrRoughness = loadPBR('/textures/gd2/roughness.jpg', THREE.LinearSRGBColorSpace)
  return _gd2PbrRoughness
}

export function getVariantColor(variant: string): THREE.Texture { return getCardboardVariantTex(variant, 'color') }
export function getVariantNormal(variant: string): THREE.Texture { return getCardboardVariantTex(variant, 'normal') }
export function getVariantRoughness(variant: string): THREE.Texture { return getCardboardVariantTex(variant, 'roughness') }

// ── #80: Cardboard cross-section textures (extracted from Blender blend file) ─────────────
// Texture: Cardboard-Side_diffuse.png (Crafty-Textures, 4096×4096, B-flute cross-section)
// Optimized to 1024×1024 WebP for web use

let _corrDiffuse: THREE.Texture | null = null
let _corrNormal: THREE.Texture | null = null
let _corrRoughness: THREE.Texture | null = null

function loadWebP(path: string): THREE.Texture {
  const tex = new THREE.TextureLoader().load(path, (t) => {
    t.needsUpdate = true  // safe: image is loaded
  })
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function getCorrugatedDiffuse(): THREE.Texture {
  if (!_corrDiffuse) {
    _corrDiffuse = loadWebP('/textures/cardboard/side-diffuse-1k.webp')
  }
  return _corrDiffuse
}

export function getCorrugatedNormal(): THREE.Texture {
  if (!_corrNormal) {
    _corrNormal = loadWebP('/textures/cardboard/side-normal-1k.webp')
    _corrNormal.colorSpace = THREE.LinearSRGBColorSpace
  }
  return _corrNormal
}

export function getCorrugatedRoughness(): THREE.Texture {
  if (!_corrRoughness) {
    _corrRoughness = loadWebP('/textures/cardboard/side-roughness-1k.webp')
    _corrRoughness.colorSpace = THREE.LinearSRGBColorSpace
  }
  return _corrRoughness
}
