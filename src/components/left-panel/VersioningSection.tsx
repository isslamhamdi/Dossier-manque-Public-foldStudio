'use client'

import { useEffect, useState } from 'react'
import type { BoxParams, ImageLayer } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

interface VersioningSectionProps {
  params: BoxParams
  imageLayers: ImageLayer[]
  onRestore: (params: BoxParams, layers: ImageLayer[]) => void
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const DB_NAME = 'fold-studio-db'
const DB_VERSION = 1
const STORE = 'kv'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbGet(key: string): Promise<unknown> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function dbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function dbList(prefix: string): Promise<{ key: string; ts: number; label: string }[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const req = store.getAllKeys()
    req.onsuccess = () => {
      const keys = (req.result as string[]).filter(k => k.startsWith(prefix))
      const results: { key: string; ts: number; label: string }[] = []
      let remaining = keys.length
      if (remaining === 0) { resolve([]); return }
      keys.forEach(key => {
        const vReq = store.get(key)
        vReq.onsuccess = () => {
          const val = vReq.result as { ts: number; label: string } | undefined
          if (val) results.push({ key, ts: val.ts, label: val.label })
          remaining--
          if (remaining === 0) {
            results.sort((a, b) => b.ts - a.ts)
            resolve(results)
          }
        }
        vReq.onerror = () => {
          remaining--
          if (remaining === 0) {
            results.sort((a, b) => b.ts - a.ts)
            resolve(results)
          }
        }
      })
    }
    req.onerror = () => reject(req.error)
  })
}

async function dbDelete(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const req = tx.objectStore(STORE).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VersionEntry {
  label: string
  ts: number
  params: BoxParams
  imageLayers: ImageLayer[]
}

interface VersionMeta {
  key: string
  ts: number
  label: string
}

const KEY_PREFIX = 'fold-version-'
const MAX_VERSIONS = 20

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${c.border}`,
  borderRadius: r.md,
  padding: '5px 8px',
  fontSize: fs.md,
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff',
  color: '#333',
}

const btnPrimary: React.CSSProperties = {
  width: '100%',
  background: c.ink,
  color: '#fff',
  border: 'none',
  borderRadius: r.lg,
  padding: '8px 0',
  fontSize: fs.md,
  fontWeight: fw.bold,
  cursor: 'pointer',
}

// ─── Date formatter ───────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VersioningSection({ params, imageLayers, onRestore }: VersioningSectionProps) {
  const [versions, setVersions] = useState<VersionMeta[]>([])
  const [labelInput, setLabelInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadVersions = async () => {
    try {
      const list = await dbList(KEY_PREFIX)
      setVersions(list)
    } catch {
      // ignore — IndexedDB not available in some contexts
    }
  }

  useEffect(() => {
    loadVersions()
  }, [])

  const handleSave = async () => {
    if (versions.length >= MAX_VERSIONS) {
      setError(`Maximum ${MAX_VERSIONS} versions atteint — supprimez-en une avant de continuer.`)
      return
    }
    setSaving(true)
    setError(null)
    const ts = Date.now()
    const key = `${KEY_PREFIX}${ts}`
    const label = labelInput.trim() || `Version du ${formatDate(ts)}`
    const entry: VersionEntry = { label, ts, params, imageLayers }
    try {
      await dbSet(key, entry)
      setLabelInput('')
      await loadVersions()
    } catch {
      setError('Impossible de sauvegarder — IndexedDB non disponible.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (key: string) => {
    setRestoring(key)
    setError(null)
    try {
      const entry = await dbGet(key) as VersionEntry | undefined
      if (entry) {
        onRestore(entry.params, entry.imageLayers)
      }
    } catch {
      setError('Impossible de restaurer cette version.')
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (key: string) => {
    setError(null)
    try {
      await dbDelete(key)
      await loadVersions()
    } catch {
      setError('Impossible de supprimer cette version.')
    }
  }

  const atMax = versions.length >= MAX_VERSIONS

  return (
    <CollapsibleSection label="Versioning Local">
      {/* Save section */}
      <div style={{
        background: c.surface,
        border: `1px solid ${c.borderSep}`,
        borderRadius: r.lg,
        padding: '10px 12px',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 7, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Sauvegarder version
        </div>
        <input
          type="text"
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          placeholder="v1 — design initial"
          style={{ ...inputStyle, marginBottom: 8 }}
        />
        <button
          onClick={handleSave}
          disabled={saving || atMax}
          style={{
            ...btnPrimary,
            background: (saving || atMax) ? '#999' : c.ink,
            cursor: (saving || atMax) ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>

        {atMax && (
          <div style={{
            marginTop: 7,
            fontSize: fs.xs,
            color: '#f57c00',
            background: '#fff8e1',
            border: '1px solid #ffe082',
            borderRadius: r.sm,
            padding: '4px 8px',
          }}>
            Maximum {MAX_VERSIONS} versions — supprimez-en une pour continuer.
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: '#fff5f5',
          border: `1px solid #ffd0d0`,
          borderRadius: r.md,
          padding: '6px 9px',
          fontSize: fs.sm,
          color: c.danger,
          marginBottom: 8,
        }}>
          {error}
        </div>
      )}

      {/* Versions list */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 7,
        }}>
          <div style={{ fontSize: fs.xs, color: c.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Versions sauvegardées
          </div>
          <span style={{
            fontSize: fs.xs,
            color: versions.length >= MAX_VERSIONS ? '#f57c00' : c.textMuted,
            fontWeight: versions.length >= MAX_VERSIONS ? fw.bold : fw.normal,
          }}>
            {versions.length}/{MAX_VERSIONS}
          </span>
        </div>

        {versions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '16px 0',
            fontSize: fs.sm,
            color: c.textMuted,
            background: c.surface,
            borderRadius: r.lg,
            border: `1px solid ${c.borderXLight}`,
          }}>
            Aucune version sauvegardée
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {versions.map(v => (
              <div
                key={v.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: '#fff',
                  border: `1px solid ${c.borderSep}`,
                  borderRadius: r.lg,
                  padding: '7px 10px',
                }}
              >
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: fs.md,
                    color: c.ink,
                    fontWeight: fw.medium,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: fs.xs, color: c.textMuted, marginTop: 2 }}>
                    {formatDate(v.ts)}
                  </div>
                </div>

                {/* Restore */}
                <button
                  onClick={() => handleRestore(v.key)}
                  disabled={restoring === v.key}
                  title="Restaurer cette version"
                  style={{
                    background: restoring === v.key ? c.surface : c.accentBg,
                    color: restoring === v.key ? c.textMuted : c.accent,
                    border: `1px solid ${restoring === v.key ? c.borderLight : c.accentBorder}`,
                    borderRadius: r.md,
                    padding: '3px 8px',
                    fontSize: fs.xs,
                    fontWeight: fw.bold,
                    cursor: restoring === v.key ? 'default' : 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {restoring === v.key ? '...' : 'Restaurer'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(v.key)}
                  title="Supprimer cette version"
                  style={{
                    background: 'transparent',
                    color: c.textLight,
                    border: 'none',
                    borderRadius: r.sm,
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 14,
                    flexShrink: 0,
                    lineHeight: 1,
                    padding: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = c.danger }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = c.textLight }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}
