'use client'

/**
 * Feature #50: Version comparison — side-by-side dieline diff
 * Shows current design vs. a saved snapshot from history.
 */

import { useMemo, useState } from 'react'
import type { Snapshot } from './useHistory'
import { computeDieline } from '@/lib/dieline'
import { MM_TO_PX } from '@/components/dieline-canvas/constants'

interface VersionCompareProps {
  current: Snapshot
  snapshots: Snapshot[]
  onClose: () => void
}

function MiniDieline({ snapshot, label }: { snapshot: Snapshot; label: string }) {
  const dieline = useMemo(() => computeDieline(snapshot.params, snapshot.activeTemplate), [snapshot])
  const scale = 160 / Math.max(dieline.svgWidth, dieline.svgHeight)
  const w = dieline.svgWidth * scale, h = dieline.svgHeight * scale

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 10, color: '#888', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <svg width={w} height={h} style={{ border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff' }}>
        <g transform={`scale(${scale})`}>
          <path d={dieline.cutPath} fill="rgba(233,30,140,0.05)" stroke="#e91e8c" strokeWidth={1.5 / scale} />
          {dieline.foldLines.map((l, i) => (
            <path key={i} d={l} fill="none" stroke="#4488ff" strokeWidth={0.8 / scale} strokeDasharray={`${5/scale} ${2/scale}`} />
          ))}
        </g>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#333', fontWeight: 700 }}>
          {snapshot.params.width} × {snapshot.params.height} × {snapshot.params.depth} mm
        </div>
        <div style={{ fontSize: 9, color: '#aaa' }}>{snapshot.activeTemplate}</div>
      </div>
    </div>
  )
}

function DiffRow({ label, a, b }: { label: string; a: string | number; b: string | number }) {
  const changed = String(a) !== String(b)
  return (
    <tr style={{ background: changed ? '#fff8e1' : 'transparent' }}>
      <td style={{ padding: '4px 8px', fontSize: 9, color: '#888', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '4px 8px', fontSize: 9, color: changed ? '#e53935' : '#333', fontFamily: 'monospace', textAlign: 'center' }}>{a}</td>
      <td style={{ padding: '4px 8px', fontSize: 9, color: '#888', textAlign: 'center' }}>→</td>
      <td style={{ padding: '4px 8px', fontSize: 9, color: changed ? '#388e3c' : '#333', fontFamily: 'monospace', textAlign: 'center' }}>{b}</td>
    </tr>
  )
}

export function VersionCompare({ current, snapshots, onClose }: VersionCompareProps) {
  const [compareIdx, setCompareIdx] = useState(0)
  const compared = snapshots[compareIdx] ?? current

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 640, maxWidth: '96vw', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Comparaison de versions</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#888' }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>
        </div>

        {snapshots.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Comparer avec :</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {snapshots.map((_, i) => i !== snapshots.length - 1 && (
                <button key={i} onClick={() => setCompareIdx(i)}
                  style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, border: `1px solid ${compareIdx===i?'#333':'#e0e0e0'}`, background: compareIdx===i?'#333':'#fff', color: compareIdx===i?'#fff':'#555', cursor: 'pointer' }}>
                  Version {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Side-by-side dielines */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 24 }}>
          <MiniDieline snapshot={compared} label="Version précédente" />
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 20, color: '#ddd' }}>→</div>
          <MiniDieline snapshot={current} label="Version actuelle" />
        </div>

        {/* Diff table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: 9, color: '#888', fontWeight: 600 }}>Paramètre</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 9, color: '#888', fontWeight: 600 }}>Avant</th>
              <th style={{ width: 20 }} />
              <th style={{ padding: '6px 8px', textAlign: 'center', fontSize: 9, color: '#888', fontWeight: 600 }}>Après</th>
            </tr>
          </thead>
          <tbody>
            <DiffRow label="Largeur"         a={`${compared.params.width} mm`}    b={`${current.params.width} mm`} />
            <DiffRow label="Hauteur"         a={`${compared.params.height} mm`}   b={`${current.params.height} mm`} />
            <DiffRow label="Profondeur"      a={`${compared.params.depth} mm`}    b={`${current.params.depth} mm`} />
            <DiffRow label="Fond perdu"      a={`${compared.params.bleed} mm`}    b={`${current.params.bleed} mm`} />
            <DiffRow label="Languette coll." a={`${compared.params.glueTab} mm`}  b={`${current.params.glueTab} mm`} />
            <DiffRow label="Modèle"          a={compared.activeTemplate}          b={current.activeTemplate} />
            <DiffRow label="Couleur ext."    a={compared.exteriorCustomColor}     b={current.exteriorCustomColor} />
            <DiffRow label="Couleur int."    a={compared.interiorCustomColor}     b={current.interiorCustomColor} />
            <DiffRow label="Calques"         a={compared.imageLayers.length}      b={current.imageLayers.length} />
          </tbody>
        </table>
      </div>
    </div>
  )
}
