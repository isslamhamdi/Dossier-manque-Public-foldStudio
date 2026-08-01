'use client'

interface VideoExportOverlayProps {
  progress: number   // 0-100
  stage: string
}

export function VideoExportOverlay({ progress, stage }: VideoExportOverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(20,18,15,0.72)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      {/* Film strip icon */}
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.6">
        <rect x="4" y="8" width="36" height="28" rx="3"/>
        <rect x="4" y="14" width="5" height="6" rx="0.8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x="35" y="14" width="5" height="6" rx="0.8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x="4" y="24" width="5" height="6" rx="0.8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <rect x="35" y="24" width="5" height="6" rx="0.8" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <path d="M15 18l8 4-8 4V18z" fill="rgba(255,255,255,0.85)" stroke="none"/>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.3, marginBottom: 4 }}>
          Export Animation
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          {stage}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: 220, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`, height: '100%',
          background: 'linear-gradient(90deg, #e91e8c, #5A6BD4)',
          borderRadius: 2, transition: 'width 0.2s ease',
        }} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
        {progress}%
      </div>
    </div>
  )
}
