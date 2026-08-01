export const BARCODE_TYPES = [
  { id: 'CODE128', label: 'Code 128',  placeholder: 'ABC-123456' },
  { id: 'EAN13',   label: 'EAN-13',    placeholder: '590123412345' },
  { id: 'UPC',     label: 'UPC-A',     placeholder: '01234567890' },
  { id: 'CODE39',  label: 'Code 39',   placeholder: 'ABC-1234' },
  { id: 'ITF14',   label: 'ITF-14',    placeholder: '0123456789012' },
] as const

export function generateBarcodeDataUrl(
  type: string, value: string, fgColor: string,
  widthMm: number, heightMm: number, showText: boolean
): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(widthMm * 6)
    canvas.height = Math.round(heightMm * 6)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const JsBarcode = require('jsbarcode') as (el: HTMLCanvasElement, v: string, o: Record<string, unknown>) => void // eslint-disable-line
    JsBarcode(canvas, value, {
      format: type, lineColor: fgColor, background: '#ffffff',
      width: Math.max(1, Math.floor(canvas.width / (Math.max(8, value.length) * 10))),
      height: Math.round(canvas.height * (showText ? 0.65 : 0.88)),
      displayValue: showText,
      fontSize: Math.round(canvas.height * 0.13),
      margin: Math.round(canvas.height * 0.04),
      textMargin: 2,
    })
    return canvas.toDataURL('image/png')
  } catch { return null }
}
