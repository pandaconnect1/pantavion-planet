import { NextResponse } from 'next/server';
import { getPantavionUnfinishedPlanRuntimeReport } from '@/core/intelligence/pantavion-unfinished-plan-ingestion';

export function GET() {
  const { report } = getPantavionUnfinishedPlanRuntimeReport();
  return NextResponse.json({ generatedAt: report.generatedAt, totals: report.totals, productionVerified: false });
}
