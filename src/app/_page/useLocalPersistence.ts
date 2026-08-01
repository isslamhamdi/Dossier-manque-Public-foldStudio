'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { BoxParams, LayerVisibility, TemplateType, ImageLayer } from '@/lib/types'

const DB_NAME = 'fold-studio-db'
const DB_VERSION = 1
const STORE = 'projects'
const AUTO_KEY = 'autosave'
const DEBOUNCE_MS = 4000  // save 4s after last change

export interface PersistedProject {
  key: string
  savedAt: number
  version: number
  params: BoxParams
  layers: LayerVisibility
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
  exteriorPresetId: string
  interiorPresetId: string
  exteriorCustomColor: string
  interiorCustomColor: string
}

// ── Minimal IDB helper ────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'key' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(data: PersistedProject): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(data)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbGet(key: string): Promise<PersistedProject | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface Options {
  params: BoxParams
  layers: LayerVisibility
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
  exteriorPresetId: string
  interiorPresetId: string
  exteriorCustomColor: string
  interiorCustomColor: string
}

export function useLocalPersistence(opts: Options, onRestore: (p: PersistedProject) => void) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isRestored, setIsRestored] = useState(false)

  // On mount: restore autosave once
  useEffect(() => {
    idbGet(AUTO_KEY).then(saved => {
      if (saved && saved.savedAt) {
        onRestore(saved)
        setLastSaved(new Date(saved.savedAt))
      }
      setIsRestored(true)
    }).catch(() => setIsRestored(true))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save debounced on every state change (skip until restored to avoid overwriting)
  const save = useCallback(() => {
    if (!isRestored) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const project: PersistedProject = { key: AUTO_KEY, savedAt: Date.now(), version: 2, ...opts }
        await idbPut(project)
        setLastSaved(new Date())
      } catch { /* IDB unavailable (private browsing?) — silently skip */ }
    }, DEBOUNCE_MS)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestored, opts.params, opts.layers, opts.activeTemplate, opts.imageLayers,
      opts.exteriorPresetId, opts.interiorPresetId, opts.exteriorCustomColor, opts.interiorCustomColor])

  useEffect(() => { save() }, [save])

  return { lastSaved, isRestored }
}
