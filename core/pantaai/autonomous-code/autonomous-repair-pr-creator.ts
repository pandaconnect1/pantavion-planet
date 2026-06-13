import {
  loadPantavionRepairQueue,
  savePantavionRepairQueue,
  type PantavionRepairJob,
  type PantavionRepairQueue,
} from "./autonomous-repair-loop";
import {
  createAutonomousGithubPullRequest,
  preflightAutonomousGithubPullRequest,
  type GithubPatchFile,
} from "./github-autonomous-writer";
import { appendPantavionRuntimeLedgerEvent } from "../runtime/runtime-ledger";

export type PantavionRepairPrRequest = {
  readonly jobId?: string;
  readonly execute?: boolean;
  readonly sourceRunId?: string;
};

export type PantavionRepairPrResult =
  | {
      readonly ok: true;
      readonly marker: "pantavion_autonomous_repair_pr_creator_c9d_v1";
      readonly executed: boolean;
      readonly job: PantavionRepairJob;
      readonly branch?: string;
      readonly pullRequestUrl?: string;
      readonly filesChanged: readonly string[];
      readonly queue: ReturnType<typeof summarizeRepairPrQueueState>;
    }
  | {
      readonly ok: false;
      readonly marker: "pantavion_autonomous_repair_pr_creator_c9d_v1";
      readonly executed: boolean;
      readonly reason: string;
      readonly job?: PantavionRepairJob;
      readonly queue: ReturnType<typeof summarizeRepairPrQueueState>;
    };

const REPAIR_PLAN_DIR = "core/pantaai/autonomous-code/generated-repair-plans";

function nowIso(): string {
  return new Date().toISOString();
}

function sanitizeForPath(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
}

function selectRepairJob(queue: PantavionRepairQueue, jobId?: string): PantavionRepairJob | undefined {
  if (jobId) {
    return queue.jobs.find((job) => job.id === jobId);
  }

  return [...queue.jobs]
    .reverse()
    .find((job) => job.state === "pending" || job.state === "claimed");
}

function updateRepairJob(
  queue: PantavionRepairQueue,
  jobId: string,
  updater: (job: PantavionRepairJob) => PantavionRepairJob,
): PantavionRepairQueue {
  return {
    version: 1,
    updatedAt: nowIso(),
    jobs: queue.jobs.map((job) => (job.id === jobId ? updater(job) : job)),
  };
}

function renderRepairPlanMarkdown(job: PantavionRepairJob): string {
  return [
    "# Pantavion Autonomous Repair Plan",
    "",
    `Repair job: ${job.id}`,
    `Fingerprint: ${job.fingerprint}`,
    `State before PR: ${job.state}`,
    `Kind: ${job.kind}`,
    `Title: ${job.title}`,
    `Target file: ${job.targetFile ?? "not specified"}`,
    `Target branch: ${job.targetBranch ?? "not specified"}`,
    `Protected domain: ${job.protectedDomain ?? "none"}`,
    `Requires founder approval: ${job.requiresFounderApproval ? "yes" : "no"}`,
    `Repeated failures: ${job.repeatedFailures}`,
    "",
    "## Summary",
    "",
    job.summary,
    "",
    "## Required gates",
    "",
    ...job.requiredGates.map((gate) => `- ${gate}`),
    "",
    "## Required actions",
    "",
    ...job.requiredActions.map((action) => `- ${action}`),
    "",
    "## Raw output preview",
    "",
    "```text",
    job.rawOutputPreview || "No raw output preview recorded.",
    "```",
    "",
    "## Safety rules",
    "",
    "- This repair PR is a controlled repair proposal.",
    "- It must pass audit, build and typecheck before merge.",
    "- Protected-domain repairs require founder approval.",
    "- No production mutation is allowed from this repair plan alone.",
    "- No raw Water/DWG/DXF/KMZ/KML/private infrastructure data may be exposed.",
    "- No secrets may be added to the repository.",
    "",
    "## Next repair step",
    "",
    "A later autonomous repair patch may use this plan to generate scoped code changes in a separate PR after locks, audits, build, typecheck and founder gates are satisfied.",
    "",
  ].join("\n");
}

function createRepairPlanFile(job: PantavionRepairJob): GithubPatchFile {
  const safeId = sanitizeForPath(job.id);
  return {
    path: `${REPAIR_PLAN_DIR}/${safeId}.md`,
    content: renderRepairPlanMarkdown(job),
    message: `pantavion repair plan: ${job.id}`,
  };
}

function repairPrTitle(job: PantavionRepairJob): string {
  return `repair(kernel): ${job.title.toLowerCase()} ${job.fingerprint}`;
}

function repairPrBody(job: PantavionRepairJob): string {
  return [
    "## Pantavion Autonomous Repair PR",
    "",
    `Repair job: ${job.id}`,
    `Kind: ${job.kind}`,
    `Target file: ${job.targetFile ?? "not specified"}`,
    `Protected domain: ${job.protectedDomain ?? "none"}`,
    `Requires founder approval: ${job.requiresFounderApproval ? "yes" : "no"}`,
    "",
    "This PR was created by the Pantavion repair PR creator.",
    "It contains a repair plan and must not be merged as a production fix unless the required gates are satisfied.",
  ].join("\n");
}

export function summarizeRepairPrQueueState() {
  const queue = loadPantavionRepairQueue();

  const byState = queue.jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.state] = (acc[job.state] ?? 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    marker: "pantavion_autonomous_repair_pr_summary_c9d_v1",
    updatedAt: queue.updatedAt,
    totalJobs: queue.jobs.length,
    pendingJobs: queue.jobs.filter((job) => job.state === "pending").length,
    claimedJobs: queue.jobs.filter((job) => job.state === "claimed").length,
    quarantinedJobs: queue.jobs.filter((job) => job.state === "quarantined").length,
    byState,
    latestJobs: queue.jobs.slice(-10),
  };
}

export async function createPantavionRepairPullRequest(
  request: PantavionRepairPrRequest = {},
): Promise<PantavionRepairPrResult> {
  const queue = loadPantavionRepairQueue();
  const job = selectRepairJob(queue, request.jobId);
  const executed = request.execute === true;

  if (!job) {
    appendPantavionRuntimeLedgerEvent({
      runId: request.sourceRunId,
      eventType: "error_recorded",
      severity: "warning",
      kernelFamily: "Pantavion Autonomous Repair PR Creator",
      message: "No pending repair job was available for PR creation.",
      protectedDomains: [],
      metadata: {
        marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      },
    });

    return {
      ok: false,
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      executed,
      reason: "No repair job available.",
      queue: summarizeRepairPrQueueState(),
    };
  }

  if (job.state === "quarantined" && !job.requiresFounderApproval) {
    return {
      ok: false,
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      executed,
      reason: "Repair job is quarantined and cannot create PR without coordinator review.",
      job,
      queue: summarizeRepairPrQueueState(),
    };
  }

  const file = createRepairPlanFile(job);
  const preflight = preflightAutonomousGithubPullRequest({ files: [file] });

  if (!preflight.ok) {
    appendPantavionRuntimeLedgerEvent({
      runId: request.sourceRunId ?? job.sourceRunId,
      eventType: "error_recorded",
      severity: "error",
      kernelFamily: "Pantavion Autonomous Repair PR Creator",
      message: "Repair PR preflight failed.",
      protectedDomains: job.protectedDomain ? [job.protectedDomain] : [],
      metadata: {
        marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
        repairJobId: job.id,
        blockedReasons: preflight.blockedReasons,
      },
    });

    return {
      ok: false,
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      executed,
      reason: `Repair PR preflight failed: ${preflight.blockedReasons.join(" | ")}`,
      job,
      queue: summarizeRepairPrQueueState(),
    };
  }

  if (!executed) {
    appendPantavionRuntimeLedgerEvent({
      runId: request.sourceRunId ?? job.sourceRunId,
      eventType: "audit_passed",
      severity: "info",
      kernelFamily: "Pantavion Autonomous Repair PR Creator",
      message: "Repair PR dry run passed preflight.",
      protectedDomains: job.protectedDomain ? [job.protectedDomain] : [],
      metadata: {
        marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
        repairJobId: job.id,
        execute: false,
        preflight,
      },
    });

    return {
      ok: true,
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      executed,
      job,
      filesChanged: [file.path],
      queue: summarizeRepairPrQueueState(),
    };
  }

  const pr = await createAutonomousGithubPullRequest({
    runId: `repair-${job.fingerprint}`,
    title: repairPrTitle(job),
    body: repairPrBody(job),
    files: [file],
  });

  if (!pr.ok) {
    appendPantavionRuntimeLedgerEvent({
      runId: request.sourceRunId ?? job.sourceRunId,
      eventType: "error_recorded",
      severity: "error",
      kernelFamily: "Pantavion Autonomous Repair PR Creator",
      message: "Repair PR creation failed.",
      protectedDomains: job.protectedDomain ? [job.protectedDomain] : [],
      metadata: {
        marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
        repairJobId: job.id,
        reason: pr.reason,
      },
    });

    return {
      ok: false,
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      executed,
      reason: pr.reason,
      job,
      queue: summarizeRepairPrQueueState(),
    };
  }

  const updatedQueue = updateRepairJob(queue, job.id, (candidate) => ({
    ...candidate,
    state: "claimed",
    attempts: candidate.attempts + 1,
    updatedAt: nowIso(),
  }));

  savePantavionRepairQueue(updatedQueue);

  appendPantavionRuntimeLedgerEvent({
    runId: request.sourceRunId ?? job.sourceRunId,
    eventType: "pr_created",
    severity: job.requiresFounderApproval ? "warning" : "info",
    kernelFamily: "Pantavion Autonomous Repair PR Creator",
    message: "Repair PR created for autonomous repair job.",
    protectedDomains: job.protectedDomain ? [job.protectedDomain] : [],
    metadata: {
      marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
      repairJobId: job.id,
      branch: pr.branch,
      pullRequestUrl: pr.pullRequestUrl,
      filesChanged: pr.filesChanged,
      requiresFounderApproval: job.requiresFounderApproval,
    },
  });

  if (job.requiresFounderApproval) {
    appendPantavionRuntimeLedgerEvent({
      runId: request.sourceRunId ?? job.sourceRunId,
      eventType: "founder_gate_required",
      severity: "warning",
      kernelFamily: "Pantavion Autonomous Repair PR Creator",
      message: "Repair PR touches a protected domain and requires founder approval before merge.",
      protectedDomains: job.protectedDomain ? [job.protectedDomain] : ["founder_gate"],
      metadata: {
        marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
        repairJobId: job.id,
        pullRequestUrl: pr.pullRequestUrl,
      },
    });
  }

  return {
    ok: true,
    marker: "pantavion_autonomous_repair_pr_creator_c9d_v1",
    executed,
    job: {
      ...job,
      state: "claimed",
      attempts: job.attempts + 1,
      updatedAt: nowIso(),
    },
    branch: pr.branch,
    pullRequestUrl: pr.pullRequestUrl,
    filesChanged: pr.filesChanged,
    queue: summarizeRepairPrQueueState(),
  };
}

export const pantavion_autonomous_repair_pr_creator_marker_v1 =
  "pantavion_autonomous_repair_pr_creator_c9d_v1";
