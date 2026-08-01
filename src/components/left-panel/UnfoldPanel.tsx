'use client'

import { useRef, useState } from 'react'
import { GEOMETRY_PRESETS } from '@/lib/geometryPresets'
import { unfoldMesh } from '@/lib/unfold'
import { SectionLabel, StatCard, SliderRow, GeometryIcon } from './ui'
import { c, fs, fw, r } from '@/lib/tokens'

interface MeshStats {
  vertices: number
  originalFaces: number
  cutEdges: number
  foldEdges: number
  glueTabs: number
}

function parseObjStats(content: string): MeshStats {
  let vertices = 0, rawFaces = 0
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t.startsWith('v ')) vertices++
    else if (t.startsWith('f ')) rawFaces++
  }
  const result = unfoldMesh(content)
  const stats = result?.stats ?? { originalFaces: rawFaces, cutEdges: 0, foldEdges: 0, glueTabs: 0 }
  return { vertices, ...stats }
}

export function UnfoldPanel({ meshName, onMeshNameChange, onObjLoad }: {
  meshName: string | null
  onMeshNameChange: (n: string | null) => void
  onObjLoad?: (name: string | null, content: string | null) => void
}) {
  const [maxFaces, setMaxFaces] = useState(200)
  const [glueTabSize, setGlueTabSize] = useState(15)
  const [glueTabAngle, setGlueTabAngle] = useState(45)
  const [objStats, setObjStats] = useState<MeshStats | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const currentObjRef = useRef<{ name: string; content: string } | null>(null)

  const loadObj = (name: string, content: string) => {
    currentObjRef.current = { name, content }
    onMeshNameChange(name)
    onObjLoad?.(name, content)
    setObjStats(parseObjStats(content))
  }

  const clearMesh = () => {
    currentObjRef.current = null
    onMeshNameChange(null)
    onObjLoad?.(null, null)
    setObjStats(null)
  }

  const forceReunfold = () => {
    if (!currentObjRef.current) return
    const { name, content } = currentObjRef.current
    onObjLoad?.(name, content)
    setObjStats(parseObjStats(content))
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Geometry Library</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {GEOMETRY_PRESETS.map(preset => (
            <button
              key={preset.id}
              title={preset.label}
              onClick={() => loadObj(preset.label, preset.obj)}
              className="fs-btn-tab"
              style={{
                background: meshName === preset.label ? c.ink : c.surface,
                border: `1px solid ${meshName === preset.label ? c.ink : c.borderLight}`,
                color: meshName === preset.label ? c.white : '#444',
                borderRadius: r.md, padding: '7px 2px 5px',
                fontSize: fs.xs, fontWeight: fw.bold, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                fontFamily: 'inherit', letterSpacing: 0.2,
              }}
            >
              <GeometryIcon id={preset.id} active={meshName === preset.label} />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Source Mesh</SectionLabel>
        {meshName ? (
          <div style={{
            background: c.surface, border: `1px solid ${c.borderLight}`, borderRadius: r.xl,
            padding: '9px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c.textMed} strokeWidth="1.5">
                <rect x="2" y="1" width="10" height="12" rx="1.5"/>
                <path d="M4 5h6M4 7h6M4 9h4"/>
              </svg>
              <span style={{ color: '#444', fontSize: fs.md }}>{meshName}</span>
            </div>
            <button onClick={clearMesh} className="fs-btn-ghost" style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 14, padding: 0 }}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5"/></svg></button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="fs-btn-default"
            style={{
              width: '100%', background: c.white, border: `1px solid ${c.border}`,
              color: '#333', borderRadius: r.lg, padding: '8px 0', fontSize: fs.md,
              fontWeight: fw.medium, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>↑</span> Import .obj
          </button>
        )}
        <input ref={fileInputRef} type="file" accept=".obj" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            const reader = new FileReader()
            reader.onload = ev => loadObj(f.name, ev.target?.result as string)
            reader.readAsText(f)
            e.target.value = ''
          }} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Mesh Optimization</SectionLabel>
        <SliderRow label="Max Faces" value={maxFaces} min={10} max={1000} step={10} onChange={setMaxFaces} />
        <div style={{ fontSize: fs.sm, color: c.textMuted, fontStyle: 'italic', marginTop: -6, marginBottom: 8 }}>
          {maxFaces >= 200 ? 'Mesh within limits — no simplification needed' : `Mesh simplified to ${maxFaces} faces`}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <SectionLabel>Unfold Settings</SectionLabel>
        <SliderRow label="Glue Tab Size (mm)" value={glueTabSize} min={5} max={40} step={1} onChange={setGlueTabSize} />
        <SliderRow label="Glue Tab Angle (°)" value={glueTabAngle} min={15} max={75} step={1} onChange={setGlueTabAngle} />
        <button
          onClick={forceReunfold}
          className="fs-btn-primary"
          style={{
            width: '100%', background: c.ink, color: c.white, border: 'none',
            borderRadius: r.lg, padding: '9px 0', fontSize: fs.md, fontWeight: fw.bold, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
          }}>
          <span style={{ fontSize: 12 }}>↺</span> Force Re-unfold
        </button>
      </div>

      {meshName && objStats && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Statistiques du maillage</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <StatCard label="Sommets" value={objStats.vertices} />
            <StatCard label="Faces" value={objStats.originalFaces} />
            <StatCard label="Arêtes coupées" value={objStats.cutEdges} />
            <StatCard label="Arêtes pliage" value={objStats.foldEdges} />
            <StatCard label="Languettes" value={objStats.glueTabs} />
            <StatCard label="Panneaux" value={Math.max(1, objStats.originalFaces)} />
          </div>
        </div>
      )}
    </>
  )
}
