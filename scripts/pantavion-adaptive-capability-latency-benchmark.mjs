import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { planAdaptiveCapability } from "../core/sovereign/adaptive-capability-fabric.ts";

const samples = [
  ["Translate a voice conversation from Greek to Arabic", "Live bidirectional translation", "el", "ar"],
  ["Create a project workflow for a small business", "Business workflow", "en", "en"],
  ["Build a learning plan for physics", "Personal learning module", "en", "en"],
  ["Create an orbital greenhouse research workspace", "Space research simulation module", "el", "en"],
  ["Remember my project decisions and retrieve them later", "Memory continuity", "en", "en"],
  ["Plan a resilient offline travel assistant", "Offline travel assistance", "en", "fr"],
];

for (let i = 0; i < 100; i += 1) {
  const s = samples[i % samples.length];
  planAdaptiveCapability({
    intentId: `warm_${i}`,
    userId: "benchmark_user",
    text: s[0],
    desiredOutcome: s[1],
    locale: s[2],
    targetLocale: s[3],
    actorScopes: ["read"],
    nowIso: "2026-09-22T21:15:00.000Z",
  });
}

const durations = [];
const iterations = 2000;
for (let i = 0; i < iterations; i += 1) {
  const s = samples[i % samples.length];
  const start = performance.now();
  planAdaptiveCapability({
    intentId: `bench_${i}`,
    userId: "benchmark_user",
    text: s[0],
    desiredOutcome: s[1],
    locale: s[2],
    targetLocale: s[3],
    actorScopes: ["read"],
    nowIso: "2026-09-22T21:15:00.000Z",
  });
  durations.push(performance.now() - start);
}

durations.sort((a,b)=>a-b);
const percentile = (p) => durations[Math.min(durations.length - 1, Math.floor((p / 100) * durations.length))];
const p50 = percentile(50);
const p95 = percentile(95);
const p99 = percentile(99);
const mean = durations.reduce((a,b)=>a+b,0)/durations.length;
const max = durations[durations.length - 1];

assert.ok(p95 < 25, `p95 adaptive planning latency too high: ${p95.toFixed(3)}ms`);
assert.ok(p99 < 50, `p99 adaptive planning latency too high: ${p99.toFixed(3)}ms`);

console.log(JSON.stringify({
  marker:"pantavion_adaptive_capability_latency_benchmark_v1",
  ok:true,
  iterations,
  meanMs:Number(mean.toFixed(4)),
  p50Ms:Number(p50.toFixed(4)),
  p95Ms:Number(p95.toFixed(4)),
  p99Ms:Number(p99.toFixed(4)),
  maxMs:Number(max.toFixed(4)),
  threshold:{p95Ms:25,p99Ms:50},
  truth:"Measures deterministic planning only, not network/model/provider/build latency."
},null,2));
