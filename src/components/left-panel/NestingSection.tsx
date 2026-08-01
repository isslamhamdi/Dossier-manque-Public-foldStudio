'use client'

import { useMemo, useState } from 'react'
import { CollapsibleSection } from './ui'
import type { BoxParams, TemplateType } from '@/lib/types'
import { computeDieline } from '@/lib/dieline'
import { nestPieces } from '@/lib/production/nestEngine'
import { downloadDxf } from '@/lib/export/dxf'

const SHEETS = [
  { label: 'A1 (594×841)',   w: 594,  h: 841  },
  { label: 'A0 (841×1189)',  w: 841,  h: 1189 },
  { label: 'SRA2 (450×640)', w: 450,  h: 640  },
  { label: 'SRA1 (640×900)', w: 640,  h: 900  },
  { label: 'B2 (500×707)',   w: 500,  h: 707  },
  { label: '70×100 cm',      w: 700,  h: 1000 },
]

export function NestingSection({ params, activeTemplate }: { params: BoxParams; activeTemplate: TemplateType }) {
  const [sheetIdx, setSheetIdx]   = useState(0)
  const [gap, setGap]             = useState(3)
  const [quantity, setQuantity]   = useState(500)
  const [rotate, setRotate]       = useState(false)

  const dieline = useMemo(() => computeDieline(params, activeTemplate), [params, activeTemplate])
  const dieW = dieline.svgWidth
  const dieH = dieline.svgHeight
  const sheet = SHEETS[sheetIdx]

  const result = useMemo(() => nestPieces({
    sheetW: sheet.w, sheetH: sheet.h,
    pieceW: rotate ? dieH : dieW,
    pieceH: rotate ? dieW : dieH,
    quantity,
    gap,
    allowRotate: false,   // rotation is manual via the toggle
  }), [sheet, dieW, dieH, gap, quantity, rotate])

  const resultRotated = useMemo(() => nestPieces({
    sheetW: sheet.w, sheetH: sheet.h,
    pieceW: dieH, pieceH: dieW,
    quantity,
    gap,
    allowRotate: false,
  }), [sheet, dieW, dieH, gap, quantity])

  const resultStraight = useMemo(() => nestPieces({
    sheetW: sheet.w, sheetH: sheet.h,
    pieceW: dieW, pieceH: dieH,
    quantity,
    gap,
    allowRotate: false,
  }), [sheet, dieW, dieH, gap, quantity])

  // First-sheet placements for preview (max 200 cells for perf)
  const previewPlacements = useMemo(() =>
    result.placements.filter(p => p.sheet === 0).slice(0, 200),
    [result]
  )

  // Scale preview to 180px wide
  const previewW = 180
  const previewH = Math.round(previewW * sheet.h / sheet.w)
  const sc = previewW / sheet.w

  const perSheet = result.placements.filter(p => p.sheet === 0).length
  const better = resultRotated.placements.filter(p => p.sheet === 0).length >
                 resultStraight.placements.filter(p => p.sheet === 0).length

  function handleDxfExport() {
    downloadDxf(dieline, `fold-studio-gang-${params.width}x${params.height}x${params.depth}.dxf`)
  }

  return (
    <CollapsibleSection label="Imposition / Nesting">

      {/* Sheet selector */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Format feuille</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {SHEETS.map((s, i) => (
            <button key={s.label} onClick={() => setSheetIdx(i)}
              style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, border: `1px solid ${sheetIdx === i ? '#555' : '#e0e0e0'}`, background: sheetIdx === i ? '#333' : '#fff', color: sheetIdx === i ? '#fff' : '#555', cursor: 'pointer' }}>
              {s.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Gap + Quantity + Rotation */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Marge (mm)</div>
          <input type="number" min={0} max={20} value={gap} onChange={e => setGap(Number(e.target.value))}
            style={{ width: '100%', fontSize: 11, border: '1px solid #e0e0e0', borderRadius: 3, padding: '3px 6px', outline: 'none' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 3 }}>Qté totale</div>
          <input type="number" min={1} max={100000} step={100} value={quantity} onChange={e => setQuantity(Number(e.target.value))}
            style={{ width: '100%', fontSize: 11, border: '1px solid #e0e0e0', borderRadius: 3, padding: '3px 6px', outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 16 }}>
          <button onClick={() => setRotate(false)}
            style={{ fontSize: 9, padding: '3px 6px', borderRadius: 3, border: `1px solid ${!rotate ? '#555' : '#e0e0e0'}`, background: !rotate ? '#333' : '#fff', color: !rotate ? '#fff' : '#555', cursor: 'pointer' }}>
            Normal
          </button>
          <button onClick={() => setRotate(true)}
            style={{ fontSize: 9, padding: '3px 6px', borderRadius: 3, border: `1px solid ${rotate ? '#555' : '#e0e0e0'}`, background: rotate ? '#333' : '#fff', color: rotate ? '#fff' : '#555', cursor: 'pointer' }}>
            90°
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        {[
          { label: 'Patrons/feuille', value: perSheet },
          { label: 'Feuilles totales', value: result.sheetsNeeded },
          { label: 'Rendement', value: `${result.efficiency}%` },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: '#f7f7f7', borderRadius: 5, padding: '6px 4px', textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{value}</div>
            <div style={{ fontSize: 8, color: '#999', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Orientation suggestion */}
      {better !== rotate && (
        <div style={{ fontSize: 9, color: '#888', background: '#f0f7ff', border: '1px solid #d0e4ff', borderRadius: 4, padding: '4px 8px', marginBottom: 8 }}>
          Rotation 90° améliore le rendement — {resultRotated.placements.filter(p => p.sheet === 0).length} patrons/feuille
        </div>
      )}

      {/* Mini layout preview — first sheet only */}
      <div style={{ fontSize: 9, color: '#aaa', marginBottom: 4 }}>Aperçu feuille 1</div>
      <div style={{ width: previewW, height: previewH, position: 'relative', background: '#f9f9f9', border: '1px solid #ddd', borderRadius: 4, overflow: 'hidden' }}>
        {previewPlacements.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: p.x * sc, top: p.y * sc,
            width: Math.max(p.w * sc - 0.5, 1), height: Math.max(p.h * sc - 0.5, 1),
            background: 'rgba(233,30,140,0.12)', border: '0.5px solid rgba(233,30,140,0.5)',
            borderRadius: 1,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 8, color: '#bbb', marginTop: 4, textAlign: 'right' }}>
        Gabarit: {Math.round(dieW)}×{Math.round(dieH)} mm • Feuille: {sheet.w}×{sheet.h} mm
      </div>

      {/* DXF export */}
      <button onClick={handleDxfExport}
        style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: 5, border: '1px solid #333', background: '#222', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.5 }}>
        Exporter DXF (découpeuse Zund/Kongsberg)
      </button>
      <div style={{ fontSize: 8, color: '#bbb', marginTop: 4 }}>
        Couches: CUT (magenta) · CREASE (bleu) · GLUE (cyan) · BLEED (jaune)
      </div>
    </CollapsibleSection>
  )
}
