import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type AutonomousJobKind =
  | "capability_gap_scan"
  | "provider_registry_expand"
  | "china_superapp_unification"
  | "seven_continent_ecosystem"
  | "autonomous_coding"
  | "rag_memory"
  | "workflow_automation"
  | "translation_voice"
  | "water_kernel"
  | "identity_access_kernel"
  | "sos_kernel"
  | "legal_payments_kernel"
  | "audit_repair";

export type AutonomousJobState =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "waiting_founder_gate";

export type AutonomousJobPriority = 1 | 2 | 3 | 4 | 5;

export type AutonomousEngineeringJob = {
  id: string;
  kind: AutonomousJobKind;
  title: string;
  description: string;
  priority: AutonomousJobPriority;
  state: AutonomousJobState;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lockedAt?: string;
  result?: unknown;
  error?: string;
};

export type AutonomousJobStore = {
  version: 1;
  jobs: AutonomousEngineeringJob[];
  events: Array<{
    id: string;
    jobId?: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
};

const STORE_PATH = path.join(
  process.cwd(),
  ".pantavion",
  "autonomous-engineering",
  "jobs.json"
);

function now() {
  return new Date().toISOString();
}

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

export function loadAutonomousJobStore(): AutonomousJobStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      return { version: 1, jobs: [], events: [] };
    }

    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AutonomousJobStore;
    return {
      version: 1,
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { version: 1, jobs: [], events: [] };
  }
}

export function saveAutonomousJobStore(store: AutonomousJobStore) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function enqueueAutonomousJob(
  job: Omit<AutonomousEngineeringJob, "id" | "state" | "attempts" | "createdAt" | "updatedAt">
): AutonomousEngineeringJob {
  const store = loadAutonomousJobStore();
  const existing = store.jobs.find(
    (item) =>
      item.kind === job.kind &&
      item.title === job.title &&
      item.state !== "completed" &&
      item.state !== "failed"
  );

  if (existing) {
    return existing;
  }

  const created: AutonomousEngineeringJob = {
    ...job,
    id: randomUUID(),
    state: "pending",
    attempts: 0,
    createdAt: now(),
    updatedAt: now(),
  };

  store.jobs.push(created);
  store.events.push({
    id: randomUUID(),
    jobId: created.id,
    type: "job_enqueued",
    message: created.title,
    createdAt: now(),
  });

  saveAutonomousJobStore(store);
  return created;
}

export function claimAutonomousJobs(maxJobs = 3): AutonomousEngineeringJob[] {
  const store = loadAutonomousJobStore();
  const jobs = store.jobs
    .filter((job) => job.state === "pending")
    .sort((a, b) => b.priority - a.priority || a.createdAt.localeCompare(b.createdAt))
    .slice(0, maxJobs);

  for (const job of jobs) {
    job.state = "running";
    job.lockedAt = now();
    job.updatedAt = now();
    job.attempts += 1;
    store.events.push({
      id: randomUUID(),
      jobId: job.id,
      type: "job_claimed",
      message: job.title,
      createdAt: now(),
    });
  }

  saveAutonomousJobStore(store);
  return jobs;
}

export function completeAutonomousJob(jobId: string, result: unknown) {
  const store = loadAutonomousJobStore();
  const job = store.jobs.find((item) => item.id === jobId);
  if (!job) return;

  job.state = "completed";
  job.result = result;
  job.updatedAt = now();

  store.events.push({
    id: randomUUID(),
    jobId,
    type: "job_completed",
    message: job.title,
    createdAt: now(),
  });

  saveAutonomousJobStore(store);
}

export function failAutonomousJob(jobId: string, error: string) {
  const store = loadAutonomousJobStore();
  const job = store.jobs.find((item) => item.id === jobId);
  if (!job) return;

  job.state = job.attempts >= 3 ? "failed" : "pending";
  job.error = error;
  job.updatedAt = now();

  store.events.push({
    id: randomUUID(),
    jobId,
    type: "job_failed",
    message: error,
    createdAt: now(),
  });

  saveAutonomousJobStore(store);
}

export function ensureAutonomousSeedJobs() {
  enqueueAutonomousJob({
    kind: "capability_gap_scan",
    title: "Scan Pantavion capability gaps",
    description:
      "Continuously scan Pantavion for missing real capabilities, static-only areas, dead surfaces and incomplete kernel execution paths.",
    priority: 5,
  });

  enqueueAutonomousJob({
    kind: "china_superapp_unification",
    title: "Unify China super-app capability patterns",
    description:
      "Map WeChat, Weibo, RedNote, QQ, Qzone, Bilibili, Alipay, Baidu, AMAP, Didi, Dianping, Douyin and Tantan patterns into Pantavion-owned legal modules.",
    priority: 5,
  });

  enqueueAutonomousJob({
    kind: "autonomous_coding",
    title: "Prepare autonomous coding PR loop",
    description:
      "Create safe code generation, audit, branch and PR loop for continuous 24/366 Pantavion engineering.",
    priority: 5,
  });

  enqueueAutonomousJob({
    kind: "rag_memory",
    title: "Prepare RAG and memory layer",
    description:
      "Prepare retrieval, source memory, code memory, private infrastructure memory and founder decision memory.",
    priority: 4,
  });

  enqueueAutonomousJob({
    kind: "workflow_automation",
    title: "Prepare workflow automation layer",
    description:
      "Prepare Make/Zapier/n8n/Gumloop-style Pantavion-owned workflow automation without copying external UI or brands.",
    priority: 4,
  });

  enqueueAutonomousJob({
    kind: "water_kernel",
    title: "Protect and supervise Water Kernel",
    description:
      "Keep Water data, users, access records, private sources and production map lanes protected while allowing audited autonomous engineering proposals.",
    priority: 5,
  });

  enqueueAutonomousJob({
    kind: "identity_access_kernel",
    title: "Protect Identity and Access Kernel",
    description:
      "Maintain users, roles, sessions, approvals and access records with no data loss and no unsafe autonomous mutation.",
    priority: 5,
  });

  enqueueAutonomousJob({
    kind: "sos_kernel",
    title: "Protect SOS Kernel",
    description:
      "Maintain SOS, emergency, elder/minor/safety language flows with strict safety and legal boundaries.",
    priority: 5,
  });
}

export const pantavion_autonomous_job_queue_marker_v1 =
  "pantavion_autonomous_job_queue_c1_v1";
