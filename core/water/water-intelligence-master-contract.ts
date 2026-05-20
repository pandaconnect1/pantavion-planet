export type WaterVisibility =
  | "founder_only"
  | "admin_review"
  | "user_private"
  | "pending_founder_approval"
  | "approved_shared"
  | "master_locked";

export type WaterSourceKind =
  | "dwg"
  | "dxf"
  | "kmz"
  | "kml"
  | "geojson"
  | "geopackage"
  | "shapefile"
  | "pdf"
  | "scan"
  | "photo"
  | "video"
  | "voice_note"
  | "field_note"
  | "telemetry"
  | "satellite"
  | "sensor"
  | "manual_entry";

export type WaterApprovalAction =
  | "approve_for_all"
  | "reject"
  | "founder_only"
  | "needs_correction"
  | "revoke"
  | "archive";

export const WATER_KERNEL_DOCTRINE = {
  name: "Pantavion Water Intelligence Kernel",
  publicEntry: "pantavion.com",
  doctrine:
    "Solution-first, protection-always. Large or difficult sources are not rejected; they are protected, classified, processed, simplified, reviewed, and only then shared.",
  operationalFlow: [
    "Observe",
    "Understand",
    "Compare options",
    "Predict risks",
    "Recommend best path",
    "Ask founder approval",
    "Patch safely",
    "Build",
    "Test",
    "Deploy",
    "Report result",
    "Keep memory",
  ],
  masterRule:
    "Locked master files are never changed automatically. They change only after explicit founder approval, backup/versioning, audit, and rollback readiness.",
} as const;

export const WATER_VISIBILITY_RULES = {
  founderCanSee: [
    "all source vault files",
    "all pending access requests",
    "all pending map notes",
    "all field photos",
    "all voice notes",
    "all fault reports",
    "all AI engineering suggestions",
    "all technology registry items",
    "all approval controls",
    "all founder-only intelligence layers",
  ],
  approvedUserCanSee: [
    "approved water map layers",
    "approved network data",
    "own private notes",
    "own pending submissions",
    "approved shared notes",
    "location tools",
    "search tools",
    "safe field assistant information",
  ],
  hiddenFromUsers: [
    "raw DWG/DXF sources",
    "founder-only engineering intelligence",
    "unapproved faults",
    "unapproved user submissions",
    "source vault",
    "AI risk predictions before approval",
    "internal approval inbox",
    "sensitive infrastructure reports",
  ],
} as const;

export const WATER_SOURCE_VAULT = {
  purpose:
    "Founder-only protected vault for large, raw, sensitive map and engineering sources before extraction into lightweight approved layers.",
  accepts: [
    "DWG",
    "DXF",
    "KMZ",
    "KML",
    "GeoJSON",
    "GeoPackage",
    "Shapefile ZIP",
    "PDF",
    "scanner reports",
    "photos",
    "videos",
    "voice notes",
    "telemetry exports",
    "satellite indicators",
    "contractor as-built files",
    "manual field notes",
  ],
  statuses: [
    "received",
    "private_source",
    "pending_inspection",
    "pending_extraction",
    "processing",
    "preview_ready",
    "founder_review",
    "approved_layer_ready",
    "published_to_users",
    "archived",
  ],
  safetyRules: [
    "Never publish raw master sources to users.",
    "Never upload raw large infrastructure files to GitHub public history.",
    "Never load full raw infrastructure files in the browser.",
    "Always create lightweight derived layers before user visibility.",
    "Always preserve provenance, audit, and rollback.",
  ],
} as const;

export const WATER_APPROVAL_INBOX = {
  purpose:
    "Single founder-only inbox for every pending decision in Pantavion Water.",
  includes: [
    "new user access requests",
    "new device requests",
    "map notes",
    "photos",
    "voice notes",
    "fault reports",
    "new roads",
    "new zones",
    "possible valves",
    "pipe corrections",
    "PDF scanner imports",
    "AI upgrade suggestions",
    "technology recommendations",
  ],
  actions: [
    "approve_for_all",
    "reject",
    "founder_only",
    "needs_correction",
    "revoke",
    "archive",
  ] satisfies readonly WaterApprovalAction[],
  audioSupport:
    "Founder can listen to voice notes and future spoken summaries before approval.",
} as const;

export const WATER_INTELLIGENCE_SIDEBAR = {
  purpose:
    "Clean appendix/sidebar for water intelligence without cluttering or breaking the working map.",
  buttons: [
    "Area Details",
    "Faults",
    "Valves",
    "Works and Extensions",
    "Photos and Evidence",
    "Voice Notes",
    "Pipe Material",
    "Depth and Diameter",
    "Pressure and Zone",
    "History",
    "AI Recommendation",
    "Pending Approval",
  ],
} as const;

export const WATER_FIELD_ASSISTANT = {
  purpose:
    "Simple controlled field interface usable by non-specialist workers without exposing founder-only intelligence.",
  userCanSee: [
    "my location",
    "search area road village zone",
    "approved nearby network",
    "approved valve tank zone information",
    "pipe material if approved",
    "pipe depth if approved",
    "pressure if approved or clearly labelled as estimated",
    "nearby approved notes",
  ],
  userCanSubmit: [
    "field note",
    "photo",
    "voice note",
    "fault report",
    "new road",
    "new area",
    "possible valve",
    "possible pipe correction",
    "depth observation",
    "pipe material observation",
    "other underground service observation",
  ],
  submissionRule:
    "User submissions remain private or pending until founder approval. They never become shared automatically.",
} as const;

export const WATER_CHANGE_AND_EVIDENCE_LOG = {
  purpose:
    "Permanent change and evidence history for roads, pipes, valves, services, works, photos, and field observations.",
  entryTypes: [
    "photo",
    "note",
    "fault",
    "new_valve",
    "remove_valve",
    "replace_valve",
    "new_pipe",
    "pipe_repair",
    "network_extension",
    "new_service_connection",
    "service_isolation",
    "pressure_or_zone_change",
    "pipe_depth",
    "pipe_material",
    "new_road",
    "new_area",
    "pdf_scan",
    "voice_note",
  ],
  certaintyLabels: [
    "verified",
    "founder_approved",
    "field_observed",
    "ai_estimated",
    "needs_check",
    "unknown",
  ],
  rule:
    "No change modifies the locked master directly. All changes move through pending, founder review, approved shared layer, and only then possible master update by explicit founder decision.",
} as const;

export const WATER_ENGINEERING_INTELLIGENCE = {
  purpose:
    "Founder-only AI-assisted engineering advisor for better water network design, reliability, leakage reduction, and minimum shutdown area.",
  modules: [
    "Fault Ledger",
    "Valve Registry",
    "Tank Registry",
    "Zone Registry",
    "Pressure and Elevation Intelligence",
    "Valve Isolation Optimizer",
    "Leak and Risk Advisor",
    "AI Sensor Placement Advisor",
    "Upgrade Intake",
    "Daily Founder Report",
  ],
  valveOptimizationGoal:
    "In a fault, identify the smallest possible water shutdown area and recommend where new valves may reduce disruption.",
  engineeringSafety:
    "AI provides recommendations with evidence, confidence, and required human founder or engineer confirmation. AI does not directly alter critical master infrastructure.",
} as const;

export const WATER_TECHNOLOGY_REGISTRY = {
  purpose:
    "Registry of every technology that may improve water networks. Difficult technologies are not rejected; they are tracked, scored, and connected when feasible.",
  technologies: [
    "telemetry",
    "SCADA",
    "RTU",
    "pressure sensors",
    "flow meters",
    "tank level sensors",
    "smart meters AMR AMI",
    "acoustic leak detection",
    "fiber optic sensing",
    "GPR underground scan",
    "drones",
    "thermal imaging",
    "satellite remote sensing",
    "SAR InSAR indicators",
    "DEM and 3D terrain",
    "EPANET hydraulic modeling",
    "AI leak prediction",
    "PDF OCR extraction",
    "photo as-built extraction",
  ],
  scoringDimensions: [
    "value",
    "cost",
    "complexity",
    "accuracy",
    "safety risk",
    "data requirements",
    "provider dependency",
    "founder visibility",
    "user visibility",
    "deployment readiness",
  ],
} as const;

export const WATER_SEARCH_AND_GUIDANCE = {
  searchRequirements: [
    "Greek",
    "Greeklish",
    "English",
    "misspellings",
    "without accents",
    "road",
    "area",
    "village",
    "zone number",
    "postal code optional",
    "new road not officially registered",
    "new area without official road",
  ],
  guidanceTools: [
    "my location",
    "target point",
    "distance to target",
    "line guidance",
    "nearby pipes",
    "nearest approved valve",
    "load network around current point",
    "load network around target",
  ],
} as const;

export const WATER_IMPLEMENTATION_SEQUENCE = [
  {
    phase: 1,
    name: "Founder Source Vault",
    goal: "Accept and protect large raw water files without breaking existing maps.",
  },
  {
    phase: 2,
    name: "Approval Inbox",
    goal: "Unify user requests, notes, photos, voice notes, and changes for founder review.",
  },
  {
    phase: 3,
    name: "Intelligence Sidebar",
    goal: "Add organized appendix buttons for faults, valves, area details, history, and approvals.",
  },
  {
    phase: 4,
    name: "Field Assistant Foundation",
    goal: "Allow simple workers to submit safe controlled field data.",
  },
  {
    phase: 5,
    name: "Change and Evidence Log",
    goal: "Track photos, notes, added/removed valves, extensions, pipe data, and field proof.",
  },
  {
    phase: 6,
    name: "Secondary Layer Registry",
    goal: "Prepare AutoCAD-derived layers without loading raw DXF in browser.",
  },
  {
    phase: 7,
    name: "Technology Registry",
    goal: "Track telemetry, satellite, sensors, hydraulic modeling, and future water technologies.",
  },
] as const;

export const WATER_NEXT_REAL_PATCH = {
  commit: "feat(water): add founder source vault and approval inbox foundation",
  scope: [
    "founder-only source vault foundation",
    "founder approval inbox foundation",
    "intelligence sidebar foundation",
    "no changes to existing live map rendering",
    "no raw DXF upload to public",
    "no user-visible engineering intelligence",
  ],
  mustNotTouch: [
    "existing water segment API",
    "existing working map network layer",
    "Vercel Blob production network URL",
    "auth device approval logic unless required",
    "master data files",
  ],
} as const;