/** Pure planning layer for approved valve changes. No database or DWG writes. */
import type { WaterMapKey, WaterValveRegistryEntry } from "./water-valve-crossmap-registry";

export type ValveChangeProposal = {
  proposalId: string;
  submittedBy: string;
  sourceMap: WaterMapKey;
  requestedNumber: string | null;
  area: string | null;
  zone: string | null;
  street: string | null;
  address: string | null;
  sourceFeatureId: string;
  sourceRevision: string;
  evidence: string[];
  kind: "NEW_VALVE" | "CORRECT_EXISTING";
};
export type ValveChangeApproval = {
  proposalId: string;
  approvedBy: string;
  approvedAt: string;
  status: "APPROVED" | "REJECTED";
};
export type ValvePropagationPlan = {
  proposalId: string;
  number: string;
  maps: readonly WaterMapKey[];
  status: "READY_FOR_REVIEW" | "BLOCKED";
  blockers: string[];
};
/**
 * This function only constructs a plan. It does not generate numbers, edit
 * source CAD, bypass approvals, or claim features are rendered in the viewer.
 * Number allocation must be transactional against the authoritative database.
 */
export function planValvePropagation(
  proposal: ValveChangeProposal,
  approval: ValveChangeApproval | null,
  existing: readonly WaterValveRegistryEntry[],
): ValvePropagationPlan {
  const blockers: string[] = [];
  if (!proposal.proposalId || !proposal.sourceFeatureId || !proposal.sourceRevision)
    blockers.push("missing_source_identity");
  if (!proposal.evidence.length) blockers.push("missing_source_evidence");
  if (!approval || approval.proposalId !== proposal.proposalId || approval.status !== "APPROVED" ||
      !approval.approvedBy || !approval.approvedAt || Number.isNaN(Date.parse(approval.approvedAt)))
    blockers.push("approval_required");
  if (!proposal.requestedNumber?.trim())
    blockers.push("transactional_number_allocation_required");
  if (proposal.requestedNumber && existing.some(e =>
      e.canonicalNumber === proposal.requestedNumber &&
      e.references[proposal.sourceMap]?.sourceFeatureId !== proposal.sourceFeatureId))
    blockers.push("number_collision_requires_review");
  return {
    proposalId: proposal.proposalId,
    number: proposal.requestedNumber?.trim() ?? "",
    maps: ["A", "B", "C", "D", "E"],
    status: blockers.length ? "BLOCKED" : "READY_FOR_REVIEW",
    blockers,
  };
}
/** CSV export for a verified registry snapshot, suitable for printing/import. */
export function exportValveRegistryCsv(entries: readonly WaterValveRegistryEntry[]): string {
  const headers = ["number","area","zone","street","address","verification","maps"];
  const cell = (value: string) => {
    const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  const rows = [...entries].sort((a,b) =>
    [a.area??"",a.zone??"",a.street??"",a.canonicalNumber].join("|").localeCompare(
    [b.area??"",b.zone??"",b.street??"",b.canonicalNumber].join("|"), "el")
  ).map(e => [
    e.canonicalNumber,e.area??"",e.zone??"",e.street??"",e.address??"",
    e.verification,Object.keys(e.references).sort().join(","),
  ].map(cell).join(","));
  return [headers.join(","),...rows].join("\r\n");
}
