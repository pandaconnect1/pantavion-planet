export type PantavionRecoveryIncidentCategory =
  | 'type-drift'
  | 'export-mismatch'
  | 'merge-corruption'
  | 'config-breakage'
  | 'runtime-missing'
  | 'unknown';

export type PantavionRecoveryPhase =
  | 'detect'
  | 'freeze'
  | 'snapshot'
  | 'compare'
  | 'classify'
  | 'restore'
  | 'verify'
  | 'promote'
  | 'block';

export interface PantavionStableBaselineRef {
  branch: string;
  description: string;
  criticalFiles: string[];
}

export interface PantavionRecoveryIncident {
  id: string;
  category: PantavionRecoveryIncidentCategory;
  title: string;
  summary: string;
  affectedFiles: string[];
  detectedAt: string;
}

export interface PantavionRecoveryAction {
  phase: PantavionRecoveryPhase;
  title: string;
  details: string;
  targetFiles?: string[];
}

export interface PantavionRecoveryPlan {
  incident: PantavionRecoveryIncident;
  baseline: PantavionStableBaselineRef;
  actions: PantavionRecoveryAction[];
  promoteAllowed: boolean;
}

export function classifyRecoveryIncident(input: {
  title: string;
  summary: string;
  affectedFiles: string[];
}): PantavionRecoveryIncident {
  const text = `${input.title} ${input.summary}`.toLowerCase();

  let category: PantavionRecoveryIncidentCategory = 'unknown';
  if (text.includes('export') || text.includes('not exported')) category = 'export-mismatch';
  else if (text.includes('conflict') || text.includes('<<<<') || text.includes('merge')) category = 'merge-corruption';
  else if (text.includes('tsc') || text.includes('type')) category = 'type-drift';
  else if (text.includes('runtime') || text.includes('missing')) category = 'runtime-missing';
  else if (text.includes('eslint') || text.includes('config')) category = 'config-breakage';

  return {
    id: `incident:${Date.now()}`,
    category,
    title: input.title,
    summary: input.summary,
    affectedFiles: input.affectedFiles,
    detectedAt: new Date().toISOString(),
  };
}

export function createRecoveryPlan(input: {
  incident: PantavionRecoveryIncident;
  baseline?: PantavionStableBaselineRef;
}): PantavionRecoveryPlan {
  const baseline: PantavionStableBaselineRef = input.baseline ?? {
    branch: 'origin/pantavion-runtime-stabilize',
    description: 'Last known runtime stabilization baseline.',
    criticalFiles: input.incident.affectedFiles,
  };

  return {
    incident: input.incident,
    baseline,
    actions: [
      {
        phase: 'freeze',
        title: 'Freeze unstable patching on main',
        details: 'Do not continue uncontrolled patching on main.',
      },
      {
        phase: 'snapshot',
        title: 'Create backup of current state',
        details: 'Capture current broken state before restore.',
      },
      {
        phase: 'restore',
        title: 'Restore affected files from stable baseline',
        details: 'Restore only the critical files from the last known good branch.',
        targetFiles: baseline.criticalFiles,
      },
      {
        phase: 'verify',
        title: 'Run strict verification gate',
        details: 'Run tsc, build, guardian, and runtime smoke in that order.',
      },
      {
        phase: 'promote',
        title: 'Promote only if all gates are green',
        details: 'Do not promote or merge unless every verification gate passes.',
      },
    ],
    baseline,
    promoteAllowed: false,
  };
}