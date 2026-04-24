// scripts/run-founder-human-final-authority-wave.ts

import { runFounderHumanFinalAuthorityWave } from '../core/governance/founder-human-final-authority-wave';

async function main(): Promise<void> {
  const output = await runFounderHumanFinalAuthorityWave();
  console.log(output.rendered);
}

void main();
