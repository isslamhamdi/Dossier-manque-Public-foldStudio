import { rng, tiled } from './helpers'

export function kraftCanvas(r0: number, g0: number, b0: number, seed: number, isRoughness: boolean, size = 1024): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = `rgb(${r0},${g0},${b0})`; ctx.fillRect(0,0,size,size)
  for (let i = 0; i < 40; i++) {
    const x = n()*size, y = n()*size, radius = 60+n()*200
    const u = isRoughness?35:18
    const dR = Math.round((n()-.5)*u), dG = Math.round((n()-.5)*u), dB = Math.round((n()-.5)*u)
    const al = isRoughness?.08+n()*.12:.06+n()*.1
    const g = ctx.createRadialGradient(x,y,0,x,y,radius)
    g.addColorStop(0,`rgba(${r0+dR},${g0+dG},${b0+dB},${al})`); g.addColorStop(1,`rgba(${r0},${g0},${b0},0)`)
    ctx.fillStyle=g; ctx.fillRect(0,0,size,size)
  }
  for (let i = 0; i < 1400; i++) {
    const x = n()*size, y = n()*size, ang = n()*Math.PI*2
    const len = 10+n()*40, dk = 30+n()*50
    const x2 = x+Math.cos(ang)*len, y2 = y+Math.sin(ang)*len
    const al = .15+n()*.25, lw = .6+n()*1.8
    tiled(ctx, size, () => { ctx.strokeStyle=`rgba(${Math.max(0,r0-dk)},${Math.max(0,g0-dk)},${Math.max(0,b0-dk)},${al})`; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke() })
  }
  for (let i = 0; i < 600; i++) {
    const x = n()*size, y = n()*size, ang = n()*Math.PI*2
    const len = 8+n()*30, lt = 25+n()*40
    const x2 = x+Math.cos(ang)*len, y2 = y+Math.sin(ang)*len
    const al = .12+n()*.18, lw = .5+n()*1.4
    tiled(ctx, size, () => { ctx.strokeStyle=`rgba(${Math.min(255,r0+lt)},${Math.min(255,g0+lt)},${Math.min(255,b0+lt)},${al})`; ctx.lineWidth=lw; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x2,y2); ctx.stroke() })
  }
  for (let i = 0; i < 2500; i++) {
    const x = n()*size, y = n()*size, r = .5+n()*2
    const al = .15+n()*.25
    tiled(ctx, size, () => { ctx.fillStyle=`rgba(${Math.max(0,r0-60)},${Math.max(0,g0-65)},${Math.max(0,b0-55)},${al})`; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill() })
  }
  for (let i = 0; i < 800; i++) {
    const x = n()*size, y = n()*size, r = .4+n()*1.5
    const al = .12+n()*.18
    tiled(ctx, size, () => { ctx.fillStyle=`rgba(${Math.min(255,r0+50)},${Math.min(255,g0+45)},${Math.min(255,b0+40)},${al})`; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill() })
  }
  const id = ctx.getImageData(0,0,size,size)
  const px = id.data
  for (let i = 0; i < px.length; i += 4) {
    const noise = (n()-.5) * (isRoughness?24:12)
    px[i]   = Math.min(255,Math.max(0,px[i]+noise))
    px[i+1] = Math.min(255,Math.max(0,px[i+1]+noise))
    px[i+2] = Math.min(255,Math.max(0,px[i+2]+noise))
  }
  ctx.putImageData(id, 0, 0)
  return cv
}
