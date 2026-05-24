import unfinishedPlanReport from "@/data/runtime-reports/latest-unfinished-plan-ingestion.json";

export const pantavionUnfinishedPlanIngestionContract = {
  id: "pantavion_unfinished_plan_ingestion_runtime_v1",
  apiRoute: "/api/pantavion/intelligence/unfinished-plans",
  publicRoute: "/pantavion/unfinished-plans",
  truth:
    "Pantavion Kernel/AI must ingest unfinished plans from repository files and convert them into runtime priorities. Local VS Code-only work must be pushed before cloud autonomy can see it.",
} as const;

export function getPantavionUnfinishedPlanRuntimeReport() {
  return {
    ok: true,
    contract: pantavionUnfinishedPlanIngestionContract,
    report: unfinishedPlanReport,
  };
}
