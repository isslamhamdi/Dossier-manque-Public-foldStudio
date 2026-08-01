import * as THREE from 'three'
import { rng, mkTex } from './helpers'

export function holographicBumpCanvas(size = 1024): HTMLCanvasElement {
  const n = rng(77)
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
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
  return cv
}

export function normalMapFromHeightMap(heightTex: THREE.CanvasTexture, scale = 3): THREE.CanvasTexture {
  const src = heightTex.image as HTMLCanvasElement
  const size = src.width
  const srcCtx = src.getContext('2d', { willReadFrequently: true })!
  const srcData = srcCtx.getImageData(0,0,size,size).data
  const cv = document.createElement('canvas'); cv.width = cv.height = size
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const id = ctx.createImageData(size,size)
  const px = id.data
  const sample = (x: number, y: number) => {
    const nx = Math.max(0,Math.min(size-1,x)), ny = Math.max(0,Math.min(size-1,y))
    return srcData[(ny*size+nx)*4] / 255
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const tl=sample(x-1,y-1), t=sample(x,y-1), tr=sample(x+1,y-1)
    const l=sample(x-1,y),               r=sample(x+1,y)
    const bl=sample(x-1,y+1), b=sample(x,y+1), br=sample(x+1,y+1)
    const dx = -(tr+2*r+br-(tl+2*l+bl)) * scale
    const dy = -(bl+2*b+br-(tl+2*t+tr)) * scale
    const dz = 1
    const len = Math.sqrt(dx*dx+dy*dy+dz*dz)
    const i=(y*size+x)*4
    px[i]  =Math.round((dx/len*.5+.5)*255)
    px[i+1]=Math.round((dy/len*.5+.5)*255)
    px[i+2]=Math.round((dz/len*.5+.5)*255)
    px[i+3]=255
  }
  ctx.putImageData(id,0,0)
  return mkTex(cv)
}
