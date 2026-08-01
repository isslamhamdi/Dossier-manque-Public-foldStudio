'use client'

import { useState, useEffect } from 'react'
import * as THREE from 'three'

export function useRenderCapture(
  gl: THREE.WebGLRenderer,
  threeScene: THREE.Scene,
  camera: THREE.Camera,
) {
  const [renderBg, setRenderBg] = useState<string | null>(null)

  useEffect(() => {
    const onSet = (e: Event) => setRenderBg((e as CustomEvent).detail?.bg ?? null)
    const onRestore = () => setRenderBg(null)

    const onCapture = (e: Event) => {
      const withMask = (e as CustomEvent).detail?.withMask ?? false
      const origBg = threeScene.background
      const origMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()

      if (!withMask) {
        threeScene.background = new THREE.Color(0xf0ede9)
        gl.render(threeScene, camera)
        const productImage = gl.domElement.toDataURL('image/png')
        threeScene.background = origBg
        gl.render(threeScene, camera)
        window.dispatchEvent(new CustomEvent('fold-studio:render-result', { detail: productImage }))
        return
      }

      threeScene.background = new THREE.Color(0x000000)
      gl.render(threeScene, camera)
      const productImage = gl.domElement.toDataURL('image/png')

      const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          origMaterials.set(obj, obj.material)
          obj.material = whiteMat
        }
      })
      gl.render(threeScene, camera)
      const maskImage = gl.domElement.toDataURL('image/png')

      threeScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && origMaterials.has(obj)) {
          obj.material = origMaterials.get(obj)!
        }
      })
      whiteMat.dispose()
      threeScene.background = origBg
      gl.render(threeScene, camera)

      window.dispatchEvent(new CustomEvent('fold-studio:render-result', {
        detail: { productImage, maskImage },
      }))
    }

    window.addEventListener('fold-studio:render-set', onSet)
    window.addEventListener('fold-studio:render-restore', onRestore)
    window.addEventListener('fold-studio:render-capture', onCapture)
    return () => {
      window.removeEventListener('fold-studio:render-set', onSet)
      window.removeEventListener('fold-studio:render-restore', onRestore)
      window.removeEventListener('fold-studio:render-capture', onCapture)
    }
  }, [gl, threeScene, camera])

  return renderBg
}
