import { aiDomain } from "./domains/ai";
import { cloudDomain } from "./domains/cloud";
import { databasesDomain } from "./domains/databases";
import { securityDomain } from "./domains/security";
import { infrastructureDomain } from "./domains/infrastructure";
import { hardwareDomain } from "./domains/hardware";
import { roboticsDomain } from "./domains/robotics";
import { educationDomain } from "./domains/education";
import { healthDomain } from "./domains/health";
import { scienceDomain } from "./domains/science";
import { communicationDomain } from "./domains/communication";
import { commerceDomain } from "./domains/commerce";

export const pantavionGlobalDomainRegistry = [
  aiDomain,
  cloudDomain,
  databasesDomain,
  securityDomain,
  infrastructureDomain,
  hardwareDomain,
  roboticsDomain,
  educationDomain,
  healthDomain,
  scienceDomain,
  communicationDomain,
  commerceDomain,
] as const;

export const pantavionMapsWaterCadScope = {
  id: "maps_water_cad_scope",
  includedInDomains: ["infrastructure", "cloud", "databases", "ai", "hardware", "security"],
  rawSources: ["DWG", "DXF", "KMZ", "KML", "GeoJSON", "PDF", "scans", "photos", "field notes"],
  pipeline: [
    "private_source_vault",
    "processing_engine",
    "spatial_database",
    "vector_tiles",
    "api",
    "pantavion_map_engine",
    "founder_approval",
    "safe_field_view",
  ],
  rules: [
    "no_raw_private_infrastructure_public_exposure",
    "no_browser_loading_of_massive_raw_cad_files",
    "derived_layers_must_have_provenance",
    "founder_approval_required_for_master_changes",
  ],
} as const;

export function createPantavionGlobalDomainReport() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    registryVersion: "pantavion_evolution_engine_v2",
    domainCount: pantavionGlobalDomainRegistry.length,
    domains: pantavionGlobalDomainRegistry,
    mapsWaterCadScope: pantavionMapsWaterCadScope,
  };
}
