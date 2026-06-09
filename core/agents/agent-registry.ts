export type PantavionAgentPermission = "observe" | "analyze" | "recommend" | "write_file" | "open_pr" | "audit" | "build" | "deploy_requires_founder" | "infrastructure_requires_founder";

export type PantavionAgentRegistryItem = {
  id: string;
  name: string;
  purpose: string;
  domains: readonly string[];
  permissions: readonly PantavionAgentPermission[];
};

export const pantavionAgentRegistry: PantavionAgentRegistryItem[] = [
  {
    id: "cloud_agent",
    name: "Pantavion Cloud Agent",
    purpose: "Writes scoped files, creates branches, commits, pushes and prepares PRs.",
    domains: ["cloud", "security", "ai"],
    permissions: ["observe", "analyze", "write_file", "open_pr", "audit", "build"],
  },
  {
    id: "research_agent",
    name: "Research Agent",
    purpose: "Collects lawful public technology signals and prepares founder briefs.",
    domains: ["ai", "science", "education", "commerce"],
    permissions: ["observe", "analyze", "recommend"],
  },
  {
    id: "audit_agent",
    name: "Audit Agent",
    purpose: "Runs build, typecheck, safety and implementation gates.",
    domains: ["security", "cloud", "infrastructure"],
    permissions: ["observe", "audit", "build"],
  },
  {
    id: "water_agent",
    name: "Water Infrastructure Agent",
    purpose: "Supports protected water source vault, derived layers and infrastructure intelligence.",
    domains: ["infrastructure", "databases", "cloud", "security"],
    permissions: ["observe", "analyze", "recommend", "infrastructure_requires_founder"],
  },
  {
    id: "map_cad_agent",
    name: "Map CAD Agent",
    purpose: "Plans DWG/DXF/KMZ processing into derived vector tiles and safe map layers.",
    domains: ["infrastructure", "databases", "hardware", "cloud"],
    permissions: ["observe", "analyze", "recommend", "infrastructure_requires_founder"],
  },
];

export function createPantavionAgentRegistryReport() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    registryVersion: "pantavion_agent_registry_v1",
    agentCount: pantavionAgentRegistry.length,
    agents: pantavionAgentRegistry,
  };
}
