import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  claimAutonomousJobs,
  completeAutonomousJob,
  ensureAutonomousSeedJobs,
  failAutonomousJob,
  loadAutonomousJobStore,
  type AutonomousEngineeringJob,
} from "../pantaai/autonomous-code/autonomous-job-queue";
import { scanPantavionCapabilityGaps } from "../pantaai/autonomous-code/capability-gap-scanner";
import { evaluateAutonomousMutation } from "../pantaai/autonomous-code/protected-path-policy";
import { PANTAVION_DOMAIN_CORES } from "../pantaai/autonomous-code/kernel-domain-cores";
import { PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY } from "../pantaai/autonomous-code/provider-ecosystem-registry";
import { CHINA_SUPERAPP_CAPABILITY_MAP } from "../pantaai/autonomous-code/china-superapp-capability-map";
import {
  createAutonomousGithubPullRequest,
  type GithubPatchFile,
} from "../pantaai/autonomous-code/github-autonomous-writer";

export type AutonomousEngineeringWriteMode =
  | "observe"
  | "draft"
  | "local_scaffold"
  | "github_pr";

export type AutonomousEngineeringRunInput = {
  trigger: "manual" | "cron" | "api" | "test";
  maxJobs?: number;
  writeMode?: AutonomousEngineeringWriteMode;
};

export type AutonomousEngineeringRunResult = {
  ok: true;
  runId: string;
  trigger: AutonomousEngineeringRunInput["trigger"];
  writeMode: AutonomousEngineeringWriteMode;
  cadence: "24_366";
  jobsClaimed: number;
  gapsDetected: number;
  domainCores: number;
  registryEntries: number;
  chinaPatterns: number;
  actions: Array<{
    jobId?: string;
    title: string;
    action: string;
    details: unknown;
  }>;
};

function now() {
  return new Date().toISOString();
}

function safeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function writeJsonArtifact(relativePath: string, value: unknown) {
  const abs = path.join(process.cwd(), relativePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(value, null, 2));
}

function buildCapabilityScaffold(args: {
  id: string;
  title: string;
  reason: string;
}) {
  const constName = args.id.replace(/[^a-zA-Z0-9]/g, "_");
  return `export const ${constName}_capability = {
  id: ${JSON.stringify(args.id)},
  title: ${JSON.stringify(args.title)},
  status: "kernel_registered",
  executionMode: "internal_autonomous_engineering",
  reason: ${JSON.stringify(args.reason)},
  rules: [
    "No fake UI",
    "No static-only visible capability",
    "No copied external brand/UI",
    "Pantavion-owned lawful implementation only",
    "Audit before production mutation"
  ]
};

export function execute_${constName}(input: { intent: string; context?: unknown }) {
  return {
    ok: true,
    capabilityId: ${JSON.stringify(args.id)},
    receivedIntent: input.intent,
    nextRequiredAction: "connect_provider_or_internal_executor",
    protectedBy: "pantavion_autonomous_engineering_kernel_v1"
  };
}
`;
}

function buildRunPatchFiles(runId: string, result: unknown): GithubPatchFile[] {
  return [
    {
      path: `.pantavion/autonomous-engineering/runs/${runId}.json`,
      content: JSON.stringify(result, null, 2),
      message: `pantavion autonomous run ${runId}`,
    },
  ];
}

function buildGapScaffoldFiles(gaps: ReturnType<typeof scanPantavionCapabilityGaps>): GithubPatchFile[] {
  return gaps.slice(0, 5).map((gap) => ({
    path: `core/pantaai/capabilities/generated/${safeSlug(gap.id)}.ts`,
    content: buildCapabilityScaffold({
      id: gap.id,
      title: gap.title,
      reason: gap.reason,
    }),
    message: `pantavion autonomous scaffold: ${gap.title}`,
  }));
}

function decideWriteMode(input?: AutonomousEngineeringRunInput): AutonomousEngineeringWriteMode {
  if (input?.writeMode) return input.writeMode;

  const envMode = process.env.PANTAVION_AUTONOMOUS_WRITE_MODE;
  if (
    envMode === "observe" ||
    envMode === "draft" ||
    envMode === "local_scaffold" ||
    envMode === "github_pr"
  ) {
    return envMode;
  }

  return "observe";
}

async function processJob(job: AutonomousEngineeringJob, runId: string) {
  const gaps = scanPantavionCapabilityGaps();
  const protectedDecisions = gaps.flatMap((gap) =>
    gap.recommendedFirstFiles.map((filePath) =>
      evaluateAutonomousMutation({
        filePath,
        operation: "create",
        reason: gap.reason,
        requestedBy: "kernel",
      })
    )
  );

  return {
    runId,
    jobId: job.id,
    kind: job.kind,
    title: job.title,
    completedAt: now(),
    gapsConsidered: gaps.slice(0, 10),
    protectedDecisions: protectedDecisions.slice(0, 20),
    domainCores: PANTAVION_DOMAIN_CORES.map((core) => ({
      id: core.id,
      directMutationAllowed: core.directMutationAllowed,
      listensTo: core.listensTo,
    })),
  };
}

export async function runAutonomousEngineeringKernel(
  input: AutonomousEngineeringRunInput
): Promise<AutonomousEngineeringRunResult> {
  const runId = randomUUID();
  const writeMode = decideWriteMode(input);

  ensureAutonomousSeedJobs();

  const gaps = scanPantavionCapabilityGaps();
  const claimed = claimAutonomousJobs(input.maxJobs ?? 3);
  const actions: AutonomousEngineeringRunResult["actions"] = [];

  for (const job of claimed) {
    try {
      const result = await processJob(job, runId);
      completeAutonomousJob(job.id, result);
      actions.push({
        jobId: job.id,
        title: job.title,
        action: "job_completed",
        details: result,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failAutonomousJob(job.id, message);
      actions.push({
        jobId: job.id,
        title: job.title,
        action: "job_failed",
        details: message,
      });
    }
  }

  const runResult: AutonomousEngineeringRunResult = {
    ok: true,
    runId,
    trigger: input.trigger,
    writeMode,
    cadence: "24_366",
    jobsClaimed: claimed.length,
    gapsDetected: gaps.length,
    domainCores: PANTAVION_DOMAIN_CORES.length,
    registryEntries: PANTAVION_PROVIDER_ECOSYSTEM_REGISTRY.length,
    chinaPatterns: CHINA_SUPERAPP_CAPABILITY_MAP.length,
    actions,
  };

  if (writeMode === "draft" || writeMode === "local_scaffold") {
    writeJsonArtifact(`.pantavion/autonomous-engineering/runs/${runId}.json`, runResult);
    actions.push({
      title: "local_run_artifact",
      action: "written",
      details: `.pantavion/autonomous-engineering/runs/${runId}.json`,
    });
  }

  if (writeMode === "local_scaffold") {
    const files = buildGapScaffoldFiles(gaps);
    for (const file of files) {
      const decision = evaluateAutonomousMutation({
        filePath: file.path,
        operation: "create",
        reason: "Autonomous capability scaffold",
        requestedBy: "kernel",
      });

      if (!decision.canWriteDirectly) {
        actions.push({
          title: file.path,
          action: "skipped_direct_write_protected",
          details: decision,
        });
        continue;
      }

      const abs = path.join(process.cwd(), file.path);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, file.content);
      actions.push({
        title: file.path,
        action: "local_scaffold_written",
        details: decision,
      });
    }
  }

  if (writeMode === "github_pr") {
    const files = [
      ...buildRunPatchFiles(runId, runResult),
      ...buildGapScaffoldFiles(gaps),
    ];

    const pr = await createAutonomousGithubPullRequest({
      runId,
      title: `pantavion autonomous engineering run ${runId}`,
      body:
        "Pantavion Autonomous Engineering Kernel generated this PR from the 24/366 observe-plan-code-audit loop. Protected domains remain founder-gated.",
      files,
    });

    actions.push({
      title: "github_pr",
      action: pr.ok ? "created_or_updated" : "failed",
      details: pr,
    });
  }

  const store = loadAutonomousJobStore();
  actions.push({
    title: "queue_state",
    action: "observed",
    details: {
      totalJobs: store.jobs.length,
      pendingJobs: store.jobs.filter((job) => job.state === "pending").length,
      completedJobs: store.jobs.filter((job) => job.state === "completed").length,
      failedJobs: store.jobs.filter((job) => job.state === "failed").length,
    },
  });

  return runResult;
}

export const pantavion_autonomous_engineering_kernel_v1 =
  "pantavion_autonomous_engineering_kernel_v1_24_366";
