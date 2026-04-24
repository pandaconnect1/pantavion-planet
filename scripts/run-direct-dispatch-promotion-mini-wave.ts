// scripts/run-direct-dispatch-promotion-mini-wave.ts

import { runDirectDispatchPromotionMiniWave } from '../core/protocol/direct-dispatch-promotion-mini-wave';

async function main(): Promise<void> {
  const output = await runDirectDispatchPromotionMiniWave();
  console.log(output.rendered);
}

void main();
