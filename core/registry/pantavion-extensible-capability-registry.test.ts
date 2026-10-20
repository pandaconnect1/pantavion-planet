import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildCapabilityRegistry, findCandidateOverlaps, listCapabilitiesByLocale, type CapabilityRecord } from "./pantavion-extensible-capability-registry";
const record = (id: string, names: Record<string,string>, source: string): CapabilityRecord => ({
  id, kernelId: "knowledge", chapterId: "knowledge", topicId: "research", sectionId: "evidence",
  names, evidence: [{source,sourceRecordId:id+"-"+source}], state: "discovered", agentWorkOrderIds: []
});
describe("extensible capability registry", () => {
  it("preserves evidence when same stable capability is discovered twice", () => {
    const result = buildCapabilityRegistry([record("knowledge-vault",{el:"Θησαυροφυλάκιο γνώσης",en:"Knowledge Vault"},"branch"),
      record("knowledge-vault",{el:"Θησαυροφυλάκιο γνώσης",en:"Knowledge Vault"},"founder")]);
    assert.equal(result.capabilities.length, 1);
    assert.equal(result.capabilities[0].evidence.length, 2);
    assert.equal(result.conflicts.length, 0);
  });
  it("does not merge separate ids merely because their names match", () => {
    const a = record("vault-a",{en:"Knowledge Vault"},"a");
    const b = record("vault-b",{en:"Knowledge Vault"},"b");
    assert.equal(buildCapabilityRegistry([a,b]).capabilities.length, 2);
    assert.equal(findCandidateOverlaps([a,b]).length, 1);
  });
  it("sorts translated titles according to requested locale", () => {
    const a=record("a",{el:"Ωκεανός",en:"Ocean"},"a");
    const b=record("b",{el:"Αγορά",en:"Market"},"b");
    assert.deepEqual(listCapabilitiesByLocale([a,b],"el").map(x=>x.id), ["b","a"]);
  });
  it("rejects unverified live status without verification timestamp", () => {
    assert.throws(()=>buildCapabilityRegistry([{...record("a",{en:"A"},"a"),state:"verified_live"}]));
  });
  it("flags contradictory hierarchy instead of silently overwriting", () => {
    const a=record("same",{en:"One"},"a");
    const b={...record("same",{en:"One"},"b"),kernelId:"other"};
    const result=buildCapabilityRegistry([a,b]);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.capabilities.length, 1);
  });
});
