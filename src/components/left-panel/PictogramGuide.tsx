'use client'

import { useState } from 'react'
import { PICTOS, type Picto } from '@/lib/pictograms'

const CATEGORIES = ['manutention', 'stockage', 'ecologie', 'general'] as const
const CAT_LABELS: Record<string, string> = {
  manutention: 'Manutention', stockage: 'Stockage', ecologie: 'Écologie', general: 'Général',
}

const PICTO_INFO: Record<string, { standard: string; description: string; usage: string }> = {
  'fragile': {
    standard: 'ISO 780',
    description: 'Indique que le contenu est fragile et peut se casser ou se détériorer en cas de choc, vibration ou pression.',
    usage: 'Verre, céramique, électronique, instruments de précision, œuvres d\'art.',
  },
  'this-way-up': {
    standard: 'ISO 780',
    description: 'Indique le sens d\'orientation obligatoire du colis pendant tout le transport et le stockage.',
    usage: 'Liquides, denrées alimentaires, objets sensibles à l\'orientation (moteurs, écrans, batteries).',
  },
  'keep-dry': {
    standard: 'ISO 780',
    description: 'Le colis doit être protégé de l\'humidité, de la pluie et de toute projection d\'eau.',
    usage: 'Électronique, textiles, papier, denrées alimentaires sèches, médicaments.',
  },
  'no-cutter': {
    standard: 'ISO 7000',
    description: 'Ne pas utiliser d\'outil tranchant (cutter, couteau) pour ouvrir l\'emballage, risque d\'endommager le contenu.',
    usage: 'Vêtements, chaussures, tableaux, produits emballés sous film délicat.',
  },
  'no-stack': {
    standard: 'ISO 780',
    description: 'Défense de poser d\'autres colis ou charges sur cet emballage, même légers.',
    usage: 'Objets fragiles, meubles, instruments de musique, matériaux de construction délicats.',
  },
  'protect-rain': {
    standard: 'ISO 780',
    description: 'Protéger l\'emballage de la pluie lors des opérations de chargement et de déchargement en extérieur.',
    usage: 'Colis manipulés à l\'air libre, produits sensibles à l\'humidité sans conditionnement étanche.',
  },
  'temperature': {
    standard: 'ISO 780',
    description: 'La plage de températures indiquée doit être respectée pour préserver les propriétés du produit.',
    usage: 'Médicaments, vaccins, produits chimiques, composants électroniques, aliments thermosensibles.',
  },
  'keep-cool': {
    standard: 'ISO 780',
    description: 'Conserver à basse température, à l\'abri de toute source de chaleur directe ou indirecte.',
    usage: 'Produits alimentaires périssables, cosmétiques thermosensibles, réactifs biologiques.',
  },
  'fsc': {
    standard: 'FSC-STD-50-001',
    description: 'Forest Stewardship Council — certifie que le matériau provient de forêts gérées de façon responsable et durable.',
    usage: 'Emballages en carton, papier ou bois issu de forêts certifiées FSC.',
  },
  'recycling': {
    standard: 'ISO 14021',
    description: 'Le matériau est recyclable ou contient des matières recyclées. Doit être déposé dans la filière de tri adaptée.',
    usage: 'Carton, papier, plastique, métal — tout emballage valorisable par recyclage.',
  },
  'attention': {
    standard: 'ISO 7010 / W001',
    description: 'Signal d\'avertissement général signalant un risque ou une précaution particulière à observer.',
    usage: 'Produits chimiques, outils, équipements sous tension, matières potentiellement dangereuses.',
  },
  'weight-limit': {
    standard: 'ISO 780',
    description: 'Indique la charge maximale autorisée sur le dessus ou sur les côtés de cet emballage.',
    usage: 'Emballages palettisés, colis empilés en entrepôt, rayonnages de stockage.',
  },
}

function pictoSVG(p: Picto, size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
    <rect width="100" height="100" fill="white"/>
    <rect x="2" y="2" width="96" height="96" rx="5" fill="none" stroke="#1a1a1a" stroke-width="2.5"/>
    <g>${p.paths.replace(/currentColor/g, '#1a1a1a')}</g>
  </svg>`
}

interface PictogramGuideProps {
  onClose: () => void
}

export function PictogramGuide({ onClose }: PictogramGuideProps) {
  const [selected, setSelected] = useState<Picto | null>(null)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={() => { if (selected) setSelected(null); else onClose() }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 20,
        width: selected ? 320 : 360,
        maxHeight: '82vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        transition: 'width 0.18s ease',
      }} onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          {selected ? (
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#777', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            }}>
              ← Retour
            </button>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a', letterSpacing: 0.5 }}>
              Guide des pictogrammes ISO
            </span>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* ── Detail view ── */}
        {selected ? (() => {
          const info = PICTO_INFO[selected.id]
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div dangerouslySetInnerHTML={{ __html: pictoSVG(selected, 72) }} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{selected.label}</div>
                  <div style={{
                    display: 'inline-block', fontSize: 9, fontWeight: 700, color: '#555',
                    background: '#f0f0f0', borderRadius: 4, padding: '2px 7px', letterSpacing: 0.5,
                  }}>
                    {info?.standard ?? 'ISO 780'}
                  </div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {CAT_LABELS[selected.category]}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Description</div>
                <p style={{ margin: 0, fontSize: 11.5, color: '#333', lineHeight: 1.6 }}>
                  {info?.description ?? '—'}
                </p>
              </div>

              {/* Usage */}
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Utilisation typique</div>
                <p style={{ margin: 0, fontSize: 11.5, color: '#333', lineHeight: 1.6 }}>
                  {info?.usage ?? '—'}
                </p>
              </div>

              {/* Divider + hint */}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                <p style={{ margin: 0, fontSize: 10, color: '#bbb', lineHeight: 1.5 }}>
                  Cliquez sur un pictogramme dans le panneau gauche pour l&apos;ajouter à votre design.
                </p>
              </div>
            </div>
          )
        })() : (
          /* ── Grid view ── */
          CATEGORIES.map(cat => {
            const pictos = PICTOS.filter(p => p.category === cat)
            if (!pictos.length) return null
            return (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#aaa', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 8 }}>
                  {CAT_LABELS[cat]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {pictos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                        padding: '10px 4px', background: '#f8f8f8', borderRadius: 8,
                        border: '1.5px solid transparent', cursor: 'pointer',
                        transition: 'border-color 0.12s, background 0.12s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e91e8c'
                        ;(e.currentTarget as HTMLButtonElement).style.background = '#fff8fb'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'
                        ;(e.currentTarget as HTMLButtonElement).style.background = '#f8f8f8'
                      }}
                    >
                      <div dangerouslySetInnerHTML={{ __html: pictoSVG(p, 44) }} />
                      <span style={{ fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.3 }}>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
