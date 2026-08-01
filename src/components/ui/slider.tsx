'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import * as RadixSlider from '@radix-ui/react-slider'
import { c } from '@/lib/tokens'

interface SliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function Slider({ value, min, max, step, onChange, disabled }: SliderProps) {
  // Local state so the thumb moves instantly even when parent state is throttled
  const [localValue, setLocalValue] = useState(value)
  const isDragging = useRef(false)
  const pendingValue = useRef(value)
  const rafRef = useRef<number | null>(null)
  // Always-current onChange ref — avoids stale closure in rAF callback
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Sync thumb from external value when not actively dragging
  useEffect(() => {
    if (!isDragging.current) setLocalValue(value)
  }, [value])

  // Throttle onChange to at most once per animation frame (≤60fps)
  const handleChange = useCallback(([v]: number[]) => {
    isDragging.current = true
    setLocalValue(v)
    pendingValue.current = v
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        onChangeRef.current(pendingValue.current)
        rafRef.current = null
      })
    }
  }, [])

  // On release: cancel pending rAF and commit the exact final value
  const handleCommit = useCallback(([v]: number[]) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    onChangeRef.current(v)
    isDragging.current = false
  }, [])

  return (
    <RadixSlider.Root
      min={min} max={max} step={step} value={[localValue]} disabled={disabled}
      onValueChange={handleChange}
      onValueCommit={handleCommit}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        userSelect: 'none', touchAction: 'none', width: '100%', height: 20,
      }}
    >
      <RadixSlider.Track style={{
        background: '#d0cec9', position: 'relative', flexGrow: 1, borderRadius: 1, height: 2,
      }}>
        <RadixSlider.Range style={{
          position: 'absolute', background: c.ink, borderRadius: 1, height: '100%',
        }} />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        className="fs-slider-thumb"
        style={{
          display: 'block', width: 11, height: 11, background: c.ink,
          borderRadius: '50%', cursor: 'pointer', outline: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }}
      />
    </RadixSlider.Root>
  )
}
