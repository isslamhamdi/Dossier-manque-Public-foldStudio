export type LineRole = 'cut' | 'fold' | 'glue' | 'bleed' | 'unknown'

// ── Color → role (SVG / Illustrator conventions) ───────────────

const COLOR_ROLE: Record<string, LineRole> = {
  // Cut — magentas, reds, hot pinks
  '#ff0000': 'cut', '#cc0000': 'cut', '#ff0066': 'cut',
  '#e91e8c': 'cut', '#ff00ff': 'cut', '#cc00cc': 'cut',
  '#ff006e': 'cut', '#d4145a': 'cut', '#c2185b': 'cut',
  // Fold — blues, cyans, greens
  '#0000ff': 'fold', '#0066ff': 'fold', '#0033cc': 'fold',
  '#00aaff': 'fold', '#4488ff': 'fold', '#0099cc': 'fold',
  '#00ff00': 'fold', '#00cc00': 'fold', '#006600': 'fold',
  '#009900': 'fold',
  // Glue — yellows, oranges
  '#ffff00': 'glue', '#ffcc00': 'glue', '#ff9900': 'glue',
  '#ffd700': 'glue',
  // Bleed — pinks, light magentas
  '#ffb3c6': 'bleed', '#ff99bb': 'bleed', '#ffccdd': 'bleed',
  '#ff88aa': 'bleed',
}

// DXF layer name → role
const LAYER_ROLE: Record<string, LineRole> = {
  // ArtiosCAD / ESKO / ISO standards
  'c': 'cut',   'cut': 'cut',   'coupe': 'cut',    'decoupage': 'cut',
  'decoupe': 'cut', '1': 'cut',
  'f': 'fold',  'fold': 'fold', 'crease': 'fold',  'pli': 'fold',
  'rainage': 'fold', 'plier': 'fold', 'perforation': 'fold', '2': 'fold',
  'b': 'bleed', 'bleed': 'bleed', 'fond perdu': 'bleed', 'fond_perdu': 'bleed', '4': 'bleed',
  'g': 'glue',  'glue': 'glue', 'colle': 'glue',  'collage': 'glue', '3': 'glue',
}

export function classifyByColor(hex: string): LineRole {
  return COLOR_ROLE[hex.toLowerCase()] ?? 'unknown'
}

export function classifyByLayer(layerName: string): LineRole {
  return LAYER_ROLE[layerName.toLowerCase().trim()] ?? 'unknown'
}

// SVG element style → role (checks color then dash pattern)
export function classifySVGElement(el: Element): LineRole {
  const stroke   = el.getAttribute('stroke') ?? ''
  const dashArr  = el.getAttribute('stroke-dasharray') ?? ''
  const cssClass = el.getAttribute('class') ?? ''
  const fill     = el.getAttribute('fill') ?? ''

  // Explicit class names
  if (/cut/.test(cssClass))   return 'cut'
  if (/fold|crease/.test(cssClass)) return 'fold'
  if (/glue/.test(cssClass))  return 'glue'
  if (/bleed/.test(cssClass)) return 'bleed'

  // Fill color only → glue zone
  if (fill && fill !== 'none' && !stroke) return 'glue'

  // Stroke color
  const byColor = classifyByColor(stroke)
  if (byColor !== 'unknown') return byColor

  // Dashed → fold
  if (dashArr && dashArr !== 'none' && dashArr !== '0') return 'fold'

  return 'unknown'
}
