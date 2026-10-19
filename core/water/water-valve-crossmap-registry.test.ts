import test from "node:test";
import assert from "node:assert/strict";
import { resolveValveAcrossMaps, validateValveRegistryEntry, type WaterValveRegistryEntry } from "./water-valve-crossmap-registry";
import { planValvePropagation, exportValveRegistryCsv } from "./water-valve-propagation-plan";

const entry: WaterValveRegistryEntry = {
  canonicalNumber: "125", area: "Area", zone: "Zone", street: "Street", address: "1",
  verification: "verified", evidence: ["CAD attribute + field confirmation"],
  references: {
    A: {map:"A",sourceFeatureId:"a-1",sourceNumber:"125",longitude:null,latitude:null,sourceRevision:"rev-a"},
    B: {map:"B",sourceFeatureId:"b-1",sourceNumber:"125",longitude:null,latitude:null,sourceRevision:"rev-b"},
  },
};

test("verified identity resolves same valve across maps", () => {
  assert.equal(resolveValveAcrossMaps([entry],"A","a-1","B")?.sourceFeatureId,"b-1");
  assert.equal(resolveValveAcrossMaps([entry],"A","a-1","C"),null);
  assert.deepEqual(validateValveRegistryEntry(entry),[]);
});
test("unverified or ambiguous identities fail closed", () => {
  assert.equal(resolveValveAcrossMaps([{...entry,verification:"pending"}],"A","a-1","B"),null);
  assert.equal(resolveValveAcrossMaps([entry,entry],"A","a-1","B"),null);
  assert.ok(validateValveRegistryEntry({...entry,evidence:[]}).includes("missing_verification_evidence"));
});
test("propagation requires approval and authoritative number", () => {
  const proposal = {proposalId:"p1",submittedBy:"tech",sourceMap:"A" as const,requestedNumber:null,
    area:null,zone:null,street:null,address:null,sourceFeatureId:"new",sourceRevision:"r1",
    evidence:["photo"],kind:"NEW_VALVE" as const};
  const denied=planValvePropagation(proposal,null,[entry]);
  assert.equal(denied.status,"BLOCKED");
  assert.ok(denied.blockers.includes("approval_required"));
  assert.ok(denied.blockers.includes("transactional_number_allocation_required"));
  const approved=planValvePropagation({...proposal,requestedNumber:"126"},
    {proposalId:"p1",approvedBy:"supervisor",approvedAt:"2026-10-19T15:00:00Z",status:"APPROVED"},[entry]);
  assert.equal(approved.status,"READY_FOR_REVIEW");
  assert.deepEqual(approved.maps,["A","B","C","D","E"]);
  assert.equal(planValvePropagation({...proposal,requestedNumber:"125"},
    {proposalId:"p1",approvedBy:"supervisor",approvedAt:"2026-10-19T15:00:00Z",status:"APPROVED"},[entry]).status,"BLOCKED");
});
test("CSV protects spreadsheet formula injection", () => {
  const csv=exportValveRegistryCsv([{...entry,street:"=1+1"}]);
  assert.ok(csv.includes("\"'=1+1\""));
  assert.ok(csv.includes("\"125\""));
});
