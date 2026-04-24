// scripts/export-global-governance-closure-wave.ts

import { mkdir, writeFile } from 'node:fs/promises';
import { runGlobalGovernanceClosureWave } from '../core/governance/global-governance-closure-wave';

function makeStamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function main(): Promise<void> {
  const output = await runGlobalGovernanceClosureWave();
  const stamp = makeStamp();

  await mkdir('./exports', { recursive: true });

  const jsonPath = `./exports/global-governance-closure-${stamp}.json`;
  const txtPath = `./exports/global-governance-closure-${stamp}.txt`;

  await writeFile(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  await writeFile(txtPath, output.rendered, 'utf8');

  console.log('GLOBAL_GOVERNANCE_CLOSURE_EXPORTED');
  console.log(`jsonPath=${jsonPath}`);
  console.log(`txtPath=${txtPath}`);
}

void main();
