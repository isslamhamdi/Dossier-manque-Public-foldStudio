import { NextRequest, NextResponse } from 'next/server'

// #63: Imprimeur webhook — send project data to registered print-shop endpoints
// POST body: { webhookUrl, secret?, project: { name, params, dieline, exteriorColor, interiorColor, imageLayers } }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { webhookUrl, secret, project } = body

    if (!webhookUrl || !project) {
      return NextResponse.json({ error: 'Missing webhookUrl or project' }, { status: 400 })
    }

    const payload = {
      source: 'fold-studio',
      version: '1.0',
      sentAt: new Date().toISOString(),
      project: {
        name: project.name ?? 'Untitled',
        template: project.template ?? 'box',
        dimensions: {
          width: project.params?.width,
          height: project.params?.height,
          depth: project.params?.depth,
          thickness: project.params?.thickness,
          bleed: project.params?.bleed,
          unit: 'mm',
        },
        colors: {
          exterior: project.exteriorColor,
          interior: project.interiorColor,
        },
        layerCount: project.imageLayers?.length ?? 0,
        dieline: project.dieline ?? null,
      },
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'FoldStudio/1.0',
      'X-FoldStudio-Event': 'project.submitted',
    }

    if (secret) {
      // HMAC-SHA256 signature using Web Crypto API
      const enc = new TextEncoder()
      const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(JSON.stringify(payload)))
      headers['X-FoldStudio-Signature'] = `sha256=${Buffer.from(sig).toString('hex')}`
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      sentAt: payload.sentAt,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Webhook delivery failed', detail: String(err) }, { status: 500 })
  }
}

// GET — list registered printers from env / future DB
export async function GET() {
  const registered = process.env.PRINTER_WEBHOOKS
    ? JSON.parse(process.env.PRINTER_WEBHOOKS)
    : []
  return NextResponse.json({ printers: registered })
}
