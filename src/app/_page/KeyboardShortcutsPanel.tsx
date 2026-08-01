'use client'

const SHORTCUTS = [
  { group: 'Général', items: [
    { keys: ['Ctrl', 'S'], desc: 'Sauvegarder le projet' },
    { keys: ['Ctrl', 'Z'], desc: 'Annuler (Undo)' },
    { keys: ['Ctrl', 'Y'], desc: 'Rétablir (Redo)' },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Rétablir (Redo)' },
  ]},
  { group: 'Vue 2D patron', items: [
    { keys: ['Ctrl', '+'], desc: 'Zoom avant' },
    { keys: ['Ctrl', '-'], desc: 'Zoom arrière' },
    { keys: ['Ctrl', '0'], desc: 'Réinitialiser la vue' },
    { keys: ['Espace', 'Drag'], desc: 'Panoramique (panning)' },
    { keys: ['Molette'], desc: 'Zoom pinch/scroll' },
  ]},
  { group: 'Calques image', items: [
    { keys: ['Clic'], desc: 'Sélectionner calque' },
    { keys: ['Shift', 'Clic'], desc: 'Multi-sélection' },
    { keys: ['Shift', 'Drag'], desc: 'Sélection rectangle (rubber-band)' },
    { keys: ['Alt', 'Drag'], desc: 'Déplacement snap 5mm' },
    { keys: ['Shift'], desc: 'Rotation par pas de 15°' },
    { keys: ['Del'], desc: 'Supprimer calque sélectionné' },
  ]},
  { group: 'Vue 3D', items: [
    { keys: ['Clic+Drag'], desc: 'Orbiter la caméra' },
    { keys: ['Scroll'], desc: 'Zoom caméra' },
    { keys: ['Clic droit+Drag'], desc: 'Pan caméra' },
    { keys: ['Double-clic face'], desc: 'Survol face (dieline → 3D)' },
  ]},
  { group: 'Annotations', items: [
    { keys: ['P'], desc: 'Activer mode crayon (annotation)' },
    { keys: ['Ctrl', 'Z'], desc: 'Annuler dernier trait' },
  ]},
  { group: 'Export', items: [
    { keys: ['Ctrl', 'S'], desc: 'Sauvegarder (.foldstudio)' },
  ]},
]

export function KeyboardShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9995, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxWidth: '96vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Raccourcis clavier</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#888' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {SHORTCUTS.map(({ group, items }) => (
            <div key={group}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>{group}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {items.map(({ keys, desc }) => (
                    <tr key={desc} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '5px 0', width: '40%', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {keys.map(k => (
                            <kbd key={k} style={{
                              display: 'inline-block', padding: '2px 6px', background: '#f0f0f0',
                              border: '1px solid #d0d0d0', borderRadius: 4, fontSize: 9,
                              fontFamily: 'system-ui', boxShadow: '0 1px 0 #c0c0c0',
                            }}>{k}</kbd>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '5px 0 5px 10px', fontSize: 10, color: '#555' }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '10px 14px', background: '#f9f9f9', borderRadius: 8, fontSize: 9, color: '#aaa', textAlign: 'center' }}>
          Sur macOS : ⌘ = Ctrl · Option = Alt · ⌫ = Del
        </div>
      </div>
    </div>
  )
}
