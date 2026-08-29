export type TechnologySource = "pantavion_native" | "open_source" | "open_standard" | "external_provider";
export type TechnologyMaturity = "research" | "prototype" | "production_proven";
export type TechnologyReadiness = "hold" | "prototype_ready" | "owner_approval_required";

export interface TechnologyEvidence {
  kind: "source" | "benchmark" | "security" | "privacy" | "license";
  reference: string;
  digest?: string;
  observedAt: string;
}

export interface TechnologyLibraryEntry {
  id: string;
  name: string;
  capability: string;
  source: TechnologySource;
  maturity: TechnologyMaturity;
  licenseId?: string;
  commercialUseAllowed: boolean;
  sourceAvailable: boolean;
  reversibleIntegration: boolean;
  securityReviewed: boolean;
  privacyReviewed: boolean;
  evidence: TechnologyEvidence[];
}

export interface TechnologyLibraryAssessment {
  entryId: string;
  readiness: TechnologyReadiness;
  blockers: string[];
  deploymentAuthorized: false;
}

export function assessTechnologyLibraryEntry(
  entry: TechnologyLibraryEntry,
): TechnologyLibraryAssessment {
  const blockers: string[] = [];
  const evidenceKinds = new Set(entry.evidence.map((item) => item.kind));

  if (!entry.id.trim() || !entry.name.trim() || !entry.capability.trim()) {
    blockers.push("identity_or_capability_missing");
  }
  for (const evidence of entry.evidence) {
    if (!evidence.reference.trim()) blockers.push("evidence_reference_missing:" + evidence.kind);
    if (!Number.isFinite(Date.parse(evidence.observedAt))) {
      blockers.push("evidence_timestamp_invalid:" + evidence.kind);
    }
  }

  const matchingLicenseEvidence = entry.evidence.some(
    (item) => item.kind === "license" && item.reference.trim() === entry.licenseId?.trim(),
  );
  if (!entry.licenseId?.trim() || !evidenceKinds.has("license")) blockers.push("license_evidence_missing");
  else if (!matchingLicenseEvidence) blockers.push("license_evidence_mismatch");
  if (!entry.commercialUseAllowed) blockers.push("commercial_use_not_allowed");
  if (!entry.sourceAvailable && entry.source !== "external_provider") blockers.push("source_unavailable");
  if (!entry.reversibleIntegration) blockers.push("rollback_unavailable");
  if (!entry.securityReviewed || !evidenceKinds.has("security")) blockers.push("security_review_missing");
  if (!entry.privacyReviewed || !evidenceKinds.has("privacy")) blockers.push("privacy_review_missing");
  if (!evidenceKinds.has("source") || !evidenceKinds.has("benchmark")) {
    blockers.push("technical_evidence_incomplete");
  }

  if (blockers.length) {
    return {
      entryId: entry.id,
      readiness: "hold",
      blockers: [...new Set(blockers)],
      deploymentAuthorized: false,
    };
  }

  return {
    entryId: entry.id,
    readiness: entry.source === "external_provider" ? "owner_approval_required" : "prototype_ready",
    blockers: [],
    deploymentAuthorized: false,
  };
}
