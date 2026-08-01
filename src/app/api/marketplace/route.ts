// #99-103 Marketplace / Community API

import { NextRequest, NextResponse } from 'next/server'

interface Template {
  id: string
  name: string
  author: string
  authorId: string
  category: string
  tags: string[]
  likes: number
  downloads: number
  thumbnail: string
  createdAt: string
  badge?: string
}

// In-memory store (replace with DB in production)
const templates: Template[] = [
  { id: 'tpl-001', name: 'Boîte Cosmétique Premium', author: 'Marie D.', authorId: 'u-001', category: 'cosmétique', tags: ['luxe', 'parfum', 'noir'], likes: 142, downloads: 891, thumbnail: '', createdAt: '2025-12-01', badge: 'gold' },
  { id: 'tpl-002', name: 'Mailer Eco Kraft', author: 'Jean P.', authorId: 'u-002', category: 'expédition', tags: ['eco', 'kraft', 'recyclé'], likes: 98, downloads: 2140, thumbnail: '', createdAt: '2026-01-15', badge: 'verified' },
  { id: 'tpl-003', name: 'Boîte Fenêtre Pâtisserie', author: 'Amira K.', authorId: 'u-003', category: 'alimentaire', tags: ['fenêtre', 'pâtisserie', 'blanc'], likes: 67, downloads: 445, thumbnail: '', createdAt: '2026-02-20' },
  { id: 'tpl-004', name: 'Sleeve Bouteille Vin', author: 'Tom R.', authorId: 'u-004', category: 'boissons', tags: ['sleeve', 'vin', 'premium'], likes: 34, downloads: 213, thumbnail: '', createdAt: '2026-03-10' },
]

const likes: Record<string, Set<string>> = {}
const badges: Record<string, string[]> = {
  'u-001': ['gold_designer', 'top_100', 'verified'],
  'u-002': ['eco_champion', 'verified'],
  'u-003': ['rising_star'],
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const sort = searchParams.get('sort') ?? 'likes'
  const userId = searchParams.get('userId')

  let results = [...templates]
  if (category) results = results.filter(t => t.category === category)
  if (sort === 'downloads') results.sort((a, b) => b.downloads - a.downloads)
  else results.sort((a, b) => b.likes - a.likes)

  // #100 — user profile badges
  const profile = userId ? { badges: badges[userId] ?? [], totalUploads: templates.filter(t => t.authorId === userId).length } : null

  return NextResponse.json({ templates: results, profile })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, templateId, userId, template } = body as {
    action: 'like' | 'unlike' | 'publish' | 'download'
    templateId?: string
    userId?: string
    template?: Partial<Template>
  }

  if (action === 'like' && templateId && userId) {
    if (!likes[templateId]) likes[templateId] = new Set()
    const already = likes[templateId].has(userId)
    if (!already) {
      likes[templateId].add(userId)
      const t = templates.find(t => t.id === templateId)
      if (t) t.likes++
    }
    return NextResponse.json({ liked: !already, likes: templates.find(t => t.id === templateId)?.likes ?? 0 })
  }

  if (action === 'unlike' && templateId && userId) {
    likes[templateId]?.delete(userId)
    const t = templates.find(t => t.id === templateId)
    if (t) t.likes = Math.max(0, t.likes - 1)
    return NextResponse.json({ liked: false, likes: t?.likes ?? 0 })
  }

  if (action === 'download' && templateId) {
    const t = templates.find(t => t.id === templateId)
    if (t) t.downloads++
    return NextResponse.json({ ok: true })
  }

  if (action === 'publish' && template && userId) {
    const newTemplate: Template = {
      id: `tpl-${Date.now()}`,
      name: template.name ?? 'Sans titre',
      author: template.author ?? 'Anonyme',
      authorId: userId,
      category: template.category ?? 'autre',
      tags: template.tags ?? [],
      likes: 0,
      downloads: 0,
      thumbnail: template.thumbnail ?? '',
      createdAt: new Date().toISOString().split('T')[0],
    }
    templates.push(newTemplate)
    // Award "first_publish" badge
    if (!badges[userId]) badges[userId] = []
    if (!badges[userId].includes('first_publish')) badges[userId].push('first_publish')
    return NextResponse.json({ template: newTemplate, badge: 'first_publish' })
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
}
