// Nest & Gang Engine — Bottom-Left-Fill sheet imposition.
//
// Algorithm: Bottom-Left-Fill (BLF) heuristic.
//   1. Sort pieces by decreasing height (tallest first).
//   2. For each piece, try to place it at the lowest possible Y,
//      then leftmost X, within the sheet minus the gap margin.
//   3. Maintain a "sky-line" profile (top-edge Y per X column)
//      to avoid overlap detection on every placement.
//
// Complexity: O(n × w) per row step — fast for typical dieline counts (< 200).
// For optimal packing (NFP), replace with a rotation + NFP solver.

export interface NestPiece {
  w: number   // piece width in mm (no rotation — call twice to test both)
  h: number   // piece height in mm
}

export interface NestPlacement {
  x: number   // bottom-left X in mm
  y: number   // bottom-left Y in mm
  w: number
  h: number
  sheet: number   // 0-indexed sheet number
}

export interface NestResult {
  placements:   NestPlacement[]
  sheetsNeeded: number
  totalPieces:  number
  efficiency:   number   // 0-100 %
  sheetW:       number
  sheetH:       number
  gap:          number
}

// ── Bottom-Left-Fill ─────────────────────────────────────────────────────────

class BLFPacker {
  private skyline: number[]  // skyline[x_col] = top Y at that column
  private colWidth: number

  constructor(
    private sheetW: number,
    private sheetH: number,
    private gap: number,
    colResolution = 1,   // mm per skyline column (trade precision vs speed)
  ) {
    const cols = Math.ceil(sheetW / colResolution)
    this.skyline  = new Array(cols).fill(0)
    this.colWidth = colResolution
  }

  // Try to place a piece, return [x, y] or null if it doesn't fit
  place(pw: number, ph: number): [number, number] | null {
    const cols    = this.skyline.length
    const pCols   = Math.ceil(pw / this.colWidth)
    const gapCols = Math.ceil(this.gap / this.colWidth)

    for (let c = 0; c <= cols - pCols; c++) {
      // Y at which piece can sit (max skyline in the span)
      let baseY = 0
      for (let k = c; k < c + pCols; k++) baseY = Math.max(baseY, this.skyline[k])

      const topY = baseY + ph + this.gap
      if (topY > this.sheetH + 1e-6) continue   // doesn't fit vertically

      const x = c * this.colWidth
      const y = baseY + this.gap

      // Stamp skyline
      for (let k = c; k < Math.min(c + pCols + gapCols, cols); k++) {
        this.skyline[k] = Math.max(this.skyline[k], baseY + ph)
      }

      return [x, y]
    }

    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface NestEngineOptions {
  sheetW:    number    // mm
  sheetH:    number    // mm
  pieceW:    number    // mm (dieW)
  pieceH:    number    // mm (dieH)
  quantity:  number    // total units needed
  gap:       number    // mm margin between pieces
  allowRotate?: boolean  // try both orientations per sheet
}

export function nestPieces({
  sheetW, sheetH, pieceW, pieceH, quantity, gap, allowRotate = true,
}: NestEngineOptions): NestResult {
  const placements: NestPlacement[] = []
  let remaining    = quantity
  let sheetIdx     = 0

  while (remaining > 0) {
    // Try normal orientation
    const packerN = new BLFPacker(sheetW, sheetH, gap)
    // Try rotated
    const packerR = allowRotate ? new BLFPacker(sheetW, sheetH, gap) : null

    const placedN: NestPlacement[] = []
    const placedR: NestPlacement[] = []

    for (let i = 0; i < remaining; i++) {
      const ptN = packerN.place(pieceW, pieceH)
      if (ptN) placedN.push({ x: ptN[0], y: ptN[1], w: pieceW, h: pieceH, sheet: sheetIdx })
    }

    if (packerR) {
      for (let i = 0; i < remaining; i++) {
        const ptR = packerR.place(pieceH, pieceW)
        if (ptR) placedR.push({ x: ptR[0], y: ptR[1], w: pieceH, h: pieceW, sheet: sheetIdx })
      }
    }

    // Take the orientation that fits more pieces per sheet
    const best = placedR.length > placedN.length ? placedR : placedN

    if (best.length === 0) break   // nothing fits even on a fresh sheet (piece too big)

    for (const p of best) placements.push(p)
    remaining -= best.length
    sheetIdx++

    if (sheetIdx > 500) break   // safety cap
  }

  const sheetsNeeded = sheetIdx
  const totalPieces  = placements.length
  const pieceArea    = pieceW * pieceH
  const sheetArea    = sheetW * sheetH

  const efficiency = sheetsNeeded > 0
    ? Math.min(100, (totalPieces * pieceArea) / (sheetsNeeded * sheetArea) * 100)
    : 0

  return {
    placements,
    sheetsNeeded,
    totalPieces,
    efficiency: Math.round(efficiency * 10) / 10,
    sheetW,
    sheetH,
    gap,
  }
}
