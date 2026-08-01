export interface Picto {
  id: string
  label: string
  category: 'manutention' | 'stockage' | 'ecologie' | 'general'
  paths: string  // SVG inner elements using currentColor
}

// Paths are normalized into a 100×100 viewport via <g transform="translate(tx,ty) scale(s)">
// Source: ISO 780 / foldboks.ch reference shapes

export const PICTOS: Picto[] = [
  {
    id: 'fragile',
    label: 'Fragile',
    category: 'manutention',
    // foldboks: 450×999 viewBox → scale=88/999=0.08809, tx=30.18, ty=6
    paths: `<g transform="translate(30.18,6) scale(0.08809)" fill="currentColor">
      <path d="M282 616v304l170 76H3l169-76V616l-8-2-9-2-8-3-8-3-8-3-8-4-7-3-7-5-15-8-7-6-6-4-12-11-6-6-5-6-6-5-4-7-5-6-5-7-2-3-1-4-4-7-3-7-4-7-3-8-2-7-2-8-2-8-1-7-1-8v-8l-1-8V0h427v443l-1 8-1 8v7l-2 7-2 8-3 8-2 7-4 7-2 7-5 7-3 8-9 12-5 7-6 5-5 6-5 6-13 11-6 4-7 6-6 4-7 4-8 5-7 3-8 4-8 3-8 3-8 3-7 2z"/>
    </g>`
  },
  {
    id: 'this-way-up',
    label: 'Ce côté-ci',
    category: 'manutention',
    // foldboks: 902.8×992 viewBox → scale=88/992=0.08871, tx=9.975, ty=6
    paths: `<g transform="translate(9.975,6) scale(0.08871)" fill="currentColor">
      <path fill-rule="evenodd" d="M757 299v518H609V299H471L686 0l216 299Zm-470 0v518H139V299H0L217 0l215 299ZM19 844h864v148H19Z"/>
    </g>`
  },
  {
    id: 'keep-dry',
    label: 'Tenir au sec',
    category: 'manutention',
    // foldboks: 149.4×175.8 → scale=88/175.8=0.50057, tx=12.6, ty=6
    paths: `<g transform="translate(12.6,6) scale(0.50057)" fill="currentColor">
      <path d="m149.4 35.4-.3 10.4c0 3-2.2 5.5-5 6.1s-5.5-1-6.3-3.7.2-5.8 2.7-7.3zM128.1 12l-.3 10.4c0 3-2.2 5.5-5 6-2.8.7-5.5-.9-6.3-3.6s.2-5.8 2.7-7.3zM104.3 0l-.3 10.4c0 3-2.2 5.5-5 6-2.8.7-5.5-.9-6.4-3.6S93 7 95.4 5.5zm11 33.8-.4 10.4a6 6 0 0 1-5 6c-2.7.7-5.4-.9-6.3-3.6s.2-5.8 2.7-7.3zM91.7 21.7 91.5 32c0 3-2.2 5.5-5 6s-5.5-1-6.4-3.6.3-5.8 2.8-7.4zm-34.9 5.7-.3 10.4c0 3-2.2 5.5-5 6-2.8.7-5.5-.9-6.4-3.6s.3-5.8 2.8-7.3zM70.3 44v5.2A83 83 0 0 0 0 96l9 1a17 17 0 0 1 13-6.4A17 17 0 0 1 35.2 97a17 17 0 0 1 13.1-6.4 17 17 0 0 1 13 6.4 17 17 0 0 1 9.1-5.9v68c0 4.8-3.8 8.7-8.7 8.7S53 163.9 53 159h-8c0 9.2 7.6 16.7 16.7 16.7s16.7-7.5 16.7-16.7V91a17 17 0 0 1 9.1 6 17 17 0 0 1 13-6.5 17 17 0 0 1 13.2 6.4 17 17 0 0 1 13-6.4 17 17 0 0 1 13 6.4l9.3-1a83 83 0 0 0-70.6-46.8V44z"/>
    </g>`
  },
  {
    id: 'no-cutter',
    label: 'Pas de couteau',
    category: 'manutention',
    // foldboks: 313.9×313.9 viewBox → scale=88/313.9=0.28034, tx=ty=6
    paths: `<g transform="translate(6,6) scale(0.28034)" fill="currentColor">
      <path d="M115.3 260.7 36.7 273l29.8-29.8a46 46 0 0 1-28.3-14L7.8 259.5a26 26 0 0 0-4.9 30.7 26 26 0 0 0 27.7 14.1l90.6-14.3a26 26 0 0 0 14.5-7.4l35.5-35.5a27 27 0 0 0 3-3.6h-41.8zm-13.8-114.1-.5-.5-40.7 40.7a15.7 15.7 0 0 0 11.1 26.8h97.1l-.6-.7-30-30h-30.3l15.1-15.1zm84.9-42.5 43.5-43.5a30.5 30.5 0 1 1 43.2 43.2l-43.5 43.5 21.2 21.2.5.5 43.5-43.5a61.3 61.3 0 0 0-86.6-86.6l-43.5 43.5.5.5z"/>
      <circle cx="251.9" cy="81.8" r="14.2"/>
      <path d="M309.5 269.7 53.4 13.5a15 15 0 0 0-21.3 0 15 15 0 0 0 0 21.2L288.3 291a15 15 0 0 0 21.2 0 15 15 0 0 0 0-21.2"/>
    </g>`
  },
  {
    id: 'no-stack',
    label: 'Ne pas empiler',
    category: 'manutention',
    paths: `
      <rect x="18" y="52" width="64" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M18 66 L50 52 L82 66" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="50" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="4"/>
      <line x1="36" y1="10" x2="64" y2="38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="64" y1="10" x2="36" y2="38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    `
  },
  {
    id: 'protect-rain',
    label: 'Protéger pluie',
    category: 'manutention',
    paths: `
      <path d="M50 8 C27 8 10 24 10 44 L90 44 C90 24 73 8 50 8 Z" fill="none" stroke="currentColor" stroke-width="4"/>
      <line x1="50" y1="8" x2="50" y2="44" stroke="currentColor" stroke-width="4"/>
      <path d="M68 48 L68 60 Q68 68 60 68" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <rect x="18" y="68" width="64" height="26" rx="3" fill="none" stroke="currentColor" stroke-width="4"/>
      <path d="M18 81 L50 68 L82 81" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round"/>
      <line x1="28" y1="52" x2="25" y2="64" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="47" y2="62" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    `
  },
  {
    id: 'temperature',
    label: 'Température',
    category: 'stockage',
    // foldboks: 125.2×172.8 → scale=88/172.8=0.50926, tx=18.12, ty=6
    paths: `<g transform="translate(18.12,6) scale(0.50926)" fill="currentColor">
      <path fill-rule="evenodd" d="M63.1 0c-5.3 0-9.6 4.6-9.6 10.2V95L18 149.5H0v5.5h21l32.5-50v32a19.2 19.2 0 1 0 19.2 0V75.6L107 23.3h18.3v-5.5H104L72.7 65.6V10.1A10 10 0 0 0 63.1 0m0 5.5c2.3 0 4.2 1.9 4.2 4.2v64.1l-8.4 13V9.7c0-2.3 1.9-4.2 4.2-4.2"/>
    </g>`
  },
  {
    id: 'keep-cool',
    label: 'Garder au frais',
    category: 'stockage',
    paths: `
      <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="43" y1="8" x2="50" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="57" y1="8" x2="50" y2="20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="43" y1="92" x2="50" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="57" y1="92" x2="50" y2="80" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="8" y1="43" x2="20" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="8" y1="57" x2="20" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="92" y1="43" x2="80" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <line x1="92" y1="57" x2="80" y2="50" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="11" fill="currentColor"/>
    `
  },
  {
    id: 'fsc',
    label: 'FSC',
    category: 'ecologie',
    // foldboks: 886×1073.9 → scale=88/1073.9=0.08194, tx=13.7, ty=6
    paths: `<g transform="translate(13.7,6) scale(0.08194)" fill="currentColor">
      <path d="m309 854.4-80.6.8-53.8-1-8.2-.2c-4.7 0-8.2 3.5-8.2 8.5 0 2.3 0 9.5 9 9.5 32.4 0 33.6 2.7 33.9 15l.8 41.1c-.2 39.2.6 78.4-1.2 117.6-.2 4.3-.5 8.5-29.2 8.5-8 0-12.9 1.5-12.9 9.5 0 2.3 0 8.5 7.8 8.5h121.7c6.2 0 11.7-.7 11.7-8.5 0-8.9-7.4-9.5-19.5-9.5-28.9 0-29-4.2-29.2-8.5-.7-14-1.2-32.8-1.2-46V974h24c37 0 41.3 1 46.5 29.5 1.5 6.2 6.5 7 10.6 7 8.8 0 9.7-4.8 9.7-7L340 993a241 241 0 0 1-1.3-24.2v-43.9c0-6.6-7.8-6.6-12-6.6-7.1 0-8.7 4.5-13.2 25.2-2 8-17.2 12.4-41.8 12.4h-21.8v-64.3c0-17.6 3-17.7 7-17.8 14-.6 48.4-1.8 58.7-1.8a46 46 0 0 1 24.6 6 292 292 0 0 1 33.3 23.7c5.6 4.6 8.7 7.2 13.3 7.2 2.6 0 10.5 0 10.5-6.8 0-1.6-.7-3.2-3.3-8.6-3-6.7-8-17.5-14.4-34.2-1.8-5.3-7.8-5.3-19.1-5.3zm337.6 110.9c0 54 46.8 108.6 136.3 108.6 49 0 71.9-11.2 94.8-23.2l-8-8.7c-3.8-3.9-6-4.7-11-1.8-6.7 3.1-27.4 12.7-65 12.7-46.4 0-96.2-30.2-96.2-96.7 0-63.3 54-85.7 100.2-85.7 44.5 0 52.3 20.8 54.6 40.4h4.2c3.9 0 14.4 0 14.4-7.8v-37c0-9-10.4-10.4-14.8-11A304 304 0 0 0 804 852c-91.1 0-157.3 47.6-157.3 113.4M432 902.5c0 26.6 29.8 42.7 78.8 66 38.8 18.2 61.1 37.4 61.1 52.9 0 25-27 33.9-52 33.9-29 0-60-7.4-76-53.5h-3.2c-7 0-12.4.3-15.3 4.1-2.7 3.5-2 8.2-.8 12.7l8.6 35.8c2.2 8.8 5.4 10.2 19.4 12.9 6 1.1 37.6 6.6 64.2 6.6 74.6 0 107.8-30.3 107.8-60.3-4.5-39.9-56.6-60.5-89.6-76.3-31.8-15.3-51.2-24.4-51.2-40.4 0-15.5 20-26.4 48.8-26.4 37.3 0 47 20.9 51.7 39l.9 3.4h3.4c8.4 0 13.6-.6 16.7-4q2.8-2.9 2.2-7.6l-3-31c-.9-9.9-8.6-11.4-19-13.5-12.6-2.3-27.6-5-50-5-64.9 0-103.5 19-103.5 50.7M524.8 0c-217 0-293.6 337.3-364.9 608.4-25.7-26.1-105-105.2-105.2-105-31.7-31.6-73.5 17.7-45.5 45l144.5 144.1c22.8 21.8 49.6 9.3 57.3-18.8C337.7 106.5 451 64.2 524.5 64.2c61.6 0 132.7 45.6 132.7 136.7 92.3 0 150 121.1 75.8 195.7 61.5 29.7 88.8 66.3 88.8 112.5a95.3 95.3 0 0 1-95.3 93.5c-56.1 0-84.7-36-128.5-36.1-19.7 0-32 16-32 31.7v114.6h-82.5V598.7c-.3-20.4-17-34-36.6-31.6L336.2 581c-13.3 1.8-25.6 16.3-25.6 31.3a32.3 32.3 0 0 0 34 32c25.1-2 50.4-6 75.5-9.2v113c0 14.4 16.2 28.2 30.8 28.3h147c17 0 32-14.7 32-32.1V640.9c30.6 18.8 73.3 26.1 95.3 26.1 82.5 0 161.2-64.8 160.8-159.8-.4-86.3-66.2-129.2-66.2-129.2a178 178 0 0 0-105-230.3A196 196 0 0 0 524.8 0"/>
    </g>`
  },
  {
    id: 'recycling',
    label: 'Recyclage',
    category: 'ecologie',
    // foldboks: 132.3×128.2 viewBox → scale=88/132.3=0.66516, tx=6, ty=7.375
    paths: `<g transform="translate(6,7.375) scale(0.66516)" fill="currentColor">
      <path d="m69.4 101.9 14.9-26.7v9.7h31.4q8.6-.9 14-7.2c-11.3 23.2-14.6 39.7-38.1 39.7h-7.3v10.8zm-36 15.7C16.8 112.6 9 92 1.3 77.3c3.5 3.2 10.1 7.8 14 7.8h44.1v32.4l-.1.1zM0 68.8 10.7 47 .3 41.3h31.3l15.1 27.4-10.3-6.1-9.8 20.8-11.4-.2A22 22 0 0 1 0 68.8m104.6 14.3L90.8 57.6l28-17 13.5 27.2c.4 6.5-10 15.5-16.6 15.4zM22.8 23.4 37 2c13.9-5 22 6 27 13L50.5 41ZM76.9 35a114 114 0 0 0-11.5-21.3C61.1 7.7 55.9 2.4 52 .1L88 0c6.5.6 9.6 4.4 13 9.5l5.3 9.2 8-5.1-15.1 26.9H66.7z"/>
    </g>`
  },
  {
    id: 'attention',
    label: 'Attention',
    category: 'general',
    paths: `
      <path d="M50 10 L88 82 L12 82 Z" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>
      <line x1="50" y1="34" x2="50" y2="60" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
      <circle cx="50" cy="71" r="4" fill="currentColor"/>
    `
  },
  {
    id: 'weight-limit',
    label: 'Poids max',
    category: 'general',
    paths: `
      <path d="M20 74 L30 30 L70 30 L80 74 Z" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M38 30 C38 18 62 18 62 30" fill="none" stroke="currentColor" stroke-width="4.5"/>
      <line x1="50" y1="42" x2="50" y2="62" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="38" y1="52" x2="62" y2="52" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      <line x1="20" y1="80" x2="80" y2="80" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
    `
  },
]

export function makePictoSVG(picto: Picto, color: string, withFrame: boolean, bgColor = 'none'): string {
  const resolvedPaths = picto.paths.replace(/currentColor/g, color)
  const frame = withFrame
    ? `<rect x="2" y="2" width="96" height="96" rx="5" fill="none" stroke="${color}" stroke-width="2.5"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${bgColor}"/>
  <g>${frame}${resolvedPaths}</g>
</svg>`
}

export function pictoToDataUrl(picto: Picto, color: string, withFrame: boolean, bgColor = 'none'): string {
  const svg = makePictoSVG(picto, color, withFrame, bgColor)
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
