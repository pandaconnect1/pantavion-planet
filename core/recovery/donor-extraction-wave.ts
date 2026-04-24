// core/recovery/donor-extraction-wave.ts

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { saveKernelState } from '../storage/kernel-state-store';
import {
  listDonorRepositories,
  getDonorRepositorySnapshot,
  type PantavionDonorRepositoryRecord,
} from './donor-extraction-registry';

export interface PantavionPackageAudit {
  packageName: string | null;
  dependencyCount: number;
  devDependencyCount: number;
}

export interface PantavionDonorExtractionRecord {
  projectKey: string;
  fullPath: string;
  presentLocally: boolean;
  urgency: 'critical' | 'high' | 'medium';
  extractionFocus: string[];
  appRoutes: string[];
  pageRoutes: string[];
  componentFiles: string[];
  brandFiles: string[];
  layoutFiles: string[];
  styleFiles: string[];
  packageAudit: PantavionPackageAudit;
  signalScore: number;
}

export interface PantavionDonorExtractionWaveOutput {
  generatedAt: string;
  repoRoot: string;
  donorSnapshot: ReturnType<typeof getDonorRepositorySnapshot>;
  donorRecords: PantavionDonorExtractionRecord[];
  recommendedOrder: string[];
  rendered: string;
}

const MAX_ITEMS_PER_BUCKET = 80;

function nowIso(): string {
  return new Date().toISOString();
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

function normalizeRelative(targetPath: string, basePath: string): string {
  return path.relative(basePath, targetPath).replace(/\\/g, '/');
}

function isIgnoredDirectory(name: string): boolean {
  return (
    name === 'node_modules' ||
    name === '.next' ||
    name === '.git' ||
    name === 'dist' ||
    name === 'build' ||
    name === 'out' ||
    name === 'coverage'
  );
}

function walkFiles(rootDir: string): string[] {
  if (!existsSync(rootDir)) {
    return [];
  }

  const results: string[] = [];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (isIgnoredDirectory(entry.name)) {
          continue;
        }

        walk(fullPath);
        continue;
      }

      if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

function limitItems(values: string[]): string[] {
  return values.slice(0, MAX_ITEMS_PER_BUCKET);
}

function collectAppRoutes(projectPath: string): string[] {
  const appDir = path.join(projectPath, 'app');

  if (!existsSync(appDir)) {
    return [];
  }

  const routes: string[] = [];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'api' || entry.name.startsWith('_') || isIgnoredDirectory(entry.name)) {
          continue;
        }

        walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'page.tsx') {
        const relativeDir = normalizeRelative(path.dirname(fullPath), appDir);

        if (!relativeDir || relativeDir === '.') {
          routes.push('/');
        } else {
          routes.push(`/${relativeDir}`);
        }
      }
    }
  }

  walk(appDir);
  return Array.from(new Set(routes)).sort();
}

function collectPageRoutes(projectPath: string): string[] {
  const pagesDir = path.join(projectPath, 'pages');

  if (!existsSync(pagesDir)) {
    return [];
  }

  const routes: string[] = [];

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'api' || isIgnoredDirectory(entry.name)) {
          continue;
        }

        walk(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      if (!/\.tsx?$/.test(entry.name)) {
        continue;
      }

      if (entry.name === '_app.tsx' || entry.name === '_document.tsx') {
        continue;
      }

      const relativeFile = normalizeRelative(fullPath, pagesDir)
        .replace(/index\.tsx?$/, '')
        .replace(/\.tsx?$/, '');

      const route = `/${relativeFile}`.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
      routes.push(route);
    }
  }

  walk(pagesDir);
  return Array.from(new Set(routes)).sort();
}

function collectComponentFiles(projectPath: string): string[] {
  const candidateRoots = [
    path.join(projectPath, 'components'),
    path.join(projectPath, 'src', 'components'),
  ].filter((root) => existsSync(root));

  const files = candidateRoots.flatMap((root) =>
    walkFiles(root)
      .filter((filePath) => /\.(tsx?|jsx?)$/.test(filePath))
      .map((filePath) => normalizeRelative(filePath, projectPath)),
  );

  return Array.from(new Set(files)).sort();
}

function collectBrandFiles(projectPath: string): string[] {
  const candidateRoots = [
    path.join(projectPath, 'app'),
    path.join(projectPath, 'public'),
    path.join(projectPath, 'src'),
    path.join(projectPath, 'components'),
  ].filter((root) => existsSync(root));

  const files = candidateRoots.flatMap((root) =>
    walkFiles(root)
      .filter((filePath) => /(logo|icon|brand|favicon)/i.test(path.basename(filePath)))
      .map((filePath) => normalizeRelative(filePath, projectPath)),
  );

  return Array.from(new Set(files)).sort();
}

function collectLayoutFiles(projectPath: string): string[] {
  const candidateRoots = [
    path.join(projectPath, 'app'),
    path.join(projectPath, 'pages'),
    path.join(projectPath, 'src'),
  ].filter((root) => existsSync(root));

  const files = candidateRoots.flatMap((root) =>
    walkFiles(root)
      .filter((filePath) => /(layout|template|page)\.(tsx?|jsx?)$/i.test(path.basename(filePath)))
      .map((filePath) => normalizeRelative(filePath, projectPath)),
  );

  return Array.from(new Set(files)).sort();
}

function collectStyleFiles(projectPath: string): string[] {
  const candidateRoots = [
    path.join(projectPath, 'app'),
    path.join(projectPath, 'src'),
    path.join(projectPath, 'styles'),
  ].filter((root) => existsSync(root));

  const rootFiles = [
    path.join(projectPath, 'tailwind.config.js'),
    path.join(projectPath, 'tailwind.config.ts'),
    path.join(projectPath, 'tailwind.config.cjs'),
    path.join(projectPath, 'postcss.config.js'),
    path.join(projectPath, 'postcss.config.cjs'),
  ].filter((filePath) => existsSync(filePath));

  const files = [
    ...candidateRoots.flatMap((root) =>
      walkFiles(root)
        .filter((filePath) => /\.(css|scss|sass)$/.test(filePath))
        .map((filePath) => normalizeRelative(filePath, projectPath)),
    ),
    ...rootFiles.map((filePath) => normalizeRelative(filePath, projectPath)),
  ];

  return Array.from(new Set(files)).sort();
}

function collectPackageAudit(projectPath: string): PantavionPackageAudit {
  const packageJsonPath = path.join(projectPath, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return {
      packageName: null,
      dependencyCount: 0,
      devDependencyCount: 0,
    };
  }

  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      name?: string;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return {
      packageName: parsed.name ?? null,
      dependencyCount: Object.keys(parsed.dependencies ?? {}).length,
      devDependencyCount: Object.keys(parsed.devDependencies ?? {}).length,
    };
  } catch {
    return {
      packageName: null,
      dependencyCount: 0,
      devDependencyCount: 0,
    };
  }
}

function buildRecord(repoRoot: string, donor: PantavionDonorRepositoryRecord): PantavionDonorExtractionRecord {
  const parentDir = path.dirname(repoRoot);
  const fullPath = path.join(parentDir, donor.projectKey);
  const presentLocally = existsSync(fullPath);

  if (!presentLocally) {
    return {
      projectKey: donor.projectKey,
      fullPath,
      presentLocally: false,
      urgency: donor.urgency,
      extractionFocus: donor.extractionFocus,
      appRoutes: [],
      pageRoutes: [],
      componentFiles: [],
      brandFiles: [],
      layoutFiles: [],
      styleFiles: [],
      packageAudit: {
        packageName: null,
        dependencyCount: 0,
        devDependencyCount: 0,
      },
      signalScore: 0,
    };
  }

  const appRoutes = collectAppRoutes(fullPath);
  const pageRoutes = collectPageRoutes(fullPath);
  const componentFiles = collectComponentFiles(fullPath);
  const brandFiles = collectBrandFiles(fullPath);
  const layoutFiles = collectLayoutFiles(fullPath);
  const styleFiles = collectStyleFiles(fullPath);
  const packageAudit = collectPackageAudit(fullPath);

  const signalScore =
    appRoutes.length * 3 +
    pageRoutes.length * 2 +
    componentFiles.length * 2 +
    brandFiles.length * 4 +
    layoutFiles.length * 2 +
    styleFiles.length;

  return {
    projectKey: donor.projectKey,
    fullPath,
    presentLocally,
    urgency: donor.urgency,
    extractionFocus: donor.extractionFocus,
    appRoutes: limitItems(appRoutes),
    pageRoutes: limitItems(pageRoutes),
    componentFiles: limitItems(componentFiles),
    brandFiles: limitItems(brandFiles),
    layoutFiles: limitItems(layoutFiles),
    styleFiles: limitItems(styleFiles),
    packageAudit,
    signalScore,
  };
}

function renderWave(output: PantavionDonorExtractionWaveOutput): string {
  return [
    'PANTAVION DONOR EXTRACTION WAVE',
    `generatedAt=${output.generatedAt}`,
    `repoRoot=${output.repoRoot}`,
    '',
    'DONOR SNAPSHOT',
    `donorCount=${output.donorSnapshot.donorCount}`,
    `criticalCount=${output.donorSnapshot.criticalCount}`,
    `highCount=${output.donorSnapshot.highCount}`,
    `mediumCount=${output.donorSnapshot.mediumCount}`,
    '',
    'DONOR RECORDS',
    ...output.donorRecords.flatMap((item) => [
      `${item.projectKey}`,
      `presentLocally=${item.presentLocally}`,
      `urgency=${item.urgency}`,
      `signalScore=${item.signalScore}`,
      `packageName=${item.packageAudit.packageName ?? 'unknown'}`,
      `dependencyCount=${item.packageAudit.dependencyCount}`,
      `devDependencyCount=${item.packageAudit.devDependencyCount}`,
      `appRouteCount=${item.appRoutes.length}`,
      `pageRouteCount=${item.pageRoutes.length}`,
      `componentCount=${item.componentFiles.length}`,
      `brandFileCount=${item.brandFiles.length}`,
      `layoutFileCount=${item.layoutFiles.length}`,
      `styleFileCount=${item.styleFiles.length}`,
      `extractionFocus=${item.extractionFocus.join(',')}`,
      '',
      ...item.appRoutes.map((value) => `appRoute=${value}`),
      ...item.pageRoutes.map((value) => `pageRoute=${value}`),
      ...item.componentFiles.map((value) => `component=${value}`),
      ...item.brandFiles.map((value) => `brand=${value}`),
      ...item.layoutFiles.map((value) => `layout=${value}`),
      ...item.styleFiles.map((value) => `style=${value}`),
      '',
    ]),
    'RECOMMENDED EXTRACTION ORDER',
    ...output.recommendedOrder.map((value, index) => `${index + 1}. ${value}`),
  ].join('\n');
}

export async function runDonorExtractionWave(): Promise<PantavionDonorExtractionWaveOutput> {
  const repoRoot = process.cwd();
  const donorRecords = listDonorRepositories()
    .map((donor) => buildRecord(repoRoot, donor))
    .sort((a, b) => {
      const urgencyDiff = urgencyRank(a.urgency) - urgencyRank(b.urgency);
      if (urgencyDiff !== 0) {
        return urgencyDiff;
      }

      return b.signalScore - a.signalScore;
    });

  const output: PantavionDonorExtractionWaveOutput = {
    generatedAt: nowIso(),
    repoRoot,
    donorSnapshot: getDonorRepositorySnapshot(),
    donorRecords,
    recommendedOrder: donorRecords.map((item) => item.projectKey),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'recovery.donor-extraction.latest',
    kind: 'report',
    payload: {
      donorSnapshot: output.donorSnapshot,
      donorRecords: output.donorRecords,
      recommendedOrder: output.recommendedOrder,
    },
    tags: ['recovery', 'donor', 'extraction', 'ui', 'brand', 'routes', 'latest'],
    metadata: {
      donorCount: output.donorRecords.length,
      firstRecommendedDonor: output.recommendedOrder[0] ?? 'none',
    },
  });

  return output;
}

export default runDonorExtractionWave;
