'use client'

import { useState, useCallback } from 'react'

const SNAP = 80
export const DEFAULT_LEFT_W = 240
export const DEFAULT_CENTER_W = 420
export const DEFAULT_RENDER_W = 300

export function usePanelLayout() {
  const [leftW, setLeftW] = useState(DEFAULT_LEFT_W)
  const [centerW, setCenterW] = useState(DEFAULT_CENTER_W)
  const [renderW, setRenderW] = useState(DEFAULT_RENDER_W)
  const [splitW, setSplitW] = useState(0) // 0 = auto 50/50; >0 = fixed px width for 2D pane
  const [isDraggingAny, setIsDraggingAny] = useState(false)

  const MIN_2D = 280
  const MIN_3D = 300

  const startSplitDrag = useCallback((e: React.MouseEvent, initialW: number, containerW: number) => {
    e.preventDefault()
    setIsDraggingAny(true)
    const startX = e.clientX
    const maxW = Math.max(MIN_2D, containerW - MIN_3D - 4)
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      setSplitW(Math.max(MIN_2D, Math.min(maxW, initialW + dx)))
    }
    const onUp = () => {
      setIsDraggingAny(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startDrag = useCallback((which: 'left' | 'right' | 'center' | 'render', e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingAny(true)
    const startX = e.clientX
    let snapLeft = leftW, snapCenter = centerW, snapRender = renderW

    // capture current values at drag start (avoids stale closure from state reads)
    const getLeft = () => snapLeft
    const getCenter = () => snapCenter
    const getRender = () => snapRender
    void getLeft; void getCenter; void getRender

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      if (which === 'left') {
        const newL = snapLeft + dx
        const newC = snapCenter - dx
        setLeftW(newL < SNAP ? 0 : Math.max(SNAP, Math.min(450, newL)))
        if (newL >= SNAP) setCenterW(Math.max(SNAP, Math.min(800, newC)))
      } else if (which === 'right') {
        const newL = snapLeft - dx
        setLeftW(newL < SNAP ? 0 : Math.max(SNAP, Math.min(450, newL)))
      } else if (which === 'center') {
        const newC = snapCenter + dx
        setCenterW(newC < SNAP ? 0 : Math.max(SNAP, Math.min(800, newC)))
      } else {
        const newR = snapRender - dx
        setRenderW(newR < SNAP ? 0 : Math.max(SNAP, Math.min(600, newR)))
      }
    }
    const onUp = () => {
      setIsDraggingAny(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [leftW, centerW, renderW])

  return { leftW, setLeftW, centerW, setCenterW, renderW, setRenderW, splitW, setSplitW, startSplitDrag, isDraggingAny, startDrag, MIN_2D, MIN_3D }
}
