/**
 * Pantavion extensible capability registry.
 * A capability is unique by stable id, not by localized title or number of discoveries.
 * All historical evidence is retained; none of these declarations proves production readiness.
 */
export type CapabilityEvidence = {
  source: string;
  sourceRecordId: string;
  commit?: string;
  path?: string;
  line?: number;
};
export type CapabilityState =
  | "discovered" | "classified" | "specified" | "implementation"
  | "testing" | "deployment_candidate" | "verified_live" | "blocked";
export type CapabilityRecord = {
  id: string;
  parentId?: string;
  kernelId: string;
  chapterId: string;
  topicId: string;
  sectionId: string;
  subsectionId?: string;
  names: Record<string, string>;
  aliases?: string[];
  evidence: CapabilityEvidence[];
  state: CapabilityState;
  agentWorkOrderIds: string[];
  verifiedAt?: string;
};
export type RegistryConflict = { id: string; reason: string };
export type RegistryResult = { capabilities: CapabilityRecord[]; conflicts: RegistryConflict[] };
const norm = (value: string) => value.normalize("NFKC").trim().toLowerCase();
const evidenceKey = (e: CapabilityEvidence) => [e.source, e.sourceRecordId, e.commit ?? "", e.path ?? "", e.line ?? ""].join("|");
const distinct = (values: string[]) => [...new Set(values)];
const allowedStates: CapabilityState[] = ["discovered","classified","specified","implementation","testing","deployment_candidate","verified_live","blocked"];
function validate(c: CapabilityRecord): void {
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(c.id)) throw Error("Invalid stable capability id");
  for (const key of ["kernelId","chapterId","topicId","sectionId"] as const) {
    if (!c[key]?.trim()) throw Error("Missing " + key + " for " + c.id);
  }
  if (!c.names || !Object.keys(c.names).length || !Object.values(c.names).every(Boolean)) throw Error("Missing localized names for " + c.id);
  if (!allowedStates.includes(c.state)) throw Error("Invalid state for " + c.id);
  if (c.state === "verified_live" && !c.verifiedAt) throw Error("Verified live requires verifiedAt");
}
function mergeEvidence(a: CapabilityEvidence[], b: CapabilityEvidence[]): CapabilityEvidence[] {
  const map = new Map<string, CapabilityEvidence>();
  for (const e of [...a, ...b]) map.set(evidenceKey(e), e);
  return [...map.values()];
}
/** No automatic semantic merge: similar labels may be distinct products. */
export function buildCapabilityRegistry(inputs: CapabilityRecord[]): RegistryResult {
  const map = new Map<string, CapabilityRecord>();
  const conflicts: RegistryConflict[] = [];
  for (const original of inputs) {
    validate(original);
    const incoming = structuredClone(original);
    const previous = map.get(incoming.id);
    if (!previous) { map.set(incoming.id, incoming); continue; }
    if (["kernelId","chapterId","topicId","sectionId","subsectionId","parentId"].some(key =>
      (previous as unknown as Record<string, unknown>)[key] !== (incoming as unknown as Record<string, unknown>)[key])) {
      conflicts.push({id: incoming.id, reason: "Conflicting architecture; manual canonical review required"});
      continue;
    }
    if (previous.state !== incoming.state) {
      conflicts.push({id: incoming.id, reason: "Conflicting lifecycle state; manual verification required"});
    }
    map.set(incoming.id, {
      ...previous,
      names: {...incoming.names, ...previous.names},
      aliases: distinct([...(previous.aliases || []), ...(incoming.aliases || [])]),
      evidence: mergeEvidence(previous.evidence, incoming.evidence),
      agentWorkOrderIds: distinct([...previous.agentWorkOrderIds, ...incoming.agentWorkOrderIds]),
    });
  }
  return {capabilities: [...map.values()], conflicts};
}
export function listCapabilitiesByLocale(items: CapabilityRecord[], locale: string): CapabilityRecord[] {
  const lang = locale.split("-")[0];
  const collator = new Intl.Collator(locale, {usage:"sort", sensitivity:"base", numeric:true});
  const title = (c: CapabilityRecord) => c.names[locale] || c.names[lang] || c.names.en || Object.values(c.names)[0] || c.id;
  return [...items].sort((a,b) => collator.compare(title(a),title(b)) || a.id.localeCompare(b.id));
}
export function findCandidateOverlaps(items: CapabilityRecord[]): Array<{a:string;b:string;reason:string}> {
  const seen = new Map<string,string>();
  const candidates: Array<{a:string;b:string;reason:string}> = [];
  for (const item of items) for (const name of [...Object.values(item.names),...(item.aliases||[])]) {
    const key = norm(name);
    const prior = seen.get(key);
    if (prior && prior !== item.id) candidates.push({a:prior,b:item.id,reason:"Shared localized name/alias; human review only"});
    else seen.set(key,item.id);
  }
  return candidates;
}
