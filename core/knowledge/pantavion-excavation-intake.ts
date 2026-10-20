/**
 * Read-only recovery intake planner for Pantavion historical excavations.
 * Converts evidenced findings into reviewable capability candidates.
 * It never executes jobs, modifies production data or claims live verification.
 */
import type { CapabilityRecord, CapabilityEvidence, CapabilityState } from "../registry/pantavion-extensible-capability-registry";
import { buildCapabilityRegistry } from "../registry/pantavion-extensible-capability-registry";

export type ExcavationFinding = {
  source: string;
  sourceRecordId: string;
  title: string;
  kernelId: string;
  chapterId: string;
  topicId: string;
  sectionId: string;
  commit?: string;
  path?: string;
  line?: number;
};
export type IntakeQuarantine = { sourceRecordId: string; reason: string };
export type IntakePlan = {
  candidates: CapabilityRecord[];
  quarantine: IntakeQuarantine[];
  conflicts: { id: string; reason: string }[];
  counts: { received: number; accepted: number; quarantined: number };
};
const SAFE_SEGMENT = /^[a-z0-9][a-z0-9._-]{0,79}$/;
const MAX_FINDINGS = 10000;
function evidenceOf(f: ExcavationFinding): CapabilityEvidence {
  return { source: f.source, sourceRecordId: f.sourceRecordId, ...(f.commit ? { commit: f.commit } : {}), ...(f.path ? { path: f.path } : {}), ...(f.line ? { line: f.line } : {}) };
}
/** Stable identity is based on source and record ID, never the translated title. */
function stableId(source: string, recordId: string): string {
  const bytes = new TextEncoder().encode(source + "\u0000" + recordId);
  // Hex encoding is collision-free for bounded byte sequences, unlike a short hash.
  return "exc-" + Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
export function planExcavationIntake(findings: readonly ExcavationFinding[]): IntakePlan {
  if (findings.length > MAX_FINDINGS) throw new Error("Excavation batch exceeds limit");
  const candidates: CapabilityRecord[] = [];
  const quarantine: IntakeQuarantine[] = [];
  for (const f of findings) {
    const dimensions = [f.kernelId, f.chapterId, f.topicId, f.sectionId];
    if (!f.source.trim() || !f.sourceRecordId.trim() || !f.title.trim() ||
        f.title.length > 500 || f.source.length > 160 || f.sourceRecordId.length > 160 ||
        !dimensions.every(x => SAFE_SEGMENT.test(x)) ||
        (f.line !== undefined && (!Number.isSafeInteger(f.line) || f.line < 1))) {
      quarantine.push({sourceRecordId: f.sourceRecordId, reason: "invalid_or_untraceable_finding"});
      continue;
    }
    const record: CapabilityRecord = {
      id: stableId(f.source, f.sourceRecordId),
      kernelId: f.kernelId, chapterId: f.chapterId, topicId: f.topicId, sectionId: f.sectionId,
      names: {en: f.title}, evidence: [evidenceOf(f)], state: "discovered" as CapabilityState,
      agentWorkOrderIds: []
    };
    candidates.push(record);
  }
  const merged = buildCapabilityRegistry(candidates);
  return {candidates: merged.capabilities, conflicts: merged.conflicts, quarantine,
    counts: {received: findings.length, accepted: merged.capabilities.length, quarantined: quarantine.length}};
}
