import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PantavionContinuityArtifact,
  PantavionContinuityDecision,
  PantavionContinuityEdge,
  PantavionContinuityExecutionLink,
  PantavionContinuityStore,
  PantavionContinuityThread,
} from "./continuity-graph";

export class PantavionSupabaseContinuityStore implements PantavionContinuityStore {
  async getThread(threadId: string) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_threads").select("*").eq("thread_id", threadId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      threadId: data.thread_id,
      userId: data.user_id,
      projectId: data.project_id ?? undefined,
      domain: data.domain ?? undefined,
      title: data.title,
      status: data.status,
      resolutionState: data.resolution_state,
      summary: data.summary ?? undefined,
      tags: data.tags ?? [],
      metadata: data.metadata ?? {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastRecalledAt: data.last_recalled_at ?? undefined,
      resolvedAt: data.resolved_at ?? undefined,
    } as PantavionContinuityThread;
  }

  async putThread(thread: PantavionContinuityThread) {
    const db = createAdminClient();
    const { error } = await db.from("continuity_threads").upsert({
      thread_id: thread.threadId,
      user_id: thread.userId,
      project_id: thread.projectId ?? null,
      domain: thread.domain ?? null,
      title: thread.title,
      status: thread.status,
      resolution_state: thread.resolutionState,
      summary: thread.summary ?? null,
      tags: thread.tags,
      metadata: thread.metadata,
      created_at: thread.createdAt,
      updated_at: thread.updatedAt,
      last_recalled_at: thread.lastRecalledAt ?? null,
      resolved_at: thread.resolvedAt ?? null,
    }, { onConflict: "thread_id" });
    if (error) throw error;
  }

  async listThreadsByUser(userId: string, limit = 100) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_threads").select("thread_id").eq("user_id", userId).order("updated_at", { ascending: false }).limit(Math.max(1, Math.min(limit, 500)));
    if (error) throw error;
    const records = await Promise.all((data ?? []).map((row) => this.getThread(row.thread_id)));
    return records.filter((item): item is PantavionContinuityThread => Boolean(item));
  }

  async putEdge(edge: PantavionContinuityEdge) {
    const db = createAdminClient();
    const { error } = await db.from("continuity_edges").upsert({
      edge_id: edge.edgeId,
      from_thread_id: edge.fromThreadId,
      to_thread_id: edge.toThreadId,
      kind: edge.kind,
      created_at: edge.createdAt,
      metadata: edge.metadata,
    }, { onConflict: "edge_id" });
    if (error) throw error;
  }

  async listEdges(threadId: string) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_edges").select("*").or(`from_thread_id.eq.${threadId},to_thread_id.eq.${threadId}`).order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      edgeId: row.edge_id,
      fromThreadId: row.from_thread_id,
      toThreadId: row.to_thread_id,
      kind: row.kind,
      createdAt: row.created_at,
      metadata: row.metadata ?? {},
    })) as PantavionContinuityEdge[];
  }

  async putDecision(decision: PantavionContinuityDecision) {
    const db = createAdminClient();
    const { error } = await db.from("continuity_decisions").upsert({
      decision_id: decision.decisionId,
      thread_id: decision.threadId,
      title: decision.title,
      decision: decision.decision,
      rationale: decision.rationale ?? null,
      status: decision.status,
      supersedes_decision_id: decision.supersedesDecisionId ?? null,
      created_at: decision.createdAt,
      created_by: decision.createdBy ?? null,
      metadata: decision.metadata,
    }, { onConflict: "decision_id" });
    if (error) throw error;
  }

  async listDecisions(threadId: string) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_decisions").select("*").eq("thread_id", threadId).order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      decisionId: row.decision_id,
      threadId: row.thread_id,
      title: row.title,
      decision: row.decision,
      rationale: row.rationale ?? undefined,
      status: row.status,
      supersedesDecisionId: row.supersedes_decision_id ?? undefined,
      createdAt: row.created_at,
      createdBy: row.created_by ?? undefined,
      metadata: row.metadata ?? {},
    })) as PantavionContinuityDecision[];
  }

  async putArtifact(artifact: PantavionContinuityArtifact) {
    const db = createAdminClient();
    const { error } = await db.from("continuity_artifacts").upsert({
      artifact_id: artifact.artifactId,
      thread_id: artifact.threadId,
      kind: artifact.kind,
      title: artifact.title,
      uri: artifact.uri ?? null,
      repository: artifact.repository ?? null,
      commit_sha: artifact.commitSha ?? null,
      path: artifact.path ?? null,
      checksum: artifact.checksum ?? null,
      created_at: artifact.createdAt,
      metadata: artifact.metadata,
    }, { onConflict: "artifact_id" });
    if (error) throw error;
  }

  async listArtifacts(threadId: string) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_artifacts").select("*").eq("thread_id", threadId).order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      artifactId: row.artifact_id,
      threadId: row.thread_id,
      kind: row.kind,
      title: row.title,
      uri: row.uri ?? undefined,
      repository: row.repository ?? undefined,
      commitSha: row.commit_sha ?? undefined,
      path: row.path ?? undefined,
      checksum: row.checksum ?? undefined,
      createdAt: row.created_at,
      metadata: row.metadata ?? {},
    })) as PantavionContinuityArtifact[];
  }

  async putExecutionLink(link: PantavionContinuityExecutionLink) {
    const db = createAdminClient();
    const { error } = await db.from("continuity_execution_links").upsert({
      link_id: link.linkId,
      thread_id: link.threadId,
      execution_id: link.executionId,
      purpose: link.purpose ?? null,
      created_at: link.createdAt,
      metadata: link.metadata,
    }, { onConflict: "link_id" });
    if (error) throw error;
  }

  async listExecutionLinks(threadId: string) {
    const db = createAdminClient();
    const { data, error } = await db.from("continuity_execution_links").select("*").eq("thread_id", threadId).order("created_at");
    if (error) throw error;
    return (data ?? []).map((row) => ({
      linkId: row.link_id,
      threadId: row.thread_id,
      executionId: row.execution_id,
      purpose: row.purpose ?? undefined,
      createdAt: row.created_at,
      metadata: row.metadata ?? {},
    })) as PantavionContinuityExecutionLink[];
  }
}

export function createSupabaseContinuityStore() {
  return new PantavionSupabaseContinuityStore();
}
