// scripts/run-donor-extraction-wave.ts

import { runDonorExtractionWave } from '../core/recovery/donor-extraction-wave';

async function main(): Promise<void> {
  const output = await runDonorExtractionWave();
  console.log(output.rendered);
}

void main();
