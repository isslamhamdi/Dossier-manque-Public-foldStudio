export type RenderSceneKey =
  | 'studio_white' | 'wooden_table' | 'marble' | 'dark' | 'outdoor' | 'luxury'
  | 'concrete' | 'colored' | 'glass' | 'velvet' | 'custom'
  | 'monochrome_studio' | 'brown_photostudio' | 'studio_small'

export interface CustomSceneConfig {
  bg: string
  floorColor: string
  floorRoughness: number
  floorMetalness: number
  lightTemp: 'warm' | 'neutral' | 'cool'
}

export interface SceneConfig {
  env: 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse'
  hdrFile?: string
  bg: string
  hemiSky: string; hemiGround: string; hemiIntensity: number
  dir1: { pos: [number, number, number]; intensity: number; color: string }
  dir2: { pos: [number, number, number]; intensity: number; color: string }
  floor: { color: string; roughness: number; metalness: number; texture?: 'wood' | 'marble' | 'concrete' }
  shadowOpacity: number; shadowColor: string
}

export const SCENE_CONFIGS: Record<RenderSceneKey, SceneConfig> = {
  studio_white: {
    env: 'studio', hdrFile: '/hdri/pacdora_studio.hdr', bg: '#f8f8f8',
    hemiSky: '#f0f0f0', hemiGround: '#e0e0e0', hemiIntensity: 1.2,
    dir1: { pos: [5, 4, 5], intensity: 0.75, color: '#ffffff' },
    dir2: { pos: [-5, 2, 3], intensity: 0.4, color: '#e8f0ff' },
    floor: { color: '#f0f0f0', roughness: 0.95, metalness: 0 },
    shadowOpacity: 0.18, shadowColor: '#604840',
  },
  wooden_table: {
    env: 'apartment', hdrFile: '/hdri/wooden_studio.exr', bg: '#c4a878',
    hemiSky: '#ffe8b0', hemiGround: '#a06030', hemiIntensity: 0.8,
    dir1: { pos: [6, 6, 4], intensity: 1.3, color: '#fff0d0' },
    dir2: { pos: [-3, 2, 3], intensity: 0.25, color: '#d09040' },
    floor: { color: '#7a5c3a', roughness: 0.75, metalness: 0, texture: 'wood' },
    shadowOpacity: 0.4, shadowColor: '#3a1800',
  },
  marble: {
    env: 'lobby', hdrFile: '/hdri/white_studio.exr', bg: '#e8e4e0',
    hemiSky: '#ffffff', hemiGround: '#d0c8c0', hemiIntensity: 1.0,
    dir1: { pos: [5, 6, 4], intensity: 1.0, color: '#ffffff' },
    dir2: { pos: [-4, 3, 2], intensity: 0.5, color: '#e8ecff' },
    floor: { color: '#ede9e5', roughness: 0.08, metalness: 0, texture: 'marble' },
    shadowOpacity: 0.12, shadowColor: '#504848',
  },
  dark: {
    env: 'night', bg: '#0e0e14',
    hemiSky: '#1020a0', hemiGround: '#050508', hemiIntensity: 0.15,
    dir1: { pos: [6, 5, 3], intensity: 2.5, color: '#7088ff' },
    dir2: { pos: [-5, 2, -2], intensity: 0.8, color: '#ff6633' },
    floor: { color: '#18181f', roughness: 0.35, metalness: 0.45 },
    shadowOpacity: 0.7, shadowColor: '#030306',
  },
  outdoor: {
    env: 'park', bg: '#b8d4e8',
    hemiSky: '#d0eaff', hemiGround: '#98a888', hemiIntensity: 1.5,
    dir1: { pos: [8, 10, 5], intensity: 1.8, color: '#fffde8' },
    dir2: { pos: [-4, 4, 2], intensity: 0.35, color: '#80b0d0' },
    floor: { color: '#b0a890', roughness: 0.95, metalness: 0 },
    shadowOpacity: 0.28, shadowColor: '#404030',
  },
  luxury: {
    env: 'sunset', bg: '#1a1210',
    hemiSky: '#3a1808', hemiGround: '#080504', hemiIntensity: 0.1,
    dir1: { pos: [5, 5, 3], intensity: 1.6, color: '#ffd070' },
    dir2: { pos: [-3, 3, -2], intensity: 0.3, color: '#6030a0' },
    floor: { color: '#28201a', roughness: 0.18, metalness: 0.65 },
    shadowOpacity: 0.7, shadowColor: '#100808',
  },
  concrete: {
    env: 'warehouse', bg: '#b8b4b0',
    hemiSky: '#c8c4c0', hemiGround: '#888480', hemiIntensity: 0.9,
    dir1: { pos: [2, 8, 4], intensity: 1.2, color: '#e0dcd8' },
    dir2: { pos: [-6, 3, 2], intensity: 0.3, color: '#a0b0c0' },
    floor: { color: '#9a9690', roughness: 0.95, metalness: 0, texture: 'concrete' },
    shadowOpacity: 0.35, shadowColor: '#302820',
  },
  colored: {
    env: 'studio', bg: '#2840b0',
    hemiSky: '#4060c0', hemiGround: '#1828a0', hemiIntensity: 0.8,
    dir1: { pos: [5, 6, 5], intensity: 1.4, color: '#ffffff' },
    dir2: { pos: [-4, 3, 2], intensity: 0.4, color: '#c0c8ff' },
    floor: { color: '#2840b0', roughness: 0.92, metalness: 0 },
    shadowOpacity: 0.45, shadowColor: '#0a1060',
  },
  glass: {
    env: 'lobby', bg: '#e8ecf4',
    hemiSky: '#f0f4ff', hemiGround: '#c8d0e0', hemiIntensity: 1.0,
    dir1: { pos: [5, 6, 4], intensity: 1.2, color: '#ffffff' },
    dir2: { pos: [-3, 3, 2], intensity: 0.5, color: '#d0e4ff' },
    floor: { color: '#d0dce8', roughness: 0.03, metalness: 0.1 },
    shadowOpacity: 0.08, shadowColor: '#304060',
  },
  velvet: {
    env: 'night', bg: '#180a20',
    hemiSky: '#200830', hemiGround: '#040008', hemiIntensity: 0.05,
    dir1: { pos: [4, 6, 2], intensity: 2.8, color: '#ffd0a0' },
    dir2: { pos: [-5, 2, -3], intensity: 0.6, color: '#4020a0' },
    floor: { color: '#1a0a28', roughness: 0.98, metalness: 0 },
    shadowOpacity: 0.9, shadowColor: '#000000',
  },
  custom: {
    env: 'studio', bg: '#e8e8e8',
    hemiSky: '#f0f0f0', hemiGround: '#e0e0e0', hemiIntensity: 1.0,
    dir1: { pos: [5, 5, 5], intensity: 1.0, color: '#ffffff' },
    dir2: { pos: [-4, 3, 3], intensity: 0.4, color: '#d0d8ff' },
    floor: { color: '#d0d0d0', roughness: 0.8, metalness: 0 },
    shadowOpacity: 0.2, shadowColor: '#504840',
  },
  monochrome_studio: {
    env: 'studio', hdrFile: '/hdri/monochrome_studio_02.exr', bg: '#d8d8d8',
    hemiSky: '#e8e8e8', hemiGround: '#c0c0c0', hemiIntensity: 1.1,
    dir1: { pos: [5, 6, 4], intensity: 0.9, color: '#ffffff' },
    dir2: { pos: [-4, 3, 2], intensity: 0.45, color: '#e8eeff' },
    floor: { color: '#cccccc', roughness: 0.90, metalness: 0 },
    shadowOpacity: 0.20, shadowColor: '#484848',
  },
  brown_photostudio: {
    env: 'apartment', hdrFile: '/hdri/brown_photostudio_03.exr', bg: '#c8a880',
    hemiSky: '#f0d8b0', hemiGround: '#8c5820', hemiIntensity: 0.7,
    dir1: { pos: [6, 6, 4], intensity: 1.2, color: '#ffecc0' },
    dir2: { pos: [-4, 2, 3], intensity: 0.3, color: '#c07030' },
    floor: { color: '#a08060', roughness: 0.80, metalness: 0, texture: 'wood' },
    shadowOpacity: 0.38, shadowColor: '#3a1400',
  },
  studio_small: {
    env: 'studio', hdrFile: '/hdri/studio_small_09.exr', bg: '#f0ede8',
    hemiSky: '#f8f5f0', hemiGround: '#d8d0c8', hemiIntensity: 1.2,
    dir1: { pos: [4, 7, 5], intensity: 1.1, color: '#fff8f0' },
    dir2: { pos: [-5, 3, 2], intensity: 0.35, color: '#e0e8ff' },
    floor: { color: '#e8e4e0', roughness: 0.88, metalness: 0 },
    shadowOpacity: 0.16, shadowColor: '#504840',
  },
}

const LIGHT_TEMPS = {
  warm:    { hemiSky: '#ffe8c0', hemiGround: '#a06030', d1: '#fff0c0', d2: '#ff8030' },
  neutral: { hemiSky: '#f0f0f0', hemiGround: '#d0d0d0', d1: '#ffffff', d2: '#c0d0ff' },
  cool:    { hemiSky: '#c0d8ff', hemiGround: '#8090a0', d1: '#d8ecff', d2: '#6080ff' },
}

export function buildCustomCfg(c: CustomSceneConfig): SceneConfig {
  const lt = LIGHT_TEMPS[c.lightTemp]
  return {
    env: 'studio',
    bg: c.bg,
    hemiSky: lt.hemiSky, hemiGround: lt.hemiGround, hemiIntensity: 1.0,
    dir1: { pos: [5, 5, 5], intensity: 1.0, color: lt.d1 },
    dir2: { pos: [-4, 3, 3], intensity: 0.4, color: lt.d2 },
    floor: { color: c.floorColor, roughness: c.floorRoughness, metalness: c.floorMetalness },
    shadowOpacity: 0.25, shadowColor: '#504840',
  }
}
