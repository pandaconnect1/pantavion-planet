export type SovereignVerificationStage = "CODED" | "TESTED" | "MERGED" | "DEPLOYED" | "VERIFIED_LIVE";
export type SovereignTruthLocation = "OPEN_PR" | "MAIN" | "PRODUCTION";

export type SovereignVerificationRecord = {
  id: string;
  title: string;
  domain: string;
  stage: SovereignVerificationStage;
  truthLocation: SovereignTruthLocation;
  pr: number;
  exactHead: string;
  base: string;
  verifiedAt: string;
  workflowCount: number;
  verificationReceipt: string;
  evidenceArtifact?: string;
  parentPr?: number;
  parentExactHead?: string;
  merged: boolean;
  deployed: boolean;
  verifiedLive: boolean;
  executionAuthorized: boolean;
  nextTransition: SovereignVerificationStage;
};

export const sovereignVerificationSnapshotAt = "2026-09-10T04:10:26.000Z";

export const sovereignVerificationRecords: SovereignVerificationRecord[] = [
  { id:"intent-firewall-workbench", title:"Founder Intent Firewall Workbench", domain:"Intent Firewall", stage:"TESTED", truthLocation:"OPEN_PR", pr:476, exactHead:"4fa03685a7277d4696873996ddd0b5b94b6514e0", base:"main", verifiedAt:"2026-09-09T13:45:06.000Z", workflowCount:11, verificationReceipt:"5602900011", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"technology-library-workbench", title:"Technology Library Assessment Workbench", domain:"Technology Library", stage:"TESTED", truthLocation:"OPEN_PR", pr:477, exactHead:"b3a3ccf30fc9f0478264fb5ed9473f0983701407", base:"main", verifiedAt:"2026-09-09T14:49:26.000Z", workflowCount:11, verificationReceipt:"5603852081", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"agent-capability-budget-workbench", title:"Agent Capability & Budget Workbench", domain:"Agent governance", stage:"TESTED", truthLocation:"OPEN_PR", pr:478, exactHead:"94791f0ab08fc8746d37977bb73e597fe8c4bf2a", base:"main", verifiedAt:"2026-09-09T15:35:18.000Z", workflowCount:11, verificationReceipt:"5604505353", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"disconnected-edge-preflight-workbench", title:"Disconnected / Edge Preflight Workbench", domain:"Edge execution", stage:"TESTED", truthLocation:"OPEN_PR", pr:479, exactHead:"67baa0fab093a7406af703619dec89bd48304d0e", base:"main", verifiedAt:"2026-09-09T17:36:22.000Z", workflowCount:11, verificationReceipt:"5606127216", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-master-register", title:"Innovation Master Register", domain:"Recovery and innovation", stage:"TESTED", truthLocation:"OPEN_PR", pr:480, exactHead:"6aaf4aa338597f545ff3fa113ac6946d21074775", base:"main", verifiedAt:"2026-09-09T22:00:57.000Z", workflowCount:12, verificationReceipt:"5609336071", evidenceArtifact:"10126678770", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"ephemeral-agent-swarm-workbench", title:"Ephemeral Agent Swarm Admission Workbench", domain:"Ephemeral Agent Swarm", stage:"TESTED", truthLocation:"OPEN_PR", pr:481, exactHead:"0d19340415546a63d7148a82d8b3746ff5e49bce", base:"main", verifiedAt:"2026-09-09T18:44:54.000Z", workflowCount:11, verificationReceipt:"5606983319", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"intent-to-outcome-workbench", title:"Intent-to-Outcome Workbench", domain:"Intent-to-Outcome Fabric", stage:"TESTED", truthLocation:"OPEN_PR", pr:482, exactHead:"0d90c1906e0f22120eb00ee3a2c194065763f49b", base:"main", verifiedAt:"2026-09-09T20:01:26.000Z", workflowCount:11, verificationReceipt:"5607938670", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-semantic-atomization", title:"Deterministic Mechanism Atomization", domain:"Recovery classification", stage:"TESTED", truthLocation:"OPEN_PR", pr:483, exactHead:"308fd7504478e0eac0913845552b68618bb788f3", base:"feature/innovation-master-register-20260909", verifiedAt:"2026-09-10T00:11:56.000Z", workflowCount:7, verificationReceipt:"5610592345", evidenceArtifact:"10128293769", parentPr:480, parentExactHead:"6aaf4aa338597f545ff3fa113ac6946d21074775", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-capability-mapping", title:"Capability Candidate Mapping", domain:"Technology classification", stage:"TESTED", truthLocation:"OPEN_PR", pr:484, exactHead:"9c584cadfc78f5d25fb0b3d261bd7ac64bfbc1ab", base:"feature/innovation-semantic-atomization-20260910", verifiedAt:"2026-09-10T01:16:18.000Z", workflowCount:7, verificationReceipt:"5611188679", evidenceArtifact:"10132110753", parentPr:483, parentExactHead:"308fd7504478e0eac0913845552b68618bb788f3", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-semantic-overlap-review", title:"Semantic Overlap Review Queue", domain:"Recovery classification", stage:"TESTED", truthLocation:"OPEN_PR", pr:485, exactHead:"b2668df57cf189a232d1f0c8b31aaf65c9d01124", base:"feature/innovation-capability-mapping-20260910", verifiedAt:"2026-09-10T02:58:31.000Z", workflowCount:7, verificationReceipt:"5611972804", evidenceArtifact:"10134523485", parentPr:484, parentExactHead:"9c584cadfc78f5d25fb0b3d261bd7ac64bfbc1ab", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-maturity-evidence-review", title:"Maturity Evidence Review Queue", domain:"Evidence and maturity", stage:"TESTED", truthLocation:"OPEN_PR", pr:486, exactHead:"8d4efe98738779d1dad1dcd8dcf77bcf93fc0b8b", base:"feature/innovation-semantic-overlap-review-20260910", verifiedAt:"2026-09-10T04:10:26.000Z", workflowCount:7, verificationReceipt:"5612866959", evidenceArtifact:"10136078802", parentPr:485, parentExactHead:"b2668df57cf189a232d1f0c8b31aaf65c9d01124", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
];

const stageOrder: SovereignVerificationStage[] = ["CODED","TESTED","MERGED","DEPLOYED","VERIFIED_LIVE"];
const shaPattern = /^[a-f0-9]{40}$/;

export function validateSovereignVerificationCatalog(records = sovereignVerificationRecords): string[] {
  const blockers: string[] = [];
  const ids = new Set<string>();
  const prs = new Set<number>();
  const byPr = new Map(records.map(record => [record.pr, record]));
  for (const record of records) {
    if (ids.has(record.id)) blockers.push("duplicate_id:" + record.id);
    if (prs.has(record.pr)) blockers.push("duplicate_pr:" + record.pr);
    ids.add(record.id);
    prs.add(record.pr);
    if (!shaPattern.test(record.exactHead)) blockers.push("invalid_exact_head:" + record.id);
    if (!Number.isFinite(Date.parse(record.verifiedAt))) blockers.push("invalid_verified_at:" + record.id);
    if (record.stage === "TESTED" && (record.workflowCount < 1 || !record.verificationReceipt.trim())) blockers.push("tested_evidence_missing:" + record.id);
    if (record.truthLocation === "OPEN_PR" && (record.merged || record.deployed || record.verifiedLive)) blockers.push("open_pr_overclaim:" + record.id);
    if (record.deployed && !record.merged) blockers.push("deployed_without_merge:" + record.id);
    if (record.verifiedLive && !record.deployed) blockers.push("verified_live_without_deploy:" + record.id);
    if (record.executionAuthorized) blockers.push("execution_authority_forbidden:" + record.id);
    const currentRank = stageOrder.indexOf(record.stage);
    const nextRank = stageOrder.indexOf(record.nextTransition);
    if (nextRank !== currentRank + 1) blockers.push("non_adjacent_next_transition:" + record.id);
    if ((record.parentPr === undefined) !== (record.parentExactHead === undefined)) blockers.push("incomplete_parent_binding:" + record.id);
    if (record.parentPr !== undefined) {
      const parent = byPr.get(record.parentPr);
      if (!parent || parent.exactHead !== record.parentExactHead) blockers.push("parent_binding_mismatch:" + record.id);
    }
  }
  return [...new Set(blockers)];
}

export const sovereignVerificationDoctrine = {
  rule: "TESTED evidence on an open pull request is repository evidence only. It is not merged, deployed, production-visible or VERIFIED_LIVE.",
  releaseRule: "Every transition remains adjacent and requires its own exact evidence. This catalog has no merge, deployment, production-write or execution authority.",
};
