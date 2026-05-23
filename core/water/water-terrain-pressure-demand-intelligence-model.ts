export type WaterTerrainPressureSignal =
  | "terrain_missing"
  | "elevation_drop_high_pressure_risk"
  | "elevation_gain_low_pressure_risk"
  | "prv_candidate"
  | "booster_or_zone_review"
  | "weak_pressure_point"
  | "demand_growth"
  | "old_network_under_new_urban_load"
  | "pipe_capacity_review"
  | "pressure_measurement_required"
  | "engineer_review_required"
  | "founder_admin_approval_required";

export type WaterTerrainPressureRiskLevel =
  | "unknown"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type WaterPressureDemandRecommendationKind =
  | "collect_elevation_data"
  | "collect_pressure_measurement"
  | "review_prv_candidate"
  | "review_booster_or_zone_split"
  | "review_pipe_capacity"
  | "review_demand_growth"
  | "inspect_weak_pressure_area"
  | "create_engineering_dossier"
  | "request_founder_admin_approval";

export type WaterPressureDemandRecommendation = {
  kind: WaterPressureDemandRecommendationKind;
  title: string;
  reason: string;
  priority: WaterTerrainPressureRiskLevel;
  requiresEngineerReview: boolean;
  requiresFounderAdminApproval: boolean;
};

export type WaterTerrainPressureDemandInput = {
  areaId?: string;
  areaLabel?: string;
  zoneId?: string;
  zoneLabel?: string;

  sourceElevationMeters?: number;
  targetElevationMeters?: number;
  sourcePressureBar?: number;

  measuredMinPressureBar?: number;
  measuredMaxPressureBar?: number;
  reportedLowPressureComplaints?: number;
  reportedHighPressureComplaints?: number;

  pipeDiameterMm?: number;
  pipeMaterial?: string;
  pipeAgeYears?: number;

  buildingCount?: number;
  highRiseBuildingCount?: number;
  estimatedFloorsMax?: number;
  estimatedPopulationGrowthPercent?: number;
  estimatedDemandGrowthPercent?: number;
  newDevelopmentCount?: number;

  hasTelemetryPressure?: boolean;
  hasRecentFieldPressureMeasurement?: boolean;
  hasHydraulicModel?: boolean;
};

export type WaterTerrainPressureDemandDecision = {
  areaId: string;
  areaLabel: string;
  zoneId: string;
  zoneLabel: string;
  estimatedStaticPressureBar: number | null;
  elevationDifferenceMeters: number | null;
  riskLevel: WaterTerrainPressureRiskLevel;
  signals: WaterTerrainPressureSignal[];
  recommendations: WaterPressureDemandRecommendation[];
  canAutoApprovePrv: false;
  canAutoChangeHydraulicDesign: false;
  engineerReviewRequired: boolean;
  founderAdminApprovalRequired: boolean;
  auditRequired: true;
  summary: string;
};

export const WATER_TERRAIN_PRESSURE_DEMAND_DOCTRINE = {
  title: "Pantavion Water Terrain / Pressure / Demand Intelligence",
  purpose:
    "Σύνδεση master/operational δικτύου με υψόμετρα, μορφολογία εδάφους, κτίρια, ανάπτυξη πληθυσμού, πίεση, ζήτηση, PRV candidates και αδύνατα σημεία.",
  hardRules: [
    "Το AI μπορεί να εισηγείται PRV ή pressure review, όχι να εγκρίνει μόνο του.",
    "Η εκτίμηση πίεσης από υψόμετρο είναι preliminary και χρειάζεται μηχανικό/μετρήσεις.",
    "Το terrain layer δεν αντικαθιστά hydraulic model.",
    "Για επίσημες αποφάσεις χρειάζονται δεδομένα: υψόμετρα, διάμετροι, υλικό, δεξαμενές, αντλίες, βάνες, ζήτηση, μετρήσεις.",
    "Αστική ανάπτυξη και νέες πολυκατοικίες πρέπει να συγκρίνονται με ηλικία/διάμετρο δικτύου.",
  ],
} as const;

function num(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function hasNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function highestRisk(
  current: WaterTerrainPressureRiskLevel,
  next: WaterTerrainPressureRiskLevel,
): WaterTerrainPressureRiskLevel {
  const rank: Record<WaterTerrainPressureRiskLevel, number> = {
    unknown: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return rank[next] > rank[current] ? next : current;
}

function addUniqueSignal(signals: WaterTerrainPressureSignal[], signal: WaterTerrainPressureSignal) {
  if (!signals.includes(signal)) signals.push(signal);
}

function addRecommendation(
  recommendations: WaterPressureDemandRecommendation[],
  recommendation: WaterPressureDemandRecommendation,
) {
  if (!recommendations.some((item) => item.kind === recommendation.kind && item.title === recommendation.title)) {
    recommendations.push(recommendation);
  }
}

export function estimateStaticPressureFromElevationBar(input: {
  sourceElevationMeters?: number;
  targetElevationMeters?: number;
  sourcePressureBar?: number;
}) {
  if (!hasNumber(input.sourceElevationMeters) || !hasNumber(input.targetElevationMeters)) {
    return null;
  }

  const elevationDifferenceMeters = input.sourceElevationMeters - input.targetElevationMeters;
  const elevationPressureBar = elevationDifferenceMeters * 0.0980665;
  return Number((elevationPressureBar + num(input.sourcePressureBar)).toFixed(2));
}

export function decideWaterTerrainPressureDemandIntelligence(
  input: WaterTerrainPressureDemandInput,
): WaterTerrainPressureDemandDecision {
  const signals: WaterTerrainPressureSignal[] = [];
  const recommendations: WaterPressureDemandRecommendation[] = [];

  const areaId = input.areaId || "unassigned-area";
  const areaLabel = input.areaLabel || "Άγνωστη περιοχή";
  const zoneId = input.zoneId || "unassigned-zone";
  const zoneLabel = input.zoneLabel || "Άγνωστη ζώνη";

  let riskLevel: WaterTerrainPressureRiskLevel = "low";

  const hasElevation = hasNumber(input.sourceElevationMeters) && hasNumber(input.targetElevationMeters);
  const elevationDifferenceMeters = hasElevation
    ? Number((input.sourceElevationMeters! - input.targetElevationMeters!).toFixed(2))
    : null;

  const estimatedStaticPressureBar = estimateStaticPressureFromElevationBar({
    sourceElevationMeters: input.sourceElevationMeters,
    targetElevationMeters: input.targetElevationMeters,
    sourcePressureBar: input.sourcePressureBar,
  });

  if (!hasElevation) {
    addUniqueSignal(signals, "terrain_missing");
    riskLevel = highestRisk(riskLevel, "medium");
    addRecommendation(recommendations, {
      kind: "collect_elevation_data",
      title: "Συμπλήρωση υψομετρικών δεδομένων",
      reason: "Δεν υπάρχουν πλήρη υψόμετρα πηγής/στόχου για σοβαρή εκτίμηση πίεσης.",
      priority: "medium",
      requiresEngineerReview: true,
      requiresFounderAdminApproval: false,
    });
  }

  if (estimatedStaticPressureBar !== null) {
    if (estimatedStaticPressureBar > 8) {
      addUniqueSignal(signals, "elevation_drop_high_pressure_risk");
      addUniqueSignal(signals, "prv_candidate");
      riskLevel = highestRisk(riskLevel, estimatedStaticPressureBar > 12 ? "high" : "medium");
      addRecommendation(recommendations, {
        kind: "review_prv_candidate",
        title: "Πιθανό PRV / pressure reduction review",
        reason: "Η εκτίμηση στατικής πίεσης από υψομετρική διαφορά είναι υψηλή.",
        priority: estimatedStaticPressureBar > 12 ? "high" : "medium",
        requiresEngineerReview: true,
        requiresFounderAdminApproval: true,
      });
    }

    if (estimatedStaticPressureBar < 1.5) {
      addUniqueSignal(signals, "elevation_gain_low_pressure_risk");
      addUniqueSignal(signals, "weak_pressure_point");
      riskLevel = highestRisk(riskLevel, "high");
      addRecommendation(recommendations, {
        kind: "review_booster_or_zone_split",
        title: "Πιθανό weak pressure point / booster ή αλλαγή ζώνης",
        reason: "Η εκτίμηση πίεσης είναι χαμηλή για ασφαλή λειτουργική παροχή.",
        priority: "high",
        requiresEngineerReview: true,
        requiresFounderAdminApproval: true,
      });
    }
  }

  if (hasNumber(input.measuredMinPressureBar) && input.measuredMinPressureBar < 1.5) {
    addUniqueSignal(signals, "weak_pressure_point");
    riskLevel = highestRisk(riskLevel, "high");
  }

  if (hasNumber(input.measuredMaxPressureBar) && input.measuredMaxPressureBar > 8) {
    addUniqueSignal(signals, "prv_candidate");
    riskLevel = highestRisk(riskLevel, "high");
  }

  if (num(input.reportedLowPressureComplaints) > 0 || num(input.reportedHighPressureComplaints) > 0) {
    addUniqueSignal(signals, "pressure_measurement_required");
    riskLevel = highestRisk(riskLevel, "medium");
    addRecommendation(recommendations, {
      kind: "collect_pressure_measurement",
      title: "Πραγματική μέτρηση πίεσης",
      reason: "Υπάρχουν παράπονα ή ενδείξεις πίεσης που χρειάζονται επιτόπια μέτρηση.",
      priority: "medium",
      requiresEngineerReview: true,
      requiresFounderAdminApproval: false,
    });
  }

  const demandGrowth =
    num(input.estimatedDemandGrowthPercent) +
    Math.max(0, num(input.estimatedPopulationGrowthPercent) / 2) +
    num(input.highRiseBuildingCount) * 5 +
    num(input.newDevelopmentCount) * 4;

  if (demandGrowth >= 20) {
    addUniqueSignal(signals, "demand_growth");
    riskLevel = highestRisk(riskLevel, demandGrowth >= 50 ? "high" : "medium");
    addRecommendation(recommendations, {
      kind: "review_demand_growth",
      title: "Έλεγχος αυξημένης ζήτησης",
      reason: "Η περιοχή δείχνει αύξηση ζήτησης λόγω ανάπτυξης, πληθυσμού ή πολυκατοικιών.",
      priority: demandGrowth >= 50 ? "high" : "medium",
      requiresEngineerReview: true,
      requiresFounderAdminApproval: false,
    });
  }

  if (
    (num(input.pipeAgeYears) >= 25 || (hasNumber(input.pipeDiameterMm) && input.pipeDiameterMm < 90)) &&
    demandGrowth >= 20
  ) {
    addUniqueSignal(signals, "old_network_under_new_urban_load");
    addUniqueSignal(signals, "pipe_capacity_review");
    riskLevel = highestRisk(riskLevel, "high");
    addRecommendation(recommendations, {
      kind: "review_pipe_capacity",
      title: "Έλεγχος επάρκειας παλιού δικτύου",
      reason: "Παλαιό ή μικρής διαμέτρου δίκτυο φαίνεται να εξυπηρετεί αυξημένη αστική ζήτηση.",
      priority: "high",
      requiresEngineerReview: true,
      requiresFounderAdminApproval: true,
    });
  }

  if (!input.hasRecentFieldPressureMeasurement && !input.hasTelemetryPressure) {
    addUniqueSignal(signals, "pressure_measurement_required");
    addRecommendation(recommendations, {
      kind: "collect_pressure_measurement",
      title: "Χρειάζεται μέτρηση πεδίου ή τηλεμετρία",
      reason: "Δεν υπάρχει πρόσφατη πραγματική μέτρηση πίεσης για επιβεβαίωση.",
      priority: "low",
      requiresEngineerReview: false,
      requiresFounderAdminApproval: false,
    });
  }

  if (!input.hasHydraulicModel && riskLevel !== "low") {
    addUniqueSignal(signals, "engineer_review_required");
    addRecommendation(recommendations, {
      kind: "create_engineering_dossier",
      title: "Engineering dossier πριν από επίσημη υδραυλική απόφαση",
      reason: "Υπάρχει ρίσκο πίεσης/ζήτησης αλλά δεν έχει συνδεθεί πλήρες hydraulic model.",
      priority: riskLevel,
      requiresEngineerReview: true,
      requiresFounderAdminApproval: true,
    });
  }

  addUniqueSignal(signals, "founder_admin_approval_required");

  return {
    areaId,
    areaLabel,
    zoneId,
    zoneLabel,
    estimatedStaticPressureBar,
    elevationDifferenceMeters,
    riskLevel,
    signals,
    recommendations,
    canAutoApprovePrv: false,
    canAutoChangeHydraulicDesign: false,
    engineerReviewRequired: signals.includes("engineer_review_required") || riskLevel === "high" || riskLevel === "critical",
    founderAdminApprovalRequired: true,
    auditRequired: true,
    summary:
      `Terrain Pressure Demand: area=${areaLabel}, zone=${zoneLabel}, ` +
      `elevationDiff=${elevationDifferenceMeters ?? "unknown"}m, ` +
      `estimatedStaticPressure=${estimatedStaticPressureBar ?? "unknown"}bar, ` +
      `demandGrowthScore=${demandGrowth.toFixed(1)}, risk=${riskLevel}, ` +
      `signals=${signals.length}, recommendations=${recommendations.length}.`,
  };
}

export const WATER_TERRAIN_PRESSURE_DEMAND_NEXT_ACTIONS = [
  "Connect terrain/elevation data to network nodes",
  "Connect building and urban growth indicators",
  "Create pressure risk overlay",
  "Create PRV candidate overlay",
  "Create weak pressure point overlay",
  "Export engineering review dossier",
] as const;