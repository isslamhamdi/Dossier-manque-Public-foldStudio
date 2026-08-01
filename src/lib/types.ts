export interface BoxParams {
  width: number
  height: number
  depth: number
  glueTab: number
  thickness: number
  bleed: number
  fluteType?: string  // #80: FluteId — cardboard substrate type
}

export interface LayerVisibility {
  decoupe: boolean
  pli: boolean
  collage: boolean
  fondPerdu: boolean
}

export type TemplateType =
  | 'box'
  | 'mailer'
  | 'tuck-end'
  | 'display'
  | 'flip-top'
  | 'gable'
  | 'seal-end'
  | 'snap-lock'
  | 'auto-bottom'
  | 'lid-box'
  | 'pillow-box'
  | 'drawer-box'
  | 'hexagonal-box'
  | 'cylinder-box'
  | 'tray-box'
  | 'reverse-tuck'
  | 'book-box'
  | 'stand-up-pouch'
  | 'crash-lock-bottom'
  | 'window-box'
  | 'sleeve-insert'
  | 'shrink-sleeve'
  | 'iml-label'
  | 'flow-wrap'
  | 'blister-pack'
  | 'ballotin'
  | 'fourreau-rigide'
  | 'thermoform-tray'
  | 'osc-box'
  | 'fol-box'
  | 'fefco-tray'
  | 'fefco-rsc'
  | 'fefco-0713'
  | 'hsc-box'
  | 'envelope'
  | 'shallow-box'
  | 'ear-box'
  | 'soufflet-partiel'
  | 'soufflet-ferme'
  | 'banderole'
  | 'banderole-fine'
  | 'handle-box'
  | 'hanging-box'
  | 'dispenser-box'
  | 'display-stand'
  | 'berlingot'
  | 'fourreau-auto'
  | 'fourreau-semi-auto'
  | 'calage-insert'
  | 'separateur'
  | 'etiquette-sac-ovale'
  | 'plateau-snap'
  | 'deluxe-soufflet'

export interface Template {
  id: TemplateType
  name: string
  description: string
}

export interface ImageLayer {
  id: string
  name: string
  src: string          // base64 data URL
  x: number            // mm on dieline
  y: number            // mm
  width: number        // mm (natural width / SCALE)
  height: number       // mm
  scale: number        // 1.0 = 100%
  rotation: number     // degrees
  visible: boolean
  locked: boolean
  faceAssignment: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'auto'
  opacity?: number       // 0–1, default 1
  kind?: 'image' | 'text' | 'barcode' | 'qr' | 'picto'  // layer type hint
  pictoId?: string    // original picto ID (for re-rendering)
  pictoColor?: string // current ink color
  pictoBg?: string    // background color ('none' = transparent)
  naturalWidth?: number  // original image pixel width (for DPI check)
  naturalHeight?: number
  patternFill?: {
    enabled: boolean
    type: 'none' | 'repeat' | 'stripes' | 'dots' | 'crosshatch'
    color: string
    size: number  // tile size in mm
    angle: number // degrees
  }
  clipMask?: boolean  // #30: clip layer to panel boundaries via SVG clipPath
  blendMode?: string  // #33: CSS mix-blend-mode for overprint simulation
  spotInk?: 'none' | 'gold' | 'silver' | 'varnish' | 'uv' | 'emboss'  // #28: encre spéciale
  flipH?: boolean  // #31: flip horizontal
  flipV?: boolean  // #31: flip vertical
  groupId?: string  // #374: group ID for linked layers
}

export interface MaterialColors {
  exterior: string  // hex e.g. '#FFFFFF'
  interior: string  // hex e.g. '#F0EDE8'
}

export interface MaterialPreset {
  id: string
  name: string
  color: string
  roughness: number
  metalness: number
  swatchStyle?: string  // CSS background for preview swatch
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'carton',         name: 'Carton',        color: '#D4C4A8', roughness: 0.92, metalness: 0, swatchStyle: 'repeating-linear-gradient(108deg,#D4C4A8 0px,#C8B898 1px,#D4C4A8 2px,#CEC0A0 5px,#D4C4A8 6px,#C6B690 7px,#D2C2A6 9px,#D4C4A8 10px)' },
  { id: 'kraft',          name: 'Kraft',         color: '#B5742A', roughness: 0.88, metalness: 0, swatchStyle: 'repeating-linear-gradient(108deg,#B5742A 0px,#A36620 1px,#B5742A 2px,#AC6C24 5px,#B5742A 6px,#9E601C 7px,#B07228 9px,#B5742A 10px)' },
  { id: 'carton-fibre',   name: 'Fibres',        color: '#B8A47C', roughness: 0.97, metalness: 0, swatchStyle: 'repeating-linear-gradient(112deg,#B8A47C 0px,#A49068 1px,#B8A47C 2px,#B09870 4px,#B8A47C 5px,#A08C62 6px,#B4A078 8px,#B8A47C 9px,#A49060 10px,#B8A47C 11px)' },
  { id: 'carton-vieilli', name: 'Vieilli',       color: '#D4C08A', roughness: 0.90, metalness: 0, swatchStyle: 'radial-gradient(ellipse at 30% 40%,#DDD090 0%,#C8AC70 40%,#D4C08A 60%,#E0CC94 80%,#CCBA7E 100%)' },
  { id: 'carton-recycle', name: 'Recyclé',       color: '#8C7A60', roughness: 0.94, metalness: 0, swatchStyle: 'repeating-linear-gradient(110deg,#8C7A60 0px,#786856 1px,#8C7A60 2px,#847060 5px,#8C7A60 6px,#766450 7px,#8A7860 9px,#8C7A60 10px)' },
  { id: 'carton-froisse', name: 'Froissé',       color: '#C8B690', roughness: 0.88, metalness: 0, swatchStyle: 'repeating-linear-gradient(45deg,#C8B690 0px,#B4A07C 1.5px,#C8B690 4px,#BCA884 5.5px,#C8B690 8px,#B09878 9.5px,#C8B690 12px)' },
  { id: 'carton-corrugue',name: 'Ondulé',        color: '#C0A878', roughness: 0.86, metalness: 0, swatchStyle: 'repeating-linear-gradient(90deg,#C0A878 0px,#C0A878 4px,#A89060 4px,#A89060 5px,#C0A878 5px,#C0A878 9px,#A89060 9px,#A89060 10px)' },
  { id: 'kraft-fibre',    name: 'Kraft Fibres',  color: '#A06828', roughness: 0.93, metalness: 0, swatchStyle: 'repeating-linear-gradient(108deg,#A06828 0px,#8E5818 1px,#A06828 2px,#986020 5px,#A06828 6px,#8A5416 7px,#9C6424 9px,#A06828 10px)' },
  { id: 'brillant',     name: 'Brillant',       color: '#F8F8F8', roughness: 0.04, metalness: 0.06, swatchStyle: '#F8F8F8' },
  { id: 'metallique',   name: 'Métallique',     color: '#B8C4CC', roughness: 0.22, metalness: 0.78, swatchStyle: 'linear-gradient(135deg,#B8C4CC 0%,#90A0AC 40%,#CDD5DA 70%,#A8B8C0 100%)' },
  { id: 'aluminium',    name: 'Aluminium',      color: '#D8DEE4', roughness: 0.14, metalness: 0.88, swatchStyle: 'linear-gradient(135deg,#D8DEE4 0%,#C0C8CE 40%,#E0E4E8 70%,#C8D0D6 100%)' },
  { id: 'holographique',name: 'Holographique',  color: '#E8D0F8', roughness: 0.04, metalness: 0.7,  swatchStyle: 'conic-gradient(from 0deg,#ff88cc,#ffcc44,#44ffcc,#44aaff,#cc44ff,#ff88cc)' },
  { id: 'miroir',       name: 'Miroir',         color: '#E8E8E8', roughness: 0.0,  metalness: 1.0,  swatchStyle: 'linear-gradient(135deg,#f0f0f0 0%,#fff 20%,#b8b8b8 40%,#f8f8f8 60%,#c8c8c8 80%)' },
  { id: 'marbre',       name: 'Marbre',         color: '#F2EEE8', roughness: 0.28, metalness: 0,    swatchStyle: 'linear-gradient(160deg,#f5f2ee 0%,#ede9e2 35%,#f8f5f0 55%,#e4e0d8 75%,#f0ece5 100%)' },
  { id: 'cuir',         name: 'Cuir',           color: '#7A3E22', roughness: 0.82, metalness: 0,    swatchStyle: 'radial-gradient(circle at 38% 38%,#9A5030 0%,#7A3E22 50%,#5C2C14 100%)' },
  { id: 'personnalise', name: 'Personnalisé',   color: '#FF0000', roughness: 0.7,  metalness: 0 },
  // Finitions premium #71-76
  { id: 'soft-touch',  name: 'Soft Touch',     color: '#E8E2DC', roughness: 0.92, metalness: 0, swatchStyle: 'radial-gradient(ellipse at 40% 40%,#f0ece8 0%,#e2dcd6 60%,#d8d0ca 100%)' },
  { id: 'verni-uv',   name: 'Verni UV',        color: '#F4F0EC', roughness: 0.05, metalness: 0, swatchStyle: 'linear-gradient(120deg,#ffffff 0%,#f4f0ec 30%,#ffffff 55%,#e8e4e0 80%,#f4f0ec 100%)' },
  { id: 'dorure',     name: 'Dorure',          color: '#D4A017', roughness: 0.08, metalness: 0.96, swatchStyle: 'linear-gradient(135deg,#f0cc40 0%,#c89010 25%,#f4d84a 50%,#b87a08 75%,#e8c030 100%)' },
  { id: 'foil-argent',name: 'Foil Argent',     color: '#C8C8CC', roughness: 0.06, metalness: 0.96, swatchStyle: 'linear-gradient(135deg,#e8e8ec 0%,#b0b0b4 25%,#f0f0f4 50%,#a0a0a4 75%,#d8d8dc 100%)' },
  { id: 'gaufrage',   name: 'Gaufrage',        color: '#E0D8CC', roughness: 0.78, metalness: 0, swatchStyle: 'repeating-radial-gradient(circle at 50% 50%,#e0d8cc 0px,#d0c8bc 4px,#e8e0d4 6px,#e0d8cc 8px)' },
  { id: 'pelliculage',name: 'Pelliculage',      color: '#F0ECE8', roughness: 0.30, metalness: 0, swatchStyle: 'linear-gradient(110deg,#f8f6f4 0%,#f0ece8 50%,#f4f2ee 100%)' },
  // Matières #116-135
  { id: 'carton-blanc',    name: 'Carton Blanc',    color: '#F8F6F2', roughness: 0.80, metalness: 0, swatchStyle: 'repeating-linear-gradient(108deg,#F8F6F2 0px,#EEE8E2 1px,#F8F6F2 2px,#F4F0EA 5px,#F8F6F2 6px,#ECE6E0 7px,#F6F2EC 9px,#F8F6F2 10px)' },
  { id: 'papier-couche',   name: 'Papier Couché',   color: '#F5F3EF', roughness: 0.22, metalness: 0, swatchStyle: 'linear-gradient(120deg,#faf8f5 0%,#f5f3ef 60%,#f8f6f2 100%)' },
  { id: 'transparent',     name: 'Transparent',     color: '#DDF0FF', roughness: 0.06, metalness: 0, swatchStyle: 'linear-gradient(135deg,rgba(180,220,255,0.5) 0%,rgba(220,240,255,0.7) 50%,rgba(190,225,255,0.4) 100%)' },
  { id: 'verre',           name: 'Verre',           color: '#C8E8F0', roughness: 0.02, metalness: 0, swatchStyle: 'linear-gradient(135deg,rgba(180,230,250,0.4) 0%,rgba(220,245,255,0.8) 40%,rgba(170,220,240,0.3) 100%)' },
  { id: 'aluminium-aniso', name: 'Alu. Aniso',      color: '#C8CCD0', roughness: 0.18, metalness: 0.94, swatchStyle: 'repeating-linear-gradient(85deg,#d0d4d8 0px,#b8bcc0 1px,#d8dce0 3px,#c0c4c8 5px,#d0d4d8 7px)' },
  { id: 'papier-kraft-rec',name: 'Kraft Recyclé',   color: '#9E7A48', roughness: 0.96, metalness: 0, swatchStyle: 'repeating-linear-gradient(108deg,#9E7A48 0px,#8A6838 1px,#9E7A48 2px,#966E40 5px,#9E7A48 6px,#866030 7px,#9A7644 9px,#9E7A48 10px)' },
  { id: 'velours',         name: 'Velours',         color: '#3A2040', roughness: 0.98, metalness: 0, swatchStyle: 'radial-gradient(ellipse at 35% 35%,#6a3870 0%,#3a2040 55%,#281430 100%)' },
  { id: 'plastique-mat',   name: 'Plastique Mat',   color: '#D0CCC8', roughness: 0.82, metalness: 0, swatchStyle: 'radial-gradient(ellipse at 40% 35%,#dedad6 0%,#c8c4c0 60%,#beb8b4 100%)' },
  { id: 'mousse-eva',      name: 'Mousse EVA',      color: '#F0E0C0', roughness: 0.96, metalness: 0, swatchStyle: 'radial-gradient(ellipse at 45% 40%,#f8f0d8 0%,#f0e0c0 55%,#e4cca8 100%)' },
  { id: 'tissu',           name: 'Tissu',           color: '#C0A890', roughness: 0.98, metalness: 0, swatchStyle: 'repeating-linear-gradient(45deg,#c0a890 0px,#b09880 1px,#c0a890 3px,#b89888 4px,#c0a890 6px),repeating-linear-gradient(-45deg,#c0a890 0px,#b09880 1px,#c0a890 3px,#b89888 4px,#c0a890 6px)' },
]
