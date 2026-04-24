// scripts/export-repository-triage-plan-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runRepositoryTriagePlanWave } from '../core/recovery/repository-triage-plan-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runRepositoryTriagePlanWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/repository-triage-plan-${stamp}.json`;
  const txtPath = `./exports/repository-triage-plan-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('REPOSITORY_TRIAGE_PLAN_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
