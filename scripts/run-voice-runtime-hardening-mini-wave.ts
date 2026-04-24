// scripts/run-voice-runtime-hardening-mini-wave.ts

import { runVoiceRuntimeHardeningMiniWave } from '../core/runtime/voice-runtime-hardening-mini-wave';

async function main(): Promise<void> {
  const output = await runVoiceRuntimeHardeningMiniWave();
  console.log(output.rendered);
}

void main();
