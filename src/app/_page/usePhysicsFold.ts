'use client'

/**
 * Spring-damper physics simulation for fold animation.
 * Approximates Rapier rigid-body/joint behavior: each panel folds
 * with inertia, overshoot, and damping — like real cardboard.
 *
 * When @dimforge/rapier3d is installed, swap this for true WASM physics.
 */

import { useRef, useState, useCallback } from 'react'

interface SpringState {
  pos: number    // current fold progress (0=open, 1=closed)
  vel: number    // angular velocity
}

interface PhysicsFoldOptions {
  stiffness?: number     // spring stiffness (default 120)
  damping?: number       // damping ratio (default 18)
  gravity?: number       // gravity force toward target (default 0.8)
  restThreshold?: number // snap to rest when |v| < threshold (default 0.001)
}

export function usePhysicsFold({
  stiffness = 120,
  damping = 18,
  gravity = 0.8,
  restThreshold = 0.0008,
}: PhysicsFoldOptions = {}) {
  const state = useRef<SpringState>({ pos: 1, vel: 0 })
  const target = useRef(1)
  const running = useRef(false)
  const rafId = useRef<number | null>(null)
  const lastTime = useRef<number>(0)

  const [foldProgress, setFoldProgress] = useState(1)
  const [isPhysicsActive, setIsPhysicsActive] = useState(false)

  const tick = useCallback((time: number) => {
    if (!running.current) return

    const dt = Math.min((time - lastTime.current) / 1000, 0.05)
    lastTime.current = time

    const s = state.current
    const error = target.current - s.pos

    // Spring force: F = k * error − damping * vel + gravity
    const force = stiffness * error - damping * s.vel + gravity * Math.sign(error)
    s.vel += force * dt
    s.pos = Math.max(0, Math.min(1, s.pos + s.vel * dt))

    setFoldProgress(s.pos)

    // Auto-stop at rest
    if (Math.abs(error) < 0.001 && Math.abs(s.vel) < restThreshold) {
      s.pos = target.current
      s.vel = 0
      setFoldProgress(target.current)
      running.current = false
      setIsPhysicsActive(false)
      return
    }

    rafId.current = requestAnimationFrame(tick)
  }, [stiffness, damping, gravity, restThreshold])

  const startLoop = useCallback(() => {
    if (running.current) return
    running.current = true
    setIsPhysicsActive(true)
    lastTime.current = performance.now()
    rafId.current = requestAnimationFrame(tick)
  }, [tick])

  const stopLoop = useCallback(() => {
    running.current = false
    if (rafId.current) { cancelAnimationFrame(rafId.current); rafId.current = null }
    setIsPhysicsActive(false)
  }, [])

  // Drop: release the lid from current position, gravity pulls it closed
  const drop = useCallback(() => {
    target.current = 1
    startLoop()
  }, [startLoop])

  // Open: push lid open with initial velocity burst
  const open = useCallback(() => {
    state.current.vel = -2.5
    target.current = 0
    startLoop()
  }, [startLoop])

  // Flick: tap the box, it bounces then settles
  const flick = useCallback(() => {
    state.current.vel += 1.8
    target.current = state.current.pos > 0.5 ? 1 : 0
    startLoop()
  }, [startLoop])

  // Manual override (from slider)
  const setPosition = useCallback((v: number) => {
    stopLoop()
    state.current.pos = v
    state.current.vel = 0
    target.current = v
    setFoldProgress(v)
  }, [stopLoop])

  return { foldProgress, isPhysicsActive, drop, open, flick, setPosition }
}
