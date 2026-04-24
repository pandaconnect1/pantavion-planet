// scripts/run-human-first-homepage-wave.ts

import { runHumanFirstHomepageWave } from '../core/public-surface/human-first-homepage-wave';

function main(): void {
  const output = runHumanFirstHomepageWave();
  console.log(output.rendered);
}

main();
