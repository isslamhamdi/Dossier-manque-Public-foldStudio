'use client'

import { useMemo } from 'react'
import { CollapsibleSection } from './ui'
import { runPreflight } from '@/lib/preflight'
import type { BoxParams, ImageLayer } from '@/lib/types'
import type { DielineData } from '@/lib/dieline'

const SEVERITY_ICON: Record<string, string> = { error: '✕', warning: '⚠', info: '✓' }
const SEVERITY_COLOR: Record<string, string> = { error: '#e53935', warning: '#f57c00', info: '#388e3c' }
const SEVERITY_BG: Record<string, string> = { error: '#fff1f0', warning: '#fff8e1', info: '#f1f8f1' }
const SEVERITY_ORDER: Record<string, number> = { error: 0, warning: 1, info: 2 }

export function PreflightSection({
  params, dieline, imageLayers, exteriorColor, interiorColor,
}: {
  params: BoxParams
  dieline: DielineData
  imageLayers: ImageLayer[]
  exteriorColor: string
  interiorColor: string
}) {
  const issues = useMemo(
    () => runPreflight(params, dieline, imageLayers, exteriorColor, interiorColor),
    [params, dieline, imageLayers, exteriorColor, interiorColor]
  )

  const errorCount  = issues.filter(i => i.severity === 'error').length
  const warnCount   = issues.filter(i => i.severity === 'warning').length
  const sorted = [...issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  const badgeColor = errorCount > 0 ? '#e53935' : warnCount > 0 ? '#f57c00' : '#388e3c'
  const badgeLabel = errorCount > 0 ? `${errorCount} erreur${errorCount > 1 ? 's' : ''}` : warnCount > 0 ? `${warnCount} avertissement${warnCount > 1 ? 's' : ''}` : 'OK'

  const badge = (
    <span style={{ fontSize: 9, fontWeight: 700, color: badgeColor, background: `${badgeColor}18`, padding: '2px 7px', borderRadius: 10, border: `1px solid ${badgeColor}30` }}>
      {badgeLabel}
    </span>
  )

  return (
    <CollapsibleSection label="Contrôle pré-impression" right={badge}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {sorted.map(issue => (
          <div key={issue.id} style={{
            padding: '7px 9px', borderRadius: 6, background: SEVERITY_BG[issue.severity],
            border: `1px solid ${SEVERITY_COLOR[issue.severity]}30`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR[issue.severity], flexShrink: 0 }}>
                {SEVERITY_ICON[issue.severity]}
              </span>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{issue.title}</div>
                <div style={{ fontSize: 9, color: '#666', marginTop: 2, lineHeight: 1.4 }}>{issue.detail}</div>
                {issue.fix && (
                  <div style={{ fontSize: 9, color: SEVERITY_COLOR[issue.severity], marginTop: 3, fontStyle: 'italic' }}>
                    → {issue.fix}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  )
}
