export type BackendClaimStatus =
  | "doctrine_only"
  | "static_page"
  | "foundation"
  | "backend_connected"
  | "production_operational";

export const REAL_BACKEND_CLAIMS_REGISTRY = [
  { module: "Homepage", route: "/", status: "production_operational" },
  { module: "Ecosystem", route: "/ecosystem", status: "static_page" },
  { module: "Deep Audit", route: "/deep-audit", status: "static_page" },
  { module: "Access Model", route: "/access-model", status: "static_page" },
  { module: "Competitive Intelligence", route: "/intelligence/competitive", status: "static_page" },
  { module: "Kernel Audit", route: "/kernel/audit", status: "static_page" },
  { module: "Pricing", route: "/pricing", status: "foundation" },
  { module: "Legal", route: "/legal", status: "static_page" },
  { module: "SOS Interpreter", route: "/sos-interpreter", status: "foundation" },
  { module: "Marketplace", route: "/market", status: "foundation" },
  { module: "Messages", route: "/messages", status: "doctrine_only" },
  { module: "Radio", route: "/radio", status: "foundation" },
  { module: "Studio", route: "/studio", status: "foundation" },
  { module: "Build Services", route: "/build-services", status: "foundation" },
  { module: "Stripe", route: "/stripe-readiness", status: "foundation" },
  { module: "PantaAI", route: "/ai", status: "doctrine_only" },
  { module: "Voice Translation", route: "/voice", status: "doctrine_only" },
  { module: "Import World", route: "/import-world", status: "foundation" },
] as const;
