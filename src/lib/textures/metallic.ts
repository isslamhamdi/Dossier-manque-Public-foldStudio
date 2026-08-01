import { rng, tiled } from './helpers'

export function metallicCanvas(seed: number, isRoughness: boolean, size = 1024): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const base = isRoughness ? 140 : 176
  ctx.fillStyle = `rgb(${base},${base},${base+6})`; ctx.fillRect(0,0,size,size)
  for (let i = 0; i < 30; i++) {
    const x = n()*size, y = n()*size, r = 80+n()*250
    const d = Math.round((n()-.5)*(isRoughness?30:14))
    const al = isRoughness?.08+n()*.1:.04+n()*.06
    const g = ctx.createRadialGradient(x,y,0,x,y,r)
    g.addColorStop(0,`rgba(${base+d},${base+d},${base+d+4},${al})`); g.addColorStop(1,`rgba(${base},${base},${base},0)`)
    ctx.fillStyle=g; ctx.fillRect(0,0,size,size)
  }
  for (let i = 0; i < 600; i++) {
    const y = n()*size, ang = n()*Math.PI*2
    const len = 6+n()*35, dk = isRoughness?18+n()*30:7+n()*16
    const al = isRoughness?.1+n()*.15:.04+n()*.08, lw = .3+n()*.9
    tiled(ctx, size, () => { ctx.strokeStyle=`rgba(${Math.max(0,base-dk)},${Math.max(0,base-dk)},${Math.max(0,base-dk)},${al})`; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(len*Math.cos(ang),y+len*Math.sin(ang)*.3); ctx.stroke() })
  }
  for (let i = 0; i < 1200; i++) {
    const y = n()*size, len = 4+n()*20, lt = isRoughness?14+n()*25:5+n()*12
    const al = isRoughness?.08+n()*.12:.03+n()*.06, lw = .2+n()*.6
    tiled(ctx, size, () => { ctx.strokeStyle=`rgba(${Math.min(255,base+lt)},${Math.min(255,base+lt)},${Math.min(255,base+lt+2)},${al})`; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(len,y+(n()-.5)*.5); ctx.stroke() })
  }
  for (let i = 0; i < 800; i++) {
    const x = n()*size, y = n()*size, r = .3+n()*1.2
    const dk = isRoughness?20+n()*35:8+n()*15, al = isRoughness?.06+n()*.1:.03+n()*.05
    tiled(ctx, size, () => { ctx.fillStyle=`rgba(${Math.max(0,base-dk)},${Math.max(0,base-dk)},${Math.max(0,base-dk)},${al})`; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill() })
  }
  return cv
}

export function aluminumCanvas(seed: number, isRoughness: boolean, size = 1024): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const base = isRoughness ? 150 : 210
  ctx.fillStyle = `rgb(${base},${base},${base+4})`; ctx.fillRect(0,0,size,size)
  for (let i = 0; i < 4000; i++) {
    const y = n()*size, len = 80+n()*(size*.9), ang = (n()-.5)*1.5
    const dk = isRoughness?(n()>.4 ? 18+n()*35:15+n()*30):(n()>.4 ? 8+n()*18:6+n()*14)
    const al = isRoughness?(n()>.4?.15+n()*.3:.1+n()*.22):(n()>.4?.06+n()*.14:.04+n()*.1)
    const lw = .25+n()*.8
    const lighter = n() > 0.4
    tiled(ctx, size, () => {
      const c = lighter ? Math.min(255,base+dk) : Math.max(0,base-dk)
      ctx.strokeStyle=`rgba(${c},${c},${c},${al})`; ctx.lineWidth=lw
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(len,y+ang); ctx.stroke()
    })
  }
  return cv
}
