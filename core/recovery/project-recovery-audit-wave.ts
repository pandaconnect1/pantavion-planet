// core/recovery/project-recovery-audit-wave.ts

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { saveKernelState } from '../storage/kernel-state-store';
import { listProjectFragments, getProjectFragmentSnapshot } from './project-fragment-registry';
import { listSurfaceCategories } from '../intake/surface-category-registry';

export interface PantavionLocalSiblingProject {
  name: string;
  fullPath: string;
  looksRelevant: boolean;
}

export interface PantavionBrandFileRecord {
  name: string;
  fullPath: string;
}

export interface PantavionLinkedVercelProjectInfo {
  projectId?: string;
  orgId?: string;
  projectName?: string;
}

export interface PantavionGitAuditInfo {
  remotes: string[];
  branches: string[];
}

export interface PantavionProjectRecoveryAuditWaveOutput {
  generatedAt: string;
  repoRoot: string;
  linkedVercelProject: PantavionLinkedVercelProjectInfo | null;
  projectFragmentSnapshot: ReturnType<typeof getProjectFragmentSnapshot>;
  knownProjectFragments: ReturnType<typeof listProjectFragments>;
  localSiblingProjects: PantavionLocalSiblingProject[];
  currentRoutes: string[];
  humanFirstExpectedSurfaces: string[];
  missingHumanFirstSurfaces: string[];
  brandFiles: PantavionBrandFileRecord[];
  gitAudit: PantavionGitAuditInfo;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeExecLines(command: string): string[] {
  try {
    const output = execSync(command, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).trim();

    if (!output) {
      return [];
    }

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function readLinkedVercelProject(repoRoot: string): PantavionLinkedVercelProjectInfo | null {
  const vercelProjectJson = path.join(repoRoot, '.vercel', 'project.json');

  if (!existsSync(vercelProjectJson)) {
    return null;
  }

  try {
    const parsed = JSON.parse(readFileSync(vercelProjectJson, 'utf8')) as PantavionLinkedVercelProjectInfo;
    return {
      projectId: parsed.projectId,
      orgId: parsed.orgId,
      projectName: parsed.projectName,
    };
  } catch {
    return null;
  }
}

function collectLocalSiblingProjects(repoRoot: string): PantavionLocalSiblingProject[] {
  const parentDir = path.dirname(repoRoot);
  const entries = readdirSync(parentDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const fullPath = path.join(parentDir, entry.name);
      const looksRelevant = /pantavion|pantaai|nextjs-ai-chatbot/i.test(entry.name);

      return {
        name: entry.name,
        fullPath,
        looksRelevant,
      };
    })
    .filter((item) => item.looksRelevant)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function collectCurrentRoutes(repoRoot: string): string[] {
  const appDir = path.join(repoRoot, 'app');

  if (!existsSync(appDir)) {
    return [];
  }

  const routes: string[] = [];

  function walkPages(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'api' || entry.name.startsWith('_')) {
          continue;
        }

        walkPages(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'page.tsx') {
        const relativeDir = path.relative(appDir, path.dirname(fullPath)).replace(/\\/g, '/');

        if (!relativeDir || relativeDir === '.') {
          routes.push('/');
        } else {
          routes.push(`/${relativeDir}`);
        }
      }
    }
  }

  walkPages(appDir);

  return Array.from(new Set(routes)).sort();
}

function collectBrandFiles(repoRoot: string): PantavionBrandFileRecord[] {
  const targetRoots = [
    path.join(repoRoot, 'app'),
    path.join(repoRoot, 'public'),
  ].filter((target) => existsSync(target));

  const results: PantavionBrandFileRecord[] = [];
  const pattern = /(logo|icon|brand|favicon)/i;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && pattern.test(entry.name)) {
        results.push({
          name: entry.name,
          fullPath,
        });
      }
    }
  }

  for (const root of targetRoots) {
    walk(root);
  }

  return results.sort((a, b) => a.fullPath.localeCompare(b.fullPath));
}

function collectGitAudit(): PantavionGitAuditInfo {
  const remotes = safeExecLines('git remote -v');
  const branches = safeExecLines('git branch --format="%(refname:short)"');

  return { remotes, branches };
}

function renderWave(output: PantavionProjectRecoveryAuditWaveOutput): string {
  return [
    'PANTAVION PROJECT RECOVERY AUDIT WAVE',
    `generatedAt=${output.generatedAt}`,
    `repoRoot=${output.repoRoot}`,
    '',
    'LINKED VERCEL PROJECT',
    `projectName=${output.linkedVercelProject?.projectName ?? 'unknown'}`,
    `projectId=${output.linkedVercelProject?.projectId ?? 'unknown'}`,
    `orgId=${output.linkedVercelProject?.orgId ?? 'unknown'}`,
    '',
    'KNOWN PROJECT FRAGMENTS',
    `projectCount=${output.projectFragmentSnapshot.projectCount}`,
    `criticalCount=${output.projectFragmentSnapshot.criticalCount}`,
    `recoveryCandidateCount=${output.projectFragmentSnapshot.recoveryCandidateCount}`,
    '',
    ...output.knownProjectFragments.flatMap((item) => [
      `${item.projectKey}`,
      `role=${item.role}`,
      `importance=${item.importance}`,
      `likelyContains=${item.likelyContains.join(',')}`,
      '',
    ]),
    'LOCAL SIBLING PROJECTS',
    `siblingCount=${output.localSiblingProjects.length}`,
    '',
    ...output.localSiblingProjects.flatMap((item) => [
      `${item.name}`,
      `fullPath=${item.fullPath}`,
      '',
    ]),
    'CURRENT ROUTES',
    `routeCount=${output.currentRoutes.length}`,
    ...output.currentRoutes,
    '',
    'HUMAN FIRST SURFACES',
    `expectedCount=${output.humanFirstExpectedSurfaces.length}`,
    `missingCount=${output.missingHumanFirstSurfaces.length}`,
    `missing=${output.missingHumanFirstSurfaces.join(',') || 'none'}`,
    '',
    'BRAND FILES',
    `brandFileCount=${output.brandFiles.length}`,
    ...output.brandFiles.map((item) => `${item.name} => ${item.fullPath}`),
    '',
    'GIT AUDIT',
    `remoteCount=${output.gitAudit.remotes.length}`,
    ...output.gitAudit.remotes,
    '',
    `branchCount=${output.gitAudit.branches.length}`,
    ...output.gitAudit.branches,
  ].join('\n');
}

export async function runProjectRecoveryAuditWave(): Promise<PantavionProjectRecoveryAuditWaveOutput> {
  const repoRoot = process.cwd();
  const currentRoutes = collectCurrentRoutes(repoRoot);
  const expectedHumanFirstSurfaces = listSurfaceCategories()
    .filter((item) => item.layer === 'human-first')
    .map((item) => item.surfaceKey)
    .sort();

  const routeSet = new Set(currentRoutes);
  const missingHumanFirstSurfaces = expectedHumanFirstSurfaces.filter((surfaceKey) => !routeSet.has(`/${surfaceKey}`));

  const output: PantavionProjectRecoveryAuditWaveOutput = {
    generatedAt: nowIso(),
    repoRoot,
    linkedVercelProject: readLinkedVercelProject(repoRoot),
    projectFragmentSnapshot: getProjectFragmentSnapshot(),
    knownProjectFragments: listProjectFragments(),
    localSiblingProjects: collectLocalSiblingProjects(repoRoot),
    currentRoutes,
    humanFirstExpectedSurfaces: expectedHumanFirstSurfaces,
    missingHumanFirstSurfaces,
    brandFiles: collectBrandFiles(repoRoot),
    gitAudit: collectGitAudit(),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'recovery.project-audit.latest',
    kind: 'report',
    payload: {
      linkedVercelProject: output.linkedVercelProject,
      knownProjectFragments: output.knownProjectFragments,
      localSiblingProjects: output.localSiblingProjects,
      currentRoutes: output.currentRoutes,
      humanFirstExpectedSurfaces: output.humanFirstExpectedSurfaces,
      missingHumanFirstSurfaces: output.missingHumanFirstSurfaces,
      brandFiles: output.brandFiles,
      gitAudit: output.gitAudit,
      projectFragmentSnapshot: output.projectFragmentSnapshot,
    },
    tags: ['recovery', 'audit', 'lineage', 'vercel', 'routes', 'brand', 'latest'],
    metadata: {
      siblingCount: output.localSiblingProjects.length,
      routeCount: output.currentRoutes.length,
      missingHumanFirstSurfaceCount: output.missingHumanFirstSurfaces.length,
      brandFileCount: output.brandFiles.length,
    },
  });

  return output;
}

export default runProjectRecoveryAuditWave;
