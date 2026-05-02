import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)

  if (!body) {
    return NextResponse.json(
      {
        ok: false,
        status: 'invalid_payload',
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    route: '/api/sos/dispatch',
    status: 'mock_delivered',
    receivedAt: Date.now(),
    received: body,
  })
}
