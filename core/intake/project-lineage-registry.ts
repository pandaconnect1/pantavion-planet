// core/intake/project-lineage-registry.ts

export interface PantavionProjectLineageRecord {
  lineageKey: string;
  projectRole: 'canonical-current' | 'legacy-fragment' | 'recovery-candidate';
  importance: 'critical' | 'high' | 'medium';
  notes: string[];
}

export interface PantavionProjectLineageSnapshot {
  generatedAt: string;
  lineageCount: number;
  criticalCount: number;
  recoveryCandidateCount: number;
  legacyFragmentCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const PROJECT_LINEAGE: PantavionProjectLineageRecord[] = [
  {
    lineageKey: 'pantavion-current-vercel-project',
    projectRole: 'canonical-current',
    importance: 'critical',
    notes: ['Current deployed Vercel project acting as canonical live shell.'],
  },
  {
    lineageKey: 'legacy-vercel-fragments',
    projectRole: 'legacy-fragment',
    importance: 'high',
    notes: ['Potential older Vercel projects may contain missing surfaces, themes, env assumptions or components.'],
  },
  {
    lineageKey: 'cross-project-recovery-audit',
    projectRole: 'recovery-candidate',
    importance: 'critical',
    notes: ['A future recovery audit must merge missing themes, pages, assets and configs from scattered project lineage.'],
  },
];

export function listProjectLineageRecords(): PantavionProjectLineageRecord[] {
  return PROJECT_LINEAGE.map((item) => cloneValue(item));
}

export function getProjectLineageSnapshot(): PantavionProjectLineageSnapshot {
  const list = listProjectLineageRecords();

  return {
    generatedAt: nowIso(),
    lineageCount: list.length,
    criticalCount: list.filter((item) => item.importance === 'critical').length,
    recoveryCandidateCount: list.filter((item) => item.projectRole === 'recovery-candidate').length,
    legacyFragmentCount: list.filter((item) => item.projectRole === 'legacy-fragment').length,
  };
}

export default listProjectLineageRecords;
