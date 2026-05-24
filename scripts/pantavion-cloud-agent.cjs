const token = process.env.GITHUB_TOKEN;
const repo = process.env.REPOSITORY;
const issueNumber = process.env.ISSUE_NUMBER;

if (!token || !repo) {
  console.error("Missing GITHUB_TOKEN or REPOSITORY.");
  process.exit(1);
}

const api = "https://api.github.com";
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

async function gh(path, options = {}) {
  const res = await fetch(`${api}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed: ${res.status} ${text}`);
  }

  return data;
}

function extractJson(body) {
  const fenced = body.match(/```json([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : body.trim();
  return JSON.parse(raw);
}

function encode(content) {
  return Buffer.from(content, "utf8").toString("base64");
}

async function getIssues() {
  if (issueNumber) {
    const issue = await gh(`/repos/${repo}/issues/${issueNumber}`);
    return [issue];
  }

  return gh(`/repos/${repo}/issues?state=open&labels=pantavion-agent&per_page=5`);
}

async function getMainRef() {
  return gh(`/repos/${repo}/git/ref/heads/main`);
}

async function createBranch(branch, sha) {
  try {
    await gh(`/repos/${repo}/git/ref/heads/${branch}`);
    return;
  } catch {}

  await gh(`/repos/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha,
    }),
  });
}

async function getFileSha(path, branch) {
  try {
    const file = await gh(`/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${branch}`);
    return file.sha;
  } catch {
    return undefined;
  }
}

async function upsertFile(path, content, branch, message) {
  const sha = await getFileSha(path, branch);

  await gh(`/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: encode(content),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

async function ensurePullRequest(branch, title, body) {
  const prs = await gh(`/repos/${repo}/pulls?state=open&head=${repo.split("/")[0]}:${branch}`);
  if (prs.length > 0) return prs[0];

  return gh(`/repos/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title,
      head: branch,
      base: "main",
      body,
    }),
  });
}

async function labelIssue(issueNumber, labels) {
  await gh(`/repos/${repo}/issues/${issueNumber}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels }),
  });
}

async function commentIssue(issueNumber, body) {
  await gh(`/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

async function closeIssue(issueNumber) {
  await gh(`/repos/${repo}/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

async function processIssue(issue) {
  let spec;

  try {
    spec = extractJson(issue.body || "");
  } catch (error) {
    await commentIssue(issue.number, `Pantavion Cloud Agent failed: invalid JSON.\n\n${error.message}`);
    await labelIssue(issue.number, ["pantavion-agent-failed"]);
    return;
  }

  const branch = spec.branch || `pantavion-agent/${issue.number}-${Date.now()}`;
  const title = spec.title || `Pantavion Agent Patch #${issue.number}`;
  const commitMessage = spec.commitMessage || title;
  const files = Array.isArray(spec.files) ? spec.files : [];

  if (files.length === 0) {
    await commentIssue(issue.number, "Pantavion Cloud Agent failed: no files provided.");
    await labelIssue(issue.number, ["pantavion-agent-failed"]);
    return;
  }

  const mainRef = await getMainRef();
  await createBranch(branch, mainRef.object.sha);

  for (const file of files) {
    if (!file.path) throw new Error("File path is required.");

    const content =
      typeof file.contentBase64 === "string"
        ? Buffer.from(file.contentBase64, "base64").toString("utf8")
        : String(file.content || "");

    await upsertFile(file.path, content, branch, commitMessage);
  }

  const pr = await ensurePullRequest(
    branch,
    title,
    [
      "Pantavion Cloud Agent generated this PR.",
      "",
      "Required verification:",
      "- npm run audit:implementation-runtime",
      "- npm run build",
      "- npx tsc --noEmit",
    ].join("\n")
  );

  await commentIssue(issue.number, `Pantavion Cloud Agent created PR: ${pr.html_url}`);
  await labelIssue(issue.number, ["pantavion-agent-done"]);
  if (spec.closeIssue !== false) await closeIssue(issue.number);
}

async function main() {
  const issues = await getIssues();

  for (const issue of issues) {
    await processIssue(issue);
  }

  console.log(`Pantavion Cloud Agent processed ${issues.length} issue(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
