/**
 * Pantavion evidence and live-verification contracts.
 * A successful build is not a successful live deployment.
 * Every source must retain license, jurisdiction, retrieval time, and evidence.
 */
export type SourceAuthority = "official_standard" | "government" | "academic" | "provider_documentation" | "internal" | "other";
export type SourceRecord = {
  id: string;
  url: string;
  authority: SourceAuthority;
  publisher: string;
  retrievedAt: string;
  jurisdiction?: string;
  license?: string;
  allowedUses: Array<"reference" | "quotation" | "redistribution" | "model_training" | "commercial_use">;
  revision?: string;
  checksum?: string;
};
export type GapRecord = {
  id: string;
  capabilityId: string;
  sourceIds: string[];
  expectedBehavior: string;
  observedBehavior: string;
  severity: "low" | "medium" | "high" | "critical";
  state: "open" | "investigating" | "fix_in_progress" | "ready_for_verification" | "resolved" | "blocked";
};
export type LiveProof = {
  capabilityId: string;
  releaseCommit: string;
  deploymentId: string;
  environment: "production";
  checkedAt: string;
  endpoint: string;
  httpStatus: number;
  expectedStatus: number;
  evidenceArtifact: string;
  checkedBy: string;
  checks: Array<{name:string;passed:boolean;detail?:string}>;
};
export function evaluateLiveProof(proof: LiveProof | null): {verifiedLive:boolean;reason:string} {
  if (!proof) return {verifiedLive:false,reason:"missing_live_proof"};
  if (!proof.capabilityId || !proof.releaseCommit || !proof.deploymentId || !proof.evidenceArtifact ||
      !proof.checkedAt || !proof.endpoint || !proof.checkedBy) {
    return {verifiedLive:false,reason:"incomplete_provenance"};
  }
  if (!/^https:\/\//.test(proof.endpoint)) return {verifiedLive:false,reason:"insecure_endpoint"};
  if (proof.httpStatus !== proof.expectedStatus) return {verifiedLive:false,reason:"unexpected_status"};
  if (!proof.checks.length || proof.checks.some(c=>!c.passed)) return {verifiedLive:false,reason:"failed_checks"};
  return {verifiedLive:true,reason:"evidence_satisfies_contract"};
}
export function evaluateSourceUse(source: SourceRecord, intendedUse: SourceRecord["allowedUses"][number]) {
  if (!source.publisher || !source.retrievedAt || !source.url || !source.license) {
    return {allowed:false,reason:"source_metadata_incomplete"};
  }
  if (!source.allowedUses.includes(intendedUse)) return {allowed:false,reason:"use_not_authorized"};
  return {allowed:true,reason:"source_permission_recorded"};
}
export type RecoveryAction = "retry" | "failover" | "isolate" | "approval_required";
export function chooseRecoveryAction(input: {
  attempts: number; maxAttempts: number; alternateProviderAvailable: boolean;
  protectedOperation: boolean; transientFailure: boolean;
}): RecoveryAction {
  if (input.protectedOperation) return "approval_required";
  if (input.transientFailure && input.attempts < input.maxAttempts) return "retry";
  if (input.alternateProviderAvailable) return "failover";
  return "isolate";
}
