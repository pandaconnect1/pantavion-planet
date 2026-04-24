// scripts/run-visibility-inspector-surface.ts

import { runVisibilityInspectorSurface } from '../core/inspector/visibility-inspector-surface';

async function main(): Promise<void> {
  const output = await runVisibilityInspectorSurface();
  console.log(output.rendered);
}

void main();
