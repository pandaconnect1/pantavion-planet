// scripts/run-primary-lane-cutover-mini-wave.ts

import { runPrimaryLaneCutoverMiniWave } from '../core/protocol/primary-lane-cutover-mini-wave';

async function main(): Promise<void> {
  const output = await runPrimaryLaneCutoverMiniWave();
  console.log(output.rendered);
}

void main();
