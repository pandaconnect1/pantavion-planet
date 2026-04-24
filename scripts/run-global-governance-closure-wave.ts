// scripts/run-global-governance-closure-wave.ts

import { runGlobalGovernanceClosureWave } from '../core/governance/global-governance-closure-wave';

async function main(): Promise<void> {
  const output = await runGlobalGovernanceClosureWave();
  console.log(output.rendered);
}

void main();
