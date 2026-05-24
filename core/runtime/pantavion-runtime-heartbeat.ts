export const pantavionRuntimeHeartbeatContract = {
  id: "pantavion_runtime_heartbeat_v1",
  apiRoute: "/api/pantavion/runtime/heartbeat",
  truth:
    "Pantavion runtime heartbeat proves the cloud/runtime layer is alive. It does not depend on the founder PC when hosted through GitHub Actions/Vercel.",
  mode: "cloud_continuity",
} as const;

export function getPantavionRuntimeHeartbeat() {
  return {
    ok: true,
    contract: pantavionRuntimeHeartbeatContract,
    alive: true,
    generatedAt: new Date().toISOString(),
    continuity: {
      pcRequired: false,
      githubActionsRequired: true,
      vercelOrCloudHostRequired: true,
      founderApprovalRequiredForDangerousActions: true,
    },
    activeRuntimeSurfaces: [
      "/pantavion/radar",
      "/api/pantavion/radar",
      "/api/pantavion/language",
      "/api/pantavion/runtime/heartbeat",
    ],
  };
}
