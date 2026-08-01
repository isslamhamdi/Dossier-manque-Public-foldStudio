'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDef, buildMaterial, buildHolographicMaterial } from './materials'
import type { PBRTexSet } from './materials'

const SC = 1 / 100   // mm → Three.js units
const FLIP_Y = -1    // SVG y-down → Three.js y-up

export interface PolygonMeshProps {
  polygon2D: [number, number][]    // mm, dieline coords (may have arbitrary offset)
  holes2D?:  [number, number][][]  // optional interior cutouts (windows, lock slots)
  extPreset: string
  extColor:  string
  intPreset: string
  intColor:  string
  imageTex?: THREE.Texture | null
  pbrTex?: PBRTexSet | null
  hovered?: boolean
  thickness?: number
  fluteType?: string
}

// Build a centered THREE.ShapeGeometry with normalized UVs.
function makeShapeGeo(
  polygon2D: [number, number][],
  holes2D?: [number, number][][]
): THREE.ShapeGeometry {
  const n = polygon2D.length
  if (n < 3) return new THREE.ShapeGeometry()

  // Centroid of bounding box (stable center for the mesh origin)
  let xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity
  for (const [x, y] of polygon2D) {
    if (x < xMin) xMin = x; if (x > xMax) xMax = x
    if (y < yMin) yMin = y; if (y > yMax) yMax = y
  }
  const cx = (xMin + xMax) / 2
  const cy = (yMin + yMax) / 2

  // Build outer shape (centered, Y-flipped for Three.js)
  const shape = new THREE.Shape()
  shape.moveTo((polygon2D[0][0] - cx) * SC, (polygon2D[0][1] - cy) * FLIP_Y * SC)
  for (let i = 1; i < n; i++) {
    shape.lineTo((polygon2D[i][0] - cx) * SC, (polygon2D[i][1] - cy) * FLIP_Y * SC)
  }
  shape.closePath()

  // Add holes (windows, interior cutouts)
  if (holes2D) {
    for (const hole of holes2D) {
      if (hole.length < 3) continue
      const path = new THREE.Path()
      path.moveTo((hole[0][0] - cx) * SC, (hole[0][1] - cy) * FLIP_Y * SC)
      for (let i = 1; i < hole.length; i++) {
        path.lineTo((hole[i][0] - cx) * SC, (hole[i][1] - cy) * FLIP_Y * SC)
      }
      path.closePath()
      shape.holes.push(path)
    }
  }

  const geo = new THREE.ShapeGeometry(shape, 4)

  // Remap UVs: 0→1 across local bounding box so textures tile correctly
  const pos = geo.attributes.position
  let gxMin = Infinity, gxMax = -Infinity, gyMin = Infinity, gyMax = -Infinity
  for (let i = 0; i < pos.count; i++) {
    const gx = pos.getX(i), gy = pos.getY(i)
    if (gx < gxMin) gxMin = gx; if (gx > gxMax) gxMax = gx
    if (gy < gyMin) gyMin = gy; if (gy > gyMax) gyMax = gy
  }
  const uRange = gxMax - gxMin || 1
  const vRange = gyMax - gyMin || 1
  const uvs = new Float32Array(pos.count * 2)
  for (let i = 0; i < pos.count; i++) {
    uvs[i * 2]     = (pos.getX(i) - gxMin) / uRange
    uvs[i * 2 + 1] = (pos.getY(i) - gyMin) / vRange
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.computeVertexNormals()

  return geo
}

export function PolygonMesh({
  polygon2D, holes2D,
  extPreset, extColor, intPreset, intColor,
  imageTex, pbrTex, hovered,
  thickness = 1.6, fluteType,
}: PolygonMeshProps) {
  const t = Math.max(thickness / 100, 0.010)
  const intDef = getDef(intPreset)
  const holoRef = useRef<THREE.ShaderMaterial | null>(null)

  const geo = useMemo(
    () => makeShapeGeo(polygon2D, holes2D),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [polygon2D, holes2D]
  )

  const extMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const mat = buildHolographicMaterial(THREE.DoubleSide)
      holoRef.current = mat
      return mat
    }
    holoRef.current = null
    return buildMaterial(extPreset, extColor, THREE.DoubleSide, imageTex ?? undefined, fluteType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extPreset, extColor, imageTex, fluteType])

  const hoverMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#a8c8ff', transparent: true, opacity: 0.35,
    side: THREE.DoubleSide, depthTest: true,
  }), [])

  const intMat = useMemo(() => {
    const col = intPreset === 'personnalise' ? intColor : intDef.color
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(col),
      roughness: intDef.roughness,
      metalness: intDef.metalness ?? 0,
      clearcoat: 0.05,
      envMapIntensity: 0.3,
      side: THREE.BackSide,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intColor])

  useFrame(state => {
    if (holoRef.current) holoRef.current.uniforms.uCameraPos.value.copy(state.camera.position)
  })

  useEffect(() => { if (pbrTex && extMat instanceof THREE.MeshPhysicalMaterial) {
    if (pbrTex.albedo)    extMat.map = pbrTex.albedo
    if (pbrTex.normal)    { extMat.normalMap = pbrTex.normal; extMat.normalScale.set(1.5, 1.5) }
    if (pbrTex.roughness) extMat.roughnessMap = pbrTex.roughness
    if (pbrTex.metallic)  { extMat.metalnessMap = pbrTex.metallic; extMat.metalness = 1 }
    extMat.needsUpdate = true
  }}, [pbrTex, extMat])

  useEffect(() => () => geo.dispose(),    [geo])
  useEffect(() => () => extMat.dispose(), [extMat])
  useEffect(() => () => intMat.dispose(), [intMat])
  useEffect(() => () => hoverMat.dispose(), [hoverMat])

  return (
    <>
      {/* Exterior face */}
      <mesh geometry={geo} material={extMat} castShadow receiveShadow />

      {/* Hover highlight */}
      <mesh geometry={geo} material={hoverMat} position={[0, 0, 0.001]}
        visible={!!hovered} renderOrder={2} />

      {/* Interior face at cardboard depth */}
      <mesh geometry={geo} material={intMat} position={[0, 0, -t]} />
    </>
  )
}
