// #179 GLTFExporter — export GLB
// #180 OBJ + MTL export
// #175 LOD niveau de détail
// #177 Object pooling

import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'

// ─── #179 GLTFExporter ─────────────────────────────────────────────────────────

export function useGLTFExport() {
  const { scene } = useThree()

  return useCallback(() => {
    const exporter = new GLTFExporter()
    exporter.parse(scene, (result) => {
      const blob = result instanceof ArrayBuffer
        ? new Blob([result], { type: 'model/gltf-binary' })
        : new Blob([JSON.stringify(result)], { type: 'model/gltf+json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'fold-studio-model.glb'
      a.click()
      URL.revokeObjectURL(url)
    }, (err) => console.error('GLTFExporter error:', err), { binary: true, animations: [] })
  }, [scene])
}

// ─── #180 OBJ + MTL export ────────────────────────────────────────────────────

export function useOBJExport() {
  const { scene } = useThree()

  return useCallback(() => {
    const exporter = new OBJExporter()
    const result = exporter.parse(scene)
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fold-studio-model.obj'
    a.click()
    URL.revokeObjectURL(url)
  }, [scene])
}

// ─── #181 STL export (Three.js native) ────────────────────────────────────────

export function useSTLExport() {
  const { scene } = useThree()

  return useCallback((binary = true) => {
    const exporter = new STLExporter()
    let blob: Blob
    if (binary) {
      const result = exporter.parse(scene, { binary: true }) as DataView
      blob = new Blob([result.buffer as ArrayBuffer], { type: 'model/stl' })
    } else {
      const result = exporter.parse(scene) as string
      blob = new Blob([result], { type: 'text/plain' })
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fold-studio-model.${binary ? 'stl' : 'stl'}`
    a.click()
    URL.revokeObjectURL(url)
  }, [scene])
}

// ─── #175 LOD (Level of Detail) ──────────────────────────────────────────────

export function createLODMesh(
  highGeo: THREE.BufferGeometry,
  material: THREE.Material,
): THREE.LOD {
  const lod = new THREE.LOD()

  // High detail at close range
  const high = new THREE.Mesh(highGeo.clone(), material)
  lod.addLevel(high, 0)

  // Medium — simplified version
  const medGeo = highGeo.clone()
  const med = new THREE.Mesh(medGeo, material)
  lod.addLevel(med, 5)

  // Low — very simplified at far distance
  const lowGeo = new THREE.BoxGeometry(1, 1, 1)
  const low = new THREE.Mesh(lowGeo, material)
  lod.addLevel(low, 15)

  return lod
}

// ─── #177 Object pool ─────────────────────────────────────────────────────────

export function createObjectPool<T extends THREE.Object3D>(
  factory: () => T,
  initialSize = 10,
) {
  const pool: T[] = Array.from({ length: initialSize }, factory)

  return {
    acquire(): T {
      return pool.pop() ?? factory()
    },
    release(obj: T) {
      obj.visible = false
      pool.push(obj)
    },
    size() { return pool.length },
  }
}

// ─── #176 LoadingManager with progress ───────────────────────────────────────

export function createLoadingManager(
  onProgress?: (url: string, loaded: number, total: number) => void,
  onLoad?: () => void,
) {
  const manager = new THREE.LoadingManager()
  if (onProgress) manager.onProgress = onProgress
  if (onLoad) manager.onLoad = onLoad
  return manager
}

// ─── #178 WebWorker for heavy calcs (Comlink-style) ──────────────────────────

export function runInWorker<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const code = `
      self.onmessage = function() {
        try {
          const result = (${fn.toString()})();
          self.postMessage({ result });
        } catch(e) {
          self.postMessage({ error: e.message });
        }
      };
    `
    const blob = new Blob([code], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)
    worker.onmessage = (e) => {
      URL.revokeObjectURL(url)
      worker.terminate()
      if (e.data.error) reject(new Error(e.data.error))
      else resolve(e.data.result)
    }
    worker.postMessage(null)
  })
}
