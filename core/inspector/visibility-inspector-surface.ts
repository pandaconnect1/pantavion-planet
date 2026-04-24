// core/inspector/visibility-inspector-surface.ts

import { runMemoryThreadKernelWave } from '../memory/memory-thread-kernel';
import { runKernelConstitutionRegenerationWave } from '../kernel/kernel-constitution-regeneration-wave';
import { runAIAuthorityRegistryWave } from '../intelligence/ai-authority-registry-wave';
import { runCommercialBillingRailWave } from '../commercial/commercial-billing-rail-wave';
import { runCanonicalRoutingTruthWave } from '../protocol/canonical-routing-truth-wave';
import { buildMemoryVisibilitySnapshot } from './memory-visibility-inspector';
import { buildIntelligenceVisibilitySnapshot } from './intelligence-visibility-inspector';
import { buildCommercialVisibilitySnapshot } from './commercial-visibility-inspector';
import { buildKernelVisibilitySnapshot } from './kernel-visibility-inspector';
import { saveKernelState } from '../storage/kernel-state-store';

export interface PantavionVisibilityInspectorSurfaceOutput {
  generatedAt: string;
  memory: ReturnType<typeof buildMemoryVisibilitySnapshot>;
  intelligence: ReturnType<typeof buildIntelligenceVisibilitySnapshot>;
  commercial: ReturnType<typeof buildCommercialVisibilitySnapshot>;
  kernel: ReturnType<typeof buildKernelVisibilitySnapshot>;
  routing: {
    truthCount: number;
    traceCount: number;
    truthAlignedCount: number;
    primaryDispatchedCount: number;
  };
  rendered: string;
  html: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderText(output: PantavionVisibilityInspectorSurfaceOutput): string {
  return [
    'PANTAVION VISIBILITY INSPECTOR SURFACE',
    `generatedAt=${output.generatedAt}`,
    '',
    'MEMORY',
    `eventCount=${output.memory.eventCount}`,
    `threadCount=${output.memory.threadCount}`,
    `factCount=${output.memory.factCount}`,
    `commitmentCount=${output.memory.commitmentCount}`,
    `reminderCount=${output.memory.reminderCount}`,
    `preparationJobCount=${output.memory.preparationJobCount}`,
    `unresolvedThreadCount=${output.memory.unresolvedThreadCount}`,
    `pendingCommitmentCount=${output.memory.pendingCommitmentCount}`,
    `pendingReminderCount=${output.memory.pendingReminderCount}`,
    '',
    'INTELLIGENCE',
    `providerCount=${output.intelligence.providerCount}`,
    `activeProviderCount=${output.intelligence.activeProviderCount}`,
    `capabilityAuthorityCount=${output.intelligence.capabilityAuthorityCount}`,
    `localeAuthorityCount=${output.intelligence.localeAuthorityCount}`,
    `nativeLocaleCount=${output.intelligence.nativeLocaleCount}`,
    `strongLocaleCount=${output.intelligence.strongLocaleCount}`,
    `futureBridgeCount=${output.intelligence.futureBridgeCount}`,
    `governorGatedCount=${output.intelligence.governorGatedCount}`,
    '',
    'COMMERCIAL',
    `railCount=${output.commercial.railCount}`,
    `planCount=${output.commercial.planCount}`,
    `paymentEventCount=${output.commercial.paymentEventCount}`,
    `capturedCount=${output.commercial.capturedCount}`,
    `grossCapturedCents=${output.commercial.grossCapturedCents}`,
    `recognizedRevenueCents=${output.commercial.recognizedRevenueCents}`,
    `deferredRevenueCents=${output.commercial.deferredRevenueCents}`,
    `payoutLaneCount=${output.commercial.payoutLaneCount}`,
    '',
    'KERNEL',
    `constitutionalCount=${output.kernel.constitutionalCount}`,
    `derivativeCount=${output.kernel.derivativeCount}`,
    `activeDerivativeCount=${output.kernel.activeDerivativeCount}`,
    `seededDerivativeCount=${output.kernel.seededDerivativeCount}`,
    `plannedDerivativeCount=${output.kernel.plannedDerivativeCount}`,
    `policyRuleCount=${output.kernel.policyRuleCount}`,
    '',
    'ROUTING',
    `truthCount=${output.routing.truthCount}`,
    `traceCount=${output.routing.traceCount}`,
    `truthAlignedCount=${output.routing.truthAlignedCount}`,
    `primaryDispatchedCount=${output.routing.primaryDispatchedCount}`,
  ].join('\n');
}

function buildCard(title: string, rows: Array<[string, string | number]>): string {
  const body = rows
    .map(
      ([key, value]) =>
        `<div class="row"><span class="label">${escapeHtml(key)}</span><span class="value">${escapeHtml(String(value))}</span></div>`,
    )
    .join('');

  return `<section class="card"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

function renderHtml(output: PantavionVisibilityInspectorSurfaceOutput): string {
  const cards = [
    buildCard('Memory', [
      ['eventCount', output.memory.eventCount],
      ['threadCount', output.memory.threadCount],
      ['factCount', output.memory.factCount],
      ['commitmentCount', output.memory.commitmentCount],
      ['reminderCount', output.memory.reminderCount],
      ['preparationJobCount', output.memory.preparationJobCount],
      ['unresolvedThreadCount', output.memory.unresolvedThreadCount],
      ['pendingCommitmentCount', output.memory.pendingCommitmentCount],
      ['pendingReminderCount', output.memory.pendingReminderCount],
    ]),
    buildCard('Intelligence', [
      ['providerCount', output.intelligence.providerCount],
      ['activeProviderCount', output.intelligence.activeProviderCount],
      ['capabilityAuthorityCount', output.intelligence.capabilityAuthorityCount],
      ['localeAuthorityCount', output.intelligence.localeAuthorityCount],
      ['nativeLocaleCount', output.intelligence.nativeLocaleCount],
      ['strongLocaleCount', output.intelligence.strongLocaleCount],
      ['futureBridgeCount', output.intelligence.futureBridgeCount],
      ['governorGatedCount', output.intelligence.governorGatedCount],
    ]),
    buildCard('Commercial', [
      ['railCount', output.commercial.railCount],
      ['planCount', output.commercial.planCount],
      ['paymentEventCount', output.commercial.paymentEventCount],
      ['capturedCount', output.commercial.capturedCount],
      ['grossCapturedCents', output.commercial.grossCapturedCents],
      ['recognizedRevenueCents', output.commercial.recognizedRevenueCents],
      ['deferredRevenueCents', output.commercial.deferredRevenueCents],
      ['payoutLaneCount', output.commercial.payoutLaneCount],
    ]),
    buildCard('Kernel Constitution', [
      ['constitutionalCount', output.kernel.constitutionalCount],
      ['derivativeCount', output.kernel.derivativeCount],
      ['activeDerivativeCount', output.kernel.activeDerivativeCount],
      ['seededDerivativeCount', output.kernel.seededDerivativeCount],
      ['plannedDerivativeCount', output.kernel.plannedDerivativeCount],
      ['policyRuleCount', output.kernel.policyRuleCount],
    ]),
    buildCard('Routing Truth', [
      ['truthCount', output.routing.truthCount],
      ['traceCount', output.routing.traceCount],
      ['truthAlignedCount', output.routing.truthAlignedCount],
      ['primaryDispatchedCount', output.routing.primaryDispatchedCount],
    ]),
  ].join('');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>Pantavion Visibility Inspector</title>`,
    '<style>',
    'body{margin:0;background:#0b1020;color:#e8edf6;font-family:Inter,Segoe UI,Arial,sans-serif;}',
    '.wrap{max-width:1200px;margin:0 auto;padding:32px 24px 48px;}',
    'h1{font-size:32px;margin:0 0 8px 0;}',
    '.sub{opacity:.75;margin-bottom:24px;}',
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;}',
    '.card{background:#121932;border:1px solid #243055;border-radius:18px;padding:18px 18px 12px 18px;box-shadow:0 10px 30px rgba(0,0,0,.24);}',
    '.card h2{font-size:18px;margin:0 0 12px 0;}',
    '.row{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-top:1px solid rgba(255,255,255,.06);}',
    '.row:first-of-type{border-top:none;}',
    '.label{opacity:.72;}',
    '.value{font-weight:700;}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="wrap">',
    '<h1>Pantavion Visibility Inspector Surface</h1>',
    `<div class="sub">generatedAt=${escapeHtml(output.generatedAt)}</div>`,
    `<div class="grid">${cards}</div>`,
    '</div>',
    '</body>',
    '</html>',
  ].join('');
}

export async function runVisibilityInspectorSurface(): Promise<PantavionVisibilityInspectorSurfaceOutput> {
  await runMemoryThreadKernelWave();
  await runKernelConstitutionRegenerationWave();
  await runAIAuthorityRegistryWave();
  await runCommercialBillingRailWave();
  const canonicalRouting = await runCanonicalRoutingTruthWave();

  const output: PantavionVisibilityInspectorSurfaceOutput = {
    generatedAt: nowIso(),
    memory: buildMemoryVisibilitySnapshot(),
    intelligence: buildIntelligenceVisibilitySnapshot(),
    commercial: buildCommercialVisibilitySnapshot(),
    kernel: buildKernelVisibilitySnapshot(),
    routing: {
      truthCount: canonicalRouting.truths.length,
      traceCount: canonicalRouting.traces.length,
      truthAlignedCount: canonicalRouting.truthAlignedCount,
      primaryDispatchedCount: canonicalRouting.truths.filter(
        (item) => item.canonicalDisposition === 'primary-dispatched',
      ).length,
    },
    rendered: '',
    html: '',
  };

  output.rendered = renderText(output);
  output.html = renderHtml(output);

  saveKernelState({
    key: 'inspector.visibility-surface.latest',
    kind: 'report',
    payload: {
      memory: output.memory,
      intelligence: output.intelligence,
      commercial: output.commercial,
      kernel: output.kernel,
      routing: output.routing,
    },
    tags: ['inspector', 'visibility', 'surface', 'latest'],
    metadata: {
      eventCount: output.memory.eventCount,
      providerCount: output.intelligence.providerCount,
      railCount: output.commercial.railCount,
      constitutionalCount: output.kernel.constitutionalCount,
      truthAlignedCount: output.routing.truthAlignedCount,
    },
  });

  return output;
}

export default runVisibilityInspectorSurface;
