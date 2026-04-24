// scripts/run-cross-device-continuity-wave.ts

import { runCrossDeviceContinuityWave } from '../core/continuity/cross-device-continuity-wave';

async function main(): Promise<void> {
  const output = await runCrossDeviceContinuityWave();
  console.log(output.rendered);
}

void main();
