'use client'

import { useState } from 'react'
import type { BoxParams, TemplateType, ImageLayer } from '@/lib/types'
import type { ProjectEntry } from './useProjects'

const STATUS_COLORS: Record<ProjectEntry['approvalStatus'], string> = {
  draft: '#94a3b8',
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
}

const STATUS_LABELS: Record<ProjectEntry['approvalStatus'], string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
}

interface Props {
  projects: ProjectEntry[]
  folders: string[]
  clients: string[]
  currentParams: BoxParams
  currentTemplate: TemplateType
  currentLayers: ImageLayer[]
  exteriorColor: string
  interiorColor: string
  onSave: (name: string, client: string, folder: string) => void
  onLoad: (entry: ProjectEntry) => void
  onDelete: (id: string) => void
  onUpdateApproval: (id: string, status: ProjectEntry['approvalStatus'], note?: string) => void
  onClose: () => void
}

export function ProjectsPanel({ projects, folders, clients, onSave, onLoad, onDelete, onUpdateApproval, onClose }: Props) {
  const [tab, setTab] = useState<'list' | 'save'>('list')
  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [folder, setFolder] = useState('')
  const [filterFolder, setFilterFolder] = useState('__all__')
  const [filterStatus, setFilterStatus] = useState<'__all__' | ProjectEntry['approvalStatus']>('__all__')
  const [approvalNoteId, setApprovalNoteId] = useState<string | null>(null)
  const [approvalNote, setApprovalNote] = useState('')

  const filtered = projects.filter(p => {
    if (filterFolder !== '__all__' && p.folder !== filterFolder) return false
    if (filterStatus !== '__all__' && p.approvalStatus !== filterStatus) return false
    return true
  }).sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 640, maxHeight: '85vh', background: '#fff', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['list', 'save'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '5px 14px', borderRadius: 6, border: `1px solid ${tab === t ? '#1a1a1a' : '#e0e0e0'}`,
                background: tab === t ? '#1a1a1a' : '#fff', color: tab === t ? '#fff' : '#555',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {t === 'list' ? 'Mes projets' : 'Sauvegarder'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888' }}>×</button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {tab === 'save' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Nom du projet *</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Boîte cosmétique Rose Gold"
                  style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Client</div>
                <input list="clients-list" value={client} onChange={e => setClient(e.target.value)} placeholder="Nom du client"
                  style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <datalist id="clients-list">{clients.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dossier</div>
                <input list="folders-list" value={folder} onChange={e => setFolder(e.target.value)} placeholder="Ex: 2026 / Beauté / Luxe"
                  style={{ width: '100%', border: '1px solid #d0d0d0', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                <datalist id="folders-list">{folders.map(f => <option key={f} value={f} />)}</datalist>
              </div>
              <button onClick={() => { if (name.trim()) { onSave(name.trim(), client.trim(), folder.trim()); setTab('list') } }}
                disabled={!name.trim()}
                style={{ padding: '10px 0', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default', opacity: name.trim() ? 1 : 0.5 }}>
                Sauvegarder le projet
              </button>
            </div>
          )}

          {tab === 'list' && (
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <select value={filterFolder} onChange={e => setFilterFolder(e.target.value)}
                  style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }}>
                  <option value="__all__">Tous les dossiers</option>
                  {folders.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                  style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 6, padding: '5px 8px', fontSize: 11, outline: 'none' }}>
                  <option value="__all__">Tous les statuts</option>
                  {(['draft', 'pending', 'approved', 'rejected'] as const).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: '#bbb', padding: 40, fontSize: 13 }}>
                  Aucun projet sauvegardé
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(p => (
                  <div key={p.id} style={{
                    border: '1px solid #eee', borderRadius: 10, padding: '12px 14px',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    background: '#fafafa',
                  }}>
                    {/* Mini preview box */}
                    <div style={{ width: 36, height: 36, borderRadius: 6, background: p.exteriorColor, flexShrink: 0, border: '1px solid #e0e0e0' }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: STATUS_COLORS[p.approvalStatus] + '22', color: STATUS_COLORS[p.approvalStatus] }}>
                          {STATUS_LABELS[p.approvalStatus]}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: '#888' }}>
                        {p.client && <span>{p.client}</span>}
                        {p.folder && <span style={{ marginLeft: 6, color: '#bbb' }}>/ {p.folder}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>
                        {p.params.width}×{p.params.height}×{p.params.depth}mm · {p.activeTemplate} · {new Date(p.savedAt).toLocaleDateString()}
                      </div>
                      {p.approvalNote && (
                        <div style={{ fontSize: 10, color: '#666', marginTop: 4, fontStyle: 'italic' }}>&ldquo;{p.approvalNote}&rdquo;</div>
                      )}
                      {approvalNoteId === p.id && (
                        <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                          <input value={approvalNote} onChange={e => setApprovalNote(e.target.value)} placeholder="Note client…"
                            style={{ flex: 1, border: '1px solid #d0d0d0', borderRadius: 4, padding: '4px 8px', fontSize: 11, outline: 'none' }} />
                          <button onClick={() => { onUpdateApproval(p.id, 'approved', approvalNote); setApprovalNoteId(null) }}
                            style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✓</button>
                          <button onClick={() => { onUpdateApproval(p.id, 'rejected', approvalNote); setApprovalNoteId(null) }}
                            style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>✗</button>
                          <button onClick={() => setApprovalNoteId(null)}
                            style={{ padding: '4px 8px', fontSize: 10, borderRadius: 4, border: '1px solid #e0e0e0', background: '#fff', color: '#888', cursor: 'pointer' }}>—</button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => onLoad(p)}
                        style={{ fontSize: 10, padding: '4px 10px', borderRadius: 5, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                        Ouvrir
                      </button>
                      <button onClick={() => { setApprovalNoteId(p.id); setApprovalNote('') }}
                        style={{ fontSize: 10, padding: '4px 6px', borderRadius: 5, border: '1px solid #e0e0e0', background: '#fff', color: '#555', cursor: 'pointer' }}>
                        Approbation
                      </button>
                      <button onClick={() => onDelete(p.id)}
                        style={{ fontSize: 10, padding: '4px 6px', borderRadius: 5, border: '1px solid #fca5a5', background: '#fff', color: '#ef4444', cursor: 'pointer' }}>
                        Suppr.
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
