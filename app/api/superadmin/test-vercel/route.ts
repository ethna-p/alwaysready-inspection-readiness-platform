import { NextResponse } from 'next/server'
import { assertSuperadmin } from '@/lib/assert-superadmin'

export async function GET() {
  await assertSuperadmin()

  const token  = process.env.INFRA_VERCEL_TOKEN
  const teamId = process.env.INFRA_VERCEL_TEAM_ID
  if (!token) return NextResponse.json({ error: 'INFRA_VERCEL_TOKEN not set' }, { status: 500 })

  const now  = Date.now()
  const from = new Date()
  from.setDate(1)
  from.setHours(0, 0, 0, 0)

  const results: Record<string, unknown> = {}

  for (const type of ['builds', 'edge', 'requests']) {
    const params = new URLSearchParams({ type, from: String(from.getTime()), to: String(now) })
    if (teamId) params.set('teamId', teamId)
    const res = await fetch(`https://api.vercel.com/v2/usage?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const text = await res.text()
    try {
      results[type] = { status: res.status, body: JSON.parse(text) }
    } catch {
      results[type] = { status: res.status, body: text }
    }
  }

  return NextResponse.json(results)
}
