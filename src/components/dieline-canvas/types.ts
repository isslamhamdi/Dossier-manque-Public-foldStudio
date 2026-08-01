import type { BoxParams, LayerVisibility, ImageLayer, TemplateType } from '@/lib/types'
import type { UnitType } from '@/components/left-panel/ui'

export interface ImportedSvgInfo {
  raw: string
  widthMm: number
  heightMm: number
}

export interface DielineCanvasProps {
  params: BoxParams
  layers: LayerVisibility
  onLayerToggle?: (key: keyof LayerVisibility) => void
  mode?: 'fold' | 'unfold'
  objContent?: string | null
  importedSvg?: ImportedSvgInfo | null
  imageLayers?: ImageLayer[]
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  onSelectLayer?: (id: string | null) => void
  onToggleSelectLayer?: (id: string) => void
  onMoveImageLayer?: (id: string, dx: number, dy: number) => void
  onMoveSelectedLayers?: (dx: number, dy: number) => void
  onUpdateImageLayer?: (id: string, updates: Partial<ImageLayer>) => void
  onHoverFace?: (face: string | null) => void
  externalHoveredFace?: string | null
  onParamChange?: (key: keyof BoxParams, value: number) => void
  activeTemplate?: TemplateType
  unit?: UnitType
}

export type DragState =
  | { kind: 'move'; id: string; startX: number; startY: number }
  | { kind: 'resize'; id: string; cx: number; cy: number; startDist: number; startScale: number }
  | { kind: 'rotate'; id: string; cx: number; cy: number; startAngle: number; startRotation: number }
  | { kind: 'param'; param: keyof BoxParams; startSvgX: number; startSvgY: number; startValue: number; axis: 'x' | 'y' }
