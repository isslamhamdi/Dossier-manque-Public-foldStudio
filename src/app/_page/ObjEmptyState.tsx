'use client'

export function ObjEmptyState() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#f5f3ef', gap: 14,
    }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: '#ede9e3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#b0a898" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4L28 10v12L16 28 4 22V10L16 4Z"/>
          <path d="M16 4v24M4 10l12 6 12-6"/>
          <path d="M10 7l6 3 6-3"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>Aucun maillage chargé</div>
        <div style={{ fontSize: 11, color: '#888', maxWidth: 220, lineHeight: 1.5 }}>
          Importez un fichier <strong>.OBJ</strong> depuis le panneau gauche pour visualiser et déplier le maillage 3D
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#bbb', letterSpacing: 0.5 }}>↙ PANNEAU GAUCHE → IMPORT .OBJ</div>
    </div>
  )
}
