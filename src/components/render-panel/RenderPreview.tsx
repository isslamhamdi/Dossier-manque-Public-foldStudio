'use client'

// #291 Image optimization — next/image avec unoptimized pour les data-URLs (captures locales)
import Image from 'next/image'

export function RenderPreview({ result, isExporting, error, onClearError }: {
  result: string | null
  isExporting: boolean
  error: string | null
  onClearError: () => void
}) {
  return (
    <div style={{
      flex: 1, background: '#e8e4df', minHeight: 80,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {result ? (
        <Image src={result} alt="Render" fill unoptimized style={{ objectFit: 'contain' }} />
      ) : isExporting ? (
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <div style={{
            width: 28, height: 28, border: '2.5px solid #c0bbb5',
            borderTopColor: '#888', borderRadius: '50%',
            margin: '0 auto 14px',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: 0.8, margin: 0, textTransform: 'uppercase' }}>
            CAPTURE…
          </p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: 10, color: '#c06060', margin: '0 0 10px' }}>{error}</p>
          <button onClick={onClearError} style={{ fontSize: 9, color: '#888', background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>OK</button>
        </div>
      ) : (
        <p style={{ fontSize: 10, color: '#bbb', margin: 0, textAlign: 'center', padding: '0 12px', lineHeight: 1.6 }}>
          Sélectionne une scène<br />puis clique <strong style={{ color: '#888' }}>EXPORT HD</strong>
        </p>
      )}
    </div>
  )
}
