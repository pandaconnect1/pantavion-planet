// core/app/vercel-product-connection-public-surface-wave.ts

import { listProductSurfaces, getProductSurfaceSnapshot } from './product-surface-registry';
import {
  evaluateSurfaceAccess,
  getSurfaceAccessSnapshot,
  type PantavionSurfaceAccessDecision,
  type PantavionSurfaceAccessRequest,
} from './public-surface-access-gate';
import {
  evaluateVercelPublicDeploy,
  getVercelDeploySnapshot,
  type PantavionVercelDeployDecision,
  type PantavionVercelDeployRequest,
} from './vercel-public-deploy-gate';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionVercelProductConnectionPublicSurfaceWaveOutput {
  generatedAt: string;
  surfaceSnapshot: ReturnType<typeof getProductSurfaceSnapshot>;
  accessSnapshot: ReturnType<typeof getSurfaceAccessSnapshot>;
  deploySnapshot: ReturnType<typeof getVercelDeploySnapshot>;
  accessDecisions: PantavionSurfaceAccessDecision[];
  deployDecisions: PantavionVercelDeployDecision[];
  rendered: string;
  html: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHtml(output: PantavionVercelProductConnectionPublicSurfaceWaveOutput): string {
  const surfaces = listProductSurfaces();

  const cards = surfaces
    .map((item) => {
      const deployDecision = output.deployDecisions.find((entry) => entry.surfaceKey === item.surfaceKey);
      return [
        '<section class="card">',
        `<h2>${escapeHtml(item.title)}</h2>`,
        `<div class="row"><span>route</span><strong>${escapeHtml(item.routePath)}</strong></div>`,
        `<div class="row"><span>visibility</span><strong>${escapeHtml(item.visibility)}</strong></div>`,
        `<div class="row"><span>domain</span><strong>${escapeHtml(item.domain)}</strong></div>`,
        `<div class="row"><span>deployAllowed</span><strong>${deployDecision?.deployAllowed ? 'yes' : 'no'}</strong></div>`,
        `<div class="row"><span>publicExposureAllowed</span><strong>${deployDecision?.publicExposureAllowed ? 'yes' : 'no'}</strong></div>`,
        '</section>',
      ].join('');
    })
    .join('');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<title>Pantavion Public Surface Manifest</title>',
    '<style>',
    'body{margin:0;background:#0b1020;color:#e8edf6;font-family:Inter,Segoe UI,Arial,sans-serif;}',
    '.wrap{max-width:1180px;margin:0 auto;padding:32px 24px 48px;}',
    'h1{margin:0 0 8px 0;font-size:32px;}',
    '.sub{opacity:.75;margin-bottom:24px;}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}',
    '.card{background:#121932;border:1px solid #243055;border-radius:18px;padding:18px;box-shadow:0 10px 30px rgba(0,0,0,.22);}',
    '.card h2{margin:0 0 12px 0;font-size:18px;}',
    '.row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06);}',
    '.row:first-of-type{border-top:none;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="wrap">',
    '<h1>Pantavion Vercel Product Connection</h1>',
    `<div class="sub">generatedAt=${escapeHtml(output.generatedAt)}</div>`,
    `<div class="grid">${cards}</div>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('');
}

function renderWave(output: PantavionVercelProductConnectionPublicSurfaceWaveOutput): string {
  const surfaces = listProductSurfaces();

  return [
    'PANTAVION VERCEL PRODUCT CONNECTION PUBLIC SURFACE WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'PRODUCT SURFACES',
    `surfaceCount=${output.surfaceSnapshot.surfaceCount}`,
    `publicCount=${output.surfaceSnapshot.publicCount}`,
    `authenticatedCount=${output.surfaceSnapshot.authenticatedCount}`,
    `operatorCount=${output.surfaceSnapshot.operatorCount}`,
    `founderCount=${output.surfaceSnapshot.founderCount}`,
    `vercelEligibleCount=${output.surfaceSnapshot.vercelEligibleCount}`,
    '',
    ...surfaces.flatMap((item) => [
      `${item.surfaceKey}`,
      `title=${item.title}`,
      `routePath=${item.routePath}`,
      `visibility=${item.visibility}`,
      '',
    ]),
    'SURFACE ACCESS GATE',
    `evaluatedCount=${output.accessSnapshot.evaluatedCount}`,
    `allowedCount=${output.accessSnapshot.allowedCount}`,
    `blockedCount=${output.accessSnapshot.blockedCount}`,
    `authRequiredCount=${output.accessSnapshot.authRequiredCount}`,
    '',
    ...output.accessDecisions.flatMap((item) => [
      `${item.surfaceKey}`,
      `allowed=${item.allowed ? 'yes' : 'no'}`,
      `authRequired=${item.authRequired ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
    'VERCEL DEPLOY GATE',
    `evaluatedCount=${output.deploySnapshot.evaluatedCount}`,
    `deployAllowedCount=${output.deploySnapshot.deployAllowedCount}`,
    `blockedCount=${output.deploySnapshot.blockedCount}`,
    `publicExposureAllowedCount=${output.deploySnapshot.publicExposureAllowedCount}`,
    `authGatedDeployAllowedCount=${output.deploySnapshot.authGatedDeployAllowedCount}`,
    '',
    ...output.deployDecisions.flatMap((item) => [
      `${item.requestKey}`,
      `surfaceKey=${item.surfaceKey}`,
      `deployAllowed=${item.deployAllowed ? 'yes' : 'no'}`,
      `publicExposureAllowed=${item.publicExposureAllowed ? 'yes' : 'no'}`,
      `authGatedDeployAllowed=${item.authGatedDeployAllowed ? 'yes' : 'no'}`,
      `reason=${item.reason}`,
      '',
    ]),
  ].join('\n');
}

export async function runVercelProductConnectionPublicSurfaceWave(): Promise<PantavionVercelProductConnectionPublicSurfaceWaveOutput> {
  const accessRequests: PantavionSurfaceAccessRequest[] = [
    {
      surfaceKey: 'surface_home',
      roleKey: 'guest',
      visibility: 'public',
      isAuthenticated: false,
    },
    {
      surfaceKey: 'surface_memory_timeline',
      roleKey: 'user',
      visibility: 'authenticated',
      isAuthenticated: true,
    },
    {
      surfaceKey: 'surface_ai_authority',
      roleKey: 'operator',
      visibility: 'operator',
      isAuthenticated: true,
    },
    {
      surfaceKey: 'surface_governance_console',
      roleKey: 'founder',
      visibility: 'founder',
      isAuthenticated: true,
    },
    {
      surfaceKey: 'surface_governance_console',
      roleKey: 'operator',
      visibility: 'founder',
      isAuthenticated: true,
    },
  ];

  const deployRequests: PantavionVercelDeployRequest[] = [
    {
      requestKey: 'deploy_home_prod_ready',
      surfaceKey: 'surface_home',
      environmentKey: 'production',
      visibility: 'public',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 20,
      activeCriticalIncident: false,
    },
    {
      requestKey: 'deploy_memory_prod_ready',
      surfaceKey: 'surface_memory_timeline',
      environmentKey: 'production',
      visibility: 'authenticated',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 20,
      activeCriticalIncident: false,
    },
    {
      requestKey: 'deploy_governance_prod_ready',
      surfaceKey: 'surface_governance_console',
      environmentKey: 'production',
      visibility: 'founder',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 20,
      activeCriticalIncident: false,
    },
    {
      requestKey: 'deploy_home_prod_blocked_incident',
      surfaceKey: 'surface_home',
      environmentKey: 'production',
      visibility: 'public',
      founderApprovalPresent: true,
      observabilityReady: true,
      secretsRotationAgeDays: 20,
      activeCriticalIncident: true,
    },
    {
      requestKey: 'deploy_home_staging_ready',
      surfaceKey: 'surface_home',
      environmentKey: 'staging',
      visibility: 'public',
      founderApprovalPresent: false,
      observabilityReady: true,
      secretsRotationAgeDays: 20,
      activeCriticalIncident: false,
    },
  ];

  const accessDecisions = accessRequests.map((item) => evaluateSurfaceAccess(item));
  const deployDecisions = deployRequests.map((item) => evaluateVercelPublicDeploy(item));

  const output: PantavionVercelProductConnectionPublicSurfaceWaveOutput = {
    generatedAt: nowIso(),
    surfaceSnapshot: getProductSurfaceSnapshot(),
    accessSnapshot: getSurfaceAccessSnapshot(accessDecisions),
    deploySnapshot: getVercelDeploySnapshot(deployDecisions),
    accessDecisions,
    deployDecisions,
    rendered: '',
    html: '',
  };

  output.rendered = renderWave(output);
  output.html = renderHtml(output);

  saveKernelState({
    key: 'app.vercel-product-connection.latest',
    kind: 'report',
    payload: {
      surfaceSnapshot: output.surfaceSnapshot,
      accessSnapshot: output.accessSnapshot,
      deploySnapshot: output.deploySnapshot,
      surfaces: listProductSurfaces(),
      accessDecisions: output.accessDecisions,
      deployDecisions: output.deployDecisions,
    },
    tags: ['app', 'vercel', 'product-connection', 'surface', 'latest'],
    metadata: {
      surfaceCount: output.surfaceSnapshot.surfaceCount,
      accessAllowedCount: output.accessSnapshot.allowedCount,
      deployAllowedCount: output.deploySnapshot.deployAllowedCount,
      publicExposureAllowedCount: output.deploySnapshot.publicExposureAllowedCount,
    },
  });

  return output;
}

export default runVercelProductConnectionPublicSurfaceWave;
