import { NextRequest, NextResponse } from 'next/server'

// Proxy Pacdora's knife API to fetch dieline data for any box dimensions
// This is used by the knife2gltf WASM to generate accurate 3D geometry
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id     = searchParams.get('id')     || '5066'
  const length = searchParams.get('length') || '300'
  const width  = searchParams.get('width')  || '300'
  const height = searchParams.get('height') || '300'
  const scienceId = searchParams.get('scienceId') || '3'

  try {
    const url = `https://www.pacdora.com/api/v2/project/knife?id=${id}&bleed=5&export_type=model&science_id=${scienceId}&length=${length}&width=${width}&height=${height}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.pacdora.com/',
        'Origin': 'https://www.pacdora.com',
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return NextResponse.json({ error: 'upstream error', status: res.status }, { status: 502 })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
