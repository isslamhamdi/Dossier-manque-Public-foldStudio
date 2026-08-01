'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface NumberTickerProps {
  value: number
  decimals?: number
  suffix?: string
  style?: React.CSSProperties
}

export function NumberTicker({ value, decimals = 0, suffix = '', style }: NumberTickerProps) {
  const spanRef = useRef<HTMLSpanElement>(null)
  const proxy = useRef({ v: value })

  useEffect(() => {
    const tween = gsap.to(proxy.current, {
      v: value,
      duration: 0.55,
      ease: 'power2.out',
      onUpdate() {
        if (!spanRef.current) return
        const n = decimals > 0 ? proxy.current.v.toFixed(decimals) : String(Math.round(proxy.current.v))
        spanRef.current.textContent = n + suffix
      },
    })
    return () => { tween.kill() }
  }, [value, decimals, suffix])

  const initial = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value))

  return (
    <span ref={spanRef} style={style}>{initial}{suffix}</span>
  )
}
