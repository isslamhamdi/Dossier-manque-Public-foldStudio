import { NextRequest, NextResponse } from 'next/server'

// #64: Zapier / Make.com automation — generic trigger endpoint
// POST body: { event, project } — fires stored automation webhooks
// Supports: project.saved, project.approved, project.exported

type AutomationEvent =
  | 'project.saved'
  | 'project.approved'
  | 'project.exported'
  | 'project.submitted_to_printer'

const EVENT_DESCRIPTIONS: Record<AutomationEvent, string> = {
  'project.saved':                 'Un projet a été sauvegardé',
  'project.approved':              'Un projet a été approuvé par le client',
  'project.exported':              'Un projet a été exporté (PDF/PNG)',
  'project.submitted_to_printer':  'Un projet a été transmis à l\'imprimeur',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event, project, webhooks } = body as {
      event: AutomationEvent
      project: Record<string, unknown>
      webhooks?: string[]
    }

    if (!event || !project) {
      return NextResponse.json({ error: 'Missing event or project' }, { status: 400 })
    }

    const targets: string[] = webhooks ?? []

    // Also include env-configured webhooks for this event type
    const envWebhooks = process.env[`AUTOMATION_WEBHOOK_${event.replace(/\./g, '_').toUpperCase()}`]
    if (envWebhooks) {
      try {
        const arr = JSON.parse(envWebhooks)
        if (Array.isArray(arr)) targets.push(...arr)
      } catch { /* ignore */ }
    }

    if (targets.length === 0) {
      return NextResponse.json({ success: true, fired: 0, message: 'No webhooks configured for this event' })
    }

    const payload = {
      event,
      description: EVENT_DESCRIPTIONS[event] ?? event,
      firedAt: new Date().toISOString(),
      project: {
        name: project.name,
        template: project.template,
        width: (project.params as any)?.width,
        height: (project.params as any)?.height,
        depth: (project.params as any)?.depth,
        exteriorColor: project.exteriorColor,
        interiorColor: project.interiorColor,
        approvalStatus: project.approvalStatus,
      },
    }

    const results = await Promise.allSettled(
      targets.map(url =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'FoldStudio-Automation/1.0' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8_000),
        }).then(r => ({ url, ok: r.ok, status: r.status }))
      )
    )

    const fired = results.filter(r => r.status === 'fulfilled' && (r.value as any).ok).length
    const failed = results.length - fired

    return NextResponse.json({ success: true, fired, failed, total: results.length })
  } catch (err) {
    return NextResponse.json({ error: 'Automation trigger failed', detail: String(err) }, { status: 500 })
  }
}
