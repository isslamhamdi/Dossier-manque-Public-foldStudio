import * as THREE from 'three'
import {
  getCardboardColorMap, getCardboardBumpMap,
  getKraftColorMap, getKraftBumpMap,
  getKraftPbrColor, getKraftPbrNormal, getKraftPbrRoughness,
  getCardboardVariantTex,
  getVariantColor, getVariantNormal, getVariantRoughness,
  getMetallicColorMap, getMetallicBumpMap,
  getAluminumColorMap, getAluminumBumpMap,
  getMarbleColorMap, getMarbleBumpMap,
  getLeatherBumpMap,
  getHolographicBumpMap,
  getCardboardPbrColor, getCardboardPbrNormal, getCardboardPbrRoughness,
  getGD2PbrColor, getGD2PbrNormal, getGD2PbrRoughness,
} from '../../lib/textures'
import { getFluteSpec } from '../../lib/flutes'
import type { FluteSpec } from '../../lib/flutes'
import { getCorrugatedDiffuse, getCorrugatedNormal, getCorrugatedRoughness } from '../../lib/textures'
// ↑ used only in buildCorrugatedRimMaterial (cross-section/edge material)

// Procedural micro-flute normal map: tangent-space normals from a sine-wave height field.
// One full flute period across the texture width → repeat count drives actual ridge density.
// Normal derivation: h(x) = sin(2πx), dh/dx = 2π·cos(2πx)·A
//   tangent-space normal = normalize(−dh/dx, 0, 1)  →  R = (Nx+1)/2, G = 0.5, B = (Nz+1)/2
const microFluteNormalCache = new Map<string, THREE.DataTexture>()

function getMicroFluteNormalMap(fluteSpec: FluteSpec): THREE.DataTexture {
  const key = fluteSpec.id
  if (microFluteNormalCache.has(key)) return microFluteNormalCache.get(key)!

  const W = 256, H = 4
  const data = new Uint8Array(W * H * 4)
  const amplitude = Math.min(fluteSpec.bumpScale * 6, 0.6)  // height derivative amplitude

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const phase = (x / W) * Math.PI * 2
      const dh  = Math.cos(phase) * amplitude
      const nx  = -dh, nz = 1.0
      const len = Math.sqrt(nx * nx + nz * nz)
      const idx = (y * W + x) * 4
      data[idx]     = Math.round(((nx / len) + 1) / 2 * 255)
      data[idx + 1] = 128   // Ny = 0 → 0.5 → 128
      data[idx + 2] = Math.round(((nz / len) + 1) / 2 * 255)
      data[idx + 3] = 255
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.LinearSRGBColorSpace
  tex.needsUpdate = true
  microFluteNormalCache.set(key, tex)
  return tex
}

// Procedural corrugation bump map: sine-wave normal texture for corrugated boards
const corrugationCache = new Map<string, THREE.DataTexture>()
function getCorrugationBumpMap(fluteSpec: FluteSpec): THREE.DataTexture | null {
  if (!fluteSpec.corrugated || fluteSpec.flutesPer30cm === 0) return null
  const key = fluteSpec.id
  if (corrugationCache.has(key)) return corrugationCache.get(key)!

  const W = 256, H = 64
  const data = new Uint8Array(W * H * 4)
  const pitch = 30 / fluteSpec.flutesPer30cm // mm per period, mapped to W pixels
  const pixPerMm = W / 30

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const phase = (x / pixPerMm / pitch) * Math.PI * 2
      const v = Math.sin(phase) * 0.5 + 0.5
      const idx = (y * W + x) * 4
      data[idx] = Math.round(v * 255)
      data[idx + 1] = Math.round(v * 255)
      data[idx + 2] = Math.round(v * 255)
      data[idx + 3] = 255
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.needsUpdate = true
  corrugationCache.set(key, tex)
  return tex
}

function blendHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const ra = (pa >> 16) & 0xff, ga = (pa >> 8) & 0xff, ba = pa & 0xff
  const rb = (pb >> 16) & 0xff, gb = (pb >> 8) & 0xff, bb = pb & 0xff
  const r = Math.round(ra + (rb - ra) * t)
  const g = Math.round(ga + (gb - ga) * t)
  const bv = Math.round(ba + (bb - ba) * t)
  return `#${((r << 16) | (g << 8) | bv).toString(16).padStart(6, '0')}`
}

export interface PBRTexSet {
  albedo:    THREE.Texture | null
  normal:    THREE.Texture | null
  roughness: THREE.Texture | null
  metallic:  THREE.Texture | null
}

interface FbMat {
  color: string
  roughness: number
  metalness: number
  clearcoat?: number
  clearcoatRoughness?: number
  iridescence?: number
  iridescenceIOR?: number
  sheen?: number
  sheenRoughness?: number
  sheenColor?: string
  transmission?: number
  ior?: number
  thickness?: number
  opacity?: number
  transparent?: boolean
  envMapIntensity?: number
  textureType?: string
  // GGX anisotropic microfacet distribution (Three.js r153+, WebGL2)
  // Models the oriented grain structure of brushed metals and foil laminates.
  // anisotropy: 0 = isotropic GGX, 1 = fully anisotropic (long highlight streaks)
  // anisotropyRotation: grain direction in radians (0 = horizontal grain)
  anisotropy?: number
  anisotropyRotation?: number
}

const FB: Record<string, FbMat> = {
  carton:            { color: '#ffffff', roughness: 0.88, metalness: 0, clearcoat: 0, envMapIntensity: 0.10, textureType: 'cardboard' },
  kraft:             { color: '#a87e4f', roughness: 0.95, metalness: 0, clearcoat: 0, envMapIntensity: 0.06, textureType: 'kraft' },
  'carton-fibre':    { color: '#b8a47c', roughness: 0.97, metalness: 0, clearcoat: 0, envMapIntensity: 0.06, textureType: 'cardboard-fibre' },
  'carton-vieilli':  { color: '#d4c08a', roughness: 0.90, metalness: 0, clearcoat: 0, envMapIntensity: 0.07, textureType: 'cardboard-vieilli' },
  'carton-recycle':  { color: '#8c7a60', roughness: 0.94, metalness: 0, clearcoat: 0, envMapIntensity: 0.05, textureType: 'cardboard-recycle' },
  'carton-froisse':  { color: '#c8b690', roughness: 0.88, metalness: 0, clearcoat: 0, envMapIntensity: 0.06, textureType: 'cardboard-froisse' },
  'carton-corrugue': { color: '#c0a878', roughness: 0.86, metalness: 0, clearcoat: 0, envMapIntensity: 0.06, textureType: 'cardboard-corrugue' },
  'kraft-fibre':     { color: '#a06828', roughness: 0.93, metalness: 0, clearcoat: 0, envMapIntensity: 0.06, textureType: 'kraft-fibre' },
  brillant:      { color: '#e8e4e0', roughness: 0.15, metalness: 0,    clearcoat: 0.9,  clearcoatRoughness: 0.05, envMapIntensity: 0.7 },
  metallique:    { color: '#b0b0b8', roughness: 0.22, metalness: 0.88, clearcoat: 0.4,  clearcoatRoughness: 0.12, envMapIntensity: 1.6, textureType: 'metallic',  anisotropy: 0.30, anisotropyRotation: 0 },
  aluminium:     { color: '#d4d4d8', roughness: 0.30, metalness: 0.92, clearcoat: 0.25, clearcoatRoughness: 0.12, envMapIntensity: 1.4, textureType: 'aluminum',  anisotropy: 0.45, anisotropyRotation: 0 },
  holographique: { color: '#ffffff', roughness: 0.04, metalness: 0.78, clearcoat: 1.0,  clearcoatRoughness: 0,   iridescence: 1, iridescenceIOR: 1.5, sheen: 0.5, sheenRoughness: 0.1, envMapIntensity: 2.2 },
  miroir:        { color: '#f0f0f0', roughness: 0.02, metalness: 1.0,  clearcoat: 1.0,  clearcoatRoughness: 0.01, envMapIntensity: 2.5 },
  marbre:        { color: '#ece8e2', roughness: 0.18, metalness: 0,    clearcoat: 0.7,  clearcoatRoughness: 0.08, envMapIntensity: 0.15, textureType: 'marble' },
  cuir:          { color: '#5c3a1e', roughness: 0.62, metalness: 0,    clearcoat: 0.2,  clearcoatRoughness: 0.3,  envMapIntensity: 0.08, textureType: 'leather' },
  personnalise:  { color: '#ffffff', roughness: 0.70, metalness: 0,    clearcoat: 0,    envMapIntensity: 0.1 },
  // Finitions premium #71-76
  'soft-touch':       { color: '#e8e2dc', roughness: 0.92, metalness: 0, clearcoat: 0.06, clearcoatRoughness: 0.9, envMapIntensity: 0.04, textureType: 'soft-touch' },
  'verni-uv':         { color: '#f4f0ec', roughness: 0.05, metalness: 0, clearcoat: 1.0,  clearcoatRoughness: 0.02, envMapIntensity: 1.2 },
  'dorure':           { color: '#d4a017', roughness: 0.08, metalness: 0.96, clearcoat: 1.0, clearcoatRoughness: 0.04, envMapIntensity: 2.8, textureType: 'foil',     anisotropy: 0.72, anisotropyRotation: 0 },
  'foil-argent':      { color: '#c8c8cc', roughness: 0.06, metalness: 0.96, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 2.6, textureType: 'foil',     anisotropy: 0.72, anisotropyRotation: 0 },
  'gaufrage':         { color: '#e0d8cc', roughness: 0.78, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.6, envMapIntensity: 0.08, textureType: 'emboss' },
  'pelliculage':      { color: '#f0ece8', roughness: 0.30, metalness: 0, clearcoat: 0.5,  clearcoatRoughness: 0.15, envMapIntensity: 0.5 },
  // Matières #116-135
  'carton-blanc':     { color: '#f8f6f2', roughness: 0.80, metalness: 0, clearcoat: 0.05, envMapIntensity: 0.08, textureType: 'carton-blanc' },
  'papier-couche':    { color: '#f5f3ef', roughness: 0.22, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.1, envMapIntensity: 0.35 },
  'transparent':      { color: '#ddf0ff', roughness: 0.06, metalness: 0, clearcoat: 1.0, clearcoatRoughness: 0.02, transmission: 0.92, ior: 1.46, thickness: 0.5, opacity: 0.55, transparent: true, envMapIntensity: 1.8 },
  'verre':            { color: '#c8e8f0', roughness: 0.02, metalness: 0, clearcoat: 1.0, clearcoatRoughness: 0.01, transmission: 0.96, ior: 1.52, thickness: 1.0, opacity: 0.4, transparent: true, envMapIntensity: 2.2 },
  'aluminium-aniso':  { color: '#c8ccd0', roughness: 0.18, metalness: 0.94, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.8, textureType: 'aluminum', anisotropy: 0.90, anisotropyRotation: 0 },
  'papier-kraft-rec': { color: '#9e7a48', roughness: 0.96, metalness: 0, clearcoat: 0, envMapIntensity: 0.05, textureType: 'gd2' },
  'velours':          { color: '#3a2040', roughness: 0.98, metalness: 0, sheen: 1.0, sheenRoughness: 0.4, sheenColor: '#8060a0', envMapIntensity: 0.05, textureType: 'velvet' },
  'plastique-mat':    { color: '#d0ccc8', roughness: 0.82, metalness: 0, clearcoat: 0.08, clearcoatRoughness: 0.8, envMapIntensity: 0.06 },
  'mousse-eva':       { color: '#f0e0c0', roughness: 0.96, metalness: 0, envMapIntensity: 0.02 },
  'tissu':            { color: '#c0a890', roughness: 0.98, metalness: 0, sheen: 0.6, sheenRoughness: 0.7, sheenColor: '#d4bc9c', envMapIntensity: 0.03, textureType: 'fabric' },
}

export function getDef(id: string): FbMat { return FB[id] ?? FB['brillant'] }

export function buildMaterial(presetId: string, customColor: string, side: THREE.Side, imageTex?: THREE.Texture | null, fluteId?: string): THREE.MeshPhysicalMaterial {
  const def = getDef(presetId)
  const fluteSpec = getFluteSpec(fluteId ?? 'E')

  // For cardboard-type presets, blend roughness from flute spec
  const isCardboardPreset = ['carton','kraft','personnalise','carton-fibre','carton-vieilli','carton-recycle','carton-froisse','carton-corrugue','kraft-fibre'].includes(presetId)
  const effectiveRoughness = isCardboardPreset
    ? Math.max(def.roughness, fluteSpec.roughness * 0.9)
    : def.roughness

  // For cardboard presets, tint with flute's natural color (subtle)
  const baseColor = presetId === 'personnalise'
    ? customColor
    : (isCardboardPreset && !imageTex)
      ? blendHex(def.color, fluteSpec.color, 0.18)
      : def.color

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(imageTex ? '#ffffff' : baseColor),
    roughness: effectiveRoughness,
    metalness: def.metalness,
    clearcoat: def.clearcoat ?? 0,
    clearcoatRoughness: def.clearcoatRoughness ?? 0.1,
    iridescence: def.iridescence ?? 0,
    iridescenceIOR: def.iridescenceIOR ?? 1.5,
    sheen: def.sheen ?? 0,
    sheenRoughness: def.sheenRoughness ?? 0.3,
    transmission: def.transmission ?? 0,
    ior: def.ior ?? 1.5,
    thickness: def.thickness ?? 0,
    opacity: def.opacity ?? 1,
    transparent: def.transparent ?? false,
    envMapIntensity: def.envMapIntensity ?? 0.5,
    side,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })
  if (def.sheenColor) mat.sheenColor = new THREE.Color(def.sheenColor)

  // GGX anisotropic microfacet distribution — models brushed-metal grain.
  // Three.js MeshPhysicalMaterial uses Trowbridge-Reitz GGX; enabling anisotropy
  // stretches the NDF along the tangent, producing the characteristic highlight
  // streak of hot-stamped foil, brushed aluminium, and métallisé finishes.
  if (def.anisotropy) {
    mat.anisotropy         = def.anisotropy
    mat.anisotropyRotation = def.anisotropyRotation ?? 0
  }

  // Store base values for live MatControls overrides (no material rebuild needed)
  mat.userData.baseRoughness = effectiveRoughness
  mat.userData.baseMetalness = def.metalness
  mat.userData.baseEnvMapIntensity = def.envMapIntensity ?? 0.5
  mat.userData.baseBumpScale = 0
  mat.userData.baseNormalScale = 1

  if (def.iridescence) {
    ;(mat as any).iridescenceThicknessRange = [200, 800]
    mat.sheenColor = new THREE.Color('#ffffff')
  }

  if (imageTex) {
    mat.map = imageTex
    return mat
  }

  const applyRepeat = (tex: THREE.Texture | null | undefined, u: number, v: number) => {
    if (!tex) return
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(u, v)
    // Don't force needsUpdate — TextureLoader automatically marks needsUpdate when image loads.
    // Calling needsUpdate before image arrives causes "no image data" warning + corrupt GPU state.
  }

  // Apply textures for all sides (interior faces use BackSide but still need texture)
  {
    switch (def.textureType) {
      case 'cardboard': {
        const color = getCardboardPbrColor()
        const normal = getCardboardPbrNormal()
        const roughness = getCardboardPbrRoughness()
        applyRepeat(color, 2, 2)
        applyRepeat(normal, 2, 2)
        applyRepeat(roughness, 2, 2)
        mat.map = color
        mat.normalMap = normal
        mat.normalScale.set(1.0, 1.0)
        mat.roughnessMap = roughness
        mat.roughness = 0.92
        mat.color.set('#ffffff')
        mat.userData.baseRoughness = 0.92
        break
      }
      case 'kraft': {
        const cm = getKraftPbrColor(), nm = getKraftPbrNormal(), rm = getKraftPbrRoughness()
        applyRepeat(cm, 2, 2); applyRepeat(nm, 2, 2); applyRepeat(rm, 2, 2)
        mat.map = cm; mat.normalMap = nm; mat.normalScale.set(1.0, 1.0)
        mat.roughnessMap = rm; mat.roughness = 0.95; mat.color.set('#ffffff')
        break
      }
      case 'gd2': {
        const cm = getGD2PbrColor(), nm = getGD2PbrNormal(), rm = getGD2PbrRoughness()
        applyRepeat(cm, 2, 2); applyRepeat(nm, 2, 2); applyRepeat(rm, 2, 2)
        mat.map = cm; mat.normalMap = nm; mat.normalScale.set(0.8, 0.8)
        mat.roughnessMap = rm; mat.roughness = 0.96; mat.color.set('#ffffff')
        break
      }
      case 'carton-blanc': {
        const cm = getVariantColor('carton-blanc'), nm = getVariantNormal('carton-blanc'), rm = getVariantRoughness('carton-blanc')
        applyRepeat(cm, 2, 2); applyRepeat(nm, 2, 2); applyRepeat(rm, 2, 2)
        mat.map = cm; mat.normalMap = nm; mat.normalScale.set(0.6, 0.6)
        mat.roughnessMap = rm; mat.roughness = 0.82; mat.color.set('#ffffff')
        break
      }
      case 'cardboard-fibre':
      case 'cardboard-vieilli':
      case 'cardboard-recycle': {
        const variant = def.textureType!
        const cm = getVariantColor(variant), nm = getVariantNormal(variant), rm = getVariantRoughness(variant)
        applyRepeat(cm, 2, 2); applyRepeat(nm, 2, 2); applyRepeat(rm, 2, 2)
        mat.map = cm; mat.normalMap = nm; mat.normalScale.set(1.0, 1.0)
        mat.roughnessMap = rm; mat.color.set('#ffffff')
        break
      }
      case 'cardboard-froisse':
      case 'cardboard-corrugue': {
        const cm = getCardboardColorMap(), bm = getCardboardBumpMap()
        applyRepeat(cm, 2, 2); applyRepeat(bm, 2, 2)
        mat.map = cm; mat.bumpMap = bm; mat.bumpScale = 0.022
        break
      }
      case 'kraft-fibre': {
        const cm = getVariantColor('kraft-fibre'), nm = getVariantNormal('kraft-fibre'), rm = getVariantRoughness('kraft-fibre')
        applyRepeat(cm, 2, 2); applyRepeat(nm, 2, 2); applyRepeat(rm, 2, 2)
        mat.map = cm; mat.normalMap = nm; mat.normalScale.set(1.0, 1.0)
        mat.roughnessMap = rm; mat.color.set('#ffffff')
        break
      }
      case 'metallic': {
        const cm = getMetallicColorMap(), bm = getMetallicBumpMap()
        applyRepeat(cm, 1, 1); applyRepeat(bm, 1, 1)
        mat.map = cm; mat.bumpMap = bm; mat.bumpScale = 0.003
        break
      }
      case 'aluminum': {
        const cm = getAluminumColorMap(), bm = getAluminumBumpMap()
        applyRepeat(cm, 1, 1); applyRepeat(bm, 1, 1)
        mat.map = cm; mat.bumpMap = bm; mat.bumpScale = 0.003
        break
      }
      case 'marble': {
        const cm = getMarbleColorMap(), bm = getMarbleBumpMap()
        applyRepeat(cm, 1, 1); applyRepeat(bm, 1, 1)
        mat.map = cm; mat.bumpMap = bm; mat.bumpScale = 0.003
        break
      }
      case 'leather': {
        const bm = getLeatherBumpMap()
        applyRepeat(bm, 0.8, 0.8)
        mat.bumpMap = bm; mat.bumpScale = 0.05
        break
      }
      case 'soft-touch': {
        // micro-velvet: near-flat bump, very high roughness gives velvet-like feel
        const bm = getLeatherBumpMap()
        applyRepeat(bm, 4, 4)
        mat.bumpMap = bm; mat.bumpScale = 0.008
        break
      }
      case 'foil': {
        // metallic foil — use aluminum texture tinted gold or silver via color
        const cm = getAluminumColorMap(), bm = getAluminumBumpMap()
        applyRepeat(cm, 1, 1); applyRepeat(bm, 1, 1)
        mat.map = cm; mat.bumpMap = bm; mat.bumpScale = 0.001
        mat.color.set(def.color)
        break
      }
      case 'emboss': {
        // gaufrage/embossing: cardboard base with pronounced bump
        const cm = getCardboardPbrColor(), bm = getCardboardPbrNormal()
        applyRepeat(cm, 2, 2); applyRepeat(bm, 2, 2)
        mat.map = cm; mat.normalMap = bm; mat.normalScale.set(3.5, 3.5)
        break
      }
      case 'velvet': {
        // velours: leather bump at fine scale + sheen
        const bm = getLeatherBumpMap()
        applyRepeat(bm, 6, 6)
        mat.bumpMap = bm; mat.bumpScale = 0.012
        break
      }
      case 'fabric': {
        // tissu: woven texture simulated via leather bump at fine grid
        const bm = getLeatherBumpMap()
        applyRepeat(bm, 8, 8)
        mat.bumpMap = bm; mat.bumpScale = 0.018
        break
      }
    }
    if (presetId === 'holographique') {
      const bm = getHolographicBumpMap()
      applyRepeat(bm, 0.5, 0.5)
      mat.bumpMap = bm; mat.bumpScale = 0.015
    }

    // Micro-flute procedural normal — overlays ridge detail on corrugated cardboard
    // when no photo-scanned normal map is already occupying the slot.
    if (isCardboardPreset && fluteSpec.corrugated && !mat.normalMap) {
      const fluteNm = getMicroFluteNormalMap(fluteSpec)
      // Repeat scales with ridge density: more flutes/30cm → tighter tiling
      const tileU = fluteSpec.flutesPer30cm / 6
      applyRepeat(fluteNm, tileU, 1)
      mat.normalMap = fluteNm
      mat.normalScale.set(fluteSpec.bumpScale, fluteSpec.bumpScale)
    }
  }

  // Persist final bumpScale so MatControls can multiply it
  mat.userData.baseBumpScale = mat.bumpScale
  mat.userData.baseNormalScale = mat.normalMap ? mat.normalScale.x : 1

  return mat
}

// Cache cloned rim textures by fluteId — clone() calls needsUpdate via copy() which warns
// every frame until the source image loads, so we limit it to one clone per flute type.
const rimTexCache = new Map<string, { diff: THREE.Texture; rough: THREE.Texture; norm: THREE.Texture }>()

// #80: Build the cardboard cross-section material for edges/thickness
export function buildCorrugatedRimMaterial(fluteId: string | undefined): THREE.MeshStandardMaterial {
  const fluteSpec = getFluteSpec(fluteId ?? 'E')

  const col = new THREE.Color(fluteSpec.color)
  col.multiplyScalar(1.35)

  const mat = new THREE.MeshStandardMaterial({
    color: col,
    roughness: fluteSpec.roughness,
    metalness: 0,
    envMapIntensity: 0.4,
  })

  if (fluteSpec.corrugated && fluteSpec.texRepeatPer100mm > 0) {
    const rU = fluteSpec.texRepeatPer100mm
    const cacheKey = fluteId ?? 'E'

    if (!rimTexCache.has(cacheKey)) {
      const srcDiff  = getCorrugatedDiffuse()
      const srcRough = getCorrugatedRoughness()
      const srcNorm  = getCorrugatedNormal()
      // Clone only if the source image has already loaded — copy() calls needsUpdate
      // which sets version=1, and if source.data is null Three.js warns every frame.
      // On first load (source not yet cached) we use the source directly to avoid noise.
      const loaded = srcDiff.source.data != null
      const diff  = loaded ? srcDiff.clone()  : srcDiff
      const rough = loaded ? srcRough.clone() : srcRough
      const norm  = loaded ? srcNorm.clone()  : srcNorm
      for (const tex of [diff, rough, norm]) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping
        tex.repeat.set(rU, 1)
      }
      diff.colorSpace  = THREE.SRGBColorSpace
      rough.colorSpace = THREE.LinearSRGBColorSpace
      norm.colorSpace  = THREE.LinearSRGBColorSpace
      rimTexCache.set(cacheKey, { diff, rough, norm })
    }

    const { diff: diffTex, rough: roughTex, norm: normalTex } = rimTexCache.get(cacheKey)!
    mat.map = diffTex
    mat.roughnessMap = roughTex
    mat.normalMap = normalTex
    mat.normalScale.set(fluteSpec.bumpScale * 12, fluteSpec.bumpScale * 12)
    mat.emissive = new THREE.Color(fluteSpec.color).multiplyScalar(0.18)
  } else {
    mat.emissive = new THREE.Color(fluteSpec.color).multiplyScalar(0.12)
  }

  return mat
}

export function buildHolographicMaterial(side: THREE.Side): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uCameraPos: { value: new THREE.Vector3() },
      uEnvIntensity: { value: 0.55 },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 uCameraPos;
      uniform float uEnvIntensity;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      vec3 hue2rgb(float h) {
        h = fract(h + 2.0);
        float r = abs(h * 6.0 - 3.0) - 1.0;
        float g = 2.0 - abs(h * 6.0 - 2.0);
        float b = 2.0 - abs(h * 6.0 - 4.0);
        return clamp(vec3(r, g, b), 0.0, 1.0);
      }

      void main() {
        vec3 viewDir = normalize(uCameraPos - vWorldPos);
        vec3 N = normalize(vWorldNormal);
        float freq = vWorldPos.x * 0.170 + vWorldPos.y * 0.090 + vWorldPos.z * 0.213;
        float viewShift = dot(viewDir, N);
        float hue = freq * 2.5 + viewShift * 0.6;
        vec3 irid = hue2rgb(hue);
        float fresnel = pow(1.0 - max(0.0, viewShift), 2.5);
        vec3 silver = vec3(0.88, 0.86, 0.90);
        vec3 color = mix(irid * 0.9, silver, 0.18);
        color = mix(color, vec3(1.0), fresnel * 0.35);
        float hemi = N.y * 0.5 + 0.5;
        vec3 hemiColor = mix(vec3(0.87, 0.82, 0.75), vec3(0.95, 0.94, 0.96), hemi);
        color *= mix(hemiColor, vec3(1.0), 0.55);
        color = pow(color, vec3(0.85));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side,
  })
}

// ── Spot Varnish overlay ShaderMaterial ─────────────────────────
// Simulates selective UV varnish on printed zones.
// Uses luminance of the image texture: dark (printed) areas get gloss.
// Fresnel effect: varnish is most visible at grazing angles.
// Blend mode: Additive — adds specular highlight on top of base material.

export function buildVarnishOverlay(
  imageTex: THREE.Texture,
  intensity: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap:       { value: imageTex },
      uIntensity: { value: intensity },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vUv = uv;
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal);
        vNormal = worldNormal;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vViewDir = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap;
      uniform float uIntensity;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec4 texel = texture2D(uMap, vUv);

        // Print coverage: dark pixels on a light substrate = ink deposited
        float lum = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
        float inkCoverage = clamp((0.88 - lum) * 1.6, 0.0, 1.0) * texel.a;

        // Fresnel: varnish sheen is strongest at grazing angles
        float NdotV = clamp(dot(normalize(vNormal), normalize(vViewDir)), 0.0, 1.0);
        float fresnel = pow(1.0 - NdotV, 2.2);
        float fresnelBase = 0.05 + fresnel * 0.95;

        // Final varnish contribution: warm near-white highlight + cold rim
        vec3 warmHighlight = vec3(1.00, 0.99, 0.97);
        vec3 coldRim       = vec3(0.92, 0.96, 1.00);
        vec3 varnishColor  = mix(warmHighlight, coldRim, fresnel);

        float alpha = inkCoverage * uIntensity * fresnelBase;
        gl_FragColor = vec4(varnishColor * alpha, alpha);
      }
    `,
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    side:        THREE.FrontSide,
  })
}
