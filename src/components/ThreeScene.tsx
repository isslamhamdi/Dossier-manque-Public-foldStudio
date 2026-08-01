'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Scene } from './three-scene/Scene'
import { SCENE_CONFIGS } from './three-scene/scenePresets'
import type { RenderSceneKey } from './three-scene/scenePresets'
import type { ThreeSceneProps } from './three-scene/Scene'
import { validateManufacturing, getBlockingError } from '../lib/dieline/constraints'
import type { ConstraintViolation } from '../lib/dieline/constraints'

export type { RenderSceneKey, CustomSceneConfig } from './three-scene/scenePresets'
export type { ThreeSceneProps } from './three-scene/Scene'
export type { ConstraintViolation }

export default function ThreeScene(props: ThreeSceneProps) {
  const bg = props.renderScene === 'custom' && props.customScene
    ? props.customScene.bg
    : SCENE_CONFIGS[(props.renderScene ?? 'studio_white') as Exclude<RenderSceneKey, 'custom'>]?.bg ?? '#f0ede9'

  // ── Manufacturing Constraint Guard ──────────────────────────────────────
  // The 2D dieline and the 3D model are the SAME mathematical object —
  // both are generated from BoxParams.  This validator is the single source
  // of truth shared by both views: if a constraint blocks here, the 2D
  // canvas shows the same error.  3D rendering is gated on zero errors.
  const violations  = validateManufacturing(props.params, props.activeTemplate ?? 'box')
  const dielineError = getBlockingError(violations)

  if (dielineError) {
    return (
      <div style={{
        width: '100%', height: '100%', background: bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textAlign: 'center', maxWidth: 220, lineHeight: 1.5 }}>
          Patron non fabriquable
        </div>
        <div style={{ fontSize: 10, color: '#b45309', textAlign: 'center', maxWidth: 240, lineHeight: 1.5, padding: '0 16px' }}>
          {dielineError}
        </div>
        {violations.filter(v => v.severity === 'warning').slice(0, 2).map(w => (
          <div key={w.rule} style={{ fontSize: 9, color: '#92400e', textAlign: 'center', maxWidth: 240, padding: '0 16px', lineHeight: 1.4, opacity: 0.75 }}>
            ⚠ {w.message}
          </div>
        ))}
        <div style={{ fontSize: 9, color: '#d97706', marginTop: 4 }}>
          Corrigez les dimensions pour afficher la 3D
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', background: bg }}>
      <Canvas
        camera={{ position: [3.2, 2.4, 3.8], fov: 35 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false, stencil: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
        shadows
        onCreated={({ gl }) => { gl.setClearColor(new THREE.Color(bg), 1) }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  )
}
