'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { BoxParams, ImageLayer, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'

const MM_TO_PX = 3.7795275591

function detectFaceFromPosition(layer: ImageLayer, params: BoxParams, template: TemplateType): ImageLayer['faceAssignment'] {
  const dieline = computeDieline(params, template)
  const cx = (layer.x + (layer.width * layer.scale) / 2) * MM_TO_PX
  const cy = (layer.y + (layer.height * layer.scale) / 2) * MM_TO_PX
  const FACE_MAP: Record<string, ImageLayer['faceAssignment']> = { Front: 'front', Back: 'back', Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' }
  for (const panel of dieline.panels) {
    if (cx >= panel.x && cx <= panel.x + panel.w && cy >= panel.y && cy <= panel.y + panel.h)
      return FACE_MAP[panel.label] ?? 'auto'
  }
  return 'auto'
}

interface Options {
  params: BoxParams
  activeTemplate: TemplateType
}

export function useImageLayers({ params, activeTemplate }: Options) {
  const [imageLayers, setImageLayers] = useState<ImageLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([])
  const [layerHistory, setLayerHistory] = useState<ImageLayer[][]>([])
  const imageLayersRef = useRef<ImageLayer[]>([])
  const selectedLayerIdRef = useRef<string | null>(null)
  const selectedLayerIdsRef = useRef<string[]>([])
  const clipboardRef = useRef<ImageLayer | null>(null)

  useEffect(() => { imageLayersRef.current = imageLayers }, [imageLayers])
  useEffect(() => { selectedLayerIdRef.current = selectedLayerId }, [selectedLayerId])
  useEffect(() => { selectedLayerIdsRef.current = selectedLayerIds }, [selectedLayerIds])

  const pushHistory = useCallback(() => {
    setLayerHistory(h => [...h.slice(-49), imageLayersRef.current])
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        const id = selectedLayerIdRef.current
        if (id) {
          e.preventDefault()
          setLayerHistory(h => [...h.slice(-49), imageLayersRef.current])
          setImageLayers(prev => prev.filter(l => l.id !== id))
          setSelectedLayerId(null)
        }
        return
      }
      const meta = e.ctrlKey || e.metaKey
      if (!meta) return
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        setLayerHistory(h => {
          if (h.length === 0) return h
          setImageLayers(h[h.length - 1])
          return h.slice(0, -1)
        })
      } else if (e.key === 'c') {
        const id = selectedLayerIdRef.current
        if (id) clipboardRef.current = imageLayersRef.current.find(l => l.id === id) ?? null
      } else if (e.key === 'x') {
        const id = selectedLayerIdRef.current
        if (id) {
          e.preventDefault()
          clipboardRef.current = imageLayersRef.current.find(l => l.id === id) ?? null
          setLayerHistory(h => [...h.slice(-49), imageLayersRef.current])
          setImageLayers(prev => prev.filter(l => l.id !== id))
          setSelectedLayerId(null)
        }
      } else if (e.key === 'v') {
        if (clipboardRef.current) {
          e.preventDefault()
          const src = clipboardRef.current
          setLayerHistory(h => [...h.slice(-49), imageLayersRef.current])
          const newLayer: ImageLayer = { ...src, id: `img-${Date.now()}`, name: `${src.name} copie`, x: src.x + 10, y: src.y + 10 }
          clipboardRef.current = newLayer
          setImageLayers(prev => [newLayer, ...prev])
          setSelectedLayerId(newLayer.id)
        }
      } else if (e.key === 'd') {
        const id = selectedLayerIdRef.current
        if (id) {
          e.preventDefault()
          const orig = imageLayersRef.current.find(l => l.id === id)
          if (orig) {
            setLayerHistory(h => [...h.slice(-49), imageLayersRef.current])
            const newLayer: ImageLayer = { ...orig, id: `img-${Date.now()}`, name: `${orig.name} copie`, x: orig.x + 5, y: orig.y + 5 }
            setImageLayers(prev => [newLayer, ...prev])
            setSelectedLayerId(newLayer.id)
          }
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleToggleSelectLayer = useCallback((id: string) => {
    setSelectedLayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])

  const handleMoveSelectedLayers = useCallback((dx: number, dy: number) => {
    setImageLayers(prev => prev.map(l => {
      if (!selectedLayerIdsRef.current.includes(l.id)) return l
      const moved = { ...l, x: l.x + dx, y: l.y + dy }
      return { ...moved, faceAssignment: detectFaceFromPosition(moved, params, activeTemplate) }
    }))
  }, [params, activeTemplate])

  const handleAddImageLayer = useCallback((layer: ImageLayer) => {
    pushHistory()
    const detected = detectFaceFromPosition(layer, params, activeTemplate)
    // If caller already specified a face (not 'auto'), keep it; otherwise detect or default to 'front'
    const face = layer.faceAssignment !== 'auto' ? layer.faceAssignment : (detected !== 'auto' ? detected : 'front')
    const withFace: ImageLayer = { ...layer, faceAssignment: face }
    setImageLayers(prev => [withFace, ...prev])
    setSelectedLayerId(withFace.id)
    setSelectedLayerIds([withFace.id])
  }, [pushHistory, params, activeTemplate])

  const handleUpdateImageLayer = useCallback((id: string, updates: Partial<ImageLayer>) => {
    setImageLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const handleDeleteImageLayer = useCallback((id: string) => {
    pushHistory()
    setImageLayers(prev => prev.filter(l => l.id !== id))
    setSelectedLayerId(prev => prev === id ? null : prev)
  }, [pushHistory])

  const handleDuplicateImageLayer = useCallback((id: string) => {
    pushHistory()
    const newId = `img-${Date.now()}`
    setImageLayers(prev => {
      const idx = prev.findIndex(l => l.id === id)
      if (idx === -1) return prev
      const orig = prev[idx]
      const copy = { ...orig, id: newId, name: `${orig.name} copy`, x: orig.x + 5, y: orig.y + 5 }
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
    setSelectedLayerId(newId)
  }, [pushHistory])

  const handleMoveImageLayer = useCallback((id: string, dx: number, dy: number) => {
    setImageLayers(prev => prev.map(l => {
      if (l.id !== id) return l
      const moved = { ...l, x: l.x + dx, y: l.y + dy }
      return { ...moved, faceAssignment: detectFaceFromPosition(moved, params, activeTemplate) }
    }))
  }, [params, activeTemplate])

  const handleReorderLayer = useCallback((id: string, direction: 'up' | 'down') => {
    setImageLayers(prev => {
      const idx = prev.findIndex(l => l.id === id)
      if (idx === -1) return prev
      const next = direction === 'up' ? idx - 1 : idx + 1
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }, [])

  return {
    imageLayers, setImageLayers,
    selectedLayerId, setSelectedLayerId,
    selectedLayerIds, setSelectedLayerIds,
    imageLayersRef,
    handleToggleSelectLayer, handleMoveSelectedLayers,
    handleAddImageLayer, handleUpdateImageLayer, handleDeleteImageLayer,
    handleDuplicateImageLayer, handleMoveImageLayer, handleReorderLayer,
  }
}
