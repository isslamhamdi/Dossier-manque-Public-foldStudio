'use client'

import { useRef, useMemo, useEffect, useState, Suspense } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { BoxParams, TemplateType, ImageLayer } from '../../lib/types'
import type { FoldNode } from '../../lib/dieline/helpers'
import type { MatControls } from '../../lib/matControls'
import type { RenderSceneKey, CustomSceneConfig } from './scenePresets'
import { SCENE_CONFIGS, buildCustomCfg } from './scenePresets'
import { SolidBox } from './SolidBox'
import { GableBox } from './GableBox'
import { OpenBox } from './OpenBox'
import { MailerBox } from './MailerBox'
import { FlipTopBox } from './FlipTopBox'
import { LidBox } from './LidBox'
import { PillowBox } from './PillowBox'
import { DrawerBox } from './DrawerBox'
import { HexBox } from './HexBox'
import { CylinderBox } from './CylinderBox'
import { TrayBox } from './TrayBox'
import { ReverseTuckBox } from './ReverseTuckBox'
import { BookBox } from './BookBox'
import { StandUpPouch } from './StandUpPouch'
import { BoxFaces } from './BoxFaces'
import { DielineFaces } from './DielineFaces'
import { computeDieline } from '../../lib/dieline'
import { BoxEdges } from './BoxEdges'
import { OBJMesh } from './OBJMesh'
import { SceneFloor } from './SceneFloor'
import { ShelfRow, StackColumn, ScatteredDisplay } from './ShelfScene'
import { ProductInsideBox } from './ProductInsideBox'
import { usePBRTextures } from './usePBRTextures'
import { useGLBExport } from './useGLBExport'
import { useRenderCapture } from './useRenderCapture'
import { AdvancedLighting } from './AdvancedLighting'
import type { LightingConfig } from './AdvancedLighting'
import { EffectsLayer } from './EffectsLayer'
import type { PostFXConfig } from './EffectsLayer'
import { Text3DLayer, TextOutline } from './Text3DLayer'
import type { Text3DConfig } from './Text3DLayer'
import { ParticleSystem, CameraPath, useGSAPBoxAnimation } from './ParticleSystem'
import { InstancedBoxGrid, SkyboxLayer } from './InstancedScene'
import type { SceneCameraConfig } from '../left-panel/SceneCameraSection'

export interface ThreeSceneProps {
  params: BoxParams
  foldProgress: number
  interiorColor?: string
  exteriorColor?: string
  exteriorPresetId?: string
  interiorPresetId?: string
  exteriorRoughness?: number
  exteriorMetalness?: number
  interiorRoughness?: number
  interiorMetalness?: number
  imageLayers?: ImageLayer[]
  objContent?: string | null
  viewMode?: 'mesh' | 'folded'
  hoveredFace?: string | null
  onHoverFace?: (face: string | null) => void
  showGrid?: boolean
  wireframe?: boolean
  activeTemplate?: TemplateType
  autoRotate?: boolean
  renderScene?: RenderSceneKey
  customScene?: CustomSceneConfig
  showReflection?: boolean
  showDOF?: boolean
  shelfLayout?: 'none' | 'shelf' | 'stack' | 'scattered'
  shelfCount?: number
  matControls?: MatControls
  showProductInside?: boolean
  productShape?: 'box' | 'cylinder' | 'sphere'
  productColor?: string
  lightingConfig?: LightingConfig
  postFXConfig?: PostFXConfig
  text3DConfig?: Text3DConfig
  text3DEnabled?: boolean
  sceneCameraConfig?: SceneCameraConfig
  importedFoldNode?: FoldNode | null
}

export function Scene({
  params, foldProgress,
  exteriorColor, interiorColor,
  exteriorPresetId = 'brillant', interiorPresetId = 'carton',
  imageLayers, objContent, viewMode, hoveredFace, onHoverFace,
  showGrid = true, wireframe = false, activeTemplate, autoRotate = false,
  renderScene = 'studio_white', customScene,
  showReflection = false,
  shelfLayout = 'none', shelfCount = 3,
  matControls,
  showProductInside = false, productShape = 'box', productColor = '#f0e9de',
  lightingConfig, postFXConfig, text3DConfig, text3DEnabled = false, sceneCameraConfig,
  importedFoldNode,
}: ThreeSceneProps) {
  const cfg = useMemo(() => {
    if (renderScene === 'custom' && customScene) return buildCustomCfg(customScene)
    return SCENE_CONFIGS[renderScene as Exclude<RenderSceneKey, 'custom'>] ?? SCENE_CONFIGS.studio_white
  }, [renderScene, customScene])

  const sc = 1 / 100
  const w = params.width * sc, h = params.height * sc, d = params.depth * sc
  const dieline = useMemo(() => computeDieline(params, activeTemplate ?? 'box'), [params, activeTemplate])
  const showOBJ = viewMode === 'mesh' && !!objContent
  const orbitRef = useRef<any>(null)

  const { gl, scene: threeScene, camera } = useThree()

  const pbrTextures = usePBRTextures()
  useGLBExport(threeScene)
  const renderBg = useRenderCapture(gl, threeScene, camera)

  // #183 High-res capture via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const { res } = (e as CustomEvent).detail as { res: '2K' | '4K' | '8K' }
      const sizes = { '2K': 2048, '4K': 4096, '8K': 7680 }
      const size = sizes[res]
      const prev = new THREE.Vector2()
      gl.getSize(prev)
      gl.setSize(size, Math.round(size * (prev.y / prev.x)))
      gl.render(threeScene, camera)
      const url = gl.domElement.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url; a.download = `fold-studio-${res}-${Date.now()}.png`; a.click()
      gl.setSize(prev.x, prev.y)
    }
    window.addEventListener('fold-studio:highres-capture', handler)
    return () => window.removeEventListener('fold-studio:highres-capture', handler)
  }, [gl, threeScene, camera])

  // #190 360° capture via custom event
  useEffect(() => {
    const handler = () => {
      const canvas = gl.domElement
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `fold-studio-360-${Date.now()}.png`
      a.click()
    }
    window.addEventListener('fold-studio:360-capture', handler)
    return () => window.removeEventListener('fold-studio:360-capture', handler)
  }, [gl])

  useEffect(() => {
    const reset = () => orbitRef.current?.reset()
    window.addEventListener('fold-studio:reset-camera', reset)
    return () => window.removeEventListener('fold-studio:reset-camera', reset)
  }, [])

  useEffect(() => {
    const onSetCamera = (e: Event) => {
      const { pos } = (e as CustomEvent).detail as { pos: [number, number, number] }
      camera.position.set(...pos)
      camera.lookAt(0, 0, 0)
      orbitRef.current?.update()
    }
    window.addEventListener('fold-studio:set-camera', onSetCamera)
    return () => window.removeEventListener('fold-studio:set-camera', onSetCamera)
  }, [camera])

  // Apply MatControls to all scene materials — runs on next frame after any change
  const matVersion = useRef(0)
  const appliedVersion = useRef(-1)
  useEffect(() => { matVersion.current++ }, [matControls, exteriorPresetId, interiorPresetId])

  useFrame(() => {
    if (!matControls || appliedVersion.current === matVersion.current) return
    appliedVersion.current = matVersion.current
    const { tiling, roughnessMult, metalnessMult, displacementScale, normalScale } = matControls
    threeScene.traverse((obj) => {
      const meshObj = obj as THREE.Mesh
      if (!meshObj.isMesh) return
      const mats = Array.isArray(meshObj.material) ? meshObj.material : [meshObj.material]
      mats.forEach((m) => {
        if (!(m instanceof THREE.MeshPhysicalMaterial)) return
        const ud = m.userData
        if (ud.baseRoughness !== undefined) m.roughness = Math.min(1, ud.baseRoughness * roughnessMult)
        if (ud.baseMetalness !== undefined) m.metalness = Math.min(1, ud.baseMetalness * metalnessMult)
        if (ud.baseBumpScale !== undefined) m.bumpScale = ud.baseBumpScale * displacementScale
        if (ud.baseNormalScale !== undefined && m.normalMap) m.normalScale.setScalar(ud.baseNormalScale * normalScale)
        const updateTex = (tex: THREE.Texture | null) => {
          if (!tex || tex.wrapS !== THREE.RepeatWrapping) return
          tex.repeat.set(tiling, tiling)
          tex.needsUpdate = true
        }
        updateTex(m.map); updateTex(m.normalMap); updateTex(m.roughnessMap); updateTex(m.bumpMap)
        m.needsUpdate = true
      })
    })
  })

  const faceProps = {
    extPreset: exteriorPresetId, extColor: exteriorColor || '#ffffff',
    intPreset: interiorPresetId, intColor: interiorColor || '#e8e4dc',
    imageLayers, hoveredFace, onHoverFace, params, activeTemplate, pbrTextures,
    fluteType: params.fluteType,
    varnishIntensity: matControls?.varnishIntensity ?? 0,
  }

  const isStandardBox = !activeTemplate || ['box', 'tuck-end', 'seal-end', 'auto-bottom', 'reverse-tuck', 'crash-lock-bottom', 'window-box'].includes(activeTemplate as string)
  const showAssembled = foldProgress >= 0.88 || !isStandardBox

  const assembledMesh = (
    <>
      {showProductInside && foldProgress < 0.5 && (
        <ProductInsideBox w={w} h={h} d={d} shape={productShape} color={productColor} />
      )}
      {activeTemplate === 'gable'
        ? <GableBox w={w} h={h} d={d} {...faceProps} />
        : (activeTemplate === 'display' || activeTemplate === 'snap-lock')
          ? <OpenBox w={w} h={h} d={d} {...faceProps} />
          : activeTemplate === 'mailer'
            ? <MailerBox w={w} h={h} d={d} {...faceProps} />
            : activeTemplate === 'flip-top'
              ? <FlipTopBox w={w} h={h} d={d} {...faceProps} />
              : activeTemplate === 'lid-box'
                ? <LidBox w={w} h={h} d={d} {...faceProps} foldProgress={foldProgress} />
                : activeTemplate === 'pillow-box'
                  ? <PillowBox w={w} h={h} d={d} {...faceProps} />
                  : activeTemplate === 'drawer-box'
                    ? <DrawerBox w={w} h={h} d={d} {...faceProps} />
                    : activeTemplate === 'hexagonal-box'
                      ? <HexBox w={w} h={h} d={d} {...faceProps} />
                      : activeTemplate === 'cylinder-box'
                        ? <CylinderBox w={w} h={h} d={d} {...faceProps} />
                        : activeTemplate === 'tray-box'
                          ? <TrayBox w={w} h={h} d={d} {...faceProps} />
                          : activeTemplate === 'book-box'
                            ? <BookBox w={w} h={h} d={d} {...faceProps} />
                            : activeTemplate === 'stand-up-pouch'
                              ? <StandUpPouch w={w} h={h} d={d} {...faceProps} />
                              : activeTemplate === 'sleeve-insert'
                                ? <DrawerBox w={w} h={h} d={d} {...faceProps} />
                                : activeTemplate === 'reverse-tuck'
                                  ? <ReverseTuckBox w={w} h={h} d={d} {...faceProps} />
                                  : <SolidBox w={w} h={h} d={d} {...faceProps} />
      }
      {wireframe && (
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(w, h, d)]} />
          <lineBasicMaterial color="#555" />
        </lineSegments>
      )}
    </>
  )

  // #44-45: Shelf / stack / scattered layout
  const boxContent = shelfLayout === 'shelf'
    ? <ShelfRow count={shelfCount} spacing={w * 1.15}>{assembledMesh}</ShelfRow>
    : shelfLayout === 'stack'
      ? <StackColumn count={shelfCount}>{assembledMesh}</StackColumn>
      : shelfLayout === 'scattered'
        ? <ScatteredDisplay count={shelfCount}>{assembledMesh}</ScatteredDisplay>
        : assembledMesh

  // #165 GSAP animation — group ref + event trigger
  const boxGroupRef = useRef<THREE.Group>(null)
  const [gsapTrigger, setGsapTrigger] = useState(false)
  useGSAPBoxAnimation(boxGroupRef, gsapTrigger)

  useEffect(() => {
    const handler = () => setGsapTrigger(v => !v)
    window.addEventListener('fold-studio:gsap-animate', handler)
    return () => window.removeEventListener('fold-studio:gsap-animate', handler)
  }, [])

  const useAdvancedLighting = !!lightingConfig
  const instancedMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: exteriorColor || '#ffffff', roughness: 0.4, metalness: 0.05 }),
    [exteriorColor]
  )
  const mirrorFloor = sceneCameraConfig?.mirrorFloor ?? false
  const skybox = sceneCameraConfig?.skybox ?? 'none'
  const particles = sceneCameraConfig?.particles ?? 'off'
  const particleCount = sceneCameraConfig?.particleCount ?? 200
  const cameraPath = sceneCameraConfig?.cameraPath
  const instancedEnabled = sceneCameraConfig?.instancedEnabled ?? false
  const instancedCount = sceneCameraConfig?.instancedCount ?? 12

  return (
    <>
      <color attach="background" args={[renderBg ?? cfg.bg]} />

      {/* Environment — always rendered for IBL/reflections on PBR materials */}
      {cfg.hdrFile
        ? <Environment files={cfg.hdrFile} background={false} environmentIntensity={(lightingConfig?.envIntensity ?? 0.55) * (matControls?.envIntensity ?? 1)} />
        : <Environment preset={cfg.env} background={false} environmentIntensity={(lightingConfig?.envIntensity ?? 0.45) * (matControls?.envIntensity ?? 1)} />
      }

      {/* Lighting: advanced or default scene lights */}
      {useAdvancedLighting ? (
        <AdvancedLighting config={lightingConfig!} boxH={h} />
      ) : (
        <>
          <ambientLight intensity={cfg.hemiIntensity * 0.6} color={cfg.hemiSky} />
          <hemisphereLight args={[cfg.hemiSky, cfg.hemiGround, cfg.hemiIntensity]} />
          <directionalLight
            position={cfg.dir1.pos}
            intensity={cfg.dir1.intensity * (matControls?.sunIntensity ?? 1)}
            color={cfg.dir1.color}
            castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005}
          />
          <directionalLight
            position={cfg.dir2.pos}
            intensity={cfg.dir2.intensity * (matControls?.sunIntensity ?? 1)}
            color={cfg.dir2.color}
          />
        </>
      )}

      {/* Skybox */}
      {skybox !== 'none' && <SkyboxLayer preset={skybox} />}

      {/* #165 GSAP group wraps all box content */}
      <group ref={boxGroupRef}>
        {showOBJ ? (
          <OBJMesh content={objContent!} />
        ) : importedFoldNode ? (
          <DielineFaces root={importedFoldNode} foldProgress={foldProgress} {...faceProps} />
        ) : dieline.foldNode && (isStandardBox || !showAssembled) ? (
          <DielineFaces root={dieline.foldNode} foldProgress={foldProgress} {...faceProps} />
        ) : showAssembled ? boxContent : (
          <BoxFaces w={w} h={h} d={d} foldProgress={foldProgress} {...faceProps} />
        )}
      </group>

      {/* #156/#163 3D Text overlay — normal or outline-only */}
      {text3DEnabled && text3DConfig && (
        text3DConfig.outlineOnly
          ? <TextOutline config={text3DConfig} w={w} h={h} d={d} />
          : <Text3DLayer config={text3DConfig} w={w} h={h} d={d} />
      )}

      {/* Particles */}
      {particles !== 'off' && (
        <ParticleSystem preset={particles} count={particleCount} />
      )}

      {/* Cinematic camera path */}
      {cameraPath?.enabled && <CameraPath config={cameraPath} />}

      {/* Instanced box grid */}
      {instancedEnabled && (
        <InstancedBoxGrid
          w={w} h={h} d={d}
          count={instancedCount}
          rows={Math.ceil(Math.sqrt(instancedCount))}
          material={instancedMaterial}
          animated
        />
      )}

      <SceneFloor cfg={cfg} boxH={h} showGrid={showGrid} showReflection={showReflection || mirrorFloor} />
      <ContactShadows
        position={[0, -h / 2, 0]}
        opacity={cfg.shadowOpacity}
        width={Math.max(w, d) * 6 + 1}
        height={Math.max(w, d) * 6 + 1}
        blur={2.5} far={h * 2} color={cfg.shadowColor}
      />
      <OrbitControls
        ref={orbitRef}
        enableDamping dampingFactor={0.06}
        autoRotate={autoRotate} autoRotateSpeed={1.4}
        minDistance={0.4} maxDistance={14}
        target={[0, 0, 0]}
      />

      {/* Post-processing effects */}
      {postFXConfig && <EffectsLayer config={postFXConfig} />}
    </>
  )
}
