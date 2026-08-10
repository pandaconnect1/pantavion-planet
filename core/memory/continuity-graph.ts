export type PantavionContinuityThreadStatus = "active" | "paused" | "resolved" | "archived";
export type PantavionContinuityEdgeKind = "parent" | "continuation" | "merged_into" | "related";
export type PantavionContinuityArtifactKind =
  | "document"
  | "code"
  | "image"
  | "audio"
  | "video"
  | "dataset"
  | "report"
  | "external_reference"
  | "other";

export interface PantavionContinuityThread {
  threadId: string;
  userId: string;
  projectId?: string;
  domain?: string;
  title: string;
  status: PantavionContinuityThreadStatus;
  resolutionState: "unresolved" | "in_progress" | "resolved";
  summary?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  lastRecalledAt?: string;
  resolvedAt?: string;
}

export interface PantavionContinuityEdge {
  edgeId: string;
  fromThreadId: string;
  toThreadId: string;
  kind: PantavionContinuityEdgeKind;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface PantavionContinuityDecision {
  decisionId: string;
  threadId: string;
  title: string;
  decision: string;
  rationale?: string;
  status: "active" | "superseded" | "reversed";
  supersedesDecisionId?: string;
  createdAt: string;
  createdBy?: string;
  metadata: Record<string, unknown>;
}

export interface PantavionContinuityArtifact {
  artifactId: string;
  threadId: string;
  kind: PantavionContinuityArtifactKind;
  title: string;
  uri?: string;
  repository?: string;
  commitSha?: string;
  path?: string;
  checksum?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface PantavionContinuityExecutionLink {
  linkId: string;
  threadId: string;
  executionId: string;
  purpose?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface PantavionContinuityBundle {
  thread: PantavionContinuityThread;
  edges: PantavionContinuityEdge[];
  decisions: PantavionContinuityDecision[];
  artifacts: PantavionContinuityArtifact[];
  executions: PantavionContinuityExecutionLink[];
}

export interface PantavionContinuityStore {
  getThread(threadId: string): Promise<PantavionContinuityThread | null>;
  putThread(thread: PantavionContinuityThread): Promise<void>;
  listThreadsByUser(userId: string, limit?: number): Promise<PantavionContinuityThread[]>;
  putEdge(edge: PantavionContinuityEdge): Promise<void>;
  listEdges(threadId: string): Promise<PantavionContinuityEdge[]>;
  putDecision(decision: PantavionContinuityDecision): Promise<void>;
  listDecisions(threadId: string): Promise<PantavionContinuityDecision[]>;
  putArtifact(artifact: PantavionContinuityArtifact): Promise<void>;
  listArtifacts(threadId: string): Promise<PantavionContinuityArtifact[]>;
  putExecutionLink(link: PantavionContinuityExecutionLink): Promise<void>;
  listExecutionLinks(threadId: string): Promise<PantavionContinuityExecutionLink[]>;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function uniq(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class PantavionMemoryContinuityStore implements PantavionContinuityStore {
  private readonly threads = new Map<string, PantavionContinuityThread>();
  private readonly edges = new Map<string, PantavionContinuityEdge>();
  private readonly decisions = new Map<string, PantavionContinuityDecision>();
  private readonly artifacts = new Map<string, PantavionContinuityArtifact>();
  private readonly executionLinks = new Map<string, PantavionContinuityExecutionLink>();

  async getThread(threadId: string) { return clone(this.threads.get(threadId) ?? null); }
  async putThread(thread: PantavionContinuityThread) { this.threads.set(thread.threadId, clone(thread)); }
  async listThreadsByUser(userId: string, limit = 100) {
    return [...this.threads.values()].filter((item) => item.userId === userId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit).map(clone);
  }
  async putEdge(edge: PantavionContinuityEdge) { this.edges.set(edge.edgeId, clone(edge)); }
  async listEdges(threadId: string) {
    return [...this.edges.values()].filter((item) => item.fromThreadId === threadId || item.toThreadId === threadId).map(clone);
  }
  async putDecision(decision: PantavionContinuityDecision) { this.decisions.set(decision.decisionId, clone(decision)); }
  async listDecisions(threadId: string) {
    return [...this.decisions.values()].filter((item) => item.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone);
  }
  async putArtifact(artifact: PantavionContinuityArtifact) { this.artifacts.set(artifact.artifactId, clone(artifact)); }
  async listArtifacts(threadId: string) {
    return [...this.artifacts.values()].filter((item) => item.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone);
  }
  async putExecutionLink(link: PantavionContinuityExecutionLink) { this.executionLinks.set(link.linkId, clone(link)); }
  async listExecutionLinks(threadId: string) {
    return [...this.executionLinks.values()].filter((item) => item.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(clone);
  }
}

export class PantavionContinuityGraphRuntime {
  constructor(private readonly store: PantavionContinuityStore = new PantavionMemoryContinuityStore()) {}

  async createThread(input: {
    userId: string;
    title: string;
    projectId?: string;
    domain?: string;
    summary?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }) {
    if (!input.userId.trim()) throw new Error("user_id_required");
    if (!input.title.trim()) throw new Error("thread_title_required");
    const timestamp = nowIso();
    const thread: PantavionContinuityThread = {
      threadId: createId("cth"),
      userId: input.userId,
      projectId: input.projectId,
      domain: input.domain,
      title: input.title.trim(),
      status: "active",
      resolutionState: "unresolved",
      summary: input.summary?.trim() || undefined,
      tags: uniq(input.tags),
      metadata: clone(input.metadata ?? {}),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await this.store.putThread(thread);
    return clone(thread);
  }

  async continueThread(sourceThreadId: string, input: { title?: string; summary?: string; metadata?: Record<string, unknown> } = {}) {
    const source = await this.requireThread(sourceThreadId);
    const next = await this.createThread({
      userId: source.userId,
      projectId: source.projectId,
      domain: source.domain,
      title: input.title?.trim() || source.title,
      summary: input.summary,
      tags: source.tags,
      metadata: { ...source.metadata, ...(input.metadata ?? {}) },
    });
    await this.linkThreads(source.threadId, next.threadId, "continuation");
    return next;
  }

  async linkThreads(fromThreadId: string, toThreadId: string, kind: PantavionContinuityEdgeKind, metadata: Record<string, unknown> = {}) {
    await this.requireThread(fromThreadId);
    await this.requireThread(toThreadId);
    if (fromThreadId === toThreadId) throw new Error("self_edge_not_allowed");
    const edge: PantavionContinuityEdge = {
      edgeId: createId("cedge"), fromThreadId, toThreadId, kind, createdAt: nowIso(), metadata: clone(metadata),
    };
    await this.store.putEdge(edge);
    return clone(edge);
  }

  async mergeThread(sourceThreadId: string, targetThreadId: string) {
    const source = await this.requireThread(sourceThreadId);
    await this.requireThread(targetThreadId);
    await this.linkThreads(sourceThreadId, targetThreadId, "merged_into");
    const updated = { ...source, status: "archived" as const, updatedAt: nowIso(), metadata: { ...source.metadata, mergedIntoThreadId: targetThreadId } };
    await this.store.putThread(updated);
    return clone(updated);
  }

  async recordDecision(threadId: string, input: {
    title: string;
    decision: string;
    rationale?: string;
    createdBy?: string;
    supersedesDecisionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.requireThread(threadId);
    const decision: PantavionContinuityDecision = {
      decisionId: createId("cdec"), threadId, title: input.title.trim(), decision: input.decision.trim(),
      rationale: input.rationale?.trim() || undefined, status: "active", supersedesDecisionId: input.supersedesDecisionId,
      createdAt: nowIso(), createdBy: input.createdBy, metadata: clone(input.metadata ?? {}),
    };
    if (!decision.title || !decision.decision) throw new Error("decision_content_required");
    await this.store.putDecision(decision);
    await this.touch(threadId);
    return clone(decision);
  }

  async attachArtifact(threadId: string, input: Omit<PantavionContinuityArtifact, "artifactId" | "threadId" | "createdAt" | "metadata"> & { metadata?: Record<string, unknown> }) {
    await this.requireThread(threadId);
    const artifact: PantavionContinuityArtifact = {
      artifactId: createId("cart"), threadId, ...input, title: input.title.trim(), createdAt: nowIso(), metadata: clone(input.metadata ?? {}),
    };
    if (!artifact.title) throw new Error("artifact_title_required");
    await this.store.putArtifact(artifact);
    await this.touch(threadId);
    return clone(artifact);
  }

  async linkExecution(threadId: string, executionId: string, purpose?: string, metadata: Record<string, unknown> = {}) {
    await this.requireThread(threadId);
    if (!executionId.trim()) throw new Error("execution_id_required");
    const link: PantavionContinuityExecutionLink = {
      linkId: createId("cexe"), threadId, executionId, purpose: purpose?.trim() || undefined, createdAt: nowIso(), metadata: clone(metadata),
    };
    await this.store.putExecutionLink(link);
    await this.touch(threadId);
    return clone(link);
  }

  async recallThread(threadId: string): Promise<PantavionContinuityBundle> {
    const thread = await this.requireThread(threadId);
    const recalled = { ...thread, lastRecalledAt: nowIso(), updatedAt: nowIso() };
    await this.store.putThread(recalled);
    const [edges, decisions, artifacts, executions] = await Promise.all([
      this.store.listEdges(threadId), this.store.listDecisions(threadId), this.store.listArtifacts(threadId), this.store.listExecutionLinks(threadId),
    ]);
    return { thread: clone(recalled), edges, decisions, artifacts, executions };
  }

  async resolveThread(threadId: string, summary?: string) {
    const thread = await this.requireThread(threadId);
    const timestamp = nowIso();
    const updated: PantavionContinuityThread = {
      ...thread, status: "resolved", resolutionState: "resolved", summary: summary?.trim() || thread.summary,
      resolvedAt: thread.resolvedAt ?? timestamp, updatedAt: timestamp,
    };
    await this.store.putThread(updated);
    return clone(updated);
  }

  async listUserThreads(userId: string, limit = 100) {
    return this.store.listThreadsByUser(userId, limit);
  }

  private async touch(threadId: string) {
    const thread = await this.requireThread(threadId);
    const updated = { ...thread, updatedAt: nowIso(), resolutionState: thread.resolutionState === "unresolved" ? "in_progress" as const : thread.resolutionState };
    await this.store.putThread(updated);
    return updated;
  }

  private async requireThread(threadId: string) {
    const thread = await this.store.getThread(threadId);
    if (!thread) throw new Error(`continuity_thread_not_found:${threadId}`);
    return thread;
  }
}

export function createContinuityGraphRuntime(store?: PantavionContinuityStore) {
  return new PantavionContinuityGraphRuntime(store);
}

export const continuityGraphRuntime = createContinuityGraphRuntime();
