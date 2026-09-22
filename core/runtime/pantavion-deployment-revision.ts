export type PantavionRuntimeProvider =
  | "railway"
  | "vercel"
  | "github"
  | "unknown";

export type PantavionDeploymentRevision = {
  marker: "pantavion_deployment_revision_v1";
  revision: string | null;
  provider: PantavionRuntimeProvider;
  deploymentId: string | null;
  branch: string | null;
  environment: string | null;
};

function clean(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function getPantavionDeploymentRevision(): PantavionDeploymentRevision {
  const railwayRevision = clean(process.env.RAILWAY_GIT_COMMIT_SHA);
  const vercelRevision = clean(process.env.VERCEL_GIT_COMMIT_SHA);
  const githubRevision = clean(process.env.GITHUB_SHA);

  if (railwayRevision) {
    return {
      marker: "pantavion_deployment_revision_v1",
      revision: railwayRevision,
      provider: "railway",
      deploymentId: clean(process.env.RAILWAY_DEPLOYMENT_ID),
      branch: clean(process.env.RAILWAY_GIT_BRANCH),
      environment: clean(process.env.RAILWAY_ENVIRONMENT_NAME) ?? "production",
    };
  }

  if (vercelRevision) {
    return {
      marker: "pantavion_deployment_revision_v1",
      revision: vercelRevision,
      provider: "vercel",
      deploymentId: clean(process.env.VERCEL_URL),
      branch: clean(process.env.VERCEL_GIT_COMMIT_REF),
      environment: clean(process.env.VERCEL_ENV),
    };
  }

  if (githubRevision) {
    return {
      marker: "pantavion_deployment_revision_v1",
      revision: githubRevision,
      provider: "github",
      deploymentId: null,
      branch: clean(process.env.GITHUB_REF_NAME),
      environment: clean(process.env.NODE_ENV),
    };
  }

  return {
    marker: "pantavion_deployment_revision_v1",
    revision: null,
    provider: "unknown",
    deploymentId: null,
    branch: null,
    environment: clean(process.env.NODE_ENV),
  };
}
