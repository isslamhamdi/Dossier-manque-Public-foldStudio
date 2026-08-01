'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ImageLayer, BoxParams, TemplateType } from '../../lib/types'
import { Panel } from './Panel'
import type { PBRTexSet } from './materials'
import { useFaceTextures } from './textureUtils'
import type { FaceName } from './textureUtils'
import { seqT } from './animationUtils'

interface BoxFacesProps {
  w: number; h: number; d: number
  foldProgress: number
  extPreset?: string; extColor?: string
  intPreset?: string; intColor?: string
  imageLayers?: ImageLayer[]
  hoveredFace?: string | null
  onHoverFace?: (face: string | null) => void
  params?: BoxParams
  activeTemplate?: TemplateType
  pbrTextures?: Partial<Record<FaceName, PBRTexSet>>
  fluteType?: string
}

export function BoxFaces({
  w, h, d, foldProgress,
  extPreset = 'brillant', extColor = '#ffffff',
  intPreset = 'carton',  intColor  = '#e8e4dc',
  imageLayers, hoveredFace, onHoverFace, params, activeTemplate, pbrTextures, fluteType,
}: BoxFacesProps) {
  const halfW = w / 2, halfH = h / 2, halfD = d / 2

  const bottomFold = useRef<THREE.Group>(null)
  const topFold    = useRef<THREE.Group>(null)
  const leftFold   = useRef<THREE.Group>(null)
  const rightFold  = useRef<THREE.Group>(null)
  const backFold   = useRef<THREE.Group>(null)

  const sm = useRef({ bt: 0, t: 0, l: 0, r: 0, bk: 0 })

  useFrame(() => {
    const s = sm.current
    s.bt = seqT(foldProgress, 0.00, 0.18)
    s.t  = seqT(foldProgress, 0.05, 0.25)
    s.l  = seqT(foldProgress, 0.20, 0.55)
    s.r  = seqT(foldProgress, 0.20, 0.55)
    s.bk = seqT(foldProgress, 0.50, 0.85)

    const PI2 = Math.PI / 2
    if (bottomFold.current) bottomFold.current.rotation.x =  s.bt * PI2
    if (topFold.current)    topFold.current.rotation.x    = -s.t  * PI2
    if (leftFold.current)   leftFold.current.rotation.y   = -s.l  * PI2
    if (rightFold.current)  rightFold.current.rotation.y  =  s.r  * PI2
    if (backFold.current)   backFold.current.rotation.y   = s.bk * PI2
  })

  const faceTextures = useFaceTextures(imageLayers, params, activeTemplate, extColor)
  const [texFront, texBack, texLeft, texRight, texTop, texBottom] = faceTextures

  const mk = (face: FaceName, fw: number, fh: number, tex: THREE.Texture | null) => (
    <Panel
      fw={fw} fh={fh}
      extPreset={extPreset} extColor={extColor}
      intPreset={intPreset} intColor={intColor}
      imageTex={tex}
      pbrTex={pbrTextures?.[face]}
      hovered={hoveredFace === face}
      thickness={params?.thickness ?? 1.6}
      fluteType={fluteType ?? params?.fluteType}
    />
  )

  const hn = onHoverFace
  return (
    <>
      <group position={[0, 0, halfD]}
        onPointerEnter={() => hn?.('front')} onPointerLeave={() => hn?.(null)}>
        {mk('front', w, h, texFront)}
      </group>

      <group position={[0, -halfH, halfD]}>
        <group ref={bottomFold}>
          <group position={[0, -halfD, 0]}
            onPointerEnter={() => hn?.('bottom')} onPointerLeave={() => hn?.(null)}>
            {mk('bottom', w, d, texBottom)}
          </group>
        </group>
      </group>

      <group position={[0, halfH, halfD]}>
        <group ref={topFold}>
          <group position={[0, halfD, 0]}
            onPointerEnter={() => hn?.('top')} onPointerLeave={() => hn?.(null)}>
            {mk('top', w, d, texTop)}
          </group>
        </group>
      </group>

      <group position={[-halfW, 0, halfD]}>
        <group ref={leftFold}>
          <group position={[-halfD, 0, 0]}
            onPointerEnter={() => hn?.('left')} onPointerLeave={() => hn?.(null)}>
            {mk('left', d, h, texLeft)}
          </group>
        </group>
      </group>

      <group position={[halfW, 0, halfD]}>
        <group ref={rightFold}>
          <group position={[halfD, 0, 0]}
            onPointerEnter={() => hn?.('right')} onPointerLeave={() => hn?.(null)}>
            {mk('right', d, h, texRight)}
          </group>

          <group position={[d, 0, 0]}>
            <group ref={backFold}>
              <group position={[halfW, 0, 0]}
                onPointerEnter={() => hn?.('back')} onPointerLeave={() => hn?.(null)}>
                {mk('back', w, h, texBack)}
              </group>
            </group>
          </group>
        </group>
      </group>
    </>
  )
}
