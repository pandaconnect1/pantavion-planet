// core/recovery/repository-triage-plan-wave.ts

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { saveKernelState } from '../storage/kernel-state-store';
import {
  listRepositoryTriagePolicies,
  getRepositoryTriagePolicySnapshot,
  type PantavionRepositoryDisposition,
} from './repository-triage-registry';

export interface PantavionSiblingInventoryRecord {
  name: string;
  fullPath: string;
  presentLocally: boolean;
  hasAppDir: boolean;
  hasPublicDir: boolean;
  hasComponentsDir: boolean;
  routePageCount: number;
  brandFileCount: number;
}

export interface PantavionRepositoryTriageDecision {
  projectKey: string;
  disposition: PantavionRepositoryDisposition;
  urgency: 'critical' | 'high' | 'medium';
  presentLocally: boolean;
  routePageCount: number;
  brandFileCount: number;
  extractionFocus: string[];
  freezeAfterMigration: boolean;
  notes: string[];
}

export interface PantavionRepositoryTriagePlanWaveOutput {
  generatedAt: string;
  repoRoot: string;
  policySnapshot: ReturnType<typeof getRepositoryTriagePolicySnapshot>;
  siblingInventory: PantavionSiblingInventoryRecord[];
  triageDecisions: PantavionRepositoryTriageDecision[];
  canonicalProject: string;
  migrateQueue: PantavionRepositoryTriageDecision[];
  referenceQueue: PantavionRepositoryTriageDecision[];
  archiveLaterQueue: PantavionRepositoryTriageDecision[];
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function collectRelevantSiblingNames(repoRoot: string): string[] {
  const parentDir = path.dirname(repoRoot);

  return readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => /pantavion|pantaai|nextjs-ai-chatbot/i.test(name))
    .sort((a, b) => a.localeCompare(b));
}

function countRoutePages(projectPath: string): number {
  const appDir = path.join(projectPath, 'app');

  if (!existsSync(appDir)) {
    return 0;
  }

  let count = 0;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'page.tsx') {
        count += 1;
      }
    }
  }

  walk(appDir);
  return count;
}

function countBrandFiles(projectPath: string): number {
  const roots = [
    path.join(projectPath, 'app'),
    path.join(projectPath, 'public'),
    path.join(projectPath, 'src'),
  ].filter((root) => existsSync(root));

  const pattern = /(logo|icon|brand|favicon)/i;
  let count = 0;

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (entry.isFile() && pattern.test(entry.name)) {
        count += 1;
      }
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return count;
}

function collectSiblingInventory(repoRoot: string): PantavionSiblingInventoryRecord[] {
  const parentDir = path.dirname(repoRoot);
  const relevantNames = collectRelevantSiblingNames(repoRoot);

  return relevantNames.map((name) => {
    const fullPath = path.join(parentDir, name);

    return {
      name,
      fullPath,
      presentLocally: true,
      hasAppDir: existsSync(path.join(fullPath, 'app')),
      hasPublicDir: existsSync(path.join(fullPath, 'public')),
      hasComponentsDir:
        existsSync(path.join(fullPath, 'components')) ||
        existsSync(path.join(fullPath, 'src', 'components')),
      routePageCount: countRoutePages(fullPath),
      brandFileCount: countBrandFiles(fullPath),
    };
  });
}

function urgencyRank(value: 'critical' | 'high' | 'medium'): number {
  switch (value) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    case 'medium':
      return 2;
  }
}

function dispositionRank(value: PantavionRepositoryDisposition): number {
  switch (value) {
    case 'canonical-keep':
      return 0;
    case 'migrate-donor':
      return 1;
    case 'reference-only':
      return 2;
    case 'archive-after-recovery':
      return 3;
  }
}

function renderWave(output: PantavionRepositoryTriagePlanWaveOutput): string {
  return [
    'PANTAVION REPOSITORY TRIAGE PLAN WAVE',
    `generatedAt=${output.generatedAt}`,
    `repoRoot=${output.repoRoot}`,
    `canonicalProject=${output.canonicalProject}`,
    '',
    'POLICIES',
    `policyCount=${output.policySnapshot.policyCount}`,
    `canonicalCount=${output.policySnapshot.canonicalCount}`,
    `migrateDonorCount=${output.policySnapshot.migrateDonorCount}`,
    `referenceOnlyCount=${output.policySnapshot.referenceOnlyCount}`,
    `archiveAfterRecoveryCount=${output.policySnapshot.archiveAfterRecoveryCount}`,
    '',
    'SIBLING INVENTORY',
    `siblingCount=${output.siblingInventory.length}`,
    '',
    ...output.siblingInventory.flatMap((item) => [
      `${item.name}`,
      `hasAppDir=${item.hasAppDir}`,
      `hasPublicDir=${item.hasPublicDir}`,
      `hasComponentsDir=${item.hasComponentsDir}`,
      `routePageCount=${item.routePageCount}`,
      `brandFileCount=${item.brandFileCount}`,
      '',
    ]),
    'TRIAGE DECISIONS',
    ...output.triageDecisions.flatMap((item) => [
      `${item.projectKey}`,
      `disposition=${item.disposition}`,
      `urgency=${item.urgency}`,
      `presentLocally=${item.presentLocally}`,
      `routePageCount=${item.routePageCount}`,
      `brandFileCount=${item.brandFileCount}`,
      `extractionFocus=${item.extractionFocus.join(',')}`,
      '',
    ]),
    'MIGRATE QUEUE',
    `count=${output.migrateQueue.length}`,
    ...output.migrateQueue.map((item) => `${item.projectKey} :: ${item.urgency} :: routes=${item.routePageCount} :: brand=${item.brandFileCount}`),
    '',
    'REFERENCE QUEUE',
    `count=${output.referenceQueue.length}`,
    ...output.referenceQueue.map((item) => `${item.projectKey} :: ${item.urgency}`),
    '',
    'ARCHIVE LATER QUEUE',
    `count=${output.archiveLaterQueue.length}`,
    ...output.archiveLaterQueue.map((item) => `${item.projectKey} :: ${item.urgency}`),
    '',
    'DELETE NOW POLICY',
    'deleteNow=false',
    'reason=No repository is deleted before recovery and migration review are complete.',
  ].join('\n');
}

export async function runRepositoryTriagePlanWave(): Promise<PantavionRepositoryTriagePlanWaveOutput> {
  const repoRoot = process.cwd();
  const policies = listRepositoryTriagePolicies();
  const siblingInventory = collectSiblingInventory(repoRoot);

  const inventoryMap = new Map(siblingInventory.map((item) => [item.name, item]));

  const triageDecisions: PantavionRepositoryTriageDecision[] = policies
    .map((policy) => {
      const inventory = inventoryMap.get(policy.projectKey);

      return {
        projectKey: policy.projectKey,
        disposition: policy.disposition,
        urgency: policy.urgency,
        presentLocally: Boolean(inventory),
        routePageCount: inventory?.routePageCount ?? 0,
        brandFileCount: inventory?.brandFileCount ?? 0,
        extractionFocus: policy.extractionFocus,
        freezeAfterMigration: policy.freezeAfterMigration,
        notes: policy.notes,
      };
    })
    .sort((a, b) => {
      const dispositionDiff = dispositionRank(a.disposition) - dispositionRank(b.disposition);
      if (dispositionDiff !== 0) {
        return dispositionDiff;
      }

      const urgencyDiff = urgencyRank(a.urgency) - urgencyRank(b.urgency);
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      return a.projectKey.localeCompare(b.projectKey);
    });

  const output: PantavionRepositoryTriagePlanWaveOutput = {
    generatedAt: nowIso(),
    repoRoot,
    policySnapshot: getRepositoryTriagePolicySnapshot(),
    siblingInventory,
    triageDecisions,
    canonicalProject: 'pantavion-planet',
    migrateQueue: triageDecisions.filter((item) => item.disposition === 'migrate-donor'),
    referenceQueue: triageDecisions.filter((item) => item.disposition === 'reference-only'),
    archiveLaterQueue: triageDecisions.filter((item) => item.disposition === 'archive-after-recovery'),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'recovery.repository-triage.latest',
    kind: 'report',
    payload: {
      policySnapshot: output.policySnapshot,
      siblingInventory: output.siblingInventory,
      triageDecisions: output.triageDecisions,
      canonicalProject: output.canonicalProject,
      migrateQueue: output.migrateQueue,
      referenceQueue: output.referenceQueue,
      archiveLaterQueue: output.archiveLaterQueue,
      deleteNow: false,
    },
    tags: ['recovery', 'triage', 'repos', 'migration', 'preservation', 'latest'],
    metadata: {
      siblingCount: output.siblingInventory.length,
      migrateQueueCount: output.migrateQueue.length,
      referenceQueueCount: output.referenceQueue.length,
      archiveLaterQueueCount: output.archiveLaterQueue.length,
    },
  });

  return output;
}

export default runRepositoryTriagePlanWave;
