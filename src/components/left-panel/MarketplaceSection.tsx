'use client'

// #99-103 Marketplace / Communauté

import { useState, useEffect } from 'react'
import { CollapsibleSection } from './ui'
import { c, fs, r } from '@/lib/tokens'

interface TemplateItem {
  id: string
  name: string
  author: string
  category: string
  tags: string[]
  likes: number
  downloads: number
  badge?: string
}

const BADGE_ICONS: Record<string, string> = {
  gold_designer: '★',
  verified: '✓',
  top_100: '★',
  eco_champion: '♺',
  rising_star: '◆',
  first_publish: '✦',
}

export function MarketplaceSection() {
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<'likes' | 'downloads'>('likes')
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [category, setCategory] = useState('')
  const userId = 'local-user'

  useEffect(() => {
    load()
  }, [sort, category])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort })
      if (category) params.set('category', category)
      const res = await fetch(`/api/marketplace?${params}`)
      const data = await res.json()
      setTemplates(data.templates ?? [])
    } catch { /* offline */ } finally {
      setLoading(false)
    }
  }

  async function toggleLike(id: string) {
    const liked = likedIds.has(id)
    const action = liked ? 'unlike' : 'like'
    const res = await fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, templateId: id, userId }),
    })
    const data = await res.json()
    setLikedIds(prev => {
      const next = new Set(prev)
      data.liked ? next.add(id) : next.delete(id)
      return next
    })
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, likes: data.likes } : t))
  }

  async function downloadTemplate(id: string) {
    await fetch('/api/marketplace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'download', templateId: id }),
    })
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, downloads: t.downloads + 1 } : t))
  }

  const categories = ['', 'cosmétique', 'alimentaire', 'expédition', 'boissons']

  return (
    <CollapsibleSection label="Marketplace">
      {/* Filters */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setSort('likes')} style={chipStyle(sort === 'likes')}>❤ Populaires</button>
        <button onClick={() => setSort('downloads')} style={chipStyle(sort === 'downloads')}>↓ Téléchargements</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} style={chipStyle(category === cat)}>
            {cat || 'Tous'}
          </button>
        ))}
      </div>

      {/* Template cards */}
      {loading ? (
        <div style={{ fontSize: 10, color: c.textGhost, textAlign: 'center', padding: '12px 0' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {templates.map(t => (
            <div key={t.id} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '8px 10px', border: `1px solid ${c.borderLight}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c.ink, lineHeight: 1.3 }}>{t.name}</div>
                  <div style={{ fontSize: 9, color: c.textGhost, marginTop: 1 }}>
                    {t.author}
                    {t.badge && <span style={{ marginLeft: 4, fontSize: 10 }}>{BADGE_ICONS[t.badge] ?? ''}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                    {t.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 5, background: 'rgba(90,107,212,0.12)', color: '#5A6BD4' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <button onClick={() => toggleLike(t.id)}
                    style={{ fontSize: 10, padding: '3px 7px', borderRadius: 7, border: `1px solid ${likedIds.has(t.id) ? '#e91e8c' : c.borderLight}`, background: likedIds.has(t.id) ? 'rgba(233,30,140,0.08)' : c.white, cursor: 'pointer', color: likedIds.has(t.id) ? '#e91e8c' : c.textMed }}>
                    ♥ {t.likes}
                  </button>
                  <button onClick={() => downloadTemplate(t.id)}
                    style={{ fontSize: 9, padding: '2px 6px', borderRadius: 7, border: `1px solid ${c.borderLight}`, background: c.white, cursor: 'pointer', color: c.textMed }}>
                    ↓ {t.downloads}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !loading && (
        <div style={{ fontSize: 9, color: c.textGhost, textAlign: 'center', padding: '10px 0' }}>
          Aucun template dans cette catégorie
        </div>
      )}
    </CollapsibleSection>
  )
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 9, padding: '2px 7px', borderRadius: 8, cursor: 'pointer',
    border: `1px solid ${active ? '#5A6BD4' : c.borderLight}`,
    background: active ? 'rgba(90,107,212,0.1)' : c.white,
    color: active ? '#5A6BD4' : c.textMed,
    fontWeight: active ? 700 : 400,
  }
}
