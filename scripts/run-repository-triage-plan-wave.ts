// scripts/run-repository-triage-plan-wave.ts

import { runRepositoryTriagePlanWave } from '../core/recovery/repository-triage-plan-wave';

async function main(): Promise<void> {
  const output = await runRepositoryTriagePlanWave();
  console.log(output.rendered);
}

void main();
