'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  onClose: () => void
}

export function ARPreviewButton({ onClose }: Props) {
  const [glbUrl, setGlbUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('fold-studio:export-glb-for-ar'))
    const onGlb = (e: Event) => {
      const { url } = (e as CustomEvent).detail
      setGlbUrl(url)
      setLoading(false)
      window.removeEventListener('fold-studio:glb-ready', onGlb)
    }
    window.addEventListener('fold-studio:glb-ready', onGlb)
    const fallback = setTimeout(() => setLoading(false), 5000)
    return () => {
      window.removeEventListener('fold-studio:glb-ready', onGlb)
      clearTimeout(fallback)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Render GLB on canvas using Three.js when URL is ready
  useEffect(() => {
    if (!glbUrl || !canvasRef.current) return
    let animId: number
    let renderer: import('three').WebGLRenderer | null = null

    const init = async () => {
      const THREE = await import('three')
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')

      const canvas = canvasRef.current!
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.shadowMap.enabled = false

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0f0f23)

      const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.01, 100)
      camera.position.set(0.4, 0.25, 0.5)
      camera.lookAt(0, 0, 0)

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 1.2))
      const dir = new THREE.DirectionalLight(0xffffff, 2)
      dir.position.set(2, 4, 3)
      scene.add(dir)

      // Load GLB
      const loader = new GLTFLoader()
      loader.load(glbUrl, (gltf) => {
        // Center and scale
        const box = new THREE.Box3().setFromObject(gltf.scene)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        gltf.scene.scale.setScalar(0.5 / maxDim)
        gltf.scene.position.sub(center.multiplyScalar(0.5 / maxDim))
        scene.add(gltf.scene)
      })

      // Auto-rotate
      let angle = 0
      const animate = () => {
        animId = requestAnimationFrame(animate)
        angle += 0.008
        camera.position.x = Math.sin(angle) * 0.6
        camera.position.z = Math.cos(angle) * 0.6
        camera.lookAt(0, 0, 0)
        renderer!.render(scene, camera)
      }
      animate()
    }

    init().catch(console.error)
    return () => {
      cancelAnimationFrame(animId)
      renderer?.dispose()
    }
  }, [glbUrl])

  const handleDownload = () => {
    if (!glbUrl) return
    const a = document.createElement('a')
    a.href = glbUrl
    a.download = `fold-studio-ar-${Date.now()}.glb`
    a.click()
  }

  return (
    <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: 400, maxWidth: '95vw' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Aperçu AR</span>
          <span style={{ marginLeft: 8, fontSize: 10, color: '#667eea', background: 'rgba(102,126,234,0.15)', padding: '2px 6px', borderRadius: 8 }}>3D Preview</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/>
          </svg>
        </button>
      </div>

      {/* 3D Canvas */}
      <div style={{ position: 'relative', width: '100%', height: 280, borderRadius: 10, overflow: 'hidden', background: '#0f0f23', marginBottom: 14 }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#667eea" strokeWidth="2.5" style={{ animation: 'ar-spin 1s linear infinite', marginBottom: 10 }}>
              <path d="M16 3a13 13 0 1 1 0 26A13 13 0 0 1 16 3z" strokeOpacity=".25"/>
              <path d="M16 3a13 13 0 0 1 13 13" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 11, color: '#888' }}>Génération du modèle 3D…</span>
          </div>
        ) : glbUrl ? (
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
            width={352}
            height={280}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10 }}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            <div style={{ fontSize: 11, color: '#666', textAlign: 'center', lineHeight: 1.5 }}>
              Scène 3D vide — assurez-vous d&apos;être en mode <strong style={{ color: '#888' }}>Fold</strong> avec un patron visible.
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {glbUrl && (
        <button
          onClick={handleDownload}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg,#667eea,#764ba2)',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            marginBottom: 10,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5"/><path d="M2 10h8"/>
          </svg>
          Télécharger GLB (AR mobile)
        </button>
      )}

      <div style={{ fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
        Ouvrez le fichier GLB sur mobile pour la vue AR<br/>
        iOS : Fichiers / Quick Look · Android : Scene Viewer / Google AR
      </div>

      <style>{`@keyframes ar-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
