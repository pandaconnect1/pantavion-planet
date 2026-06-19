import { PANTAVION_COMMON_SERVICE_IDS } from "@/core/kernel/common/pantavion-common-services";
import type {
  PantavionProjectIntakeRecord,
  PantavionProjectIntakeReport
} from "./project-intake-types";

const allCommonServices = PANTAVION_COMMON_SERVICE_IDS;

export const PANTAVION_PROJECT_INTAKE_REGISTRY: PantavionProjectIntakeRecord[] = [
  {
    intakeId: "legacy-pantavion-one",
    title: "Pantavion One legacy product DNA",
    sourceKind: "legacy_repo",
    sourceReference: "pandaconnect1/pantavion-one",
    status: "mapped_to_existing_capability",
    proposedAction: "merge",
    mappedCapabilityIds: [
      "messages-chat",
      "stories",
      "music",
      "dates-connections",
      "health",
      "calendar-reminders",
      "culture",
      "environment",
      "education",
      "sports",
      "news-newspaper",
      "work-business",
      "family-friends",
      "economy-banks",
      "shipping-marine",
      "flights-travel",
      "tourism",
      "politics",
      "faith-religions",
      "vr-ar",
      "photos-multimedia",
      "contacts-import",
      "marketplace",
      "academy",
      "research",
      "communities",
      "support-care"
    ],
    usefulSignals: [
      "Unified daily life platform",
      "Social, media, work, learning, marketplace and care concepts",
      "Pantavion One should remain legacy redirect while its DNA lives inside Pantavion Planet"
    ],
    staticOrPrototypeSignals: [
      "Static UI concepts",
      "Placeholder surfaces",
      "No full backend/auth/provider implementation"
    ],
    realImplementationRequirements: [
      "Convert each useful static concept into a real Pantavion Planet capability",
      "Create isolated autonomous kernel work orders",
      "Promote to live only through realness gate"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "china", "usa", "europe", "japan", "korea", "russia", "india"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Do not restore Pantavion One as separate production product.",
      "Do not copy static buttons as live features."
    ]
  },
  {
    intakeId: "current-pantavion-planet-unfinished-routes",
    title: "Pantavion Planet unfinished routes and partial modules",
    sourceKind: "current_repo_file",
    sourceReference: "C:\\Users\\gnkkm\\pantavion-planet",
    status: "discovered",
    proposedAction: "extract_requirements",
    mappedCapabilityIds: [],
    proposedCapabilityTitle: "Unfinished Route Recovery",
    proposedKernelId: "unfinished-route-recovery-kernel",
    usefulSignals: [
      "Existing routes may contain unfinished product work",
      "Some routes may already be live, beta, foundation or static"
    ],
    staticOrPrototypeSignals: [
      "Route exists but no backend",
      "Button exists but no action",
      "Feature page exists but no provider/data/state"
    ],
    realImplementationRequirements: [
      "Inventory app routes",
      "Detect dead buttons and fake public actions",
      "Map each route to Universal Life capability",
      "Create work orders for missing backend/state/provider/legal gates"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "usa", "china", "europe"],
    risk: "medium",
    founderReportRequired: true,
    notes: [
      "Do not modify protected Water/SOS/users/access files during inventory."
    ]
  },
  {
    intakeId: "water-professional-infrastructure",
    title: "Protected Water Infrastructure module",
    sourceKind: "current_repo_file",
    sourceReference: "app/professional/infrastructure/water",
    status: "classified",
    proposedAction: "preserve",
    mappedCapabilityIds: ["water-infrastructure", "professional-infrastructure"],
    usefulSignals: [
      "Real protected professional infrastructure layer",
      "Private source vault concept",
      "Founder/admin approval model",
      "Field and engineering workflows"
    ],
    staticOrPrototypeSignals: [
      "Some admin/intelligence surfaces may still be partial",
      "Some DXF/DWG source workflows remain future or protected"
    ],
    realImplementationRequirements: [
      "Do not expose raw DWG/DXF/KMZ/private geodata",
      "Preserve approved users and access records",
      "All Water changes require protected scoped work orders",
      "Founder approval required for source, access, and public map changes"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "europe", "china", "usa", "japan"],
    risk: "critical",
    founderReportRequired: true,
    notes: [
      "Water is protected infrastructure, not a normal feature.",
      "No blind patches."
    ]
  },
  {
    intakeId: "sos-elder-safety",
    title: "SOS, elder and care safety modules",
    sourceKind: "current_repo_file",
    sourceReference: "app/sos and app/sos-interpreter",
    status: "classified",
    proposedAction: "preserve",
    mappedCapabilityIds: ["sos", "support-care", "sos-interpreter"],
    usefulSignals: [
      "Emergency language support",
      "Elder-safe interface",
      "Trusted contact and care direction"
    ],
    staticOrPrototypeSignals: [
      "Provider-backed voice/translation may still be incomplete",
      "Offline/Satellite-supported roadmap is not full certified emergency dispatch"
    ],
    realImplementationRequirements: [
      "No false emergency dispatch claims",
      "Trusted contacts and consent required",
      "Offline pack must be explicit about limits",
      "Medical and emergency disclaimers required"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: ["global", "europe", "usa", "japan", "china"],
    risk: "critical",
    founderReportRequired: true,
    notes: [
      "SOS is life-protection, not casual UI."
    ]
  },
  {
    intakeId: "global-ecosystem-benchmark",
    title: "Global ecosystem benchmark intake",
    sourceKind: "external_benchmark",
    sourceReference: "China, USA, Europe, Japan, Korea, Russia, India, Southeast Asia and global platforms",
    status: "new_capability_candidate",
    proposedAction: "convert_to_kernel_candidate",
    mappedCapabilityIds: [],
    proposedCapabilityTitle: "Global Ecosystem Benchmark Matrix",
    proposedKernelId: "global-ecosystem-benchmark-kernel",
    usefulSignals: [
      "Super-app patterns",
      "Mini-app service patterns",
      "Search/maps/workspace patterns",
      "Personal cloud continuity patterns",
      "Social/media/community patterns",
      "Commerce/payment/logistics patterns",
      "AI workspace and agent workforce patterns"
    ],
    staticOrPrototypeSignals: [],
    realImplementationRequirements: [
      "Benchmark legal functional patterns only",
      "Do not copy protected UI, logos, code, claims or brand identity",
      "Find gaps in global systems and define Pantavion-owned improvements"
    ],
    requiredSharedServices: allCommonServices,
    benchmarkRegions: [
      "global",
      "china",
      "usa",
      "europe",
      "japan",
      "korea",
      "russia",
      "india",
      "southeast_asia",
      "africa",
      "latin_america",
      "oceania"
    ],
    risk: "high",
    founderReportRequired: true,
    notes: [
      "Pantavion should legally absorb ecosystem logic and fill their gaps."
    ]
  }
];

export function getPantavionProjectIntakeReport(): PantavionProjectIntakeReport {
  return {
    totalRecords: PANTAVION_PROJECT_INTAKE_REGISTRY.length,
    legacyRepos: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "legacy_repo"
    ).length,
    staticPrototypes: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "static_prototype"
    ).length,
    unfinishedRoutes: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.sourceKind === "unfinished_route"
    ).length,
    newCapabilityCandidates: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.status === "new_capability_candidate"
    ).length,
    founderReviewRequired: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.founderReportRequired
    ).length,
    blocked: PANTAVION_PROJECT_INTAKE_REGISTRY.filter(
      (record) => record.status === "blocked"
    ).length
  };
}

export function getPantavionProjectIntakeRecord(intakeId: string) {
  return PANTAVION_PROJECT_INTAKE_REGISTRY.find((record) => record.intakeId === intakeId);
}

export function getPantavionProjectIntakeRecordsForCapability(capabilityId: string) {
  return PANTAVION_PROJECT_INTAKE_REGISTRY.filter((record) =>
    record.mappedCapabilityIds.includes(capabilityId)
  );
}
