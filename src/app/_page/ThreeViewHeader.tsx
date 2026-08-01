'use client'

interface ThreeViewHeaderProps {
  isFold: boolean
  unfoldView: 'mesh' | 'folded'
  setUnfoldView: (v: 'mesh' | 'folded') => void
  onImportSVG?: () => void
  hasImportedDieline?: boolean
  onClearImport?: () => void
}

export function ThreeViewHeader({
  isFold, unfoldView, setUnfoldView, onImportSVG, hasImportedDieline, onClearImport,
}: ThreeViewHeaderProps) {
  const btnBase: React.CSSProperties = {
    border: '1px solid #d0d0d0', borderRadius: 4, padding: '3px 9px',
    fontSize: 10, fontWeight: 600, cursor: 'pointer',
    letterSpacing: 0.3, textTransform: 'none' as const, fontFamily: 'inherit',
  }
  return (
    <div style={{
      padding: '0 14px', height: 40, fontSize: 10, fontWeight: 700, color: '#888',
      letterSpacing: 1.8, textTransform: 'uppercase', borderBottom: '1px solid #e4e4e4',
      background: '#f5f5f5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span>{isFold ? 'APERÇU 3D' : (unfoldView === 'mesh' ? 'MAILLAGE 3D' : 'APERÇU 3D PLIÉ')}</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {onImportSVG && (
          <button onClick={onImportSVG} style={{
            ...btnBase,
            background: hasImportedDieline ? '#e8f4e8' : 'transparent',
            color: hasImportedDieline ? '#2d7a2d' : '#666',
            border: `1px solid ${hasImportedDieline ? '#9acc9a' : '#d0d0d0'}`,
          }}>
            {hasImportedDieline ? 'SVG importé ✓' : 'Importer SVG'}
          </button>
        )}
        {hasImportedDieline && onClearImport && (
          <button onClick={onClearImport} title="Effacer l'import" style={{
            ...btnBase, background: 'transparent', color: '#999',
            padding: '3px 7px', fontSize: 11, lineHeight: 1,
          }}>×</button>
        )}
        {!isFold && (
          <div style={{ display: 'flex', gap: 3 }}>
            {(['mesh', 'folded'] as const).map(v => (
              <button key={v} onClick={() => setUnfoldView(v)}
                style={{
                  ...btnBase,
                  background: unfoldView === v ? '#1a1a1a' : 'transparent',
                  color: unfoldView === v ? '#fff' : '#888',
                  border: `1px solid ${unfoldView === v ? '#1a1a1a' : '#d0d0d0'}`,
                }}
              >{v === 'mesh' ? 'Maillage' : 'Vue pliée'}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
