// scripts/run-fallback-bypass-enforcement-mini-wave.ts

import { runFallbackBypassEnforcementMiniWave } from '../core/protocol/fallback-bypass-enforcement-mini-wave';

async function main(): Promise<void> {
  const output = await runFallbackBypassEnforcementMiniWave();
  console.log(output.rendered);
}

void main();
