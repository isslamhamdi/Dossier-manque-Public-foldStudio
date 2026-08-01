'use client'

import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'

const DURATION = 2.5 // seconds for a full 0 → 1 sweep at full speed

export function useFoldAnimation() {
  const [foldProgress, setFoldProgress] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)

  // GSAP animates this proxy object; React state follows via onUpdate
  const proxy = useRef({ v: 1 })
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    if (!isAnimating) {
      tweenRef.current?.kill()
      tweenRef.current = null
      return
    }

    // Sync proxy to current state before launching tween
    proxy.current.v = foldProgress

    // Start from current position, sweep to far end, then bounce forever
    const firstTarget = proxy.current.v > 0.5 ? 0 : 1
    const firstDuration = Math.abs(firstTarget - proxy.current.v) * DURATION

    tweenRef.current?.kill()
    tweenRef.current = gsap.to(proxy.current, {
      v: firstTarget,
      duration: firstDuration,
      ease: 'power2.inOut',
      onUpdate() { setFoldProgress(proxy.current.v) },
      onComplete() {
        tweenRef.current = gsap.to(proxy.current, {
          v: firstTarget === 0 ? 1 : 0,
          duration: DURATION,
          ease: 'power2.inOut',
          yoyo: true,
          repeat: -1,
          onUpdate() { setFoldProgress(proxy.current.v) },
        })
      },
    })

    return () => { tweenRef.current?.kill() }
    // isAnimating is the only trigger; foldProgress read once at start via proxy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating])

  // When the user scrubs the slider, kill tween and stop animation
  const handleSetFoldProgress = (v: number) => {
    tweenRef.current?.kill()
    proxy.current.v = v
    setFoldProgress(v)
    if (isAnimating) setIsAnimating(false)
  }

  return { foldProgress, setFoldProgress: handleSetFoldProgress, isAnimating, setIsAnimating }
}
