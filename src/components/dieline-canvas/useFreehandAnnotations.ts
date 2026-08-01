'use client'

/**
 * Freehand annotation tool for the 2D patron canvas.
 * Uses the perfect-freehand stroke algorithm for natural-looking strokes.
 * Strokes are stored as SVG path strings and rendered as an overlay layer.
 */

import { useState, useRef, useCallback } from 'react'
import { getStroke, strokeToClosedPath } from '@/lib/freehand/stroke'

export interface Annotation {
  id: string
  path: string
  color: string
  size: number
}

export function useFreehandAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [annotationMode, setAnnotationMode] = useState(false)
  const [penColor, setPenColor] = useState('#e91e8c')
  const [penSize, setPenSize] = useState(4)

  const currentPoints = useRef<[number, number][]>([])
  const currentAnnotation = useRef<string>('')

  const startStroke = useCallback((x: number, y: number) => {
    if (!annotationMode) return false
    currentPoints.current = [[x, y]]
    currentAnnotation.current = ''
    setIsDrawing(true)
    return true
  }, [annotationMode])

  const continueStroke = useCallback((x: number, y: number): string => {
    if (!isDrawing) return ''
    currentPoints.current.push([x, y])
    const outline = getStroke(currentPoints.current, {
      size: penSize,
      thinning: 0.5,
      smoothing: 0.6,
      streamline: 0.5,
      simulatePressure: true,
    })
    const path = strokeToClosedPath(outline)
    currentAnnotation.current = path
    return path
  }, [isDrawing, penSize])

  const endStroke = useCallback(() => {
    if (!isDrawing || !currentAnnotation.current) return
    setAnnotations(prev => [...prev, {
      id: `ann-${Date.now()}`,
      path: currentAnnotation.current,
      color: penColor,
      size: penSize,
    }])
    currentPoints.current = []
    currentAnnotation.current = ''
    setIsDrawing(false)
  }, [isDrawing, penColor, penSize])

  const undoLastStroke = useCallback(() => {
    setAnnotations(prev => prev.slice(0, -1))
  }, [])

  const clearAnnotations = useCallback(() => {
    setAnnotations([])
  }, [])

  return {
    annotations,
    isDrawing,
    annotationMode,
    setAnnotationMode,
    penColor, setPenColor,
    penSize, setPenSize,
    startStroke, continueStroke, endStroke,
    undoLastStroke, clearAnnotations,
    liveAnnotationPath: currentAnnotation.current,
  }
}
