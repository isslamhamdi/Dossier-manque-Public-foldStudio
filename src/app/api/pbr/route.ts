import { NextRequest, NextResponse } from 'next/server'

const BACKEND = 'http://127.0.0.1:8001'

export async function POST(req: NextRequest) {
  const { imageBase64, prompt = '' } = await req.json()
  if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })

  try {
    const res = await fetch(`${BACKEND}/generate-pbr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64, prompt }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erreur inconnue' }))
      return NextResponse.json({ error: err.detail }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({
      albedo:    `data:image/png;base64,${data.albedo_base64}`,
      normal:    `data:image/png;base64,${data.normal_base64}`,
      roughness: `data:image/png;base64,${data.roughness_base64}`,
      metallic:  `data:image/png;base64,${data.metallic_base64}`,
      durationS: data.duration_s,
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
