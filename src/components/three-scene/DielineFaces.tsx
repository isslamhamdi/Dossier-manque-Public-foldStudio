'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ImageLayer, BoxParams, TemplateType } from '../../lib/types'
import type { FoldNode, FaceName } from '../../lib/dieline/helpers'
import { Panel } from './Panel'
import { PolygonMesh } from './PolygonMesh'
import type { PBRTexSet } from './materials'
import { useFaceTextures } from './textureUtils'
import { seqT, type EaseFnName } from './animationUtils'
import { generateAlphaTex } from '../../lib/dieline/alphaShapes'

const SC = 1 / 100  // mm → Three.js scene units

// Plastic material types — these use living hinge physics instead of crush factor
const PLASTIC_FLUTE_TYPES = new Set(['flat_pp', 'flat_hdpe', 'flat_pet', 'flat_pla', 'flat_abs'])

function isPlasticFluteType(fluteType?: string): boolean {
  if (!fluteType) return false
  const f = fluteType.toLowerCase()
  return PLASTIC_FLUTE_TYPES.has(f) || f.includes('pp') || f.includes('hdpe') || f.includes('pet')
}

// Module-level constant — never mutated, safe to share across all FoldNodeRenderer instances
const PARENT_NORMAL = new THREE.Vector3(0, 0, 1)

// Anisotropy coefficient α for paper grain direction.
// Horizontal creases (fold around X-axis) go AGAINST the fiber grain → α > 1.
// Vertical creases (fold around Y-axis) go WITH the grain → α = 1.
const ANISOTROPY_MAP: Record<string, number> = {
  B: 1.30, C: 1.25, E: 1.15, micro: 1.10, default: 1.06,
}

function getAnisotropy(axis: [number, number, number], fluteType?: string): number {
  if (Math.abs(axis[0]) <= 0.5) return 1.0  // fold WITH grain — no correction
  const key = fluteType ?? 'default'
  return ANISOTROPY_MAP[key] ?? ANISOTROPY_MAP.default
}

interface SharedProps {
  foldProgress: number
  extPreset: string
  extColor: string
  intPreset: string
  intColor: string
  hoveredFace?: string | null
  onHoverFace?: (face: string | null) => void
  params?: BoxParams
  activeTemplate?: TemplateType
  pbrTextures?: Partial<Record<FaceName, PBRTexSet>>
  fluteType?: string
  texByFace: Map<string, THREE.Texture | null>
  varnishIntensity?: number
  cmyk?: [number, number, number, number]
  laminate?: 0 | 1 | 2
  varnishMask?: THREE.Texture | null
  imageMix?: number
}

// ── Renders the panel mesh for one node ─────────────────────────────────────

function PanelMeshNode({
  node, s,
  foldAngle = 0,
  hingeEdge = 'bottom',
}: {
  node: FoldNode
  s: SharedProps
  foldAngle?: number
  hingeEdge?: 'top' | 'bottom' | 'left' | 'right'
}) {
  const face = node.face
  const tex = face ? (s.texByFace.get(face) ?? null) : null

  // Generate canvas alpha texture for irregular panel shapes (gable flaps, tuck tongues…)
  const alphaShapeKey = node.alphaShape ? JSON.stringify(node.alphaShape) : null
  const alphaTex = useMemo(
    () => (node.alphaShape ? generateAlphaTex(node.alphaShape) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [alphaShapeKey],
  )
  useEffect(() => () => { alphaTex?.dispose() }, [alphaTex])

  const matProps = {
    extPreset: s.extPreset, extColor: s.extColor,
    intPreset: s.intPreset, intColor: s.intColor,
    imageTex: tex,
    pbrTex: face ? s.pbrTextures?.[face] : undefined,
    hovered: s.hoveredFace === face,
    thickness: s.params?.thickness ?? 1.6,
    fluteType: s.fluteType ?? s.params?.fluteType,
    varnishIntensity: s.varnishIntensity,
    foldAngle,
    hingeEdge,
    isLivingHinge: node.isLivingHinge ?? isPlasticFluteType(s.fluteType ?? s.params?.fluteType),
    hingeThickness: node.hingeThickness,
    cmyk:        s.cmyk,
    laminate:    s.laminate,
    varnishMask: s.varnishMask,
    imageMix:    s.imageMix,
    uvOffset:    node.uvOffset,
    uvScale:     node.uvScale,
  }
  return (
    <group
      onPointerEnter={() => s.onHoverFace?.(face ?? null)}
      onPointerLeave={() => s.onHoverFace?.(null)}
    >
      {node.polygon2D && node.polygon2D.length >= 3
        ? <PolygonMesh polygon2D={node.polygon2D} {...matProps} />
        : <Panel fw={node.w * SC} fh={node.h * SC} {...matProps} alphaTex={alphaTex} />
      }
    </group>
  )
}

// ── FoldNodeRenderer: pivot → Dynamic Pivot Offset → fold → panel ───────────
//
// THE ALGORITHM (Pacdora's "floating fold axis"):
// A simple fixed-axis rotation causes cardboard faces to interpenetrate at
// fold lines when the material has thickness T. The fix: as the fold angle θ
// increases from 0→target, shift the pivot position by:
//   • halfT × α × sin(|θ|) along panelDir  (α = anisotropy coefficient)
//   • halfT × (1-cos(|θ|)) along parentNormal  (outward from parent face)
// This keeps the inner face of the folding panel tangent to the outer face
// of the parent throughout the animation — zero interpenetration.
// α > 1 for horizontal creases (fold against paper grain) to compensate
// for additional material compression in the fiber-perpendicular direction.

function FoldNodeRenderer({ node, s }: { node: FoldNode; s: SharedProps }) {
  const foldRef       = useRef<THREE.Group>(null)
  const pivotGroupRef = useRef<THREE.Group>(null)
  const angleRef      = useRef(0)  // current fold angle in radians, passed to PanelMeshNode

  // Pre-allocate per-node vectors — avoids `new THREE.Vector3()` on every frame
  const _foldAxis = useMemo(() =>
    node.hinge ? new THREE.Vector3(...node.hinge.axis) : new THREE.Vector3(0, 1, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.hinge])

  const _pivotBase = useMemo(() =>
    node.hinge
      ? new THREE.Vector3(node.hinge.pivotPos[0] * SC, node.hinge.pivotPos[1] * SC, node.hinge.pivotPos[2] * SC)
      : new THREE.Vector3(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [node.hinge])

  // panelDir: unit vector from pivot toward panel center (in parent XY plane).
  // Encodes WHICH side of the fold line the child panel is on — used as sweep direction.
  const _panelDir = useMemo(() => {
    if (!node.hinge) return new THREE.Vector3(0, 1, 0)
    const v = new THREE.Vector3(node.hinge.panelPos[0], node.hinge.panelPos[1], node.hinge.panelPos[2])
    return v.lengthSq() > 0.01 ? v.normalize() : new THREE.Vector3(0, 1, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.hinge])

  useFrame(() => {
    const ref        = foldRef.current
    const pivotGroup = pivotGroupRef.current
    if (!ref || !pivotGroup || !node.hinge) return

    const { angle, seq, easing } = node.hinge
    const t        = seqT(s.foldProgress, seq[0], seq[1], (easing ?? 'cubic') as EaseFnName)
    const thetaRad = t * angle

    // Write current angle for HingeArc (runs in its own useFrame)
    angleRef.current = thetaRad

    // 1. Rotation around fold axis
    ref.quaternion.setFromAxisAngle(_foldAxis, thetaRad)

    // 2. Dynamic Pivot Offset with anisotropy coefficient α
    //    halfT = half the cardboard thickness in scene units
    const halfT    = (s.params?.thickness ?? 1.6) / 200
    const absTheta = Math.abs(thetaRad)
    const α        = getAnisotropy(node.hinge.axis, s.fluteType ?? s.params?.fluteType)

    pivotGroup.position
      .copy(_pivotBase)
      .addScaledVector(_panelDir, halfT * α * Math.sin(absTheta))
      .addScaledVector(PARENT_NORMAL, halfT * (1 - Math.cos(absTheta)))
  })

  if (!node.hinge) return null

  const { pivotPos, panelPos } = node.hinge

  // Derive hinge edge from fold axis direction:
  // axis [1,0,0] → horizontal crease → top/bottom edge
  // axis [0,1,0] → vertical crease → left/right edge
  // panelPos.y > 0 → panel center is above pivot → bottom edge is the hinge
  const hingeEdge: 'top' | 'bottom' | 'left' | 'right' = (() => {
    const [ax, , ] = node.hinge.axis
    const [, py, ] = node.hinge.panelPos
    const [px, ,]  = node.hinge.panelPos
    if (Math.abs(ax) > 0.5) return py >= 0 ? 'bottom' : 'top'
    return px >= 0 ? 'left' : 'right'
  })()

  return (
    <group ref={pivotGroupRef} position={[pivotPos[0] * SC, pivotPos[1] * SC, pivotPos[2] * SC]}>
      <group ref={foldRef}>
        <group position={[panelPos[0] * SC, panelPos[1] * SC, panelPos[2] * SC]}>
          <PanelMeshNode node={node} s={s} foldAngle={angleRef.current} hingeEdge={hingeEdge} />
        </group>
        {node.children.map(child => (
          <FoldNodeRenderer key={child.id} node={child} s={s} />
        ))}
      </group>
    </group>
  )
}

// ── Public interface ─────────────────────────────────────────────────────────

export interface DielineFacesProps {
  root: FoldNode
  foldProgress: number
  extPreset?: string
  extColor?: string
  intPreset?: string
  intColor?: string
  imageLayers?: ImageLayer[]
  hoveredFace?: string | null
  onHoverFace?: (face: string | null) => void
  params?: BoxParams
  activeTemplate?: TemplateType
  pbrTextures?: Partial<Record<FaceName, PBRTexSet>>
  fluteType?: string
  varnishIntensity?: number
  cmyk?: [number, number, number, number]
  laminate?: 0 | 1 | 2
  varnishMask?: THREE.Texture | null
  imageMix?: number
}

export function DielineFaces({
  root, foldProgress,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton',  intColor  = '#e8e4dc',
  imageLayers, hoveredFace, onHoverFace, params, activeTemplate, pbrTextures, fluteType,
  varnishIntensity = 0, cmyk, laminate, varnishMask, imageMix,
}: DielineFacesProps) {
  const faceTextures = useFaceTextures(imageLayers, params, activeTemplate, extColor)

  const texByFace = useMemo<Map<string, THREE.Texture | null>>(() => new Map([
    ['front',  faceTextures[0] ?? null],
    ['back',   faceTextures[1] ?? null],
    ['left',   faceTextures[2] ?? null],
    ['right',  faceTextures[3] ?? null],
    ['top',    faceTextures[4] ?? null],
    ['bottom', faceTextures[5] ?? null],
  ]), [faceTextures])

  const [wx, wy, wz] = root.worldPos ?? [0, 0, 0]

  const s: SharedProps = {
    foldProgress, extPreset, extColor, intPreset, intColor,
    hoveredFace, onHoverFace, params, activeTemplate, pbrTextures, fluteType, texByFace,
    varnishIntensity, cmyk, laminate, varnishMask, imageMix,
  }

  return (
    <group position={[wx * SC, wy * SC, wz * SC]}>
      <PanelMeshNode node={root} s={s} />
      {root.children.map(child => (
        <FoldNodeRenderer key={child.id} node={child} s={s} />
      ))}
    </group>
  )
}
