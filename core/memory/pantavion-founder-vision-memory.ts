import founderVisionReport from "@/data/runtime-reports/latest-founder-vision-ingestion.json";

export const pantavionFounderVisionMemoryContract = {
  id: "pantavion_founder_vision_memory_runtime_v1",
  vault: "data/founder-vision-vault",
  apiRoute: "/api/pantavion/founder-vision",
  publicRoute: "/pantavion/founder-vision",
  truth:
    "Founder vision, old unfinished ideas, and repo evidence are ingested into a runtime-readable memory surface. ChatGPT private threads must be exported/pasted into the vault before cloud runtime can read them.",
} as const;

export function getPantavionFounderVisionMemory() {
  return {
    ok: true,
    contract: pantavionFounderVisionMemoryContract,
    report: founderVisionReport,
  };
}
