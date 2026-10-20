/**
 * Pantavion AI agent execution contracts.
 * Independent workers can claim jobs, call a configured model adapter and submit evidence.
 * No live-provider or autonomous production claim is made by this contract.
 */
export type AgentRole = "research" | "planner" | "builder" | "reviewer" | "tester" | "integration" | "operations";
export type AgentJobStatus = "queued" | "leased" | "running" | "awaiting_approval" | "succeeded" | "failed" | "cancelled";
export type AgentJob = {
  id: string;
  capabilityId: string;
  kernelId: string;
  role: AgentRole;
  objective: string;
  status: AgentJobStatus;
  risk: "read_only" | "sandbox_code" | "protected_change";
  attempts: number;
  maxAttempts: number;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  artifactRefs: string[];
  evidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
};
export type AgentModelRequest = {
  jobId: string;
  systemPolicy: string;
  objective: string;
  evidenceRefs: string[];
  maxOutputTokens: number;
};
export type AgentModelResult = {
  provider: string;
  model: string;
  output: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};
export interface AgentModelAdapter {
  readonly id: string;
  isConfigured(): Promise<boolean>;
  infer(request: AgentModelRequest, signal?: AbortSignal): Promise<AgentModelResult>;
}
export interface AgentJobStore {
  enqueue(job: AgentJob): Promise<void>;
  claim(workerId: string, nowIso: string, leaseSeconds: number): Promise<AgentJob | null>;
  heartbeat(jobId: string, workerId: string, leaseUntil: string): Promise<boolean>;
  complete(jobId: string, workerId: string, artifactRefs: string[], evidenceRefs: string[]): Promise<void>;
  fail(jobId: string, workerId: string, reason: string, retry: boolean): Promise<void>;
  cancel(jobId: string): Promise<void>;
}
export interface AgentArtifactStore {
  write(jobId: string, content: string, mediaType: string): Promise<string>;
}
export interface AgentApprovalGate {
  isApproved(job: AgentJob): Promise<boolean>;
}
export type AgentRunResult =
  | {status:"idle"}
  | {status:"blocked";jobId:string;reason:string}
  | {status:"completed";jobId:string;artifactRef:string;provider:string;model:string};
export async function runAgentOnce(input: {
  workerId: string;
  store: AgentJobStore;
  model: AgentModelAdapter;
  artifacts: AgentArtifactStore;
  approvals: AgentApprovalGate;
  systemPolicy: string;
  now?: () => Date;
  signal?: AbortSignal;
}): Promise<AgentRunResult> {
  const now = input.now || (()=>new Date());
  const job = await input.store.claim(input.workerId,now().toISOString(),120);
  if (!job) return {status:"idle"};
  try {
    if (job.risk === "protected_change" && !(await input.approvals.isApproved(job))) {
      await input.store.fail(job.id,input.workerId,"Protected work requires explicit approval",false);
      return {status:"blocked",jobId:job.id,reason:"approval_required"};
    }
    if (!(await input.model.isConfigured())) {
      await input.store.fail(job.id,input.workerId,"No configured model adapter",true);
      return {status:"blocked",jobId:job.id,reason:"provider_unavailable"};
    }
    const response = await input.model.infer({
      jobId:job.id,systemPolicy:input.systemPolicy,objective:job.objective,
      evidenceRefs:job.evidenceRefs,maxOutputTokens:4096
    },input.signal);
    if (!response.output.trim()) throw new Error("Empty model output");
    const artifactRef=await input.artifacts.write(job.id,response.output,"text/plain");
    await input.store.complete(job.id,input.workerId,[artifactRef],job.evidenceRefs);
    return {status:"completed",jobId:job.id,artifactRef,provider:response.provider,model:response.model};
  } catch(error) {
    await input.store.fail(job.id,input.workerId,error instanceof Error?error.message:String(error),job.attempts+1<job.maxAttempts);
    throw error;
  }
}
