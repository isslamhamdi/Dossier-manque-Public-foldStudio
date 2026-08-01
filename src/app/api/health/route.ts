// #297 Edge function — latence mondiale via Next.js Edge Runtime

export const runtime = 'edge'

export function GET() {
  return Response.json({
    status: 'ok',
    runtime: 'edge',
    region: process.env.VERCEL_REGION ?? 'local',
    ts: Date.now(),
  })
}
