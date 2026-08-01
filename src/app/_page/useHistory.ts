'use client'

import { useRef, useState } from 'react'
import type { BoxParams, TemplateType, ImageLayer } from '@/lib/types'

export interface Snapshot {
  params: BoxParams
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
  exteriorPresetId: string
  interiorPresetId: string
  exteriorCustomColor: string
  interiorCustomColor: string
}

const MAX_HISTORY = 60
const DEBOUNCE_MS = 380

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function equal(a: Snapshot, b: Snapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useHistory() {
  const stack = useRef<Snapshot[]>([])
  const index = useRef(-1)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoreNext = useRef(false)   // set true while restoring to skip the resulting push

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  function sync() {
    setCanUndo(index.current > 0)
    setCanRedo(index.current < stack.current.length - 1)
  }

  function commit(snap: Snapshot) {
    if (ignoreNext.current) { ignoreNext.current = false; return }

    const current = stack.current[index.current]
    if (current && equal(current, snap)) return   // no change

    // Discard any "future" states above current index
    stack.current = stack.current.slice(0, index.current + 1)

    // Enforce max history size (drop oldest)
    if (stack.current.length >= MAX_HISTORY) {
      stack.current.shift()
    } else {
      index.current++
    }

    stack.current.push(clone(snap))
    sync()
  }

  // Debounced push — use for slider drags, text inputs
  function push(snap: Snapshot) {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => commit(snap), DEBOUNCE_MS)
  }

  // Immediate push — use for discrete actions (template change, add/delete layer)
  function pushNow(snap: Snapshot) {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    commit(snap)
  }

  function undo(): Snapshot | null {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (index.current <= 0) return null
    index.current--
    sync()
    ignoreNext.current = true
    return clone(stack.current[index.current])
  }

  function redo(): Snapshot | null {
    if (index.current >= stack.current.length - 1) return null
    index.current++
    sync()
    ignoreNext.current = true
    return clone(stack.current[index.current])
  }

  return { push, pushNow, undo, redo, canUndo, canRedo, stack: stack.current }
}
