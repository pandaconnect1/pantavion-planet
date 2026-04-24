// core/memory/cognitive-memory-stratification-wave.ts

import { runMemoryThreadKernelWave } from './memory-thread-kernel';
import { listEpisodicMemories, getEpisodicMemorySnapshot } from './episodic-memory-store';
import { listSemanticMemories, getSemanticMemorySnapshot } from './semantic-memory-store';
import { listWorkingMemories, getWorkingMemorySnapshot } from './working-memory-store';
import { listLongHorizonMemories, getLongHorizonMemorySnapshot } from './long-horizon-memory-store';
import { listPredictivePlanningMemories, getPredictivePlanningMemorySnapshot } from './predictive-planning-memory-store';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionCognitiveMemoryStratificationWaveOutput {
  generatedAt: string;
  episodicSnapshot: ReturnType<typeof getEpisodicMemorySnapshot>;
  semanticSnapshot: ReturnType<typeof getSemanticMemorySnapshot>;
  workingSnapshot: ReturnType<typeof getWorkingMemorySnapshot>;
  longHorizonSnapshot: ReturnType<typeof getLongHorizonMemorySnapshot>;
  predictiveSnapshot: ReturnType<typeof getPredictivePlanningMemorySnapshot>;
  rendered: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function renderWave(output: PantavionCognitiveMemoryStratificationWaveOutput): string {
  const episodic = listEpisodicMemories();
  const semantic = listSemanticMemories();
  const working = listWorkingMemories();
  const longHorizon = listLongHorizonMemories();
  const predictive = listPredictivePlanningMemories();

  return [
    'PANTAVION COGNITIVE MEMORY STRATIFICATION WAVE',
    `generatedAt=${output.generatedAt}`,
    '',
    'EPISODIC',
    `episodicCount=${output.episodicSnapshot.episodicCount}`,
    `highSalienceCount=${output.episodicSnapshot.highSalienceCount}`,
    `mediumSalienceCount=${output.episodicSnapshot.mediumSalienceCount}`,
    `lowSalienceCount=${output.episodicSnapshot.lowSalienceCount}`,
    '',
    ...episodic.slice(0, 5).flatMap((item) => [
      `${item.memoryKey}`,
      `eventClass=${item.eventClass}`,
      `salience=${item.salience}`,
      `summary=${item.summary}`,
      '',
    ]),
    'SEMANTIC',
    `semanticCount=${output.semanticSnapshot.semanticCount}`,
    `highConfidenceCount=${output.semanticSnapshot.highConfidenceCount}`,
    `timelessCount=${output.semanticSnapshot.timelessCount}`,
    `expiringCount=${output.semanticSnapshot.expiringCount}`,
    '',
    ...semantic.slice(0, 5).flatMap((item) => [
      `${item.memoryKey}`,
      `factKey=${item.factKey}`,
      `confidence=${item.confidence}`,
      `timeless=${item.timeless ? 'yes' : 'no'}`,
      '',
    ]),
    'WORKING',
    `workingCount=${output.workingSnapshot.workingCount}`,
    `activeThreadCount=${output.workingSnapshot.activeThreadCount}`,
    `pendingCommitmentCount=${output.workingSnapshot.pendingCommitmentCount}`,
    `pendingReminderCount=${output.workingSnapshot.pendingReminderCount}`,
    `readyPreparationCount=${output.workingSnapshot.readyPreparationCount}`,
    `highPriorityCount=${output.workingSnapshot.highPriorityCount}`,
    '',
    ...working.slice(0, 5).flatMap((item) => [
      `${item.workingKey}`,
      `itemType=${item.itemType}`,
      `priority=${item.priority}`,
      `title=${item.title}`,
      '',
    ]),
    'LONG HORIZON',
    `longHorizonCount=${output.longHorizonSnapshot.longHorizonCount}`,
    `timelessCount=${output.longHorizonSnapshot.timelessCount}`,
    `futureObligationCount=${output.longHorizonSnapshot.futureObligationCount}`,
    `longLivedContextCount=${output.longHorizonSnapshot.longLivedContextCount}`,
    '',
    ...longHorizon.slice(0, 5).flatMap((item) => [
      `${item.horizonKey}`,
      `horizonClass=${item.horizonClass}`,
      `title=${item.title}`,
      '',
    ]),
    'PREDICTIVE PLANNING',
    `predictiveCount=${output.predictiveSnapshot.predictiveCount}`,
    `followUpRiskCount=${output.predictiveSnapshot.followUpRiskCount}`,
    `continuityOpportunityCount=${output.predictiveSnapshot.continuityOpportunityCount}`,
    `preparationNeededCount=${output.predictiveSnapshot.preparationNeededCount}`,
    `threadReactivationCount=${output.predictiveSnapshot.threadReactivationCount}`,
    `highConfidenceCount=${output.predictiveSnapshot.highConfidenceCount}`,
    '',
    ...predictive.slice(0, 5).flatMap((item) => [
      `${item.predictionKey}`,
      `signalType=${item.signalType}`,
      `confidence=${item.confidence}`,
      `recommendation=${item.recommendation}`,
      '',
    ]),
  ].join('\n');
}

export async function runCognitiveMemoryStratificationWave(): Promise<PantavionCognitiveMemoryStratificationWaveOutput> {
  await runMemoryThreadKernelWave();

  const output: PantavionCognitiveMemoryStratificationWaveOutput = {
    generatedAt: nowIso(),
    episodicSnapshot: getEpisodicMemorySnapshot(),
    semanticSnapshot: getSemanticMemorySnapshot(),
    workingSnapshot: getWorkingMemorySnapshot(),
    longHorizonSnapshot: getLongHorizonMemorySnapshot(),
    predictiveSnapshot: getPredictivePlanningMemorySnapshot(),
    rendered: '',
  };

  output.rendered = renderWave(output);

  saveKernelState({
    key: 'memory.cognitive-stratification.latest',
    kind: 'report',
    payload: {
      episodicSnapshot: output.episodicSnapshot,
      semanticSnapshot: output.semanticSnapshot,
      workingSnapshot: output.workingSnapshot,
      longHorizonSnapshot: output.longHorizonSnapshot,
      predictiveSnapshot: output.predictiveSnapshot,
      episodic: listEpisodicMemories(),
      semantic: listSemanticMemories(),
      working: listWorkingMemories(),
      longHorizon: listLongHorizonMemories(),
      predictive: listPredictivePlanningMemories(),
    },
    tags: ['memory', 'cognitive', 'stratification', 'latest'],
    metadata: {
      episodicCount: output.episodicSnapshot.episodicCount,
      semanticCount: output.semanticSnapshot.semanticCount,
      workingCount: output.workingSnapshot.workingCount,
      longHorizonCount: output.longHorizonSnapshot.longHorizonCount,
      predictiveCount: output.predictiveSnapshot.predictiveCount,
    },
  });

  return output;
}

export default runCognitiveMemoryStratificationWave;
