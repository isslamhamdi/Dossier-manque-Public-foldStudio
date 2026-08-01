export const PATH_PRESETS = [
  { id: 'arc-top', label: 'Arc haut', d: (w: number) => `M 0,${w/3} A ${w/2},${w/3} 0 0,1 ${w},${w/3}` },
  { id: 'arc-bottom', label: 'Arc bas', d: (w: number) => `M 0,${w/6} A ${w/2},${w/3} 0 0,0 ${w},${w/6}` },
  { id: 'wave', label: 'Vague', d: (w: number) => `M 0,${w/4} Q ${w/4},0 ${w/2},${w/4} T ${w},${w/4}` },
  { id: 'circle', label: 'Cercle', d: (w: number) => `M ${w/2},0 A ${w/2},${w/2} 0 1,1 ${w/2-0.1},0` },
]

export function generateTextOnPathDataUrl(
  text: string, font: string, sizePt: number, color: string,
  bold: boolean, pathPreset: string
): { src: string; widthMm: number; heightMm: number } | null {
  try {
    const PX_PER_MM = 4
    const sizePx = Math.round(sizePt * 1.333 * PX_PER_MM)
    const boxW = Math.max(sizePx * text.length * 0.65, 100)
    const boxH = boxW * 0.6
    const preset = PATH_PRESETS.find(p => p.id === pathPreset) ?? PATH_PRESETS[0]
    const d = preset.d(boxW)
    const fontStyle = `${bold ? 'bold ' : ''}${sizePx}px ${font}`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}">
  <defs>
    <path id="tp" d="${d}"/>
  </defs>
  <text font-family="${font}" font-size="${sizePx}" fill="${color}" font-weight="${bold ? 'bold' : 'normal'}" font-style="normal">
    <textPath href="#tp" startOffset="50%" text-anchor="middle">${text}</textPath>
  </text>
</svg>`
    const encoded = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
    return { src: encoded, widthMm: boxW / PX_PER_MM, heightMm: boxH / PX_PER_MM }
  } catch { return null }
}

export const FONT_OPTIONS = [
  { id: 'Arial', label: 'Arial' },
  { id: 'Georgia', label: 'Georgia' },
  { id: 'Courier New', label: 'Courier New' },
  { id: 'Times New Roman', label: 'Times New Roman' },
  { id: 'Verdana', label: 'Verdana' },
  { id: 'Helvetica Neue, Helvetica, Arial', label: 'Helvetica' },
  { id: 'Impact', label: 'Impact' },
  { id: 'Futura, Century Gothic, Arial', label: 'Futura' },
  { id: 'Garamond, Georgia, serif', label: 'Garamond' },
  { id: 'Trebuchet MS, Arial', label: 'Trebuchet' },
  { id: 'Palatino, Palatino Linotype, serif', label: 'Palatino' },
  { id: 'Gill Sans, Gill Sans MT, Arial', label: 'Gill Sans' },
]

export function generateTextDataUrl(
  text: string, font: string, sizePt: number, color: string,
  bold: boolean, italic: boolean, align: 'left' | 'center' | 'right',
  bgColor?: string, letterSpacing?: number
): { src: string; widthMm: number; heightMm: number } | null {
  try {
    const PX_PER_MM = 4
    const sizePx = Math.round(sizePt * 1.333 * PX_PER_MM)
    const style = `${bold ? 'bold ' : ''}${italic ? 'italic ' : ''}${sizePx}px ${font}`
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    ctx.font = style
    const lines = text.split('\n')
    const lineH = Math.round(sizePx * 1.3)
    const ls = (letterSpacing ?? 0) * (sizePx / 12)
    const measureWithSpacing = (line: string) => {
      let w = 0
      for (const ch of line) w += ctx.measureText(ch).width + ls
      return Math.max(w - ls, 0)
    }
    const maxW = Math.max(...lines.map(l => measureWithSpacing(l)))
    const pad = sizePx * 0.3
    canvas.width = Math.ceil(maxW) + pad * 2
    canvas.height = lineH * lines.length + pad * 1.2
    if (bgColor && bgColor !== 'transparent' && bgColor !== '#00000000') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.font = style
    ctx.fillStyle = color
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    lines.forEach((line, i) => {
      const lineW = measureWithSpacing(line)
      let xBase = pad
      if (align === 'center') xBase = (canvas.width - lineW) / 2
      if (align === 'right') xBase = canvas.width - pad - lineW
      let x = xBase
      for (const ch of line) { ctx.fillText(ch, x, pad * 0.5 + i * lineH); x += ctx.measureText(ch).width + ls }
    })
    return { src: canvas.toDataURL('image/png'), widthMm: canvas.width / PX_PER_MM, heightMm: canvas.height / PX_PER_MM }
  } catch { return null }
}
