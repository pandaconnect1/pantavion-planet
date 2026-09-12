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
  researchQuality?: "BLOCKED" | "VALIDATED" | "RESEARCH_READY";
  researchEligible?: boolean;
  qualityBlocker?: string;
  merged: boolean;
  deployed: boolean;
  verifiedLive: boolean;
  executionAuthorized: boolean;
  nextTransition: SovereignVerificationStage;
};

export const sovereignVerificationSnapshotAt = "2026-09-12T10:05:26.000Z";

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
  { id:"founder-innovation-review-preflight", title:"Founder Innovation Review Workbench", domain:"Founder evidence review", stage:"TESTED", truthLocation:"OPEN_PR", pr:488, exactHead:"9e940758a3cc2d445ae440e0f5d5e46a17bcc116", base:"feature/innovation-maturity-evidence-review-20260910", verifiedAt:"2026-09-10T06:40:16.000Z", workflowCount:8, verificationReceipt:"5614290805", evidenceArtifact:"10139710606", parentPr:486, parentExactHead:"8d4efe98738779d1dad1dcd8dcf77bcf93fc0b8b", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"sovereign-admission-bundle", title:"Sovereign Receipt-chain Admission Bundle", domain:"Owner Control integration", stage:"TESTED", truthLocation:"OPEN_PR", pr:489, exactHead:"34ef8f01c0ae53412a4b07ae93f8a13c711c2a16", base:"main", verifiedAt:"2026-09-10T06:57:58.000Z", workflowCount:12, verificationReceipt:"5614469215", evidenceArtifact:"10140201992", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-maturity-review-batches", title:"Bounded Maturity Review Batches", domain:"Recovery classification", stage:"TESTED", truthLocation:"OPEN_PR", pr:490, exactHead:"8365040942e148c0bb6661058d75f482f2c5aed0", base:"feature/innovation-maturity-evidence-review-20260910", verifiedAt:"2026-09-10T08:17:05.000Z", workflowCount:7, verificationReceipt:"5615412404", evidenceArtifact:"10142655927", parentPr:486, parentExactHead:"8d4efe98738779d1dad1dcd8dcf77bcf93fc0b8b", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"innovation-review-campaign-plan", title:"Deterministic Innovation Review Campaign Plan", domain:"Recovery classification", stage:"TESTED", truthLocation:"OPEN_PR", pr:491, exactHead:"212f79a084eefb1521dc59d1c45245d687630f39", base:"feature/innovation-maturity-review-batches-20260910", verifiedAt:"2026-09-10T12:31:05.000Z", workflowCount:7, verificationReceipt:"5618710980", evidenceArtifact:"10151859238", parentPr:490, parentExactHead:"8365040942e148c0bb6661058d75f482f2c5aed0", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"preseed-research-shortlist", title:"Evidence-first PRE-SEED Research Shortlist", domain:"Prior-art research triage", stage:"TESTED", truthLocation:"OPEN_PR", pr:492, exactHead:"85579e30db5b5bf84b3d40bd6d5f2ba9d87dcf1b", base:"feature/innovation-review-campaign-plan-20260910", verifiedAt:"2026-09-10T13:28:42.000Z", workflowCount:7, verificationReceipt:"5619491177", evidenceArtifact:"10154289683", parentPr:491, parentExactHead:"212f79a084eefb1521dc59d1c45245d687630f39", researchQuality:"BLOCKED", researchEligible:false, qualityBlocker:"140 code/config fragments, 6 literals/identifiers and 4 incomplete fragments; 0 coherent technical mechanisms. Rejected for innovation research by PR #494.", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"preseed-prior-art-dossiers", title:"PRE-SEED Prior-Art Research Dossiers", domain:"Prior-art research planning", stage:"TESTED", truthLocation:"OPEN_PR", pr:493, exactHead:"1b6717ce095e38d4a9c489742a4da63fa07ddc2e", base:"feature/preseed-research-shortlist-20260910", verifiedAt:"2026-09-10T14:32:09.000Z", workflowCount:7, verificationReceipt:"5620380543", evidenceArtifact:"10157089662", parentPr:492, parentExactHead:"85579e30db5b5bf84b3d40bd6d5f2ba9d87dcf1b", researchQuality:"BLOCKED", researchEligible:false, qualityBlocker:"Research dossiers are deterministic but blocked by the invalid #492 parent population; 750 tasks remain unexecuted.", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"preseed-shortlist-quality-audit", title:"PRE-SEED Shortlist Research Quality Audit", domain:"Research quality control", stage:"TESTED", truthLocation:"OPEN_PR", pr:494, exactHead:"8d00bae9ea614e42309065b5ee74110cc93c62cd", base:"feature/preseed-research-shortlist-20260910", verifiedAt:"2026-09-10T16:31:00.000Z", workflowCount:7, verificationReceipt:"5622042586", evidenceArtifact:"10162289979", parentPr:492, parentExactHead:"85579e30db5b5bf84b3d40bd6d5f2ba9d87dcf1b", researchQuality:"VALIDATED", researchEligible:false, qualityBlocker:"Validated fail-closed rejection: 0/150 coherent technical mechanisms and 0 research-eligible items.", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"coherent-invention-disclosures", title:"Coherent Invention Disclosures", domain:"Prior-art research preparation", stage:"TESTED", truthLocation:"OPEN_PR", pr:495, exactHead:"b2434d35fcd0d7b8f024c152ed61eaaf8f6fad6b", base:"feature/preseed-shortlist-quality-audit-20260910", verifiedAt:"2026-09-10T17:11:00.000Z", workflowCount:7, verificationReceipt:"5622537250", evidenceArtifact:"10163147674", parentPr:494, parentExactHead:"8d00bae9ea614e42309065b5ee74110cc93c62cd", researchQuality:"RESEARCH_READY", researchEligible:true, qualityBlocker:"Two coherent technical disclosures are ready for professional prior-art research; novelty and patentability remain unverified.", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
  { id:"cross-cultural-understanding-assessment", title:"Cross-Cultural Understanding Assessment Core", domain:"Translation and intercultural repair", stage:"TESTED", truthLocation:"OPEN_PR", pr:497, exactHead:"8197f03fd0d88ffe780ae44fdb28e45745c30a60", base:"main", verifiedAt:"2026-09-12T10:05:26.000Z", workflowCount:11, verificationReceipt:"5645230145", evidenceArtifact:"10296150998", merged:false, deployed:false, verifiedLive:false, executionAuthorized:false, nextTransition:"MERGED" },
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
    if (record.researchQuality === "BLOCKED" && (record.researchEligible !== false || !record.qualityBlocker?.trim())) blockers.push("research_quality_block_incomplete:" + record.id);
    if (record.researchQuality === "VALIDATED" && record.researchEligible !== false) blockers.push("research_quality_verdict_inconsistent:" + record.id);
    if (record.researchQuality === "RESEARCH_READY" && (record.researchEligible !== true || !record.qualityBlocker?.trim())) blockers.push("research_ready_evidence_incomplete:" + record.id);
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
