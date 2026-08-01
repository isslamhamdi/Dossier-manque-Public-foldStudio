'use client'

import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import type { SceneConfig } from './scenePresets'
import { getWoodFloorTexture, getMarbleFloorTexture, getConcreteFloorTexture } from './floorTextures'

export function SceneFloor({ cfg, boxH, showGrid, showReflection }: { cfg: SceneConfig; boxH: number; showGrid: boolean; showReflection?: boolean }) {
  const y = -boxH / 2 - 0.001
  const floorMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.floor.color),
      roughness: cfg.floor.roughness,
      metalness: cfg.floor.metalness,
    })
    if (typeof document !== 'undefined') {
      if (cfg.floor.texture === 'wood')     m.map = getWoodFloorTexture()
      if (cfg.floor.texture === 'marble')   m.map = getMarbleFloorTexture()
      if (cfg.floor.texture === 'concrete') m.map = getConcreteFloorTexture()
    }
    return m
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.floor.color, cfg.floor.roughness, cfg.floor.metalness, cfg.floor.texture])
  useEffect(() => () => { floorMat.dispose() }, [floorMat])

  return (
    <>
      {showReflection ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <MeshReflectorMaterial
            color={cfg.floor.color}
            roughness={Math.max(cfg.floor.roughness, 0.1)}
            metalness={cfg.floor.metalness}
            mirror={0.55}
            blur={[400, 100]}
            mixBlur={8}
            mixStrength={0.8}
            depthScale={1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            resolution={512}
          />
        </mesh>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <primitive object={floorMat} attach="material" />
        </mesh>
      )}
      {showGrid && <gridHelper args={[20, 40, '#c8c4be', '#d8d4ce']} position={[0, y + 0.002, 0]} />}
    </>
  )
}
