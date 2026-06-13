import { Buffer } from "buffer";

export type GithubPatchFile = {
  path: string;
  content: string;
  message?: string;
};

export type GithubPrResult =
  | {
      ok: true;
      branch: string;
      pullRequestUrl?: string;
      filesChanged: string[];
    }
  | {
      ok: false;
      reason: string;
    };

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
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
  const sha = await getFileSha(owner, repo, branch, file.path);
  await githubFetch(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(file.path).replace(/%2F/g, "/")}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: file.message ?? `pantavion autonomous update: ${file.path}`,
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

export async function createAutonomousGithubPullRequest(args: {
  runId: string;
  title: string;
  body: string;
  files: GithubPatchFile[];
}): Promise<GithubPrResult> {
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
      args.body
    );

    return {
      ok: true,
      branch,
      pullRequestUrl,
      filesChanged: args.files.map((file) => file.path),
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

export const pantavion_github_autonomous_writer_marker_v1 =
  "pantavion_github_autonomous_writer_c1_v1";
