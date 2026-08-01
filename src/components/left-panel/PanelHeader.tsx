'use client'

import { useState } from 'react'
import { fs, fw } from '@/lib/tokens'

interface PanelHeaderProps {
  mode: 'fold' | 'unfold'
  unfoldTitle: string
  onOpenTemplates: () => void
  projectTitle: string
  onProjectTitleChange: (t: string) => void
}

export function PanelHeader({ mode, unfoldTitle, onOpenTemplates, projectTitle, onProjectTitleChange }: PanelHeaderProps) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [savedTitle, setSavedTitle] = useState('')

  const startEditing = () => {
    setSavedTitle(projectTitle)
    setEditingTitle(true)
  }

  const commitEdit = () => setEditingTitle(false)

  const cancelEdit = () => {
    onProjectTitleChange(savedTitle)
    setEditingTitle(false)
  }

  return (
    <div style={{
      padding: '9px 10px 9px', borderBottom: '1px solid #ddd8d2',
      background: '#f0ede9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 6,
    }}>
      {mode === 'fold' ? (
        editingTitle ? (
          <input
            autoFocus
            value={projectTitle}
            onChange={e => onProjectTitleChange(e.target.value.toUpperCase())}
            onFocus={e => e.currentTarget.select()}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            style={{
              flex: 1, minWidth: 0, color: '#222', fontSize: fs.md, fontWeight: fw.heavy, letterSpacing: 0.5,
              background: 'transparent', border: 'none', outline: 'none',
              borderBottom: '1px solid #aaa', padding: '0 2px', fontFamily: 'inherit',
            }}
          />
        ) : (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden' }}>
            <span style={{ color: '#222', fontSize: fs.md, fontWeight: fw.heavy, letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {projectTitle}
            </span>
            <button
              onClick={startEditing}
              title="Rename"
              className="fs-btn-ghost"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#aaa', flexShrink: 0, lineHeight: 1 }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M7.5 1.5L9.5 3.5L3.5 9.5H1.5V7.5L7.5 1.5Z" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )
      ) : (
        <span style={{ color: '#222', fontSize: fs.md, fontWeight: fw.heavy, letterSpacing: 0.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {unfoldTitle}
        </span>
      )}
      <button onClick={onOpenTemplates} title="Template Library"
        className="fs-btn-ghost"
        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="1" y="1" width="6" height="6" rx="1"/>
          <rect x="9" y="1" width="6" height="6" rx="1"/>
          <rect x="1" y="9" width="6" height="6" rx="1"/>
          <rect x="9" y="9" width="6" height="6" rx="1"/>
        </svg>
      </button>
    </div>
  )
}
