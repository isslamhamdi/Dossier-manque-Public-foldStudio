// @ts-nocheck
/* eslint-disable */

function rng(seed) {
  let t = seed
  return () => { t = (t * 16807) % 2147483647; return (t - 1) / 2147483646 }
}

function tiled(ctx, size, fn) {
  for (let r = -1; r <= 1; r++) for (let i = -1; i <= 1; i++) {
    ctx.save(); ctx.translate(r * size, i * size); fn(); ctx.restore()
  }
}

function cardboardCanvas(seed, isRoughness, size = 1024) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')

  if (isRoughness) {
    const R = 165, G = 158, B = 148
    ctx.fillStyle = `rgb(${R},${G},${B})`; ctx.fillRect(0, 0, size, size)
    const wl = 185 + n() * 25
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / wl * Math.PI * 2)
      const v = Math.round(R + wave * 55)
      ctx.fillStyle = `rgba(${v},${v},${v},0.75)`; ctx.fillRect(0, y, size, 1)
    }
    for (let i = 0; i < 1500; i++) {
      const px = n()*size, py = n()*size, len = 20+n()*90
      const dk = 25+n()*55, al = 0.25+n()*0.45
      ctx.strokeStyle = `rgba(${Math.max(0,R-dk)},${Math.max(0,G-dk)},${Math.max(0,B-dk)},${al})`
      ctx.lineWidth = 0.4+n()*1.2
      ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+len, py+(n()-0.5)*4); ctx.stroke()
    }
  } else {
    const R = 186, G = 150, B = 100
    ctx.fillStyle = `rgb(${R},${G},${B})`; ctx.fillRect(0, 0, size, size)
    const wl = 185 + n() * 25
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / wl * Math.PI * 2)
      const dR = Math.round(wave * 28), dG = Math.round(wave * 20), dB = Math.round(wave * 12)
      ctx.fillStyle = `rgba(${Math.max(0,R+dR)},${Math.max(0,G+dG)},${Math.max(0,B+dB)},0.85)`
      ctx.fillRect(0, y, size, 1)
    }
    const wl2 = 48 + n() * 14
    for (let y = 0; y < size; y++) {
      const wave2 = Math.sin(y / wl2 * Math.PI * 2)
      const v = Math.round(wave2 * 7)
      ctx.fillStyle = `rgba(${R+v},${G+v},${B+v},0.22)`; ctx.fillRect(0, y, size, 1)
    }
    for (let i = 0; i < 2800; i++) {
      const px = n()*size, py = n()*size, len = 60+n()*250
      const dk = 18+n()*42, al = 0.18+n()*0.40, lw = 0.3+n()*0.85
      tiled(ctx, size, () => {
        ctx.strokeStyle = `rgba(${Math.max(0,R-dk)},${Math.max(0,G-dk-4)},${Math.max(0,B-dk-8)},${al})`
        ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+len, py+(n()-0.5)*3); ctx.stroke()
      })
    }
    for (let i = 0; i < 1000; i++) {
      const px = n()*size, py = n()*size, len = 30+n()*120
      const lt = 18+n()*30, al = 0.10+n()*0.22
      ctx.strokeStyle = `rgba(${Math.min(255,R+lt)},${Math.min(255,G+lt)},${Math.min(255,B+lt)},${al})`
      ctx.lineWidth = 0.25+n()*0.65; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+len, py+(n()-0.5)*2); ctx.stroke()
    }
    for (let i = 0; i < 500; i++) {
      const px = n()*size, py = n()*size, len = 15+n()*55
      const dk = 22+n()*35, al = 0.06+n()*0.14
      ctx.strokeStyle = `rgba(${Math.max(0,R-dk)},${Math.max(0,G-dk)},${Math.max(0,B-dk)},${al})`
      ctx.lineWidth = 0.3+n()*0.7; ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+(n()-0.5)*3, py+len); ctx.stroke()
    }
    for (let i = 0; i < 35; i++) {
      const x = n()*size, y = n()*size, r = 80+n()*180
      const dR = Math.round((n()-0.5)*22), a = 0.04+n()*0.09
      const g = ctx.createRadialGradient(x,y,0,x,y,r)
      g.addColorStop(0,`rgba(${Math.max(0,R+dR)},${Math.max(0,G+Math.round(dR*0.6))},${Math.max(0,B+Math.round(dR*0.3))},${a})`)
      g.addColorStop(1,`rgba(${R},${G},${B},0)`)
      ctx.fillStyle = g; ctx.fillRect(0,0,size,size)
    }
    for (let y = 0; y < size; y++) {
      const wave = Math.sin(y / (185 + n()*25) * Math.PI * 2)
      if (wave < -0.7) {
        const dk2 = Math.round((-wave-0.7)/0.3*25)
        ctx.fillStyle = `rgba(${Math.max(0,R-dk2-10)},${Math.max(0,G-dk2-8)},${Math.max(0,B-dk2-5)},0.6)`
        ctx.fillRect(0, y, size, 1)
      }
    }
  }
  return cv.transferToImageBitmap()
}

function kraftCanvas(r0, g0, b0, seed, isRoughness, size = 1024) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
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
  return cv.transferToImageBitmap()
}

function metallicCanvas(seed, isRoughness, size = 1024) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
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
  return cv.transferToImageBitmap()
}

function aluminumCanvas(seed, isRoughness, size = 1024) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
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
  return cv.transferToImageBitmap()
}

function marbleCanvas(seed, isRoughness, size = 1024) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
  const perm = Array(512)
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) { const j = Math.floor(n()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]] }
  for (let i = 0; i < 256; i++) perm[i+256] = perm[i]
  const fade = (t) => t*t*t*(t*(t*6-15)+10)
  const lerp2 = (a, b, t) => a+t*(b-a)
  const grad2d = (h, x, y) => { switch(h&3){case 0:return x+y;case 1:return-x+y;case 2:return x-y;default:return-x-y} }
  const noise2d = (x, y) => {
    const xi=Math.floor(x)&255, yi=Math.floor(y)&255
    const xf=x-Math.floor(x), yf=y-Math.floor(y)
    const u=fade(xf), v=fade(yf)
    const a=perm[xi]+yi, b=perm[xi+1]+yi
    return lerp2(lerp2(grad2d(perm[a],xf,yf),grad2d(perm[b],xf-1,yf),u),lerp2(grad2d(perm[a+1],xf,yf-1),grad2d(perm[b+1],xf-1,yf-1),u),v)
  }
  const fbm = (x, y, oct) => {
    let v=0,a=1,f=1,s=0
    for(let i=0;i<oct;i++){v+=a*noise2d(x*f,y*f);s+=a;a*=.5;f*=2}
    return v/s
  }
  const id = ctx.createImageData(size,size)
  const px = id.data
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const nx = x/size*5, ny = y/size*5
    const v = fbm(nx,ny,6)*1.8 + fbm(nx*2.1,ny*2.1,4)*.6 + Math.sin(nx*1.5+ny*2.2+fbm(nx,ny,3)*3)*.5
    const t = Math.min(1,Math.max(0,v*.5+.5 + (n()-.5)*.04))
    let r2,g2,b2
    if (isRoughness) { const g = Math.round(t*255); r2=g2=b2=g }
    else {
      const wl = 240, gl = 232, bl = 226
      const dv = 35
      r2=Math.round(Math.min(255,Math.max(0,wl - t*dv))); g2=Math.round(Math.min(255,Math.max(0,gl - t*dv*1.05))); b2=Math.round(Math.min(255,Math.max(0,bl - t*dv*1.1)))
    }
    const i = (y*size+x)*4; px[i]=r2; px[i+1]=g2; px[i+2]=b2; px[i+3]=255
  }
  ctx.putImageData(id,0,0)
  return cv.transferToImageBitmap()
}

function leatherCanvas(seed, isRoughness, size = 2048) {
  const n = rng(seed)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
  const BASE_R = isRoughness ? 128 : 88, BASE_G = isRoughness ? 128 : 56, BASE_B = isRoughness ? 128 : 28
  const numPts = 2500
  const px = [], py = []
  for (let i = 0; i < numPts; i++) { px.push(n()*size); py.push(n()*size) }
  const cells = Math.ceil(size/48), cellSz = Math.ceil(size/cells)
  const grid = Array(cells*cells).fill(null).map(()=>[])
  for (let i = 0; i < numPts; i++) {
    const cx = Math.min(cells-1, px[i]/cellSz|0), cy = Math.min(cells-1, py[i]/cellSz|0)
    grid[cy*cells+cx].push(i)
  }
  const id = ctx.createImageData(size,size)
  const pxd = id.data
  for (let y = 0; y < size; y++) {
    const cy = Math.min(cells-1, y/cellSz|0)
    for (let x = 0; x < size; x++) {
      const cx = Math.min(cells-1, x/cellSz|0)
      let d1=1e9, d2=1e9
      for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) {
        const ny2 = cy+dy, nx2 = cx+dx
        const gy = (ny2%cells+cells)%cells, gx = (nx2%cells+cells)%cells
        const offY = ny2<0?-size:ny2>=cells?size:0, offX = nx2<0?-size:nx2>=cells?size:0
        for (const idx of grid[gy*cells+gx]) {
          const d = (x-(px[idx]+offX))**2 + (y-(py[idx]+offY))**2
          if (d < d1) { d2=d1; d1=d } else if (d < d2) d2=d
        }
      }
      const t = Math.min(1, Math.sqrt(d2-d1)/(cellSz*0.7))
      const noise2 = (n()-.5)*15
      let r2,g2,b2
      if (isRoughness) { const v=Math.round(BASE_R*(1-t*0.6)+t*200+noise2); r2=g2=b2=Math.min(255,Math.max(0,v)) }
      else {
        r2=Math.min(255,Math.max(0,Math.round(BASE_R*(1-t*.5)+t*130+noise2*.6)))
        g2=Math.min(255,Math.max(0,Math.round(BASE_G*(1-t*.5)+t*70+noise2*.6)))
        b2=Math.min(255,Math.max(0,Math.round(BASE_B*(1-t*.5)+t*40+noise2*.6)))
      }
      const idx2 = (y*size+x)*4; pxd[idx2]=r2; pxd[idx2+1]=g2; pxd[idx2+2]=b2; pxd[idx2+3]=255
    }
  }
  ctx.putImageData(id,0,0)
  return cv.transferToImageBitmap()
}

function holographicBumpCanvas(size = 1024) {
  const n = rng(77)
  const cv = new OffscreenCanvas(size, size)
  const ctx = cv.getContext('2d')
  const id = ctx.createImageData(size,size)
  const px = id.data
  const τ = Math.PI*2
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x/size, v = y/size
    const w = Math.sin(τ*(u*7+v*3))*.3 + Math.cos(τ*(u*5-v*8))*.25 + Math.sin(τ*(u*4+v*6))*.2 + Math.cos(τ*(u*9+v*2))*.15 + Math.sin(τ*(u*3-v*9))*.1
    const g = Math.min(255,Math.max(0,Math.round((w*.5+.5)*255+(n()-.5)*12)))
    const i = (y*size+x)*4; px[i]=g; px[i+1]=g; px[i+2]=g; px[i+3]=255
  }
  ctx.putImageData(id,0,0)
  return cv.transferToImageBitmap()
}

const FN_MAP = {
  cardboardCanvas,
  kraftCanvas,
  metallicCanvas,
  aluminumCanvas,
  marbleCanvas,
  leatherCanvas,
  holographicBumpCanvas,
}

self.onmessage = ({ data }) => {
  const { id, fn, args } = data
  try {
    const bitmap = FN_MAP[fn](...args)
    self.postMessage({ id, bitmap }, [bitmap])
  } catch (e) {
    self.postMessage({ id, error: String(e) })
  }
}
