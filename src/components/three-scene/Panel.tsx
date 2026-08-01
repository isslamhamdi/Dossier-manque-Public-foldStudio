'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getDef, buildMaterial, buildHolographicMaterial, buildVarnishOverlay } from './materials'
import type { PBRTexSet } from './materials'
import { usePrintingMaterial } from './PrintingMaterial'
import { computeCrushDeformation, materialClassFromFluteType } from '../../lib/physics/crushFactor'
import { applyLivingHingeDeformation, plasticTypeFromFluteType, computeLivingHinge } from '../../lib/physics/livingHinge'
import { stressWhiteningVertexShader, stressWhiteningFragmentShader } from '../../lib/shaders/stressWhiteningShader'

// Subdivision count for crush-deformable panels.
// 6×6 = 49 vertices per face — enough resolution for smooth crease deformation.
const SEGS = 6

export interface PanelProps {
  fw: number; fh: number
  extPreset: string; extColor: string
  intPreset: string; intColor: string
  imageTex?: THREE.Texture | null
  pbrTex?: PBRTexSet | null
  hovered?: boolean
  thickness?: number
  fluteType?: string
  varnishIntensity?: number  // 0–1: spot UV varnish on printed zones
  // Crush-factor inputs
  foldAngle?: number                                   // radians — current fold angle from parent
  hingeEdge?: 'top' | 'bottom' | 'left' | 'right'    // which edge touches the hinge
  // Living hinge (PP/HDPE/PET plastics)
  isLivingHinge?: boolean
  hingeThickness?: number    // mm — hinge zone thickness (default 0.4mm for PP)
  // Kubelka-Munk printing
  cmyk?: [number, number, number, number]
  laminate?: 0 | 1 | 2
  varnishMask?: THREE.Texture | null
  imageMix?: number          // 0=KM only, 1=image only
  // Inter-panel UV continuity
  uvOffset?: [number, number]
  uvScale?: [number, number]
  // Alpha map for non-rectangular panel shapes (gable flaps, tuck tongues, handle arches)
  alphaTex?: THREE.Texture | null
}

// ── Crease normal blending — smooths the hard lighting seam at fold edges ────
// After computeVertexNormals(), vertices near the hinge crease get their normal
// blended toward the bisector of the fold angle. Quadratic falloff over ~8% of
// panel size so the transition is barely perceptible.
function blendCreaseNormals(
  normalArr: Float32Array,
  posArr: Float32Array,
  vertCount: number,
  fw: number,
  fh: number,
  foldAngle: number,
  hingeEdge: 'top' | 'bottom' | 'left' | 'right',
): void {
  const absTheta = Math.abs(foldAngle)
  if (absTheta < 0.02) return

  const BLEND_FRAC = 0.08
  const zoneLen = (hingeEdge === 'left' || hingeEdge === 'right') ? fw * BLEND_FRAC : fh * BLEND_FRAC
  const halfTheta = absTheta / 2
  const sign = foldAngle > 0 ? 1 : -1

  // Bisector normal in panel-local space: blend Z toward the half-angle
  const targetNy = -Math.sin(halfTheta) * sign
  const targetNz = Math.cos(halfTheta)

  for (let i = 0; i < vertCount; i++) {
    const pi = i * 3
    const ni = i * 3
    const x = posArr[pi], y = posArr[pi + 1]

    let dist = Infinity
    switch (hingeEdge) {
      case 'bottom': dist = y + fh / 2; break
      case 'top':    dist = fh / 2 - y; break
      case 'left':   dist = x + fw / 2; break
      case 'right':  dist = fw / 2 - x; break
    }
    if (dist < 0 || dist > zoneLen) continue

    const t = 1 - dist / zoneLen  // 1 at crease edge, 0 at zone boundary
    const blend = t * t            // quadratic

    normalArr[ni + 1] = normalArr[ni + 1] * (1 - blend) + targetNy * blend
    normalArr[ni + 2] = normalArr[ni + 2] * (1 - blend) + targetNz * blend
    // Re-normalize
    const nx = normalArr[ni], ny = normalArr[ni + 1], nz = normalArr[ni + 2]
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz)
    if (len > 1e-6) {
      normalArr[ni] /= len; normalArr[ni + 1] /= len; normalArr[ni + 2] /= len
    }
  }
}

export function Panel({
  fw, fh,
  extPreset, extColor, intPreset, intColor,
  imageTex, pbrTex, hovered,
  thickness = 0.5, fluteType, varnishIntensity = 0,
  foldAngle = 0, hingeEdge = 'bottom',
  isLivingHinge = false, hingeThickness = 0.4,
  cmyk, laminate, varnishMask, imageMix,
  uvOffset, uvScale, alphaTex,
}: PanelProps) {
  const t = Math.max(thickness / 100, 0.010)
  const intDef = getDef(intPreset)
  const holoRef = useRef<THREE.ShaderMaterial | null>(null)
  const matClass = materialClassFromFluteType(fluteType)
  const plasticType = plasticTypeFromFluteType(fluteType)

  // Use KM printing material when artwork or ink density is present
  const hasPrinting = !!(imageTex) || !!(cmyk && cmyk.some(v => v > 0))

  // ── Printing material (Kubelka-Munk) — always called (hook rules) ───────
  const printingMat = usePrintingMaterial({
    boardColor:  extColor,
    cmyk:        cmyk ?? [0, 0, 0, 0],
    laminate:    laminate ?? 0,
    varnishMask: varnishMask ?? null,
    varnishAmt:  varnishIntensity,
    albedoTex:   imageTex ?? null,
    imageMix:    imageMix ?? 0.5,
    side:        THREE.DoubleSide,
    uvOffset,
    uvScale,
    alphaTex:    alphaTex ?? null,
  })

  // Dynamic subdivided BufferGeometry for crush deformation.
  // Baseline positions are stored separately so crush is applied each frame
  // as a delta on top of the flat plane — no drift accumulation.
  const extGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(fw, fh, SEGS, SEGS)
    const pos = g.attributes.position as THREE.BufferAttribute
    ;(g as THREE.PlaneGeometry & { _basePos: Float32Array })._basePos =
      new Float32Array(pos.array as Float32Array)
    pos.usage = THREE.DynamicDrawUsage
    // Mark normal attribute dynamic so we can blend crease normals each frame
    const nor = g.attributes.normal as THREE.BufferAttribute
    nor.usage = THREE.DynamicDrawUsage
    return g
  }, [fw, fh])

  useEffect(() => () => extGeo.dispose(), [extGeo])

  // ── Standard PBR material for unprinted panels ───────────────────────────
  const standardExtMat = useMemo(() => {
    if (extPreset === 'holographique') {
      const mat = buildHolographicMaterial(THREE.DoubleSide)
      holoRef.current = mat
      return mat
    }
    holoRef.current = null
    // Pass imageTex only when NOT using PrintingMaterial (avoid double-apply)
    return buildMaterial(extPreset, extColor, THREE.DoubleSide, hasPrinting ? null : imageTex, fluteType)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extPreset, extColor, imageTex, fluteType, hasPrinting])

  // Apply alpha map to the standard (non-printing) path
  useEffect(() => {
    if (hasPrinting) return  // printing path handles its own alpha via shader uniform
    if (!(standardExtMat instanceof THREE.MeshPhysicalMaterial)) return
    if (alphaTex) {
      standardExtMat.alphaMap = alphaTex
      standardExtMat.transparent = true
      standardExtMat.alphaTest = 0.5
    } else {
      standardExtMat.alphaMap = null
      standardExtMat.transparent = false
      standardExtMat.alphaTest = 0
    }
    standardExtMat.needsUpdate = true
  }, [alphaTex, standardExtMat, hasPrinting])

  // The active exterior material — PrintingMat when artwork/CMYK present, PBR otherwise
  const extMat = hasPrinting ? printingMat : standardExtMat

  // Stress whitening overlay — only created for living hinge panels
  const whiteningRef = useRef<THREE.ShaderMaterial | null>(null)
  const whiteningMat = useMemo(() => {
    if (!isLivingHinge) return null
    const m = new THREE.ShaderMaterial({
      vertexShader:   stressWhiteningVertexShader,
      fragmentShader: stressWhiteningFragmentShader,
      transparent:    true,
      depthWrite:     false,
      side:           THREE.DoubleSide,
      uniforms: {
        uWhiteningIntensity: { value: 0 },
        uHingeAxis:          { value: (hingeEdge === 'left' || hingeEdge === 'right') ? 1 : 0 },
        uCreaseUV:           { value: hingeEdge === 'bottom' || hingeEdge === 'left' ? 0 : 1 },
        uZoneWidth:          { value: 0.12 },
      },
    })
    whiteningRef.current = m
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLivingHinge, hingeEdge])

  useEffect(() => () => { whiteningMat?.dispose() }, [whiteningMat])

  const hoverOverlayMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#a8c8ff',
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthTest: true,
  }), [])

  useFrame((state) => {
    if (holoRef.current) {
      holoRef.current.uniforms.uCameraPos.value.copy(state.camera.position)
    }

    // ── Conditional side flip — eliminates Z-fighting on closed boxes ─────
    // Past 90° the exterior face is definitively outward-facing; drop DoubleSide
    // to halve fragment cost and remove depth fighting with adjacent panels.
    const newSide = Math.abs(foldAngle) > Math.PI / 2 ? THREE.FrontSide : THREE.DoubleSide
    if (extMat.side !== newSide) {
      extMat.side = newSide
      extMat.needsUpdate = true
    }

    // ── Deformation — skip if no meaningful fold angle ─────────────────────
    if (Math.abs(foldAngle) > 0.02) {
      const pos = extGeo.attributes.position as THREE.BufferAttribute
      const posArr = pos.array as Float32Array
      const basePos = (extGeo as THREE.PlaneGeometry & { _basePos: Float32Array })._basePos

      posArr.set(basePos)

      if (isLivingHinge) {
        applyLivingHingeDeformation(
          posArr, pos.count, fw, fh, foldAngle, hingeEdge,
          hingeThickness * 20, plasticType,
        )
        const hingeState = computeLivingHinge(foldAngle, hingeThickness, thickness, plasticType)
        if (whiteningRef.current) {
          whiteningRef.current.uniforms.uWhiteningIntensity.value = hingeState.whiteningIntensity
        }
      } else {
        computeCrushDeformation(posArr, pos.count, fw, fh, foldAngle, hingeEdge, matClass)
      }

      pos.needsUpdate = true
      extGeo.computeVertexNormals()

      // ── Crease normal blending — smooth lighting seam at fold edge ────────
      const nor = extGeo.attributes.normal as THREE.BufferAttribute
      blendCreaseNormals(
        nor.array as Float32Array,
        posArr,
        pos.count,
        fw, fh, foldAngle, hingeEdge,
      )
      nor.needsUpdate = true
    }
  })

  const intMat = useMemo(() => {
    const intColor3 = intPreset === 'personnalise' ? intColor : intDef.color
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(intColor3),
      roughness: intDef.roughness,
      metalness: intDef.metalness ?? 0,
      clearcoat: 0.05,
      envMapIntensity: 0.3,
      side: THREE.BackSide,
    })
    return mat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intPreset, intColor])


  useEffect(() => () => { standardExtMat.dispose() }, [standardExtMat])
  useEffect(() => () => { intMat.dispose() }, [intMat])

  useEffect(() => () => { hoverOverlayMat.dispose() }, [hoverOverlayMat])

  const varnishMat = useMemo(() => {
    if (varnishIntensity <= 0 || !imageTex || hasPrinting) return null
    return buildVarnishOverlay(imageTex, varnishIntensity)
  }, [varnishIntensity, imageTex, hasPrinting])

  useEffect(() => () => { varnishMat?.dispose() }, [varnishMat])

  useEffect(() => {
    if (!pbrTex) return
    if (!(standardExtMat instanceof THREE.MeshPhysicalMaterial)) return
    if (pbrTex.albedo)    { standardExtMat.map = pbrTex.albedo }
    if (pbrTex.normal)    { standardExtMat.normalMap = pbrTex.normal; standardExtMat.normalScale.set(1.5, 1.5) }
    if (pbrTex.roughness) { standardExtMat.roughnessMap = pbrTex.roughness }
    if (pbrTex.metallic)  { standardExtMat.metalnessMap = pbrTex.metallic; standardExtMat.metalness = 1.0 }
    standardExtMat.needsUpdate = true
  }, [pbrTex, standardExtMat])

  return (
    <>
      {/* Exterior face — subdivided BufferGeometry for crush deformation */}
      <mesh castShadow receiveShadow geometry={extGeo}>
        <primitive object={extMat} attach="material" />
      </mesh>
      {/* Spot UV varnish overlay — additive gloss on printed zones (PBR path only) */}
      {varnishMat && (
        <mesh position={[0, 0, 0.0008]} geometry={extGeo} renderOrder={3}>
          <primitive object={varnishMat} attach="material" />
        </mesh>
      )}
      {/* Stress whitening overlay — living hinge crazing effect */}
      {whiteningMat && (
        <mesh position={[0, 0, 0.0012]} geometry={extGeo} renderOrder={4}>
          <primitive object={whiteningMat} attach="material" />
        </mesh>
      )}
      {/* Hover overlay — stable material, only visible when hovered */}
      <mesh position={[0, 0, 0.001]} visible={!!hovered} renderOrder={2}>
        <planeGeometry args={[fw, fh]} />
        <primitive object={hoverOverlayMat} attach="material" />
      </mesh>
      {/* Interior face at actual cardboard depth */}
      <mesh position={[0, 0, -t]}>
        <planeGeometry args={[fw, fh]} />
        <primitive object={intMat} attach="material" />
      </mesh>
    </>
  )
}
