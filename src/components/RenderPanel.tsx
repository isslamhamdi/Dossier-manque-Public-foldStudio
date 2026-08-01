'use client'

import { useState, useCallback } from 'react'
import type { RenderSceneKey, CustomSceneConfig } from './ThreeScene'
import { SceneGrid } from './render-panel/SceneGrid'
import { CustomSceneBuilder } from './render-panel/CustomSceneBuilder'
import { RenderPreview } from './render-panel/RenderPreview'
import type { BoxParams } from '@/lib/types'

function captureThreeCanvas(): Promise<string> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Capture timeout')), 8000)
    const handler = (e: Event) => {
      clearTimeout(t)
      window.removeEventListener('fold-studio:render-result', handler)
      const detail = (e as CustomEvent).detail
      resolve(typeof detail === 'string' ? detail : detail.productImage)
    }
    window.addEventListener('fold-studio:render-result', handler)
    window.dispatchEvent(new CustomEvent('fold-studio:render-capture', { detail: { withMask: false } }))
  })
}

// ── Cloud HD render pipeline ────────────────────────────────────────────
// 1. Capture WebGL canvas at current resolution
// 2. Send to /api/render (AI-enhanced photo-realistic composite)
// 3. Return the enhanced result URL

type RenderStage = 'idle' | 'capture' | 'cloud' | 'done'

async function cloudRender(
  sceneLabel: string,
  params?: BoxParams
): Promise<string> {
  // Step 1: capture the current 3D view
  const dataUrl = await captureThreeCanvas()

  // Step 2: send to /api/render for AI-enhanced photoreal composite
  const body: Record<string, unknown> = {
    imageBase64: dataUrl,
    instructions: sceneLabel,
  }
  if (params) body.boxDimensions = { w: params.width, h: params.height, d: params.depth }

  const res = await fetch('/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    // Fallback: return the raw capture if cloud fails
    const errData = await res.json().catch(() => ({})) as { error?: string }
    console.warn('[CloudRender] API error:', errData.error)
    return dataUrl
  }

  const data = await res.json() as { imageUrl?: string }
  return data.imageUrl ?? dataUrl
}

interface RenderPanelProps {
  width: number
  renderScene: RenderSceneKey
  onSceneChange: (s: RenderSceneKey) => void
  customScene: CustomSceneConfig
  onCustomSceneChange: (c: CustomSceneConfig) => void
  params?: BoxParams
}

const SCENE_LABELS: Record<string, string> = {
  studio_white:  'clean white studio, soft diffuse lighting, product photography',
  studio_dark:   'dark luxury studio, dramatic rim lighting, black background',
  studio_warm:   'warm afternoon light, cream background, editorial photography',
  outdoor:       'outdoor natural daylight, concrete surface, minimalist background',
  shelf:         'retail shelf display, ambient store lighting',
  custom:        'custom scene, professional product mockup',
}

export default function RenderPanel({ width, renderScene, onSceneChange, customScene, onCustomSceneChange, params }: RenderPanelProps) {
  const [result, setResult] = useState<string | null>(null)
  const [stage, setStage] = useState<RenderStage>('idle')
  const [provider, setProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isExporting = stage === 'capture' || stage === 'cloud'

  const handleExport = useCallback(async () => {
    setStage('capture')
    setError(null)
    setProvider(null)
    try {
      const sceneLabel = SCENE_LABELS[renderScene] ?? 'professional product mockup'
      setStage('cloud')
      const imageUrl = await cloudRender(sceneLabel, params)
      setResult(imageUrl)
      setProvider('Cloud AI · Photoréaliste')
      setStage('done')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rendu échoué')
      setStage('idle')
    }
  }, [renderScene, params])

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `fold-studio-hd-${Date.now()}.png`
    a.click()
  }

  const stageLabel =
    stage === 'capture' ? 'CAPTURE…' :
    stage === 'cloud'   ? 'CLOUD AI…' :
    'RENDU HD'

  return (
    <div style={{
      width, flexShrink: 0,
      background: '#f0ede9',
      borderLeft: '1px solid #e0dcd8',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 40, padding: '0 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #e4e0dc', flexShrink: 0,
        background: '#eae6e1',
      }}>
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#888', letterSpacing: 1.8, textTransform: 'uppercase' }}>
            RENDER
          </span>
          {stage === 'cloud' && (
            <span style={{ fontSize: 8, color: '#5A6BD4', marginLeft: 6, fontWeight: 600 }}>
              IA en cours…
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {result && (
            <>
              <button onClick={handleDownload} title="Télécharger" style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1 }}>↓</button>
              <button onClick={() => { setResult(null); setStage('idle'); setProvider(null) }} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg>
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={isExporting ? '' : 'fs-shimmer-btn'}
            style={{
              background: isExporting ? '#555' : 'linear-gradient(135deg, #111 0%, #333 100%)',
              color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px',
              fontSize: 11, fontWeight: 700, cursor: isExporting ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: isExporting ? 0.85 : 1, letterSpacing: 0.3,
            }}
          >
            {isExporting
              ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                  <path d="M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1z" strokeOpacity="0.25"/>
                  <path d="M6 1a5 5 0 0 1 5 5" strokeLinecap="round"/>
                </svg>
              : <span style={{ fontSize: 12 }}>✦</span>
            }
            {stageLabel}
          </button>
        </div>
      </div>

      <RenderPreview result={result} isExporting={isExporting} error={error} onClearError={() => setError(null)} />

      {provider && result && (
        <div style={{ padding: '4px 12px', fontSize: 8.5, color: '#5A6BD4', fontWeight: 600 }}>
          {provider}
        </div>
      )}

      <div style={{ overflowY: 'auto', flexShrink: 0, maxHeight: 420 }}>
        <SceneGrid renderScene={renderScene} onSceneChange={onSceneChange} />
        {renderScene === 'custom' && (
          <CustomSceneBuilder customScene={customScene} onCustomSceneChange={onCustomSceneChange} />
        )}
        <div style={{ margin: '8px 12px 14px', padding: '8px 10px', background: 'rgba(90,107,212,0.05)', borderRadius: 8, border: '1px solid rgba(90,107,212,0.12)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#5A6BD4', marginBottom: 3 }}>Pipeline Cloud Hybride</div>
          <div style={{ fontSize: 8.5, color: '#888', lineHeight: 1.5 }}>
            Capture WebGL → IA Photoréaliste → PNG HD
          </div>
        </div>
      </div>
    </div>
  )
}
