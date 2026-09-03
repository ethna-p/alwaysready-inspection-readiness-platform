import { NextResponse } from 'next/server'
import { assertSuperadmin } from '@/lib/auth/assert'

export async function GET() {
  await assertSuperadmin()

  const token = process.env.INFRA_VERCEL_TOKEN
  if (!token) return NextResponse.json({ error: 'INFRA_VERCEL_TOKEN not set' }, { status: 500 })

  const res = await fetch('https://api.vercel.com/v2/usage', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })

  const body = await res.text()
  return NextResponse.json({ status: res.status, body })
}
