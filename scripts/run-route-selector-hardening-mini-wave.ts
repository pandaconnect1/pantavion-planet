// scripts/run-route-selector-hardening-mini-wave.ts

import { runRouteSelectorHardeningMiniWave } from '../core/protocol/route-selector-hardening-mini-wave';

async function main(): Promise<void> {
  const output = await runRouteSelectorHardeningMiniWave();
  console.log(output.rendered);
}

void main();
