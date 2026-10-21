import { getPantavionUnfinishedPlanRuntimeReport } from '@/core/intelligence/pantavion-unfinished-plan-ingestion';

export default function UnfinishedPlansPage() {
  const data = getPantavionUnfinishedPlanRuntimeReport();
  return <main><h1>PANTAVION UNFINISHED PLAN INGESTION</h1><p>Repository snapshot: {data.report.generatedAt}</p><p>Files scanned: {data.report.totals.scannedFiles}</p><p>Findings: {data.report.totals.findings}</p><p>Production verification: not established.</p></main>;
}
