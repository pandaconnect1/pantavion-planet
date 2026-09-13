import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createFounderSwarmAdmissionAssessment, parseSwarmAdmission, SWARM_ADMISSION_SCHEMA, SWARM_ADMISSION_POLICY } from "../core/sovereign/founder-swarm-admission-assessment.ts";
let assertions=0;
function equal(a,b,m){assert.equal(a,b,m);assertions++;}
function check(v,m){assert.ok(v,m);assertions++;}
function rejects(v,f){assert.throws(()=>parseSwarmAdmission(v),new RegExp(f));assertions++;}

const base={intentId:"intent-1",maxAgents:4,maxTotalBudget:100,maxLifetimeMinutes:60,proposals:[{id:"agent-1",role:"researcher",budget:20,createdAt:"2026-09-09T10:00:00.000Z",expiresAt:"2026-09-09T10:30:00.000Z",capabilities:[{capability:"research",scope:"technology_library",readOnly:true,expiresAt:"2026-09-09T10:30:00.000Z"}]}]};
const allowed=createFounderSwarmAdmissionAssessment(base);
equal(allowed.schema,SWARM_ADMISSION_SCHEMA,"schema");
equal(allowed.policyVersion,SWARM_ADMISSION_POLICY,"policy");
equal(allowed.decision.eligibleForOwnerReview,true,"eligible");
equal(allowed.decision.reasons.length,0,"no blockers");
equal(allowed.proposalCount,1,"count");
equal(allowed.totalBudget,20,"budget");
equal(allowed.swarmState,"withheld_pending_owner_admission","withheld");
equal(allowed.assessmentOnly,true,"assessment");
equal(allowed.agentsCreated,false,"not created");
equal(allowed.agentsActivated,false,"not activated");
equal(allowed.executionAllowed,false,"no execution");
equal(allowed.budgetConsumed,false,"no budget consumption");
equal(allowed.authorizationEffect,"none","no authorization");
check(/^[a-f0-9]{64}$/.test(allowed.receiptSha256),"receipt");
equal(createFounderSwarmAdmissionAssessment(structuredClone(base)).receiptSha256,allowed.receiptSha256,"deterministic");
check(createFounderSwarmAdmissionAssessment({...base,maxTotalBudget:99}).receiptSha256!==allowed.receiptSha256,"policy-bound receipt");

const overBudget=createFounderSwarmAdmissionAssessment({...base,maxTotalBudget:19});
equal(overBudget.decision.eligibleForOwnerReview,false,"budget blocked");
check(overBudget.decision.reasons.includes("total_budget_exceeds_policy"),"budget reason");
const long=createFounderSwarmAdmissionAssessment({...base,maxLifetimeMinutes:10});
check(long.decision.reasons.includes("lifetime_exceeds_policy:agent-1"),"lifetime reason");
const write=structuredClone(base); write.proposals[0].capabilities[0].readOnly=false;
check(createFounderSwarmAdmissionAssessment(write).decision.reasons.includes("write_capability_requires_separate_owner_admission:agent-1"),"write reason");

rejects(null,"object_required");
rejects({...base,extra:true},"unknown_request_field");
rejects({...base,proposals:[]},"proposal_count");
rejects({...base,maxAgents:0},"policy_floor");
rejects({...base,maxLifetimeMinutes:0},"policy_floor");
rejects({...base,maxTotalBudget:-1},"maxTotalBudget");
const role=structuredClone(base); role.proposals[0].role="admin"; rejects(role,"role");
const duplicate={...base,proposals:[base.proposals[0],base.proposals[0]]}; rejects(duplicate,"duplicate_agent_id");
const noCaps=structuredClone(base); noCaps.proposals[0].capabilities=[]; rejects(noCaps,"capability_count");
const extraAgent=structuredClone(base); extraAgent.proposals[0].extra=true; rejects(extraAgent,"unknown_agent_field");
const extraCap=structuredClone(base); extraCap.proposals[0].capabilities[0].extra=true; rejects(extraCap,"unknown_capability_field");
const badRead=structuredClone(base); badRead.proposals[0].capabilities[0].readOnly="yes"; rejects(badRead,"readOnly_boolean_required");
const badExpiry=structuredClone(base); badExpiry.proposals[0].expiresAt=badExpiry.proposals[0].createdAt; rejects(badExpiry,"expiresAt must be after createdAt");
const capAfter=structuredClone(base); capAfter.proposals[0].capabilities[0].expiresAt="2026-09-09T11:00:00.000Z"; rejects(capAfter,"capability expiry");

const route=readFileSync("app/api/owner/swarm-admission/assess/route.ts","utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"),"API founder");
check(route.includes('currentLevel !== "aal2"'),"API AAL2");
check(route.includes("MAX_REQUEST_BYTES = 24_576"),"body limit");
check(route.includes('"Cache-Control": "no-store, max-age=0"'),"no store");
check(!route.includes(".from(")&&!route.includes("activateEphemeralAgent"),"no mutation or activation");
const page=readFileSync("app/owner/control/swarm-admission/page.tsx","utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"),"page founder");
check(page.includes('currentLevel !== "aal2"'),"page AAL2");
const client=readFileSync("app/owner/control/swarm-admission/swarm-admission-client.tsx","utf8");
check(client.includes('aria-live="polite"'),"accessible result");
check(client.includes("agentsCreated"),"creation boundary visible");
check(client.includes("agentsActivated"),"activation boundary visible");
check(client.includes("executionAllowed"),"execution boundary visible");
check(client.includes("budgetConsumed"),"budget boundary visible");
console.log(`Ephemeral swarm admission contract: PASS (${assertions} assertions)`);
