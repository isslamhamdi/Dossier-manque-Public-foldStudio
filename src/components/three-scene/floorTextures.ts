import * as THREE from 'three'

let _woodTex: THREE.CanvasTexture | null = null
export function getWoodFloorTexture(): THREE.CanvasTexture {
  if (_woodTex) return _woodTex
  const size = 512
  const cv = document.createElement('canvas')
  cv.width = size; cv.height = size
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#7a5c3a'; ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * size
    const w = Math.random() * 5 + 0.5
    const alpha = Math.random() * 0.22 + 0.02
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '20,8,0' : '190,145,85'},${alpha})`
    ctx.fillRect(x, 0, w, size)
  }
  _woodTex = new THREE.CanvasTexture(cv)
  _woodTex.wrapS = _woodTex.wrapT = THREE.RepeatWrapping
  _woodTex.repeat.set(6, 6)
  return _woodTex
}

let _marbleTex: THREE.CanvasTexture | null = null
export function getMarbleFloorTexture(): THREE.CanvasTexture {
  if (_marbleTex) return _marbleTex
  const size = 512
  const cv = document.createElement('canvas')
  cv.width = size; cv.height = size
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#ece8e4'; ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 14; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * size, 0)
    ctx.bezierCurveTo(Math.random() * size, size * 0.33, Math.random() * size, size * 0.67, Math.random() * size, size)
    ctx.strokeStyle = `rgba(140,128,122,${Math.random() * 0.28 + 0.04})`
    ctx.lineWidth = Math.random() * 2.5 + 0.5
    ctx.stroke()
  }
  _marbleTex = new THREE.CanvasTexture(cv)
  _marbleTex.wrapS = _marbleTex.wrapT = THREE.RepeatWrapping
  _marbleTex.repeat.set(3, 3)
  return _marbleTex
}

let _concreteTex: THREE.CanvasTexture | null = null
export function getConcreteFloorTexture(): THREE.CanvasTexture {
  if (_concreteTex) return _concreteTex
  const size = 512
  const cv = document.createElement('canvas')
  cv.width = size; cv.height = size
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = '#9a9690'; ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size, y = Math.random() * size
    const r = Math.random() * 1.8
    const alpha = Math.random() * 0.12
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '50,45,40' : '200,196,192'},${alpha})`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  for (let i = 0; i < 18; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * size, Math.random() * size)
    ctx.lineTo(Math.random() * size, Math.random() * size)
    ctx.strokeStyle = `rgba(70,65,60,${Math.random() * 0.1})`
    ctx.lineWidth = Math.random() * 1.2; ctx.stroke()
  }
  _concreteTex = new THREE.CanvasTexture(cv)
  _concreteTex.wrapS = _concreteTex.wrapT = THREE.RepeatWrapping
  _concreteTex.repeat.set(4, 4)
  return _concreteTex
}
