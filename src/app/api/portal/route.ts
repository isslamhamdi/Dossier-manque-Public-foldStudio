import { NextRequest, NextResponse } from 'next/server'

// #54: Client portal — shared projects endpoint for client review
// Clients access their assigned projects without full editor access

function getClientEmail(req: NextRequest): string | null {
  const token = req.cookies.get('fold-portal-token')?.value
    ?? req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    if (Date.now() - decoded.iat > 24 * 60 * 60 * 1000) return null
    return decoded.email ?? null
  } catch {
    return null
  }
}

// GET /api/portal — list projects shared with this client
// In production: query DB. Here returns a stub filtered by client email.
export async function GET(req: NextRequest) {
  const email = getClientEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Projects are stored client-side (IndexedDB), so this endpoint
  // acts as a relay for projects explicitly shared via the share feature.
  // For full production use, add a DB (e.g. Vercel Postgres/Neon).
  return NextResponse.json({
    client: email,
    message: 'Portal active. Projects shared with this client will appear here.',
    projects: [],
    portalVersion: '1.0',
  })
}

// POST /api/portal — client submits approval decision
export async function POST(req: NextRequest) {
  const email = getClientEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { projectId, decision, note } = await req.json()
    if (!projectId || !decision) {
      return NextResponse.json({ error: 'Missing projectId or decision' }, { status: 400 })
    }
    if (!['approved', 'rejected', 'revision'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
    }

    // Fire automation webhook for approval event
    const automationPayload = {
      event: decision === 'approved' ? 'project.approved' : 'project.submitted_to_printer',
      project: { id: projectId, approvalStatus: decision, clientNote: note, reviewedBy: email },
    }
    try {
      const baseUrl = req.nextUrl.origin
      await fetch(`${baseUrl}/api/webhook/automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationPayload),
      })
    } catch { /* non-blocking */ }

    return NextResponse.json({
      success: true,
      projectId,
      decision,
      reviewedAt: new Date().toISOString(),
      reviewedBy: email,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
