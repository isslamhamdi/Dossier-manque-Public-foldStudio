'use client'

import { useState, useRef } from 'react'
import { MATERIAL_PRESETS } from '@/lib/types'

interface MaterialsPanelProps {
  materialFaceTab: 'exterior' | 'interior'
  setMaterialFaceTab: (tab: 'exterior' | 'interior') => void
  exteriorPresetId: string
  setExteriorPresetId: (id: string) => void
  interiorPresetId: string
  setInteriorPresetId: (id: string) => void
  exteriorCustomColor: string
  setExteriorCustomColor: (c: string) => void
  interiorCustomColor: string
  setInteriorCustomColor: (c: string) => void
  exteriorActualColor: string
  interiorActualColor: string
}

export function MaterialsPanel({
  materialFaceTab, setMaterialFaceTab,
  exteriorPresetId, setExteriorPresetId,
  interiorPresetId, setInteriorPresetId,
  exteriorCustomColor, setExteriorCustomColor,
  interiorCustomColor, setInteriorCustomColor,
  exteriorActualColor, interiorActualColor,
}: MaterialsPanelProps) {
  return (
    <div data-materials-panel="" style={{
      position: 'absolute', bottom: 46, right: 10, zIndex: 30,
      background: '#f2ede7', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)',
      padding: '12px 12px 10px', width: 248,
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', background: 'rgba(180,170,160,0.22)', borderRadius: 8, padding: 2, marginBottom: 10, gap: 2 }}>
        {(['exterior', 'interior'] as const).map(tab => (
          <button key={tab}
            onClick={() => setMaterialFaceTab(tab)}
            style={{
              flex: 1, padding: '5px 4px', border: 'none', borderRadius: 7,
              background: materialFaceTab === tab ? '#fff' : 'transparent',
              boxShadow: materialFaceTab === tab ? '0 1px 4px rgba(0,0,0,0.14)' : 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'background 0.15s, box-shadow 0.15s',
            }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: tab === 'exterior' ? exteriorActualColor : interiorActualColor,
              border: '1px solid rgba(0,0,0,0.16)', flexShrink: 0,
            }} />
            <span style={{
              fontSize: 10, fontWeight: materialFaceTab === tab ? 700 : 500,
              color: materialFaceTab === tab ? '#1a1a1a' : '#888', fontFamily: 'inherit',
            }}>
              {tab === 'exterior' ? 'Extérieur' : 'Intérieur'}
            </span>
          </button>
        ))}
      </div>

      {/* Swatches grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px 6px', marginBottom: 10 }}>
        {MATERIAL_PRESETS.map(preset => {
          const activePresetId = materialFaceTab === 'exterior' ? exteriorPresetId : interiorPresetId
          const isSelected = activePresetId === preset.id
          const swatchBg = preset.id === 'personnalise'
            ? (materialFaceTab === 'exterior' ? exteriorCustomColor : interiorCustomColor)
            : (preset.swatchStyle || preset.color)
          return (
            <button key={preset.id}
              onClick={() => {
                if (materialFaceTab === 'exterior') setExteriorPresetId(preset.id)
                else setInteriorPresetId(preset.id)
              }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                border: 'none', cursor: 'pointer', padding: '5px 2px', borderRadius: 8,
                outline: 'none', fontFamily: 'inherit',
                background: isSelected ? 'rgba(255,255,255,0.85)' : 'transparent',
                boxShadow: isSelected ? '0 0 0 2px #e0342a' : 'none',
                transition: 'background 0.12s, box-shadow 0.12s',
              }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', background: swatchBg,
                  border: isSelected ? '2px solid #e0342a' : '1px solid rgba(0,0,0,0.12)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }} />
                {['carton','kraft','carton-fibre','carton-vieilli','carton-recycle','carton-froisse','carton-corrugue','kraft-fibre'].includes(preset.id) && (
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: '#5A6BD4', borderRadius: 4, padding: '1px 4px',
                    fontSize: 7, fontWeight: 700, color: '#fff', letterSpacing: 0.5,
                  }}>PBR</div>
                )}
              </div>
              <span style={{
                fontSize: 8, fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#e0342a' : '#555', textAlign: 'center', lineHeight: 1.2,
              }}>{preset.name}</span>
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.1)', margin: '0 0 10px' }} />

      {/* Illustrator-style double color squares */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#555' }}>Teinte</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Double square widget */}
          <div style={{ position: 'relative', width: 52, height: 50 }}>
            {/* Back square = Intérieur */}
            <label
              title="Intérieur"
              onClick={() => setMaterialFaceTab('interior')}
              style={{ position: 'absolute', bottom: 0, right: 0, display: 'block', cursor: 'pointer' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 7,
                background: interiorCustomColor,
                border: '2.5px solid #f2ede7',
                outline: materialFaceTab === 'interior' ? '2px solid #e0342a' : '1px solid rgba(0,0,0,0.2)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
              }} />
              <input type="color" value={interiorCustomColor}
                onChange={e => { setInteriorCustomColor(e.target.value); setInteriorPresetId('personnalise') }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            </label>

            {/* Front square = Extérieur */}
            <label
              title="Extérieur"
              onClick={() => setMaterialFaceTab('exterior')}
              style={{ position: 'absolute', top: 0, left: 0, display: 'block', cursor: 'pointer', zIndex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 7,
                background: exteriorCustomColor,
                border: '2.5px solid #f2ede7',
                outline: materialFaceTab === 'exterior' ? '2px solid #e0342a' : '1px solid rgba(0,0,0,0.2)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
              }} />
              <input type="color" value={exteriorCustomColor}
                onChange={e => { setExteriorCustomColor(e.target.value); setExteriorPresetId('personnalise') }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
            </label>
          </div>

          {/* Swap button */}
          <button
            title="Échanger ext. / int."
            onClick={() => {
              const tmp = exteriorCustomColor
              setExteriorCustomColor(interiorCustomColor)
              setInteriorCustomColor(tmp)
              setExteriorPresetId('personnalise')
              setInteriorPresetId('personnalise')
            }}
            style={{
              width: 22, height: 22, borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'rgba(255,255,255,0.75)',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', padding: 0, color: '#888',
            }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 5l3-3 3 3M5 2v8M12 9l-3 3-3-3M9 12V4"/>
            </svg>
          </button>
        </div>
      </div>

      {/* #60: AI PBR texture generation */}
      <PBRSection face={materialFaceTab} />
    </div>
  )
}

function PBRSection({ face }: { face: 'exterior' | 'interior' }) {
  const [pbrStatus, setPbrStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [prompt, setPrompt] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleGenerate = async (imageBase64?: string) => {
    setPbrStatus('loading')
    try {
      const res = await fetch('/api/pbr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: imageBase64 ?? '', prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.dispatchEvent(new CustomEvent('fold-studio:apply-pbr', {
        detail: { face: face === 'exterior' ? 'all' : 'back', ...data },
      }))
      setPbrStatus('done')
    } catch { setPbrStatus('error') }
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const b64 = (ev.target?.result as string).split(',')[1]
      handleGenerate(b64)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', marginTop: 10, paddingTop: 8 }}>
      <div style={{ fontSize: 8, fontWeight: 700, color: '#bbb', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
        Texture PBR IA
      </div>
      <input
        type="text" value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="ex: kraft texturé, glacé brillant, bois…"
        style={{ width: '100%', fontSize: 10, border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '6px 8px', marginBottom: 6, outline: 'none', boxSizing: 'border-box', background: 'rgba(255,255,255,0.6)', fontFamily: 'inherit' }}
      />
      <div style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={pbrStatus === 'loading'}
          style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: '1px solid rgba(0,0,0,0.15)', background: 'rgba(255,255,255,0.7)', fontSize: 10, cursor: pbrStatus === 'loading' ? 'wait' : 'pointer', color: '#555', fontFamily: 'inherit' }}>
          ↑ Image
        </button>
        <button
          onClick={() => handleGenerate()}
          disabled={pbrStatus === 'loading' || !prompt}
          style={{ flex: 2, padding: '6px 0', borderRadius: 8, border: 'none', background: pbrStatus === 'loading' ? 'rgba(90,107,212,0.5)' : prompt ? '#5A6BD4' : '#ccc', fontSize: 10, cursor: pbrStatus === 'loading' || !prompt ? 'default' : 'pointer', color: '#fff', fontFamily: 'inherit', fontWeight: 600 }}>
          {pbrStatus === 'loading' ? 'Génération…' : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0 6.8 5.2 12 6 6.8 6.8 6 12 5.2 6.8 0 6 5.2 5.2z"/></svg>
              Générer PBR
            </span>
          )}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      {pbrStatus === 'done' && <div style={{ fontSize: 9, color: '#38a169', marginTop: 5 }}>✓ Texture appliquée au modèle 3D</div>}
      {pbrStatus === 'error' && <div style={{ fontSize: 9, color: '#e53935', marginTop: 5 }}>✕ Erreur — backend PBR non disponible</div>}
    </div>
  )
}
