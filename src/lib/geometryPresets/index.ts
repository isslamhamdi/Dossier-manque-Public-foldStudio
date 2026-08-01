import { CUBE_OBJ, TETRA_OBJ, PYRAMID_OBJ, ICOSA_OBJ, PRISM_OBJ } from './static'
import { makeConeOBJ, makeStarOBJ, makeGearOBJ, makeDodecaOBJ, makeHexTorusOBJ } from './procedural'

export interface GeometryPreset {
  id: string
  label: string
  obj: string
}

export const GEOMETRY_PRESETS: GeometryPreset[] = [
  { id: 'cube',      label: 'Cube',     obj: CUBE_OBJ },
  { id: 'tetra',     label: 'Tetra',    obj: TETRA_OBJ },
  { id: 'pyramid',   label: 'Pyramid',  obj: PYRAMID_OBJ },
  { id: 'star',      label: 'Star',     obj: makeStarOBJ() },
  { id: 'gear',      label: 'Gear',     obj: makeGearOBJ() },
  { id: 'icosa',     label: 'Icosa',    obj: ICOSA_OBJ },
  { id: 'dodeca',    label: 'Dodeca',   obj: makeDodecaOBJ() },
  { id: 'bucky',     label: 'Bucky',    obj: ICOSA_OBJ.replace('# Icosa', '# Bucky') },
  { id: 'cone',      label: 'Cone',     obj: makeConeOBJ() },
  { id: 'polygon',   label: 'Polygon',  obj: PRISM_OBJ.replace('# Prism', '# Polygon_Triangle') },
  { id: 'hex-torus', label: 'HexTorus', obj: makeHexTorusOBJ() },
]
