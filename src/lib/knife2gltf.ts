'use client'

// knife2gltf — uses Pacdora's WASM (extracted from their bundle) to convert dieline JSON → GLTF
// The WASM binary is served from /public/knife2gltf.wasm
// The JS wrapper is loaded via /knife2gltf-module.js and exposes window.knife2gltfGenerate

let scriptLoaded: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptLoaded) return scriptLoaded
  scriptLoaded = new Promise((resolve, reject) => {
    if ((window as any).knife2gltfGenerate) { resolve(); return }
    const s = document.createElement('script')
    s.src = '/knife2gltf-module.js'
    s.onload  = () => resolve()
    s.onerror = (e) => reject(new Error(`Failed to load knife2gltf: ${e}`))
    document.head.appendChild(s)
  })
  return scriptLoaded
}

// BOX_MODELS maps our template types to Pacdora model IDs
export const BOX_MODELS: Record<string, number> = {
  'box':          5066,   // Standard shipping box (RSC/0201)
  'mailer':       5164,   // Mailer box
  'display':      5078,   // Open display box
  'reverse-tuck': 5095,   // Reverse tuck end
}

export interface KnifeGltfOptions {
  width: number    // mm
  height: number   // mm
  depth: number    // mm
  modelId?: number
  scienceId?: number
}

export async function generateGLTF(knifeJson: object): Promise<string> {
  await loadScript()
  const gen = (window as any).knife2gltfGenerate
  if (!gen) throw new Error('knife2gltfGenerate not available after script load')
  return gen(knifeJson)
}

export async function buildBoxGLTF(opts: KnifeGltfOptions): Promise<string> {
  const { width, height, depth, modelId = 5066, scienceId = 3 } = opts
  const params = new URLSearchParams({
    id:        String(modelId),
    length:    String(Math.round(width)),
    width:     String(Math.round(depth)),
    height:    String(Math.round(height)),
    scienceId: String(scienceId),
  })
  const res = await fetch(`/api/knife?${params}`)
  if (!res.ok) throw new Error(`knife API ${res.status}`)
  const data = await res.json()
  if (data.code !== 200 && data.code !== undefined) throw new Error(`knife API: ${data.msg ?? data.code}`)
  const knifeData = data.data ?? data
  return generateGLTF(knifeData)
}
