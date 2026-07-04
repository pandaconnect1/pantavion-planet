// core/pantavion/execution/pantavion-result-normalizer.ts

import type {
  PantavionExecutionMemoryWrite,
  PantavionExecutionOutput,
  PantavionExecutionReceipt,
} from "./pantavion-execution-bus";

export type PantavionNormalizedResultKind =
  | "summary"
  | "dataset"
  | "handoff"
  | "artifact"
  | "state_update"
  | "none";

export type PantavionNormalizedResult = {
  kind: PantavionNormalizedResultKind;
  title: string;
  summary: string;
  data: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  memoryWrites: PantavionExecutionMemoryWrite[];
};

export function normalizePantavionExecutionOutput(
  output: PantavionExecutionOutput
): PantavionNormalizedResult {
  const baseData =
    isPlainObject(output.payload) ? output.payload : { payload: output.payload };

  switch (output.kind) {
    case "json":
      return {
        kind: inferNormalizedKind(baseData),
        title: output.title,
        summary: output.summary,
        data: baseData,
        warnings: [],
        errors: [],
        memoryWrites: [],
      };

    case "handoff":
      return {
        kind: "handoff",
        title: output.title,
        summary: output.summary,
        data: baseData,
        warnings: [],
        errors: [],
        memoryWrites: [],
      };

    case "artifact":
      return {
        kind: "artifact",
        title: output.title,
        summary: output.summary,
        data: baseData,
        warnings: [],
        errors: [],
        memoryWrites: [],
      };

    case "text":
      return {
        kind: "summary",
        title: output.title,
        summary: output.summary,
        data: baseData,
        warnings: [],
        errors: [],
        memoryWrites: [],
      };

    case "none":
    default:
      return {
        kind: "none",
        title: output.title,
        summary: output.summary,
        data: baseData,
        warnings: [],
        errors: [],
        memoryWrites: [],
      };
  }
}

export function normalizePantavionExecutionReceipt(
  receipt: PantavionExecutionReceipt
): PantavionNormalizedResult {
  const normalizedOutput = normalizePantavionExecutionOutput(receipt.output);

  return {
    ...normalizedOutput,
    warnings: dedupeStrings([
      ...normalizedOutput.warnings,
      ...receipt.warnings,
    ]),
    errors: dedupeStrings([
      ...normalizedOutput.errors,
      ...receipt.errors,
    ]),
    memoryWrites: dedupeMemoryWrites([
      ...normalizedOutput.memoryWrites,
      ...receipt.memoryWrites,
    ]),
    data: {
      ...normalizedOutput.data,
      receiptId: receipt.id,
      taskId: receipt.taskId,
      status: receipt.status,
      executionKind: receipt.kind,
      adapterKey: receipt.adapterKey,
      adapterLabel: receipt.adapterLabel,
      audit: receipt.audit,
    },
  };
}

export function mergePantavionNormalizedResults(
  results: PantavionNormalizedResult[]
): PantavionNormalizedResult {
  if (!results.length) {
    return {
      kind: "none",
      title: "Pantavion normalized result",
      summary: "No normalized results were supplied.",
      data: {},
      warnings: [],
      errors: [],
      memoryWrites: [],
    };
  }

  const mergedData: Record<string, unknown> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const memoryWrites: PantavionExecutionMemoryWrite[] = [];

  for (const result of results) {
    mergedData[result.title] = result.data;
    warnings.push(...result.warnings);
    errors.push(...result.errors);
    memoryWrites.push(...result.memoryWrites);
  }

  return {
    kind: resolveMergedKind(results),
    title: "Pantavion merged normalized result",
    summary: results.map((item) => item.summary).join(" | "),
    data: mergedData,
    warnings: dedupeStrings(warnings),
    errors: dedupeStrings(errors),
    memoryWrites: dedupeMemoryWrites(memoryWrites),
  };
}

export function buildPantavionResultSnapshot(
  receipt: PantavionExecutionReceipt
) {
  const normalized = normalizePantavionExecutionReceipt(receipt);

  return {
    receiptId: receipt.id,
    taskId: receipt.taskId,
    status: receipt.status,
    kind: normalized.kind,
    title: normalized.title,
    summary: normalized.summary,
    warningCount: normalized.warnings.length,
    errorCount: normalized.errors.length,
    memoryWriteCount: normalized.memoryWrites.length,
  };
}

function inferNormalizedKind(
  data: Record<string, unknown>
): PantavionNormalizedResultKind {
  if ("artifactUrl" in data || "artifactPath" in data) return "artifact";
  if ("handoffTarget" in data || "nextSuggestedStep" in data) return "handoff";
  if ("state" in data || "stateUpdate" in data) return "state_update";
  if (Object.keys(data).length > 3) return "dataset";
  if (Object.keys(data).length > 0) return "summary";
  return "none";
}

function resolveMergedKind(
  results: PantavionNormalizedResult[]
): PantavionNormalizedResultKind {
  if (results.some((item) => item.kind === "artifact")) return "artifact";
  if (results.some((item) => item.kind === "handoff")) return "handoff";
  if (results.some((item) => item.kind === "state_update")) return "state_update";
  if (results.some((item) => item.kind === "dataset")) return "dataset";
  if (results.some((item) => item.kind === "summary")) return "summary";
  return "none";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function dedupeMemoryWrites(
  values: PantavionExecutionMemoryWrite[]
): PantavionExecutionMemoryWrite[] {
  const seen = new Set<string>();
  const output: PantavionExecutionMemoryWrite[] = [];

  for (const item of values) {
    const key = `${item.scope}:${item.key}:${item.summary}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}
