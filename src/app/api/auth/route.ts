import { NextRequest, NextResponse } from 'next/server'

// #54: Client portal — lightweight token-based auth (no external deps)
// In production: swap for NextAuth or Clerk. This provides a functional stub.

const PORTAL_SECRET = process.env.PORTAL_SECRET ?? 'fold-studio-dev-secret'
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24h

function sign(payload: Record<string, unknown>): string {
  const data = JSON.stringify({ ...payload, iss: 'fold-studio', iat: Date.now() })
  return Buffer.from(data).toString('base64url')
}

function verify(token: string): Record<string, unknown> | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'))
    if (!decoded.iat || Date.now() - decoded.iat > TOKEN_TTL_MS) return null
    if (decoded.iss !== 'fold-studio') return null
    return decoded
  } catch {
    return null
  }
}

// POST /api/auth — login with email + PIN (or magic token from env)
export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json()

    if (!email || !pin) {
      return NextResponse.json({ error: 'Missing email or pin' }, { status: 400 })
    }

    // Configurable via env: PORTAL_USERS=email:pin,email2:pin2
    const usersEnv = process.env.PORTAL_USERS ?? ''
    const users = usersEnv.split(',').reduce<Record<string, string>>((acc, pair) => {
      const [e, p] = pair.split(':')
      if (e && p) acc[e.trim().toLowerCase()] = p.trim()
      return acc
    }, {})

    const expectedPin = users[email.toLowerCase()]
    if (!expectedPin || expectedPin !== String(pin)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = sign({ email, role: 'client', secret: PORTAL_SECRET })
    const res = NextResponse.json({ success: true, email, token, expiresIn: TOKEN_TTL_MS / 1000 })
    res.cookies.set('fold-portal-token', token, { httpOnly: true, sameSite: 'lax', maxAge: TOKEN_TTL_MS / 1000 })
    return res
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET /api/auth — verify current token
export async function GET(req: NextRequest) {
  const token = req.cookies.get('fold-portal-token')?.value
    ?? req.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 })

  const payload = verify(token)
  if (!payload) return NextResponse.json({ authenticated: false, error: 'Token expired' }, { status: 401 })

  return NextResponse.json({ authenticated: true, email: payload.email, role: payload.role })
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('fold-portal-token')
  return res
}
