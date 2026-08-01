'use client'

// #77-81 Résistance structurelle — BCT/McKee/ECT + simulation empilement

import { useState, useMemo } from 'react'
import type { BoxParams } from '@/lib/types'
import { calcStrength, FLUTE_NAMES, GRAMMAGE_PRESETS } from '@/lib/structural'
import { CollapsibleSection } from './ui'
import { c, fs } from '@/lib/tokens'

interface StrengthSectionProps {
  params: BoxParams
}

export function StrengthSection({ params }: StrengthSectionProps) {
  const [fluteId, setFluteId] = useState('B')
  const [grammage, setGrammage] = useState(125)
  const [stack, setStack] = useState(6)

  const result = useMemo(
    () => calcStrength(params.width, params.height, params.depth, fluteId, grammage),
    [params.width, params.height, params.depth, fluteId, grammage],
  )

  const totalLoad = result.bct * 0.6 * stack
  const barW = Math.min(100, (result.bct / 300) * 100)
  const barColor = result.bct < 50 ? '#ef4444' : result.bct < 120 ? '#f59e0b' : '#10b981'

  return (
    <CollapsibleSection label="Résistance structurelle">
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Cannelure</div>
          <select
            value={fluteId}
            onChange={e => setFluteId(e.target.value)}
            style={{ width: '100%', fontSize: 11, border: `1px solid ${c.borderLight}`, borderRadius: 6, padding: '4px 6px', background: c.white, fontFamily: 'inherit' }}
          >
            {Object.entries(FLUTE_NAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Grammage</div>
          <select
            value={grammage}
            onChange={e => setGrammage(Number(e.target.value))}
            style={{ width: '100%', fontSize: 11, border: `1px solid ${c.borderLight}`, borderRadius: 6, padding: '4px 6px', background: c.white, fontFamily: 'inherit' }}
          >
            {GRAMMAGE_PRESETS.map(g => (
              <option key={g} value={g}>{g} g/m²</option>
            ))}
          </select>
        </div>
      </div>

      {/* BCT bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: c.textMed }}>BCT (McKee)</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>{result.bct.toFixed(0)} kg</span>
        </div>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barW}%`, background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <Metric label="ECT" value={`${result.ect.toFixed(1)} kN/m`} />
        <Metric label="Charge utile" value={`${result.stackLoad.toFixed(0)} kg`} />
      </div>

      {/* Stacking simulation #79 */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: c.textMed }}>Empilement</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setStack(s => Math.max(1, s - 1))} style={btnStyle}>−</button>
            <span style={{ fontSize: 11, fontWeight: 700, color: c.textMed, minWidth: 20, textAlign: 'center' }}>{stack}</span>
            <button onClick={() => setStack(s => Math.min(20, s + 1))} style={btnStyle}>+</button>
          </div>
        </div>
        <StackVisual count={stack} maxLoad={totalLoad} bct={result.bct} />
        <div style={{ fontSize: 9, color: c.textGhost, marginTop: 4, textAlign: 'center' }}>
          Charge totale : {totalLoad.toFixed(0)} kg — Résistance cumulée : {(result.bct * stack).toFixed(0)} kg
        </div>
      </div>

      {/* Fragility alert #81 */}
      {result.warnings.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '6px 8px' }}>
          {result.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 9, color: '#b45309', lineHeight: 1.5 }}>⚠ {w}</div>
          ))}
        </div>
      )}
      {result.warnings.length === 0 && (
        <div style={{ fontSize: 9, color: '#059669', background: 'rgba(5,150,105,0.06)', borderRadius: 8, padding: '5px 8px', border: '1px solid rgba(5,150,105,0.2)' }}>
          ✓ Structure correcte pour emballage standard
        </div>
      )}
    </CollapsibleSection>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '6px 8px' }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: c.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function StackVisual({ count, maxLoad, bct }: { count: number; maxLoad: number; bct: number }) {
  const safe = maxLoad < bct * count * 0.8
  return (
    <div style={{ display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 2, padding: '6px 0' }}>
      {Array.from({ length: Math.min(count, 8) }).map((_, i) => {
        const crush = !safe && i >= Math.min(count, 8) - 2
        return (
          <div key={i} style={{
            width: 60, height: 12, borderRadius: 3,
            background: crush ? 'rgba(239,68,68,0.5)' : 'rgba(90,107,212,0.25)',
            border: `1px solid ${crush ? '#ef4444' : 'rgba(90,107,212,0.4)'}`,
            transition: 'all 0.2s',
          }} />
        )
      })}
      {count > 8 && (
        <div style={{ fontSize: 9, color: c.textGhost }}>+{count - 8} boîtes…</div>
      )}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 22, height: 22, borderRadius: 6, border: `1px solid ${c.borderLight}`,
  background: c.white, cursor: 'pointer', fontSize: 13, fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
}
