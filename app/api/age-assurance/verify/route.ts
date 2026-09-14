import { NextRequest, NextResponse } from 'next/server';
import { verifyAgeAssurance, type AgeAssuranceInput } from '@/lib/age-assurance/runtime';

export async function POST(request: NextRequest) {
  let body: AgeAssuranceInput;
  try {
    body = (await request.json()) as AgeAssuranceInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  if (!body?.method || !body?.jurisdiction) {
    return NextResponse.json({ ok: false, error: 'METHOD_AND_JURISDICTION_REQUIRED' }, { status: 400 });
  }

  const result = verifyAgeAssurance(body);
  const statusCode = result.status === 'REJECTED' ? 422 : 200;

  return NextResponse.json(
    {
      ok: result.status !== 'REJECTED',
      verification: result,
      evidence: {
        jurisdiction: body.jurisdiction,
        method: body.method,
        rawImageStored: false,
      },
    },
    { status: statusCode, headers: { 'Cache-Control': 'no-store' } },
  );
}
