'use client'

import type { BoxParams } from '@/lib/types'
import type { UnitType } from '@/components/left-panel/ui'

const PT_PER_MM = 2.834645669

function fmtVal(mm: number, unit: UnitType): string {
  if (unit === 'cm') return (mm / 10).toFixed(1)
  if (unit === 'in') return (mm / 25.4).toFixed(2)
  if (unit === 'pt') return Math.round(mm * PT_PER_MM).toString()
  return mm % 1 === 0 ? mm.toString() : mm.toFixed(2)
}

export function DimensionBar({ params, unit = 'mm' }: { params: BoxParams; unit?: UnitType }) {
  return (
    <div style={{
      position: 'absolute', top: 10, right: 10,
      background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(220,215,210,0.8)',
      borderRadius: 10, padding: '7px 16px', display: 'flex', alignItems: 'center',
      gap: 0, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    }}>
      {[
        { label: 'LONGUEUR', value: params.width },
        { label: 'LARGEUR', value: params.depth },
        { label: 'HAUTEUR', value: params.height },
      ].map(({ label, value }, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
          {i > 0 && <span style={{ color: '#ccc', fontSize: 13, margin: '0 10px' }}>×</span>}
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a' }}>{fmtVal(value, unit)}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#888', marginLeft: 3 }}>{unit}</span>
            <div style={{ fontSize: 8, fontWeight: 700, color: '#aaa', letterSpacing: 1, marginTop: 1 }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
