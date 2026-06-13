import { Buffer } from "buffer";
import {
  evaluateAutonomousMutation,
  type AutonomousPolicyDecision,
} from "./protected-path-policy";

export type GithubPatchFile = {
  path: string;
  content: string;
  message?: string;
};

export type GithubAutonomousPreflightFile = {
  readonly path: string;
  readonly allowed: boolean;
  readonly protectedDomain?: string;
  readonly requiresFounderApproval: boolean;
  readonly requiredGates: readonly string[];
  readonly reasons: readonly string[];
};

export type GithubAutonomousPreflight = {
  readonly ok: boolean;
  readonly marker: "pantavion_github_autonomous_writer_preflight_c9a_v1";
  readonly filesChecked: number;
  readonly filesAllowed: number;
  readonly filesBlocked: number;
  readonly requiresFounderApproval: boolean;
  readonly protectedDomains: readonly string[];
  readonly requiredGates: readonly string[];
  readonly blockedReasons: readonly string[];
  readonly files: readonly GithubAutonomousPreflightFile[];
};

export type GithubPrResult =
  | {
      ok: true;
      branch: string;
      pullRequestUrl?: string;
      filesChanged: string[];
      preflight: GithubAutonomousPreflight;
    }
  | {
      ok: false;
      reason: string;
      preflight?: GithubAutonomousPreflight;
    };

const MAX_FILES_PER_PR = 25;
const MAX_FILE_BYTES = 120_000;

const RAW_DATA_PATTERNS: readonly RegExp[] = [
  /(^|\/)data\/water-network-private\//i,
  /\.(dwg|dxf|kmz|kml|geojson|sqlite|db|parquet|zip|7z|rar)$/i,
];

const RAW_SECRET_CONTENT_PATTERNS: readonly RegExp[] = [
  /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/,
  /PANTAVION_AUTONOMOUS_SECRET\s*=/,
  /PANTAVION_GITHUB_TOKEN\s*=/,
  /CRON_SECRET\s*=/,
];

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function normalizeRepoPath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/^\/+/, "");
}

function uniqueStrings(values: readonly string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function hasRawDataPath(filePath: string): boolean {
  return RAW_DATA_PATTERNS.some((pattern) => pattern.test(normalizeRepoPath(filePath)));
}

function hasRawSecretContent(content: string): boolean {
  return RAW_SECRET_CONTENT_PATTERNS.some((pattern) => pattern.test(content));
}

function evaluateFileForPr(file: GithubPatchFile): {
  readonly allowed: boolean;
  readonly path: string;
  readonly policy: AutonomousPolicyDecision;
  readonly reasons: readonly string[];
} {
  const path = normalizeRepoPath(file.path);
  const reasons: string[] = [];
  const policy = evaluateAutonomousMutation({
    filePath: path,
    operation: "create",
    reason: file.message ?? "Pantavion autonomous generated code proposal.",
    requestedBy: "kernel",
  });

  if (!path || path.includes("..") || path.startsWith(".git/")) {
    reasons.push("Invalid repository path.");
  }

  if (hasRawDataPath(path)) {
    reasons.push("Raw/private infrastructure or geodata file paths are blocked from autonomous PR writer.");
  }

  const bytes = Buffer.byteLength(file.content, "utf8");
  if (bytes > MAX_FILE_BYTES) {
    reasons.push(`File is too large for autonomous PR writer: ${bytes} bytes.`);
  }

  if (hasRawSecretContent(file.content)) {
    reasons.push("Generated file appears to contain raw secret material.");
  }

  if (!policy.canCreatePullRequest) {
    reasons.push("Protected path policy rejected PR creation.");
  }

  return {
    allowed: reasons.length === 0,
    path,
    policy,
    reasons: reasons.length > 0 ? reasons : policy.reasons,
  };
}

export function preflightAutonomousGithubPullRequest(args: {
  readonly files: readonly GithubPatchFile[];
}): GithubAutonomousPreflight {
  const blockedReasons: string[] = [];

  if (args.files.length === 0) {
    blockedReasons.push("No files supplied for autonomous PR.");
  }

  if (args.files.length > MAX_FILES_PER_PR) {
    blockedReasons.push(`Too many files for one autonomous PR: ${args.files.length}.`);
  }

  const files = args.files.map((file): GithubAutonomousPreflightFile => {
    const evaluation = evaluateFileForPr(file);

    return {
      path: evaluation.path,
      allowed: evaluation.allowed,
      protectedDomain: evaluation.policy.domain,
      requiresFounderApproval: evaluation.policy.requiresFounderApproval,
      requiredGates: evaluation.policy.requiredGates,
      reasons: evaluation.reasons,
    };
  });

  for (const file of files) {
    if (!file.allowed) {
      blockedReasons.push(`${file.path}: ${file.reasons.join(" ")}`);
    }
  }

  const requiredGates = uniqueStrings(files.flatMap((file) => Array.from(file.requiredGates)));
  const protectedDomains = uniqueStrings(
    files
      .map((file) => file.protectedDomain)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const requiresFounderApproval = files.some((file) => file.requiresFounderApproval);

  return {
    ok: blockedReasons.length === 0,
    marker: "pantavion_github_autonomous_writer_preflight_c9a_v1",
    filesChecked: args.files.length,
    filesAllowed: files.filter((file) => file.allowed).length,
    filesBlocked: files.filter((file) => !file.allowed).length,
    requiresFounderApproval,
    protectedDomains,
    requiredGates,
    blockedReasons,
    files,
  };
}

async function githubFetch(pathname: string, init: RequestInit = {}) {
  const token = requiredEnv("PANTAVION_GITHUB_TOKEN");
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status}: ${text}`);
  }

  return response.json();
}

async function getDefaultBranchSha(owner: string, repo: string, baseBranch: string) {
  const ref = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`);
  return ref.object.sha as string;
}

async function createBranch(owner: string, repo: string, branch: string, sha: string) {
  try {
    await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    return;
  } catch {
    await githubFetch(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha,
      }),
    });
  }
}

async function getFileSha(owner: string, repo: string, branch: string, filePath: string) {
  try {
    const file = await githubFetch(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`
    );
    return typeof file.sha === "string" ? file.sha : undefined;
  } catch {
    return undefined;
  }
}

async function putFile(owner: string, repo: string, branch: string, file: GithubPatchFile) {
  const normalizedPath = normalizeRepoPath(file.path);
  const sha = await getFileSha(owner, repo, branch, normalizedPath);

  await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(normalizedPath).replace(/%2F/g, "/")}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: file.message ?? `pantavion autonomous update: ${normalizedPath}`,
        content: Buffer.from(file.content, "utf8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    }
  );
}

async function createPullRequest(
  owner: string,
  repo: string,
  branch: string,
  baseBranch: string,
  title: string,
  body: string
) {
  try {
    const pr = await githubFetch(`/repos/${owner}/${repo}/pulls`, {
      method: "POST",
      body: JSON.stringify({
        title,
        head: branch,
        base: baseBranch,
        body,
        maintainer_can_modify: true,
      }),
    });

    return pr.html_url as string | undefined;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("A pull request already exists")) {
      return undefined;
    }

    throw error;
  }
}

function buildAutonomousPrBody(originalBody: string, preflight: GithubAutonomousPreflight): string {
  const gates = preflight.requiredGates.length > 0 ? preflight.requiredGates.join(", ") : "none";
  const domains = preflight.protectedDomains.length > 0 ? preflight.protectedDomains.join(", ") : "none";

  return [
    originalBody,
    "",
    "## Pantavion Autonomous PR Gate",
    "",
    `- Preflight marker: ${preflight.marker}`,
    `- Files checked: ${preflight.filesChecked}`,
    `- Protected domains: ${domains}`,
    `- Requires founder approval: ${preflight.requiresFounderApproval ? "yes" : "no"}`,
    `- Required gates: ${gates}`,
    "",
    "This PR was generated by Pantavion autonomous code flow. It must pass audits, build, typecheck, protected-domain policy, and founder/maintainer review before merge.",
  ].join("\n");
}

export async function createAutonomousGithubPullRequest(args: {
  runId: string;
  title: string;
  body: string;
  files: GithubPatchFile[];
}): Promise<GithubPrResult> {
  const preflight = preflightAutonomousGithubPullRequest({ files: args.files });

  if (!preflight.ok) {
    return {
      ok: false,
      reason: `Autonomous GitHub PR preflight failed: ${preflight.blockedReasons.join(" | ")}`,
      preflight,
    };
  }

  try {
    const owner = requiredEnv("PANTAVION_GITHUB_OWNER");
    const repo = requiredEnv("PANTAVION_GITHUB_REPO");
    const baseBranch = process.env.PANTAVION_GITHUB_BASE_BRANCH ?? "main";
    const branchPrefix = process.env.PANTAVION_AUTONOMOUS_BRANCH_PREFIX ?? "pantavion/autonomous";
    const branch = `${branchPrefix}-${args.runId}`.replace(/[^a-zA-Z0-9/_-]/g, "-");

    const baseSha = await getDefaultBranchSha(owner, repo, baseBranch);
    await createBranch(owner, repo, branch, baseSha);

    for (const file of args.files) {
      await putFile(owner, repo, branch, file);
    }

    const pullRequestUrl = await createPullRequest(
      owner,
      repo,
      branch,
      baseBranch,
      args.title,
      buildAutonomousPrBody(args.body, preflight)
    );

    return {
      ok: true,
      branch,
      pullRequestUrl,
      filesChanged: args.files.map((file) => normalizeRepoPath(file.path)),
      preflight,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
      preflight,
    };
  }
}

export const pantavion_github_autonomous_writer_marker_v1 =
  "pantavion_github_autonomous_writer_c9a_v1";
