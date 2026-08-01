'use client'

// #169 Particules (confetti, paillettes) — Three.js Points + shader
// #164-165 GSAP easing (called from useFoldAnimation)
// #171 Chemin de caméra CatmullRomCurve3

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { gsap } from 'gsap'

// ─── Particle System #169 ─────────────────────────────────────────────────────

export type ParticlePreset = 'confetti' | 'sparkles' | 'dust' | 'snow' | 'off'

interface ParticleSystemProps {
  preset: ParticlePreset
  count?: number
  colors?: string[]
  origin?: [number, number, number]
}

const CONFETTI_COLORS = ['#ff4444', '#44ff88', '#4488ff', '#ffdd00', '#ff44cc', '#44ffdd']

function makeParticleColors(colors: string[], count: number): Float32Array {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const c = new THREE.Color(colors[i % colors.length])
    arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b
  }
  return arr
}

export function ParticleSystem({
  preset = 'confetti',
  count = 200,
  colors = CONFETTI_COLORS,
  origin = [0, 1, 0],
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const velRef = useRef<Float32Array>(new Float32Array(count * 3))
  const lifeRef = useRef<Float32Array>(new Float32Array(count))

  const { positions, colorAttr } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = velRef.current
    const life = lifeRef.current

    for (let i = 0; i < count; i++) {
      pos[i * 3] = origin[0] + (Math.random() - 0.5) * 0.1
      pos[i * 3 + 1] = origin[1]
      pos[i * 3 + 2] = origin[2] + (Math.random() - 0.5) * 0.1
      const speed = preset === 'confetti' ? 0.04 : preset === 'snow' ? 0.005 : 0.012
      vel[i * 3] = (Math.random() - 0.5) * speed * 2
      vel[i * 3 + 1] = Math.random() * speed + (preset === 'confetti' ? 0.02 : -0.002)
      vel[i * 3 + 2] = (Math.random() - 0.5) * speed * 2
      life[i] = Math.random()
    }
    return { positions: pos, colorAttr: makeParticleColors(colors, count) }
  }, [count, colors, preset, origin])

  const geoRef = useRef<THREE.BufferGeometry>(null)

  useFrame((_, delta) => {
    const geo = geoRef.current
    if (!geo) return
    const pos = geo.attributes.position.array as Float32Array
    const vel = velRef.current
    const life = lifeRef.current
    const gravity = preset === 'snow' ? -0.001 : preset === 'dust' ? 0 : -0.008
    const drag = preset === 'snow' ? 0.99 : 0.98

    for (let i = 0; i < count; i++) {
      life[i] -= delta * 0.4
      if (life[i] < 0) {
        // Reset particle
        life[i] = 1
        pos[i * 3] = origin[0] + (Math.random() - 0.5) * 0.2
        pos[i * 3 + 1] = origin[1]
        pos[i * 3 + 2] = origin[2] + (Math.random() - 0.5) * 0.2
        const speed = preset === 'confetti' ? 0.04 : preset === 'snow' ? 0.005 : 0.012
        vel[i * 3] = (Math.random() - 0.5) * speed * 2
        vel[i * 3 + 1] = Math.random() * speed + (preset === 'confetti' ? 0.02 : -0.001)
        vel[i * 3 + 2] = (Math.random() - 0.5) * speed * 2
        continue
      }
      vel[i * 3 + 1] += gravity * delta
      vel[i * 3] *= drag; vel[i * 3 + 2] *= drag
      pos[i * 3] += vel[i * 3]
      pos[i * 3 + 1] += vel[i * 3 + 1]
      pos[i * 3 + 2] += vel[i * 3 + 2]
    }
    geo.attributes.position.needsUpdate = true
  })

  if (preset === 'off') return null

  const pointSize = preset === 'sparkles' ? 0.025 : preset === 'snow' ? 0.015 : 0.02

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} />
        <bufferAttribute attach="attributes-color" args={[colorAttr, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize} vertexColors transparent opacity={0.9}
        sizeAttenuation blending={preset === 'sparkles' ? THREE.AdditiveBlending : THREE.NormalBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── Camera Path #171 ─────────────────────────────────────────────────────────

export interface CameraPathConfig {
  enabled: boolean
  speed: number
  loop: boolean
}

export function CameraPath({ config }: { config: CameraPathConfig }) {
  const { camera } = useThree()
  const tRef = useRef(0)

  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(3, 2, 4),
    new THREE.Vector3(4, 3, 0),
    new THREE.Vector3(2, 4, -4),
    new THREE.Vector3(-3, 2, -3),
    new THREE.Vector3(-4, 1.5, 1),
    new THREE.Vector3(-2, 3, 4),
    new THREE.Vector3(0, 2, 5),
    new THREE.Vector3(3, 2, 4),
  ], true), [])

  useFrame((_, delta) => {
    if (!config.enabled) return
    tRef.current = (tRef.current + delta * config.speed * 0.04) % 1
    const pos = curve.getPoint(tRef.current)
    camera.position.copy(pos)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── GSAP Timeline animation #165 ────────────────────────────────────────────

export function useGSAPBoxAnimation(meshRef: React.RefObject<THREE.Object3D | null>, trigger: boolean) {
  useEffect(() => {
    const obj = meshRef.current
    if (!obj || !trigger) return
    // #164 Custom easing — cubic-bezier bounce on open
    gsap.fromTo(obj.rotation, { y: 0 }, {
      y: Math.PI * 2, duration: 1.2,
      ease: 'elastic.out(1, 0.6)',
    })
    gsap.fromTo(obj.scale, { x: 0.8, y: 0.8, z: 0.8 }, {
      x: 1, y: 1, z: 1, duration: 0.8,
      ease: 'back.out(1.5)',
    })
  }, [trigger, meshRef])
}

// ─── GSAP scroll-driven fold #172 ────────────────────────────────────────────

// #172 scroll-driven fold — delta brut ±, accumulé côté appelant
export function useScrollFold(
  containerRef: React.RefObject<HTMLElement | null>,
  onDelta: (delta: number) => void,
) {
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      onDelta(e.deltaY / 600)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [containerRef, onDelta])
}
