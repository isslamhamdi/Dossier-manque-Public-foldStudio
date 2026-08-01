import { rng } from './helpers'

export function marbleCanvas(seed: number, isRoughness: boolean, size = 1024): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const perm = Array(512)
  for (let i = 0; i < 256; i++) perm[i] = i
  for (let i = 255; i > 0; i--) { const j = Math.floor(n()*(i+1)); [perm[i],perm[j]]=[perm[j],perm[i]] }
  for (let i = 0; i < 256; i++) perm[i+256] = perm[i]
  const fade = (t: number) => t*t*t*(t*(t*6-15)+10)
  const lerp2 = (a: number, b: number, t: number) => a+t*(b-a)
  const grad2d = (h: number, x: number, y: number) => { switch(h&3){case 0:return x+y;case 1:return-x+y;case 2:return x-y;default:return-x-y} }
  const noise2d = (x: number, y: number) => {
    const xi=Math.floor(x)&255, yi=Math.floor(y)&255
    const xf=x-Math.floor(x), yf=y-Math.floor(y)
    const u=fade(xf), v=fade(yf)
    const a=perm[xi]+yi, b=perm[xi+1]+yi
    return lerp2(lerp2(grad2d(perm[a],xf,yf),grad2d(perm[b],xf-1,yf),u),lerp2(grad2d(perm[a+1],xf,yf-1),grad2d(perm[b+1],xf-1,yf-1),u),v)
  }
  const fbm = (x: number, y: number, oct: number) => {
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
  return cv
}

export function leatherCanvas(seed: number, isRoughness: boolean, size = 2048): HTMLCanvasElement {
  const n = rng(seed)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const BASE_R = isRoughness ? 128 : 88, BASE_G = isRoughness ? 128 : 56, BASE_B = isRoughness ? 128 : 28
  const numPts = 2500
  const px: number[] = [], py: number[] = []
  for (let i = 0; i < numPts; i++) { px.push(n()*size); py.push(n()*size) }
  const cells = Math.ceil(size/48), cellSz = Math.ceil(size/cells)
  const grid: number[][] = Array(cells*cells).fill(null).map(()=>[])
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
  return cv
}
