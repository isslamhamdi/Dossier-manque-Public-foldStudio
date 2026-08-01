import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ready' })
}

async function uploadToTempHost(imageBuffer: Buffer): Promise<string | null> {
  const bytes = new Uint8Array(imageBuffer)
  try {
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'image/png' }), 'render.png')
    const res = await fetch('https://0x0.st', { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) })
    if (res.ok) {
      const url = (await res.text()).trim()
      if (url.startsWith('http')) return url
    }
  } catch (_) { /* fallthrough */ }

  try {
    const form = new FormData()
    form.append('file', new Blob([bytes], { type: 'image/png' }), 'render.png')
    const res = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: form, signal: AbortSignal.timeout(15_000) })
    if (res.ok) {
      const data = await res.json() as { data?: { url?: string } }
      const rawUrl = data?.data?.url
      if (rawUrl) return rawUrl.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
  } catch (_) { /* fallthrough */ }

  return null
}

function bufToResponse(buf: Buffer, providerLabel: string) {
  if (buf.length < 5000) throw new Error('Response too small')
  const mime = buf[0] === 0x89 ? 'image/png' : 'image/jpeg'
  return NextResponse.json({ imageUrl: `data:${mime};base64,${buf.toString('base64')}`, provider: providerLabel })
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms)),
  ])
}

// Use Gemini 2.0 Flash vision (free tier, generous quota) to describe the box
async function describeBox(b64clean: string, apiKey: string): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { data: b64clean, mimeType: 'image/png' } },
        { text: 'Describe this 3D packaging box render precisely for a product mockup: its exact color(s), any visible text or graphics (exact wording), surface finish, and shape. 2-3 sentences, very specific and factual.' },
      ],
    }],
  })
  return result.response.text().trim()
}

export async function POST(req: NextRequest) {
  const { imageBase64, instructions = '', boxDimensions } = await req.json() as {
    imageBase64: string
    instructions?: string
    boxDimensions?: { w: number; h: number; d: number }
  }
  if (!imageBase64) return NextResponse.json({ error: 'imageBase64 required' }, { status: 400 })

  const scenePrompt = instructions.trim() || 'white studio background, soft diffuse lighting'

  let aspectDesc = ''
  if (boxDimensions) {
    const { w, h } = boxDimensions
    if (w > h * 1.2)      aspectDesc = ', wider-than-tall box (landscape orientation)'
    else if (h > w * 1.2) aspectDesc = ', taller-than-wide box (portrait orientation)'
    else                   aspectDesc = ', square box'
  }

  const b64clean = imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const imageBuffer = Buffer.from(b64clean, 'base64')
  const imageBytes = new Uint8Array(imageBuffer)
  const inputBlob = new Blob([imageBytes], { type: 'image/png' })

  // ── Phase 0: Analyse visuelle Gemini + upload temp en parallèle ──────────
  const [boxDescription, hostedUrl] = await Promise.all([
    process.env.GEMINI_API_KEY
      ? withTimeout(describeBox(b64clean, process.env.GEMINI_API_KEY), 10_000).catch(() => '')
      : Promise.resolve(''),
    uploadToTempHost(imageBuffer),
  ])

  const boxDesc = boxDescription
    ? ` Box visual description from 3D render: ${boxDescription}`
    : ''

  const prompt = `product photography mockup: place EXACTLY the packaging box shown in the reference image${aspectDesc} into this scene: ${scenePrompt}. The box must look IDENTICAL to the reference — same colors, same surface, same shape, same proportions.${boxDesc} Only change the background/lighting. Photorealistic, sharp focus, 8k`

  // ── Tier 1: fal.ai ───────────────────────────────────────────────────────
  if (process.env.FAL_KEY) {
    try {
      const { fal } = await import('@fal-ai/client')
      fal.config({ credentials: process.env.FAL_KEY })
      const file = new File([new Blob([imageBytes], { type: 'image/png' })], 'render.png', { type: 'image/png' })
      const imageUrl = await fal.storage.upload(file)
      const result = await fal.subscribe('fal-ai/flux/dev/image-to-image', {
        input: { image_url: imageUrl, prompt, strength: 0.72, num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, enable_safety_checker: false },
        logs: false,
      }) as { data: { images: Array<{ url: string }> } }
      const url = result.data.images[0]?.url
      if (url) return NextResponse.json({ imageUrl: url, provider: 'fal.ai · Flux dev (img2img)' })
    } catch (e: unknown) {
      console.warn('fal.ai:', e instanceof Error ? e.message : String(e))
    }
  }

  // ── Tier 2: Race HF Kontext + Pollinations simultaneously ────────────────
  const img2imgRace: Promise<NextResponse>[] = []

  if (process.env.HF_TOKEN) {
    const { HfInference } = await import('@huggingface/inference')
    const hf = new HfInference(process.env.HF_TOKEN)

    const hfImg2img = (provider: string, label: string) =>
      hf.imageToImage({
        model: 'black-forest-labs/FLUX.1-Kontext-dev',
        inputs: inputBlob,
        provider: provider as never,
        parameters: { prompt, num_inference_steps: 20, guidance_scale: 3.5 } as Record<string, unknown>,
      }).then(blob => blob.arrayBuffer()).then(ab => bufToResponse(Buffer.from(ab), `HF · FLUX Kontext (${label})`))

    img2imgRace.push(withTimeout(hfImg2img('fal-ai', 'fal-ai'), 25_000))
    img2imgRace.push(withTimeout(hfImg2img('together', 'together'), 25_000))
  }

  // Pollinations img2img with vision-enhanced prompt
  if (hostedUrl) {
    const polImg2img = (async () => {
      const encPrompt = encodeURIComponent(prompt)
      const encImg = encodeURIComponent(hostedUrl)
      const polUrl = `https://image.pollinations.ai/prompt/${encPrompt}?model=flux&nologo=true&width=1024&height=1024&image=${encImg}&seed=${Date.now()}`
      const res = await fetch(polUrl, { signal: AbortSignal.timeout(90_000) })
      if (!res.ok) throw new Error(`Pollinations ${res.status}`)
      const b64Out = Buffer.from(await res.arrayBuffer()).toString('base64')
      const mime = res.headers.get('content-type') || 'image/jpeg'
      return NextResponse.json({ imageUrl: `data:${mime};base64,${b64Out}`, provider: 'Pollinations · FLUX (img2img)' })
    })()
    img2imgRace.push(polImg2img)
  }

  if (img2imgRace.length > 0) {
    try {
      return await Promise.any(img2imgRace)
    } catch (e) {
      console.warn('All img2img failed:', e)
    }
  }

  // ── Tier 3: Pollinations txt2img — last resort ───────────────────────────
  try {
    const encPrompt = encodeURIComponent(prompt)
    const polUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`
    const res = await fetch(polUrl, { signal: AbortSignal.timeout(60_000) })
    if (res.ok) {
      const b64Out = Buffer.from(await res.arrayBuffer()).toString('base64')
      const mime = res.headers.get('content-type') || 'image/jpeg'
      return NextResponse.json({ imageUrl: `data:${mime};base64,${b64Out}`, provider: 'Pollinations · FLUX (txt2img)' })
    }
  } catch (err: unknown) {
    console.warn('Pollinations txt2img:', err instanceof Error ? err.message : String(err))
  }

  return NextResponse.json({ error: 'Tous les fournisseurs ont échoué.' }, { status: 503 })
}
