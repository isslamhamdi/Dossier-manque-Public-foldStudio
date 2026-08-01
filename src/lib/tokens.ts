// Design tokens — single source of truth for inline styles across the app

export const c = {
  ink:          '#1a1a1a',  // primary text / dark button bg
  textMed:      '#555',     // medium body text
  textMuted:    '#888',     // labels, secondary text
  textLight:    '#aaa',     // very muted
  textFaint:    '#bbb',     // decorative, disabled icon
  textGhost:    '#ccc',     // ghost / off-state indicator
  white:        '#ffffff',
  surface:      '#f5f5f5',  // card / input background
  surfaceAlt:   '#fafafa',
  border:       '#d0d0d0',  // default input border
  borderLight:  '#e0e0e0',  // lighter border / button stroke
  borderXLight: '#efefef',  // section dividers
  borderSep:    '#e8e8e8',  // nav / header separators
  accent:       '#4488ff',
  accentBg:     '#f0f4ff',
  accentBorder: '#c0ccff',
  danger:       '#e53935',
} as const

export const fs = {
  micro: 8,  // badge
  xs:    9,  // micro label
  sm:    10, // field label / section header
  md:    11, // input / list item / UI control
  lg:    13, // body / nav tab
} as const

export const fw = {
  normal: 400,
  medium: 500,
  bold:   600,
  heavy:  700,
} as const

export const r = {
  sm:   3,
  md:   4,
  lg:   5,
  xl:   6,
  pill: 10,
} as const
