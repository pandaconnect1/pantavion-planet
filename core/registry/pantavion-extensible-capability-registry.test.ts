import { buildCapabilityRegistry, findCandidateOverlaps, listCapabilitiesByLocale, type CapabilityRecord } from "./pantavion-extensible-capability-registry";
import { describe, expect, it } from "vitest";
const record = (id: string, names: Record<string,string>, source: string): CapabilityRecord => ({
  id, kernelId: "knowledge", chapterId: "knowledge", topicId: "research", sectionId: "evidence",
  names, evidence: [{source,sourceRecordId:id+"-"+source}], state: "discovered", agentWorkOrderIds: []
});
describe("extensible capability registry", () => {
  it("preserves evidence when same stable capability is discovered twice", () => {
    const result = buildCapabilityRegistry([record("knowledge-vault",{el:"Θησαυροφυλάκιο γνώσης",en:"Knowledge Vault"},"branch"),
      record("knowledge-vault",{el:"Θησαυροφυλάκιο γνώσης",en:"Knowledge Vault"},"founder")]);
    expect(result.capabilities).toHaveLength(1);
    expect(result.capabilities[0].evidence).toHaveLength(2);
    expect(result.conflicts).toHaveLength(0);
  });
  it("does not merge separate ids merely because their names match", () => {
    const a = record("vault-a",{en:"Knowledge Vault"},"a");
    const b = record("vault-b",{en:"Knowledge Vault"},"b");
    expect(buildCapabilityRegistry([a,b]).capabilities).toHaveLength(2);
    expect(findCandidateOverlaps([a,b])).toHaveLength(1);
  });
  it("sorts translated titles according to requested locale", () => {
    const a=record("a",{el:"Ωκεανός",en:"Ocean"},"a");
    const b=record("b",{el:"Αγορά",en:"Market"},"b");
    expect(listCapabilitiesByLocale([a,b],"el").map(x=>x.id)).toEqual(["b","a"]);
  });
  it("rejects unverified live status without verification timestamp", () => {
    expect(()=>buildCapabilityRegistry([{...record("a",{en:"A"},"a"),state:"verified_live"}])).toThrow();
  });
  it("flags contradictory hierarchy instead of silently overwriting", () => {
    const a=record("same",{en:"One"},"a");
    const b={...record("same",{en:"One"},"b"),kernelId:"other"};
    const result=buildCapabilityRegistry([a,b]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.capabilities).toHaveLength(1);
  });
});
