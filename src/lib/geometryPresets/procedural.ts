export function makeConeOBJ(): string {
  const N = 12
  const lines = ['# Cone']
  lines.push('v 0.000 1.500 0.000')
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N
    lines.push(`v ${Math.cos(a).toFixed(3)} -1.000 ${Math.sin(a).toFixed(3)}`)
  }
  lines.push('v 0.000 -1.000 0.000')
  for (let i = 0; i < N; i++) {
    const a = i + 2
    const b = (i + 1) % N + 2
    lines.push(`f 1 ${a} ${b}`)
  }
  for (let i = 0; i < N; i++) {
    const a = i + 2
    const b = (i + 1) % N + 2
    lines.push(`f ${N + 2} ${b} ${a}`)
  }
  return lines.join('\n')
}

export function makeStarOBJ(): string {
  const N = 5
  const outerR = 1.4
  const innerR = 0.55
  const h = 0.3
  const lines = ['# Star']
  for (let i = 0; i < N; i++) {
    const ao = Math.PI / 2 + (2 * Math.PI * i) / N
    const ai = Math.PI / 2 + Math.PI / N + (2 * Math.PI * i) / N
    lines.push(`v ${(outerR * Math.cos(ao)).toFixed(3)} ${h} ${(outerR * Math.sin(ao)).toFixed(3)}`)
    lines.push(`v ${(innerR * Math.cos(ai)).toFixed(3)} ${h} ${(innerR * Math.sin(ai)).toFixed(3)}`)
  }
  for (let i = 0; i < N; i++) {
    const ao = Math.PI / 2 + (2 * Math.PI * i) / N
    const ai = Math.PI / 2 + Math.PI / N + (2 * Math.PI * i) / N
    lines.push(`v ${(outerR * Math.cos(ao)).toFixed(3)} ${-h} ${(outerR * Math.sin(ao)).toFixed(3)}`)
    lines.push(`v ${(innerR * Math.cos(ai)).toFixed(3)} ${-h} ${(innerR * Math.sin(ai)).toFixed(3)}`)
  }
  lines.push(`v 0.000 ${h} 0.000`)
  lines.push(`v 0.000 ${-h} 0.000`)
  const M = N * 2
  for (let i = 0; i < M; i++) {
    lines.push(`f ${M * 2 + 1} ${i + 1} ${(i + 1) % M + 1}`)
  }
  for (let i = 0; i < M; i++) {
    lines.push(`f ${M * 2 + 2} ${M + (i + 1) % M + 1} ${M + i + 1}`)
  }
  for (let i = 0; i < M; i++) {
    const t1 = i + 1
    const t2 = (i + 1) % M + 1
    const b1 = M + i + 1
    const b2 = M + (i + 1) % M + 1
    lines.push(`f ${t1} ${b1} ${b2} ${t2}`)
  }
  return lines.join('\n')
}

export function makeGearOBJ(): string {
  const teeth = 8
  const N = teeth * 4
  const outerR = 1.2
  const innerR = 0.82
  const h = 0.3
  const lines = ['# Gear']
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N
    const r = i % 4 < 2 ? outerR : innerR
    lines.push(`v ${(r * Math.cos(a)).toFixed(3)} ${h} ${(r * Math.sin(a)).toFixed(3)}`)
  }
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N
    const r = i % 4 < 2 ? outerR : innerR
    lines.push(`v ${(r * Math.cos(a)).toFixed(3)} ${-h} ${(r * Math.sin(a)).toFixed(3)}`)
  }
  lines.push(`v 0.000 ${h} 0.000`)
  lines.push(`v 0.000 ${-h} 0.000`)
  for (let i = 0; i < N; i++) {
    lines.push(`f ${2 * N + 1} ${i + 1} ${(i + 1) % N + 1}`)
  }
  for (let i = 0; i < N; i++) {
    lines.push(`f ${2 * N + 2} ${N + (i + 1) % N + 1} ${N + i + 1}`)
  }
  for (let i = 0; i < N; i++) {
    const t1 = i + 1
    const t2 = (i + 1) % N + 1
    const b1 = N + i + 1
    const b2 = N + (i + 1) % N + 1
    lines.push(`f ${t1} ${b1} ${b2} ${t2}`)
  }
  return lines.join('\n')
}

export function makeDodecaOBJ(): string {
  const phi = (1 + Math.sqrt(5)) / 2
  const a = 1 / phi
  const b = phi
  const verts: number[][] = [
    [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
    [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1],
    [0, a, b], [0, -a, b], [0, a, -b], [0, -a, -b],
    [a, b, 0], [-a, b, 0], [a, -b, 0], [-a, -b, 0],
    [b, 0, a], [-b, 0, a], [b, 0, -a], [-b, 0, -a],
  ]
  const lines = ['# Dodeca']
  for (const v of verts) {
    lines.push(`v ${v[0].toFixed(3)} ${v[1].toFixed(3)} ${v[2].toFixed(3)}`)
  }
  lines.push('f 1 9 2')
  lines.push('f 1 13 9')
  lines.push('f 1 17 13')
  lines.push('f 1 3 17')
  lines.push('f 1 10 3')
  lines.push('f 9 14 2')
  lines.push('f 9 13 14')
  lines.push('f 13 5 17')
  lines.push('f 13 6 5')
  lines.push('f 17 7 3')
  lines.push('f 17 19 7')
  lines.push('f 3 15 10')
  lines.push('f 3 16 15')
  lines.push('f 10 4 9')
  lines.push('f 10 18 4')
  lines.push('f 2 20 14')
  lines.push('f 14 20 6')
  lines.push('f 5 12 6')
  lines.push('f 6 12 11')
  lines.push('f 7 11 19')
  lines.push('f 19 11 20')
  lines.push('f 8 16 4')
  lines.push('f 8 20 16')
  lines.push('f 8 12 20')
  lines.push('f 8 15 12')
  lines.push('f 8 4 15')
  return lines.join('\n')
}

export function makeHexTorusOBJ(): string {
  const N = 6
  const R = 1.2
  const r = 0.4
  const lines = ['# Hexagon Torus']
  const M = N
  for (let i = 0; i < N; i++) {
    const a = (2 * Math.PI * i) / N
    const ca = Math.cos(a), sa = Math.sin(a)
    for (let j = 0; j < M; j++) {
      const b = (2 * Math.PI * j) / M
      const x = (R + r * Math.cos(b)) * ca
      const y = r * Math.sin(b)
      const z = (R + r * Math.cos(b)) * sa
      lines.push(`v ${x.toFixed(3)} ${y.toFixed(3)} ${z.toFixed(3)}`)
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < M; j++) {
      const a = i * M + j + 1
      const b = i * M + (j + 1) % M + 1
      const c = ((i + 1) % N) * M + (j + 1) % M + 1
      const d = ((i + 1) % N) * M + j + 1
      lines.push(`f ${a} ${b} ${c} ${d}`)
    }
  }
  return lines.join('\n')
}
