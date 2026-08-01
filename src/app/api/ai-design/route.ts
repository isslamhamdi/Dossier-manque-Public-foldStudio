import { NextRequest, NextResponse } from 'next/server'

/**
 * AI artwork generation for packaging design.
 * Text description → image → add as ImageLayer on dieline.
 * Tiers: HF Inference (FLUX.1-schnell) → Pollinations (free, no key)
 */

export async function POST(req: NextRequest) {
  const {
    prompt, style = '',
    faceW, faceH, faceName,
  } = await req.json() as {
    prompt: string; style?: string
    faceW?: number; faceH?: number; faceName?: string
  }
  if (!prompt?.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 })

  // ── Compute image dimensions proportional to target face ────────────────
  // Never stretch: clamp to 1024px on the longest side while preserving ratio.
  const MAX_PX = 1024
  let width = MAX_PX, height = MAX_PX
  if (faceW && faceH && faceW > 0 && faceH > 0) {
    const ratio = faceW / faceH
    if (ratio >= 1) { width = MAX_PX; height = Math.round(MAX_PX / ratio) }
    else            { height = MAX_PX; width = Math.round(MAX_PX * ratio) }
    // Round to nearest multiple of 64 (GPU-friendly)
    width  = Math.max(64, Math.round(width  / 64) * 64)
    height = Math.max(64, Math.round(height / 64) * 64)
  }

  // ── Build a packaging-optimized + geometry-aware prompt ─────────────────
  const styleMap: Record<string, string> = {
    minimalist: 'clean minimalist design, lots of white space, simple typography, helvetica',
    luxury:     'luxury premium packaging, gold foil accents, elegant serif typography, dark background',
    bold:       'bold graphic design, strong contrast, vibrant colors, impactful typography',
    vintage:    'vintage retro packaging design, distressed textures, classic typography, warm tones',
    eco:        'eco-friendly natural packaging, kraft paper texture, hand-drawn illustrations, earthy tones',
    playful:    'playful colorful packaging, rounded shapes, fun typography, bright cheerful colors',
  }
  const styleHint = styleMap[style] || style || 'professional product packaging design'

  // Geometry context injected directly into the prompt so the AI knows the format
  const faceCtx = (faceW && faceH && faceName)
    ? `Layout for "${faceName}" panel (${faceW}×${faceH}mm, ${faceW > faceH ? 'landscape' : 'portrait'} format). Keep main graphic centered with safe zone margin. `
    : ''

  const fullPrompt = `${faceCtx}packaging design artwork, flat lay print-ready design, ${styleHint}: ${prompt.trim()}. High resolution, print quality, crisp edges, commercial packaging illustration`

  // ── Tier 1: Hugging Face FLUX.1-schnell (fast, free with token) ──────────
  if (process.env.HF_TOKEN) {
    try {
      const { HfInference } = await import('@huggingface/inference')
      const hf = new HfInference(process.env.HF_TOKEN)
      const result = await hf.textToImage({
        model: 'black-forest-labs/FLUX.1-schnell',
        inputs: fullPrompt,
        parameters: { width, height, num_inference_steps: 4 },
      })
      const blob = new Blob([result as unknown as BlobPart])
      const ab = await blob.arrayBuffer()
      const b64 = Buffer.from(ab).toString('base64')
      const mime = 'image/jpeg'
      return NextResponse.json({ imageUrl: `data:${mime};base64,${b64}`, provider: 'HF · FLUX.1-schnell' })
    } catch (e) {
      console.warn('HF text-to-image:', e instanceof Error ? e.message : String(e))
    }
  }

  // ── Tier 2: Pollinations (always free, no token) ─────────────────────────
  try {
    const encPrompt = encodeURIComponent(fullPrompt)
    const url = `https://image.pollinations.ai/prompt/${encPrompt}?model=flux&width=${width}&height=${height}&nologo=true&seed=${Date.now()}`
    const res = await fetch(url, { signal: AbortSignal.timeout(60_000) })
    if (res.ok) {
      const ab = await res.arrayBuffer()
      const b64 = Buffer.from(ab).toString('base64')
      const mime = res.headers.get('content-type') || 'image/jpeg'
      return NextResponse.json({ imageUrl: `data:${mime};base64,${b64}`, provider: 'Pollinations · FLUX' })
    }
  } catch (e) {
    console.warn('Pollinations:', e instanceof Error ? e.message : String(e))
  }

  return NextResponse.json({ error: 'Génération échouée.' }, { status: 503 })
}
