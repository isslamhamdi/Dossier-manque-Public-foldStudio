'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BoxParams, TemplateType, ImageLayer } from '@/lib/types'

export interface ProjectEntry {
  id: string
  name: string
  client: string
  folder: string
  thumbnail?: string
  params: BoxParams
  activeTemplate: TemplateType
  imageLayers: ImageLayer[]
  exteriorColor: string
  interiorColor: string
  savedAt: Date
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected'
  approvalNote?: string
}

const DB_NAME = 'fold-studio-projects'
const STORE = 'projects'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('folder', 'folder', { unique: false })
        store.createIndex('client', 'client', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbGetAll(): Promise<ProjectEntry[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbPut(entry: ProjectEntry): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(entry)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectEntry[]>([])

  useEffect(() => {
    dbGetAll().then(entries => {
      setProjects(entries.map(e => ({ ...e, savedAt: new Date(e.savedAt) })))
    }).catch(() => {})
  }, [])

  const saveProject = useCallback(async (entry: Omit<ProjectEntry, 'id' | 'savedAt'> & { id?: string }) => {
    const full: ProjectEntry = {
      ...entry,
      id: entry.id ?? `proj-${Date.now()}`,
      savedAt: new Date(),
    }
    await dbPut(full)
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === full.id)
      return idx >= 0 ? prev.map(p => p.id === full.id ? full : p) : [...prev, full]
    })
    return full.id
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    await dbDelete(id)
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  const updateApproval = useCallback(async (id: string, status: ProjectEntry['approvalStatus'], note?: string) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, approvalStatus: status, approvalNote: note } : p)
      const entry = updated.find(p => p.id === id)
      if (entry) dbPut(entry).catch(() => {})
      return updated
    })
  }, [])

  const folders = Array.from(new Set(projects.map(p => p.folder).filter(Boolean)))
  const clients = Array.from(new Set(projects.map(p => p.client).filter(Boolean)))

  return { projects, folders, clients, saveProject, deleteProject, updateApproval }
}
