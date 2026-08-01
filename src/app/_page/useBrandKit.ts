'use client'

/**
 * Feature #51: Brand kit — persistent brand colors, fonts, and logos
 * Stored in IndexedDB, survives page refresh.
 */

import { useState, useEffect, useCallback } from 'react'

export interface BrandKit {
  name: string
  primaryColors: string[]   // hex
  secondaryColors: string[] // hex
  fontFamily: string
  logoSrc: string | null    // base64 data URL
}

const DEFAULT_KIT: BrandKit = {
  name: 'Ma marque',
  primaryColors: ['#e91e8c', '#5A6BD4', '#1a1a2e'],
  secondaryColors: ['#f5f3ef', '#ffffff', '#c8b8a0'],
  fontFamily: 'system-ui, sans-serif',
  logoSrc: null,
}

async function openBrandDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('fold-studio-brand', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('kit', { keyPath: 'id' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function loadKit(): Promise<BrandKit | null> {
  try {
    const db = await openBrandDB()
    return new Promise((resolve) => {
      const tx = db.transaction('kit', 'readonly')
      const req = tx.objectStore('kit').get('main')
      req.onsuccess = () => resolve(req.result?.data ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

async function saveKit(kit: BrandKit): Promise<void> {
  try {
    const db = await openBrandDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('kit', 'readwrite')
      tx.objectStore('kit').put({ id: 'main', data: kit })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch { /* ignore */ }
}

export function useBrandKit() {
  const [kit, setKitState] = useState<BrandKit>(DEFAULT_KIT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadKit().then(saved => {
      if (saved) setKitState(saved)
      setLoaded(true)
    })
  }, [])

  const setKit = useCallback((updates: Partial<BrandKit>) => {
    setKitState(prev => {
      const next = { ...prev, ...updates }
      saveKit(next)
      return next
    })
  }, [])

  const addPrimaryColor = useCallback((hex: string) => {
    setKitState(prev => {
      const next = { ...prev, primaryColors: Array.from(new Set([...prev.primaryColors, hex])).slice(0, 8) }
      saveKit(next)
      return next
    })
  }, [])

  const addSecondaryColor = useCallback((hex: string) => {
    setKitState(prev => {
      const next = { ...prev, secondaryColors: Array.from(new Set([...prev.secondaryColors, hex])).slice(0, 8) }
      saveKit(next)
      return next
    })
  }, [])

  const removeColor = useCallback((hex: string, type: 'primary' | 'secondary') => {
    setKitState(prev => {
      const next = type === 'primary'
        ? { ...prev, primaryColors: prev.primaryColors.filter(c => c !== hex) }
        : { ...prev, secondaryColors: prev.secondaryColors.filter(c => c !== hex) }
      saveKit(next)
      return next
    })
  }, [])

  return { kit, setKit, addPrimaryColor, addSecondaryColor, removeColor, loaded }
}
