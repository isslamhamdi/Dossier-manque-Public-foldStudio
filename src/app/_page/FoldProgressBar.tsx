'use client'

interface FoldProgressBarProps {
  foldProgress: number
  setFoldProgress: (v: number) => void
  isAnimating: boolean
  setIsAnimating: (v: boolean) => void
  onPhysicsDrop?: () => void
  onPhysicsOpen?: () => void
  onPhysicsFlick?: () => void
  isPhysicsActive?: boolean
}

export function FoldProgressBar({ foldProgress, setFoldProgress, isAnimating, setIsAnimating, onPhysicsDrop, onPhysicsOpen, onPhysicsFlick, isPhysicsActive }: FoldProgressBarProps) {
  return (
    <div style={{ padding: '9px 16px 11px', borderBottom: '1px solid #e4e0dc', background: '#edeae5', flexShrink: 0 }}>
      <style>{`
        .fold-range {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 3px; border-radius: 2px; outline: none; cursor: pointer;
          background: linear-gradient(to right, #e0342a ${Math.round(foldProgress * 100)}%, rgba(0,0,0,0.14) ${Math.round(foldProgress * 100)}%);
        }
        .fold-range::-webkit-slider-thumb {
          -webkit-appearance: none; width: 14px; height: 14px;
          background: #e0342a; border-radius: 50%; cursor: pointer;
          border: 2px solid #fff; box-shadow: 0 1px 5px rgba(224,52,42,0.4);
        }
        .fold-range::-moz-range-thumb {
          width: 14px; height: 14px; background: #e0342a;
          border-radius: 50%; border: 2px solid #fff; cursor: pointer;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#666', flexShrink: 0 }}>Progression du pli</span>
        <button
          title={isAnimating ? 'Pause' : 'Animer (boucle)'}
          onClick={() => setIsAnimating(!isAnimating)}
          className={isAnimating ? 'fs-glow-playing' : ''}
          style={{
            width: 22, height: 22, background: 'transparent', border: '1.5px solid #ccc',
            borderRadius: '50%', cursor: 'pointer', padding: 0, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555',
          }}
        >
          {isAnimating ? (
            <svg width="7" height="8" viewBox="0 0 7 8" fill="currentColor">
              <rect x="0.5" width="2" height="8" rx="0.8"/>
              <rect x="4.5" width="2" height="8" rx="0.8"/>
            </svg>
          ) : (
            <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor">
              <path d="M1.5 1L7.5 4.5L1.5 8Z"/>
            </svg>
          )}
        </button>
        <input
          className="fold-range"
          type="range" min={0} max={1} step={0.01}
          value={foldProgress}
          onChange={e => { setIsAnimating(false); setFoldProgress(parseFloat(e.target.value)) }}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#e0342a', minWidth: 32, textAlign: 'right' }}>
          {Math.round(foldProgress * 100)}%
        </span>

        {/* Physics buttons */}
        {(onPhysicsDrop || onPhysicsOpen || onPhysicsFlick) && (
          <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
            {[
              { label: '↓', title: 'Fermer (gravité)', fn: onPhysicsDrop },
              { label: '↑', title: 'Ouvrir (poussée)', fn: onPhysicsOpen },
              { label: '~', title: 'Secouer', fn: onPhysicsFlick },
            ].map(({ label, title, fn }) => fn && (
              <button key={label} title={title} onClick={fn}
                style={{
                  width: 22, height: 22, border: `1.5px solid ${isPhysicsActive ? '#e0342a' : '#ccc'}`,
                  borderRadius: 4, background: isPhysicsActive ? 'rgba(224,52,42,0.08)' : 'transparent',
                  cursor: 'pointer', fontSize: 12, color: isPhysicsActive ? '#e0342a' : '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  padding: 0,
                }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
