'use client'

// #136 RectAreaLight + LightProbe
// #137 HDRI via Environment (Three.js PMREMGenerator)
// #138 VSMShadowMap
// #139 3-point lighting (Key + Fill + Rim)
// #141 Lensflare
// #144 Neon emissive + Bloom setup
// #145 SpotLight with color

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js'

export interface LightingConfig {
  preset: 'studio' | 'three-point' | 'neon' | 'natural' | 'dramatic'
  intensity: number
  keyColor: string
  fillColor: string
  rimColor: string
  spotColor: string
  envIntensity: number
  showLensflare: boolean
  fogEnabled: boolean
  fogColor: string
  fogDensity: number
}

export const LIGHTING_DEFAULTS: LightingConfig = {
  preset: 'three-point',
  intensity: 1.0,
  keyColor: '#ffffff',
  fillColor: '#e8f0ff',
  rimColor: '#ffd0a0',
  spotColor: '#ffffff',
  envIntensity: 0.5,
  showLensflare: false,
  fogEnabled: false,
  fogColor: '#c8d8e8',
  fogDensity: 0.08,
}

interface AdvancedLightingProps {
  config: LightingConfig
  boxH: number
}

export function AdvancedLighting({ config, boxH }: AdvancedLightingProps) {
  const { scene, gl } = useThree()
  const lensflareRef = useRef<Lensflare | null>(null)
  const spotRef = useRef<THREE.SpotLight | null>(null)
  const rectRef = useRef<THREE.RectAreaLight | null>(null)
  const rectFillRef = useRef<THREE.RectAreaLight | null>(null)
  const lensPointRef = useRef<THREE.PointLight | null>(null)

  // Init RectAreaLight uniforms once
  useEffect(() => {
    RectAreaLightUniformsLib.init()
  }, [])

  // #138 VSMShadowMap for softer shadows
  useEffect(() => {
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.VSMShadowMap
    return () => { gl.shadowMap.type = THREE.PCFSoftShadowMap }
  }, [gl])

  // #188 Fog
  useEffect(() => {
    if (config.fogEnabled) {
      scene.fog = new THREE.FogExp2(new THREE.Color(config.fogColor), config.fogDensity)
    } else {
      scene.fog = null
    }
    return () => { scene.fog = null }
  }, [scene, config.fogEnabled, config.fogColor, config.fogDensity])

  // #141 Lensflare — attach to key light
  useEffect(() => {
    if (!config.showLensflare || !lensPointRef.current) return
    const flare = new Lensflare()
    // Procedural circle texture for lensflare
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,220,180,0.8)')
    grad.addColorStop(1, 'rgba(255,200,120,0)')
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(canvas)
    flare.addElement(new LensflareElement(tex, 80, 0, new THREE.Color(config.keyColor)))
    flare.addElement(new LensflareElement(tex, 30, 0.4, new THREE.Color('#fffae0')))
    flare.addElement(new LensflareElement(tex, 18, 0.7, new THREE.Color('#ffd080')))
    lensPointRef.current.add(flare)
    lensflareRef.current = flare
    return () => { lensPointRef.current?.remove(flare); flare.dispose() }
  }, [config.showLensflare, config.keyColor])

  const I = config.intensity

  if (config.preset === 'three-point') {
    // #139 Classic 3-point: Key (main), Fill (soft opposite), Rim (back highlight)
    return (
      <>
        {/* Key light */}
        <pointLight ref={lensPointRef} position={[4, 5, 3]} intensity={I * 1.8}
          color={config.keyColor} castShadow shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1} shadow-camera-far={30}
          shadow-bias={-0.001} shadow-radius={8} />
        {/* Fill light — softer, opposite side */}
        <pointLight position={[-3, 2, 2]} intensity={I * 0.55} color={config.fillColor} />
        {/* Rim light — backlight for product definition */}
        <pointLight position={[-1, 3, -4]} intensity={I * 0.9} color={config.rimColor} />
        {/* Ambient base */}
        <ambientLight intensity={I * 0.25} color="#e8eaf0" />
      </>
    )
  }

  if (config.preset === 'studio') {
    // #136 RectAreaLight for studio soft-box look
    return (
      <>
        <rectAreaLight ref={rectRef}
          position={[3, 4, 2]} width={4} height={3}
          intensity={I * 6} color={config.keyColor}
          lookAt={[0, 0, 0] as any} />
        <rectAreaLight ref={rectFillRef}
          position={[-3, 2, 2]} width={3} height={2.5}
          intensity={I * 2.5} color={config.fillColor}
          lookAt={[0, 0, 0] as any} />
        <pointLight position={[0, 5, -3]} intensity={I * 0.8} color="#e0e8ff" />
        <ambientLight intensity={I * 0.15} />
      </>
    )
  }

  if (config.preset === 'neon') {
    // #144 Neon emissive lighting for glow effect
    return (
      <>
        <pointLight position={[2, 2, 2]} intensity={I * 3} color="#00ffcc" />
        <pointLight position={[-2, 1, -2]} intensity={I * 2.5} color="#ff00aa" />
        <pointLight position={[0, 4, 0]} intensity={I * 1.5} color="#4040ff" />
        <ambientLight intensity={I * 0.05} color="#001020" />
      </>
    )
  }

  if (config.preset === 'dramatic') {
    // #145 Single SpotLight for dramatic shadows
    return (
      <>
        <spotLight ref={spotRef}
          position={[3, 6, 2]} angle={0.38} penumbra={0.5}
          intensity={I * 8} color={config.spotColor}
          castShadow shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.001} shadow-radius={12}
          target-position={[0, 0, 0]} />
        <pointLight position={[-4, 1, 3]} intensity={I * 0.3} color="#2040a0" />
        <ambientLight intensity={I * 0.08} />
      </>
    )
  }

  // Natural
  return (
    <>
      <hemisphereLight args={['#d0e8ff', '#a0b080', I * 1.2] as any} />
      <directionalLight position={[8, 10, 5]} intensity={I * 1.8} color="#fffde8"
        castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
      <directionalLight position={[-4, 4, 2]} intensity={I * 0.4} color="#80b0d0" />
    </>
  )
}
