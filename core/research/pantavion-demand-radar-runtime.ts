import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";
import seed from "@/data/research/global-human-demand-radar/2026-08-29-initial-signals.json";
import {
  PANTAVION_RESEARCH_CONTINENTS,
  assessPantavionHumanDemand,
  type PantavionDemandAssessment,
  type PantavionHumanDemandSignal,
  type PantavionResearchContinent,
} from "./pantavion-global-human-demand-radar";
import {
  createPantavionDemandPromotionCandidate,
  type PantavionDemandPromotionCandidate,
} from "./pantavion-demand-promotion";

export const PANTAVION_DEMAND_RADAR_STATE_KIND = "global_human_demand_radar" as const;
export const PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER = "pantavion_continuous_demand_radar_snapshot_v1" as const;

export type PantavionDemandTrend = "NEW" | "RISING" | "STABLE" | "FALLING";
export type PantavionDemandFreshness = "FRESH" | "AGING" | "STALE";

export interface PantavionDemandRadarIngestItem {
  signal: PantavionHumanDemandSignal;
  countryValidationRefs?: string[];
}

export interface PantavionDemandRadarStoredSignal {
  signal: PantavionHumanDemandSignal;
  assessment: PantavionDemandAssessment;
  countryValidationRefs: string[];
  trend: PantavionDemandTrend;
  opportunityDelta: number;
  latestEvidenceAt: string | null;
  sourceRefs: string[];
}

export interface PantavionDemandRadarAggregates {
  totalSignals: number;
  globalSignals: number;
  continentSignals: Record<PantavionResearchContinent, number>;
  byDomain: Record<string, number>;
  byDecision: Record<string, number>;
  byTrend: Record<PantavionDemandTrend, number>;
  promotionEligible: number;
}

export interface PantavionDemandRadarSnapshot {
  marker: typeof PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER;
  signals: PantavionDemandRadarStoredSignal[];
  sourceRefs: string[];
  aggregates: PantavionDemandRadarAggregates;
}

export interface PantavionDemandRadarOverview {
  marker: "pantavion_continuous_demand_radar_overview_v1";
  persisted: boolean;
  stateId: string | null;
  contentSha256: string;
  snapshot: PantavionDemandRadarSnapshot;
  promotionCandidates: Array<{
    signalId: string;
    candidate: PantavionDemandPromotionCandidate;
    freshness: PantavionDemandFreshness;
  }>;
  checkedAt: string;
}

type CanonicalStateRow = {
  state_id: string;
  state_kind: string;
  title: string;
  content: string;
  content_sha256: string;
  source_ref: string | null;
  truth_state: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function uniqueStrings(values: string[], max = 100): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, max);
}

function latestEvidenceAt(signal: PantavionHumanDemandSignal): string | null {
  const timestamps = signal.evidence
    .map((item) => Date.parse(item.observedAt))
    .filter((value) => Number.isFinite(value));
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function freshnessFor(latest: string | null, nowMs = Date.now()): PantavionDemandFreshness {
  if (!latest) return "STALE";
  const ageDays = Math.max(0, (nowMs - Date.parse(latest)) / 86_400_000);
  if (ageDays <= 45) return "FRESH";
  if (ageDays <= 120) return "AGING";
  return "STALE";
}

function defaultCountryValidationRefs(signal: PantavionHumanDemandSignal): string[] {
  if ((signal.segment.countries?.length ?? 0) === 0) return [];
  return uniqueStrings(
    signal.evidence
      .filter((item) => item.tier === "country_report" || item.tier === "official")
      .map((item) => item.id),
    20,
  );
}

function trendFor(previous: PantavionDemandRadarStoredSignal | undefined, next: PantavionDemandAssessment) {
  if (!previous) return { trend: "NEW" as const, delta: 0 };
  const delta = next.opportunityScore - previous.assessment.opportunityScore;
  if (delta >= 3) return { trend: "RISING" as const, delta };
  if (delta <= -3) return { trend: "FALLING" as const, delta };
  return { trend: "STABLE" as const, delta };
}

function candidateFor(record: PantavionDemandRadarStoredSignal): PantavionDemandPromotionCandidate {
  return createPantavionDemandPromotionCandidate({
    signal: record.signal,
    assessment: record.assessment,
    countryValidationComplete: record.countryValidationRefs.length > 0,
    countryValidationRefs: record.countryValidationRefs,
  });
}

function aggregate(records: PantavionDemandRadarStoredSignal[]): PantavionDemandRadarAggregates {
  const continentSignals = Object.fromEntries(
    PANTAVION_RESEARCH_CONTINENTS.map((continent) => [continent, 0]),
  ) as Record<PantavionResearchContinent, number>;
  const byDomain: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  const byTrend: Record<PantavionDemandTrend, number> = {
    NEW: 0,
    RISING: 0,
    STABLE: 0,
    FALLING: 0,
  };
  let globalSignals = 0;
  let promotionEligible = 0;

  for (const record of records) {
    const { signal, assessment } = record;
    if (signal.segment.scope === "global") globalSignals += 1;
    if (signal.segment.continent) continentSignals[signal.segment.continent] += 1;
    byDomain[signal.domain] = (byDomain[signal.domain] ?? 0) + 1;
    byDecision[assessment.decision] = (byDecision[assessment.decision] ?? 0) + 1;
    byTrend[record.trend] += 1;
    if (candidateFor(record).eligibleForFounderProposal) promotionEligible += 1;
  }

  return {
    totalSignals: records.length,
    globalSignals,
    continentSignals,
    byDomain,
    byDecision,
    byTrend,
    promotionEligible,
  };
}

function buildSnapshot(records: PantavionDemandRadarStoredSignal[], sourceRefs: string[]): PantavionDemandRadarSnapshot {
  const signals = [...records].sort((a, b) => a.signal.id.localeCompare(b.signal.id));
  return {
    marker: PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER,
    signals,
    sourceRefs: uniqueStrings(sourceRefs),
    aggregates: aggregate(signals),
  };
}

function seedSnapshot(): PantavionDemandRadarSnapshot {
  const records = (seed.signals as PantavionHumanDemandSignal[]).map((signal) => ({
    signal,
    assessment: assessPantavionHumanDemand(signal),
    countryValidationRefs: defaultCountryValidationRefs(signal),
    trend: "NEW" as const,
    opportunityDelta: 0,
    latestEvidenceAt: latestEvidenceAt(signal),
    sourceRefs: uniqueStrings(signal.evidence.map((item) => item.url)),
  }));
  return buildSnapshot(records, ["repo:data/research/global-human-demand-radar/2026-08-29-initial-signals.json"]);
}

function parseSnapshot(content: string): PantavionDemandRadarSnapshot | null {
  try {
    const parsed = JSON.parse(content) as PantavionDemandRadarSnapshot;
    if (parsed?.marker !== PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER || !Array.isArray(parsed.signals)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function activeRadarState(): Promise<CanonicalStateRow | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pantavion_founder_canonical_states")
    .select("state_id,state_kind,title,content,content_sha256,source_ref,truth_state,status,metadata,created_at,updated_at")
    .eq("state_kind", PANTAVION_DEMAND_RADAR_STATE_KIND)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return (data as CanonicalStateRow | null) ?? null;
}

export async function getPantavionDemandRadarOverview(): Promise<PantavionDemandRadarOverview> {
  const active = await activeRadarState();
  const snapshot = active ? parseSnapshot(active.content) : null;
  const resolved = snapshot ?? seedSnapshot();
  const content = stableJson(resolved);
  const checkedAt = new Date().toISOString();

  return {
    marker: "pantavion_continuous_demand_radar_overview_v1",
    persisted: Boolean(active && snapshot),
    stateId: active?.state_id ?? null,
    contentSha256: active?.content_sha256 ?? sha256(content),
    snapshot: resolved,
    promotionCandidates: resolved.signals.map((record) => ({
      signalId: record.signal.id,
      candidate: candidateFor(record),
      freshness: freshnessFor(record.latestEvidenceAt, Date.parse(checkedAt)),
    })),
    checkedAt,
  };
}

export async function persistPantavionDemandRadarSnapshot(input: {
  items: PantavionDemandRadarIngestItem[];
  sourceRef: string;
}): Promise<{ stateId: string; contentSha256: string; deduplicated: boolean; snapshot: PantavionDemandRadarSnapshot }> {
  if (!input.sourceRef.trim()) throw new Error("demand_radar_source_ref_required");
  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 200) {
    throw new Error("demand_radar_items_out_of_bounds");
  }

  const current = await activeRadarState();
  const currentSnapshot = current ? parseSnapshot(current.content) : null;
  const base = currentSnapshot ?? seedSnapshot();
  const records = new Map(base.signals.map((record) => [record.signal.id, record]));

  for (const item of input.items) {
    const assessment = assessPantavionHumanDemand(item.signal);
    const previous = records.get(item.signal.id);
    const { trend, delta } = trendFor(previous, assessment);
    records.set(item.signal.id, {
      signal: item.signal,
      assessment,
      countryValidationRefs: uniqueStrings(
        item.countryValidationRefs?.length
          ? item.countryValidationRefs
          : defaultCountryValidationRefs(item.signal),
        20,
      ),
      trend,
      opportunityDelta: delta,
      latestEvidenceAt: latestEvidenceAt(item.signal),
      sourceRefs: uniqueStrings([
        input.sourceRef,
        ...item.signal.evidence.map((evidence) => evidence.url),
      ]),
    });
  }

  const snapshot = buildSnapshot(Array.from(records.values()), [...base.sourceRefs, input.sourceRef]);
  const content = stableJson(snapshot);
  const contentSha256 = sha256(content);

  if (current?.content_sha256 === contentSha256) {
    return { stateId: current.state_id, contentSha256, deduplicated: true, snapshot };
  }

  const admin = createAdminClient();
  const stateId = `demand_radar_${contentSha256.slice(0, 24)}`;
  const { data: existingById, error: existingError } = await admin
    .from("pantavion_founder_canonical_states")
    .select("state_id,status")
    .eq("state_id", stateId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (!existingById) {
    const { error: insertError } = await admin
      .from("pantavion_founder_canonical_states")
      .insert({
        state_id: stateId,
        state_kind: PANTAVION_DEMAND_RADAR_STATE_KIND,
        title: "Pantavion Global Human Demand Radar",
        content,
        content_sha256: contentSha256,
        source_ref: input.sourceRef,
        truth_state: current ? "archived_internal" : "canonical_internal",
        status: current ? "archived" : "active",
        supersedes_state_id: current?.state_id ?? null,
        metadata: {
          marker: PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER,
          signalCount: snapshot.aggregates.totalSignals,
          sourceRefs: snapshot.sourceRefs,
          founderOnly: true,
          productionMutationAllowed: false,
        },
      });
    if (insertError) throw insertError;
  }

  if (current) {
    const { error: supersedeError } = await admin
      .from("pantavion_founder_canonical_states")
      .update({
        status: "superseded",
        truth_state: "superseded_internal",
        updated_at: new Date().toISOString(),
      })
      .eq("state_id", current.state_id)
      .eq("status", "active");
    if (supersedeError) throw supersedeError;

    const { error: activateError } = await admin
      .from("pantavion_founder_canonical_states")
      .update({
        content,
        content_sha256: contentSha256,
        source_ref: input.sourceRef,
        status: "active",
        truth_state: "canonical_internal",
        supersedes_state_id: current.state_id,
        metadata: {
          marker: PANTAVION_DEMAND_RADAR_SNAPSHOT_MARKER,
          signalCount: snapshot.aggregates.totalSignals,
          sourceRefs: snapshot.sourceRefs,
          founderOnly: true,
          productionMutationAllowed: false,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("state_id", stateId);
    if (activateError) throw activateError;
  }

  return { stateId, contentSha256, deduplicated: false, snapshot };
}

export async function createPantavionDemandExecutionIntent(signalId: string): Promise<{
  candidate: PantavionDemandPromotionCandidate;
  intentId: string | null;
  deduplicated: boolean;
}> {
  const active = await activeRadarState();
  if (!active) throw new Error("demand_radar_not_persisted");
  const snapshot = parseSnapshot(active.content);
  if (!snapshot) throw new Error("demand_radar_snapshot_invalid");
  const record = snapshot.signals.find((item) => item.signal.id === signalId);
  if (!record) throw new Error("demand_radar_signal_not_found");

  const candidate = candidateFor(record);
  if (!candidate.eligibleForFounderProposal || !candidate.submission) {
    return { candidate, intentId: null, deduplicated: false };
  }

  const admin = createAdminClient();
  const { data: existing, error: existingError } = await admin
    .from("pantavion_founder_execution_intents")
    .select("intent_id")
    .eq("idempotency_key", candidate.submission.idempotencyKey)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.intent_id) {
    return { candidate, intentId: String(existing.intent_id), deduplicated: true };
  }

  const intentId = `demand_intent_${sha256(`${active.state_id}:${signalId}`).slice(0, 24)}`;
  const { error: insertError } = await admin
    .from("pantavion_founder_execution_intents")
    .insert({
      intent_id: intentId,
      canonical_state_id: active.state_id,
      idempotency_key: candidate.submission.idempotencyKey,
      title: `Demand proposal: ${record.signal.title}`.slice(0, 300),
      founder_intent: candidate.submission.founderIntent,
      target: candidate.submission.target,
      capabilities: candidate.submission.capabilities,
      target_files: candidate.submission.targetFiles,
      approval_scope: candidate.submission.approvalScope,
      workload: candidate.submission.workload ?? null,
      status: "pending_materialization",
    });
  if (insertError) throw insertError;

  return { candidate, intentId, deduplicated: false };
}
