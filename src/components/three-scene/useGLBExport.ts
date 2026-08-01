'use client'

import { useEffect } from 'react'
import * as THREE from 'three'

export function useGLBExport(threeScene: THREE.Scene) {
  useEffect(() => {
    const buildExportGroup = () => {
      const exportGroup = new THREE.Group()
      const isValidTex = (tex: THREE.Texture | null | undefined) => {
        if (!tex?.image) return true
        // Accept canvas, image, and ImageBitmap; reject VideoTexture etc.
        return (
          tex.image instanceof HTMLImageElement ||
          tex.image instanceof HTMLCanvasElement ||
          tex.image instanceof ImageBitmap
        )
      }
      const isValidMat = (mat: THREE.Material) => {
        // ShaderMaterial (holographic) can't be serialized by GLTFExporter
        if (mat instanceof THREE.ShaderMaterial) return false
        const m = mat as THREE.MeshStandardMaterial
        return [m.map, m.normalMap, m.roughnessMap, m.metalnessMap].every(isValidTex)
      }
      threeScene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return
        // Skip hover-highlight planes (PlaneGeometry used for face overlays)
        if (obj.geometry.type === 'PlaneGeometry') return
        // Skip invisible meshes
        if (!obj.visible) return
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        if (!mats.every(isValidMat)) return
        const worldPos = new THREE.Vector3()
        const worldQuat = new THREE.Quaternion()
        const worldScale = new THREE.Vector3()
        obj.matrixWorld.decompose(worldPos, worldQuat, worldScale)
        const clone = new THREE.Mesh(obj.geometry, obj.material)
        clone.position.copy(worldPos)
        clone.quaternion.copy(worldQuat)
        clone.scale.copy(worldScale)
        exportGroup.add(clone)
      })
      return exportGroup
    }

    const handler = async () => {
      try {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
        const exporter = new GLTFExporter()
        exporter.parse(
          buildExportGroup(),
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url
            a.download = `fold-studio-${Date.now()}.glb`; a.click()
            URL.revokeObjectURL(url)
          },
          (err) => console.error('GLB export error:', err),
          { binary: true }
        )
      } catch (err) { console.error('GLTFExporter import failed:', err) }
    }

    // #41: AR preview — export GLB as object URL instead of download
    const handlerForAR = async () => {
      try {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
        const exporter = new GLTFExporter()
        exporter.parse(
          buildExportGroup(),
          (gltf) => {
            const blob = new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' })
            const url = URL.createObjectURL(blob)
            window.dispatchEvent(new CustomEvent('fold-studio:glb-ready', { detail: { url } }))
          },
          (err) => console.error('GLB AR export error:', err),
          { binary: true }
        )
      } catch (err) { console.error('GLTFExporter import failed:', err) }
    }

    window.addEventListener('fold-studio:export-glb', handler)
    window.addEventListener('fold-studio:export-glb-for-ar', handlerForAR)
    return () => {
      window.removeEventListener('fold-studio:export-glb', handler)
      window.removeEventListener('fold-studio:export-glb-for-ar', handlerForAR)
    }
  }, [threeScene])
}
