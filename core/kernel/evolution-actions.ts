export type EvolutionActionStatus =
  | "implemented"
  | "internal"
  | "disabled"
  | "requires_provider"
  | "requires_founder_approval";

export type EvolutionAction = {
  id: string;
  title: string;
  status: EvolutionActionStatus;
  zone:
    | "Z1_AUTO_SAFE"
    | "Z2_PREVIEW_REQUIRED"
    | "Z3_FOUNDER_APPROVAL_REQUIRED"
    | "Z4_BLOCKED_MANUAL_ONLY";
  realRouteOrScript: string;
  mutatesRepo: boolean;
  requiresGreenChecks: boolean;
  requiresFounderApproval: boolean;
  description: string;
};

export function getEvolutionActionCatalog(): EvolutionAction[] {
  return [
    {
      id: "kernel-hourly-watch",
      title: "Kernel hourly watch",
      status: "implemented",
      zone: "Z1_AUTO_SAFE",
      realRouteOrScript: "scripts/pantavion-kernel-tick.cjs",
      mutatesRepo: false,
      requiresGreenChecks: true,
      requiresFounderApproval: false,
      description:
        "Runs kernel tick, scans repo, writes state/audit/report, and fails if critical checks fail.",
    },
    {
      id: "evolution-pr-writer",
      title: "Evolution PR writer",
      status: "implemented",
      zone: "Z2_PREVIEW_REQUIRED",
      realRouteOrScript: "scripts/pantavion-evolution-pr-writer.cjs",
      mutatesRepo: true,
      requiresGreenChecks: true,
      requiresFounderApproval: false,
      description:
        "Creates or updates a controlled evolution PR with kernel reports and CI/CD gates.",
    },
    {
      id: "command-pack-bridge",
      title: "Command pack bridge",
      status: "implemented",
      zone: "Z2_PREVIEW_REQUIRED",
      realRouteOrScript: "scripts/pantavion-apply-command-pack.cjs",
      mutatesRepo: true,
      requiresGreenChecks: true,
      requiresFounderApproval: false,
      description:
        "Applies scoped command packs locally when direct GitHub access is unavailable.",
    },
    {
      id: "startup-builder-provider",
      title: "Provider-backed startup builder",
      status: "requires_provider",
      zone: "Z2_PREVIEW_REQUIRED",
      realRouteOrScript: "app/api/kernel/startup-builder",
      mutatesRepo: false,
      requiresGreenChecks: true,
      requiresFounderApproval: false,
      description:
        "Uses a real AI provider only when configured. Otherwise returns provider-not-ready.",
    },
    {
      id: "production-auto-deploy",
      title: "Production auto deploy",
      status: "requires_founder_approval",
      zone: "Z3_FOUNDER_APPROVAL_REQUIRED",
      realRouteOrScript: "blocked-by-policy",
      mutatesRepo: true,
      requiresGreenChecks: true,
      requiresFounderApproval: true,
      description:
        "Production, users, auth, water, billing, secrets and infrastructure changes require founder approval.",
    },
  ];
}
