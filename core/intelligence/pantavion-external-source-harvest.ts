import harvest from "@/data/runtime-reports/latest-external-source-harvest.json";

export function getPantavionExternalSourceHarvest() {
  return {
    ok: true,
    report: harvest,
  };
}
