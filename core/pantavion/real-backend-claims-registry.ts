export type BackendClaimStatus =
  | "doctrine_only"
  | "static_page"
  | "foundation"
  | "backend_connected"
  | "production_operational";

export const BACKEND_CLAIM_STATUS_LABELS: Record<BackendClaimStatus, string> = {
  doctrine_only: "Doctrine Only",
  static_page: "Static Page",
  foundation: "Foundation",
  backend_connected: "Backend Connected",
  production_operational: "Production Operational",
};

export const realBackendClaimsRegistry = [
  { module: "Homepage", route: "/", status: "production_operational" as BackendClaimStatus },
  { module: "Ecosystem", route: "/ecosystem", status: "static_page" as BackendClaimStatus },
  { module: "Deep Audit", route: "/deep-audit", status: "static_page" as BackendClaimStatus },
  { module: "Access Model", route: "/access-model", status: "static_page" as BackendClaimStatus },
  { module: "Competitive Intelligence", route: "/intelligence/competitive", status: "static_page" as BackendClaimStatus },
  { module: "Kernel Audit", route: "/kernel/audit", status: "static_page" as BackendClaimStatus },
  { module: "Pricing", route: "/pricing", status: "foundation" as BackendClaimStatus },
  { module: "Legal", route: "/legal", status: "static_page" as BackendClaimStatus },
  { module: "Marketplace", route: "/market", status: "foundation" as BackendClaimStatus },
  { module: "Messages", route: "/messages", status: "doctrine_only" as BackendClaimStatus },
  { module: "PantaAI", route: "/ai", status: "doctrine_only" as BackendClaimStatus },
  { module: "Voice Translation", route: "/voice", status: "doctrine_only" as BackendClaimStatus },
];

export function getBackendClaimsSummary() {
  const counts = realBackendClaimsRegistry.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {} as Record<BackendClaimStatus, number>);
  return counts;
}
