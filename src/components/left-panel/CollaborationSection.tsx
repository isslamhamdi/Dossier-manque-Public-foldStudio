'use client'

import { useState } from 'react'
import type { BoxParams, ImageLayer } from '@/lib/types'
import { CollapsibleSection } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

interface CollaborationSectionProps {
  params: BoxParams
  imageLayers: ImageLayer[]
}

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

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'export' | 'p2p'

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tab = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => onChange(id)}
      style={{
        flex: 1,
        padding: '5px 0',
        fontSize: fs.sm,
        fontWeight: active === id ? fw.bold : fw.normal,
        color: active === id ? c.ink : c.textMuted,
        background: active === id ? '#fff' : 'transparent',
        border: 'none',
        borderBottom: active === id ? `2px solid ${c.ink}` : '2px solid transparent',
        cursor: 'pointer',
        transition: 'color 0.15s',
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${c.borderLight}`,
      marginBottom: 12,
    }}>
      {tab('export', 'Export ZIP')}
      {tab('p2p', 'P2P Partage')}
    </div>
  )
}

// ─── Checkbox row ─────────────────────────────────────────────────────────────

function CheckRow({
  label,
  checked,
  onChange,
  disabled,
  badge,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  badge?: string
}) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      cursor: disabled ? 'default' : 'pointer',
      marginBottom: 7,
      opacity: disabled ? 0.5 : 1,
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ accentColor: c.ink, width: 13, height: 13, flexShrink: 0, cursor: disabled ? 'default' : 'pointer' }}
      />
      <span style={{ fontSize: fs.md, color: disabled ? c.textMuted : c.textMed }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontSize: fs.xs,
          color: c.textMuted,
          background: c.surface,
          border: `1px solid ${c.borderLight}`,
          borderRadius: r.sm,
          padding: '1px 5px',
          marginLeft: 'auto',
        }}>
          {badge}
        </span>
      )}
    </label>
  )
}

// ─── Export ZIP tab ───────────────────────────────────────────────────────────

function ExportZipTab({ params, imageLayers }: { params: BoxParams; imageLayers: ImageLayer[] }) {
  const [inclSvg, setInclSvg] = useState(true)
  const [inclPng, setInclPng] = useState(true)
  const [inclJson, setInclJson] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      if (inclSvg) {
        zip.file('patron.svg', '<!-- Patron SVG généré par Fold Studio -->')
      }

      if (inclJson) {
        zip.file('projet.json', JSON.stringify({
          params,
          layers: imageLayers,
          exportedAt: new Date().toISOString(),
        }, null, 2))
      }

      if (inclPng) {
        const visible = imageLayers.filter(l => l.visible)
        const calquesFolder = zip.folder('calques')!
        visible.forEach((layer, i) => {
          // src is a data URL — strip the header to get raw base64
          const src = layer.src
          const commaIdx = src.indexOf(',')
          if (commaIdx !== -1) {
            const b64 = src.slice(commaIdx + 1)
            calquesFolder.file(`layer-${i}.png`, b64, { base64: true })
          }
        })
      }

      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fold-studio-export-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération du ZIP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{
        background: c.surface,
        border: `1px solid ${c.borderSep}`,
        borderRadius: r.lg,
        padding: '10px 12px',
        marginBottom: 10,
      }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Contenu du ZIP
        </div>
        <CheckRow label="Inclure patron SVG" checked={inclSvg} onChange={setInclSvg} />
        <CheckRow label="Inclure calques PNG" checked={inclPng} onChange={setInclPng} />
        <CheckRow label="Inclure JSON projet" checked={inclJson} onChange={setInclJson} />
        <CheckRow
          label="Inclure PDF impression"
          checked={false}
          onChange={() => {}}
          disabled
          badge="bientôt"
        />
      </div>

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

      <button
        onClick={handleExport}
        disabled={loading || (!inclSvg && !inclPng && !inclJson)}
        style={{
          ...btnPrimary,
          background: (loading || (!inclSvg && !inclPng && !inclJson)) ? '#999' : c.ink,
          cursor: (loading || (!inclSvg && !inclPng && !inclJson)) ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Génération...' : 'Exporter tout (.zip)'}
      </button>
    </div>
  )
}

// ─── P2P Partage tab ──────────────────────────────────────────────────────────

function P2PTab() {
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [connected, setConnected] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateCode = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    setRoomCode(code)
    setCopied(false)
  }

  const copyCode = async () => {
    if (!roomCode) return
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: no-op if clipboard blocked
    }
  }

  const handleJoin = () => {
    if (!joinCode.trim()) return
    // UI state only — WebRTC not implemented
    setConnected(true)
  }

  return (
    <div>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: connected ? '#4caf50' : '#bbb',
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: fs.sm,
          color: connected ? '#388e3c' : c.textMuted,
          fontWeight: connected ? fw.bold : fw.normal,
        }}>
          {connected ? 'Connecté' : 'Non connecté'}
        </span>
      </div>

      {/* Description */}
      <div style={{
        fontSize: fs.sm,
        color: c.textMuted,
        lineHeight: 1.5,
        background: c.surface,
        border: `1px solid ${c.borderSep}`,
        borderRadius: r.lg,
        padding: '9px 11px',
        marginBottom: 12,
      }}>
        Partage direct entre navigateurs via WebRTC (sans serveur). Aucun fichier ne transite par un tiers.
      </div>

      {/* Generate link */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Créer une session
        </div>
        <button onClick={generateCode} style={btnPrimary}>
          Générer lien de partage
        </button>

        {roomCode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            background: c.accentBg,
            border: `1px solid ${c.accentBorder}`,
            borderRadius: r.lg,
            padding: '8px 10px',
          }}>
            <span style={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: fs.lg,
              fontWeight: fw.heavy,
              color: c.accent,
              letterSpacing: 3,
            }}>
              {roomCode}
            </span>
            <button
              onClick={copyCode}
              style={{
                background: copied ? '#e8f5e9' : '#fff',
                border: `1px solid ${copied ? '#a5d6a7' : c.border}`,
                borderRadius: r.md,
                padding: '4px 9px',
                fontSize: fs.xs,
                color: copied ? '#388e3c' : c.textMed,
                cursor: 'pointer',
                fontWeight: fw.bold,
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: c.borderXLight, marginBottom: 12 }} />

      {/* Join session */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: fs.xs, color: c.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Rejoindre une session
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Code de la salle"
            maxLength={8}
            style={{
              ...inputStyle,
              flex: 1,
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          />
          <button
            onClick={handleJoin}
            disabled={!joinCode.trim()}
            style={{
              background: joinCode.trim() ? c.ink : '#999',
              color: '#fff',
              border: 'none',
              borderRadius: r.lg,
              padding: '5px 12px',
              fontSize: fs.md,
              fontWeight: fw.bold,
              cursor: joinCode.trim() ? 'pointer' : 'default',
              flexShrink: 0,
            }}
          >
            Rejoindre
          </button>
        </div>
      </div>

      {/* Note */}
      <div style={{
        fontSize: fs.xs,
        color: c.textMuted,
        background: c.surface,
        borderRadius: r.md,
        padding: '6px 9px',
        border: `1px solid ${c.borderXLight}`,
        lineHeight: 1.5,
      }}>
        Nécessite que les deux parties aient Fold Studio ouvert dans leur navigateur.
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CollaborationSection({ params, imageLayers }: CollaborationSectionProps) {
  const [tab, setTab] = useState<Tab>('export')

  return (
    <CollapsibleSection label="Collaboration & Export ZIP">
      <TabBar active={tab} onChange={setTab} />
      {tab === 'export'
        ? <ExportZipTab params={params} imageLayers={imageLayers} />
        : <P2PTab />
      }
    </CollapsibleSection>
  )
}
