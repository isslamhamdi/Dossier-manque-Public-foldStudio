// #106 Analytics — event tracking for printer dashboard

import { NextRequest, NextResponse } from 'next/server'

interface AnalyticsEvent {
  event: string
  userId?: string
  data?: Record<string, unknown>
  timestamp: number
}

const events: AnalyticsEvent[] = []

export async function POST(req: NextRequest) {
  const body = await req.json() as Omit<AnalyticsEvent, 'timestamp'>
  events.push({ ...body, timestamp: Date.now() })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = Number(searchParams.get('from') ?? 0)
  const filtered = events.filter(e => e.timestamp >= from)

  const summary = {
    total: filtered.length,
    byEvent: filtered.reduce<Record<string, number>>((acc, e) => {
      acc[e.event] = (acc[e.event] ?? 0) + 1
      return acc
    }, {}),
    last30: filtered.slice(-30),
  }

  return NextResponse.json(summary)
}
