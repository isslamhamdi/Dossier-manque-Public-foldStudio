'use client'

/**
 * Feature #44-45: Product inside box + shelf render (multiple products in scene)
 * Renders N copies of the packaging arranged as a retail shelf display.
 */

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ShelfSceneProps {
  children: React.ReactNode  // The packaging mesh
  count?: number             // Number of copies
  layout?: 'shelf' | 'stack' | 'scattered'
  spacing?: number           // Distance between copies (Three.js units)
}

// Single shelf row: count items side by side
export function ShelfRow({ count = 3, spacing = 1.2, children }: { count?: number; spacing?: number; children: React.ReactNode }) {
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    positions.push([(i - (count - 1) / 2) * spacing, 0, 0])
  }

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {children}
        </group>
      ))}
    </>
  )
}

// Stacked column
export function StackColumn({ count = 3, children }: { count?: number; children: React.ReactNode }) {
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    positions.push([0, i * 0.65, 0])
  }
  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {children}
        </group>
      ))}
    </>
  )
}

// Scattered arrangement (display table)
export function ScatteredDisplay({ count = 6, children }: { count?: number; children: React.ReactNode }) {
  const allPositions: [number, number, number][] = [
    [0, 0, 0], [-1.1, 0, 0.3], [1.1, 0, -0.2],
    [-0.5, 0, -0.8], [0.6, 0, 0.7], [-1.3, 0, -0.6],
  ]
  const positions = allPositions.slice(0, count)

  const rotations: [number, number, number][] = [
    [0, 0, 0], [0, 0.3, 0], [0, -0.2, 0],
    [0, 1.1, 0], [0, -0.5, 0], [0, 0.8, 0],
  ]

  return (
    <>
      {positions.map((pos, i) => (
        <group key={i} position={pos} rotation={rotations[i]}>
          {children}
        </group>
      ))}
    </>
  )
}
