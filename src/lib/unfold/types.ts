export interface Vec2 { x: number; y: number }

export interface Vec3 { x: number; y: number; z: number }

export interface UnfoldFace {
  vertices: Vec2[]
  originalFaceIdx: number
}

export interface UnfoldResult {
  faces: UnfoldFace[]
  foldLines: [Vec2, Vec2][]
  cutLines: [Vec2, Vec2][]
  glueTabs: Vec2[][]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  stats: { originalFaces: number; cutEdges: number; foldEdges: number; glueTabs: number }
}
