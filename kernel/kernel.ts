import { classifyInput, type RawKernelInput, type NormalizedInput, type ClassificationResult } from "./classifier";
import { resolveRegistryMapping, type RegistryResolution } from "./registry";
import { resolveCapabilities, detectGaps, type CapabilityProfile, type GapReport } from "./capability";
import { KernelMemoryStore, type MemoryRecord } from "./memory";

export type ReviewStatus = "pass" | "warn" | "block";
export type PolicyStatus = "approved" | "review" | "blocked";
export type PriorityBucket = "blocking" | "urgent" | "watch" | "later" | "reject";
export type ExecutionState = "APPROVED" | "BLOCKED" | "WATCH" | "LATER";

export interface SecurityFinding {
  code: string;
  level: "low" | "medium" | "high" | "critical";
  message: string;
}

export interface SecurityReview {
  status: ReviewStatus;
  riskScore: number;
  findings: SecurityFinding[];
  requiresHumanApproval: boolean;
}

export interface PolicyDecision {
  status: PolicyStatus;
  reason: string[];
  policyZone: string;
}

export interface PriorityScore {
  bucket: PriorityBucket;
  score: number;
  reason: string[];
}

export interface ExecutionDecision {
  state: ExecutionState;
  executionMode: "auto" | "queue" | "human-review" | "reject";
  reason: string[];
}

export interface KernelResult {
  normalized: NormalizedInput;
  classification: ClassificationResult;
  registry: RegistryResolution;
  capability: CapabilityProfile;
  gaps: GapReport;
  security: SecurityReview;
  policy: PolicyDecision;
  priority: PriorityScore;
  execution: ExecutionDecision;
  memoryRecord: MemoryRecord;
}

export interface EnrichmentHit {
  source: string;
  title: string;
  summary: string;
  url?: string;
}

export interface KnowledgeAdapter {
  name: string;
  search(query: string, normalized: NormalizedInput): Promise<EnrichmentHit[]>;
}

export interface KernelOptions {
  adapters?: KnowledgeAdapter[];
}

const HIGH_RISK_PATTERNS = [
  /\bprod(uction)?\b/i,
  /\bdeploy\b/i,
  /\bbilling\b/i,
  /\bauth\b/i,
  /\bidentity\b/i,
  /\badmin\b/i,
  /\bdelete\b/i,
  /\bsecurity\b/i,
  /\bzero trust\b/i,
  /\bmedical\b/i,
  /\bfinancial\b/i,
  /\bbiometric\b/i,
  /\bface recognition\b/i,
  /\bsurveillance\b/i
];

const BLOCKED_PATTERNS = [
  /\bmalware\b/i,
  /\bransomware\b/i,
  /\bcredential stuffing\b/i,
  /\bexploit\b/i,
  /\bphishing kit\b/i,
  /\bcitizen tracking\b/i
];

function buildSearchQuery(normalized: NormalizedInput): string {
  return [normalized.title, ...normalized.keywords.slice(0, 6)].filter(Boolean).join(" ");
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export class PantavionKernel {
  private memory: KernelMemoryStore;
  private adapters: KnowledgeAdapter[];

  constructor(options?: KernelOptions) {
    this.memory = new KernelMemoryStore();
    this.adapters = options?.adapters || [];
  }

  async process(input: RawKernelInput): Promise<KernelResult> {
    const { normalized, classification } = classifyInput(input);

    const enrichment = await this.enrich(normalized);
    const boostedClassification = this.applyEnrichmentBoost(classification, enrichment);

    const registry = resolveRegistryMapping(boostedClassification);
    const capability = resolveCapabilities(normalized, boostedClassification, registry.mapping);
    const gaps = detectGaps(normalized, boostedClassification, registry.mapping, capability);
    const security = this.reviewSecurity(normalized, boostedClassification, registry.mapping, gaps);
    const policy = this.makePolicyDecision(boostedClassification, registry.mapping, security);
    const priority = this.scorePriority(normalized, boostedClassification, gaps, security, policy);
    const execution = this.makeExecutionDecision(gaps, security, policy, priority);

    const memoryRecord = this.memory.save({
      id: normalized.id,
      timestamp: normalized.timestamp,
      input: {
        title: normalized.title,
        text: normalized.text,
        source: normalized.source,
        keywords: normalized.keywords,
        signals: normalized.signals
      },
      classification: {
        type: boostedClassification.type,
        domain: boostedClassification.domain,
        intent: boostedClassification.intent,
        confidence: boostedClassification.confidence,
        tags: boostedClassification.tags
      },
      mapping: {
        workspace: registry.mapping.workspace,
        category: registry.mapping.category,
        module: registry.mapping.module,
        core: registry.mapping.core,
        policyZone: registry.mapping.policyZone
      },
      execution: {
        decision: execution.state,
        priority: priority.bucket,
        reason: execution.reason
      }
    });

    return {
      normalized,
      classification: boostedClassification,
      registry,
      capability,
      gaps,
      security,
      policy,
      priority,
      execution,
      memoryRecord
    };
  }

  listMemory() {
    return this.memory.list();
  }

  searchMemory(query: string) {
    return this.memory.search(query);
  }

  exportMemory() {
    return this.memory.exportSnapshot();
  }

  private async enrich(normalized: NormalizedInput): Promise<EnrichmentHit[]> {
    if (!this.adapters.length) return [];

    const query = buildSearchQuery(normalized);
    const responses = await Promise.allSettled(
      this.adapters.map((adapter) => adapter.search(query, normalized))
    );

    const hits: EnrichmentHit[] = [];
    for (const response of responses) {
      if (response.status === "fulfilled") {
        hits.push(...response.value);
      }
    }

    return hits;
  }

  private applyEnrichmentBoost(
    classification: ClassificationResult,
    enrichment: EnrichmentHit[]
  ): ClassificationResult {
    if (!enrichment.length) return classification;

    const confidenceBoost = enrichment.length >= 3 ? 0.08 : 0.04;

    return {
      ...classification,
      confidence: clamp(classification.confidence + confidenceBoost, 0, 0.99),
      reasoning: [
        ...classification.reasoning,
        `enrichment added ${enrichment.length} external hit(s)`
      ]
    };
  }

  private reviewSecurity(
    normalized: NormalizedInput,
    classification: ClassificationResult,
    registry: RegistryResolution["mapping"],
    gaps: GapReport
  ): SecurityReview {
    const findings: SecurityFinding[] = [];
    const haystack = `${normalized.title}\n${normalized.text}`;
    let riskScore = 8;

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(haystack)) {
        findings.push({
          code: "BLOCKED_PATTERN",
          level: "critical",
          message: `Blocked pattern matched: ${pattern}`
        });
        riskScore += 70;
      }
    }

    for (const pattern of HIGH_RISK_PATTERNS) {
      if (pattern.test(haystack)) {
        findings.push({
          code: "HIGH_RISK_SIGNAL",
          level: "high",
          message: `High-risk signal matched: ${pattern}`
        });
        riskScore += 10;
      }
    }

    if (classification.intent === "implementation") {
      findings.push({
        code: "IMPLEMENTATION_FLOW",
        level: "medium",
        message: "Implementation intent requires stronger review than exploration."
      });
      riskScore += 12;
    }

    if (registry.policyZone.includes("sensitive") || registry.policyZone.includes("governed")) {
      findings.push({
        code: "GOVERNED_ZONE",
        level: "medium",
        message: `Mapped into governed zone: ${registry.policyZone}`
      });
      riskScore += 10;
    }

    if (gaps.status === "has-gaps") {
      findings.push({
        code: "GAPS_PRESENT",
        level: "medium",
        message: "Gaps exist; auto-execution is less safe."
      });
      riskScore += gaps.items.length * 6;
    }

    if (normalized.source === "mixed" || normalized.source === "image") {
      findings.push({
        code: "NON_TEXT_INPUT",
        level: "low",
        message: "Visual or mixed input may require additional interpretation validation."
      });
      riskScore += 4;
    }

    riskScore = clamp(riskScore, 0, 100);

    if (riskScore >= 75) {
      return {
        status: "block",
        riskScore,
        findings,
        requiresHumanApproval: true
      };
    }

    if (riskScore >= 35) {
      return {
        status: "warn",
        riskScore,
        findings,
        requiresHumanApproval: true
      };
    }

    return {
      status: "pass",
      riskScore,
      findings,
      requiresHumanApproval: false
    };
  }

  private makePolicyDecision(
    classification: ClassificationResult,
    registry: RegistryResolution["mapping"],
    security: SecurityReview
  ): PolicyDecision {
    const reason: string[] = [];

    if (security.findings.some((f) => f.code === "BLOCKED_PATTERN")) {
      reason.push("blocked by hard policy pattern");
      return {
        status: "blocked",
        reason,
        policyZone: registry.policyZone
      };
    }

    if (
      security.requiresHumanApproval ||
      registry.policyZone.includes("governed") ||
      registry.policyZone.includes("sensitive") ||
      classification.intent === "implementation"
    ) {
      reason.push("requires governed review before direct execution");
      return {
        status: "review",
        reason,
        policyZone: registry.policyZone
      };
    }

    reason.push("safe enough for structured auto-processing");
    return {
      status: "approved",
      reason,
      policyZone: registry.policyZone
    };
  }

  private scorePriority(
    normalized: NormalizedInput,
    classification: ClassificationResult,
    gaps: GapReport,
    security: SecurityReview,
    policy: PolicyDecision
  ): PriorityScore {
    let score = 40;
    const reason: string[] = [];

    if (classification.intent === "implementation") {
      score += 25;
      reason.push("implementation request increases urgency");
    }

    if (classification.type === "ARCHITECTURE") {
      score += 20;
      reason.push("architecture input affects broader system shape");
    }

    if (classification.type === "VOICE_SYSTEM" || classification.domain === "voice") {
      score += 15;
      reason.push("voice is a strategic Pantavion core");
    }

    if (classification.type === "UNKNOWN") {
      score -= 10;
      reason.push("unknown type lowers auto-priority");
    }

    if (gaps.items.some((g) => g.severity === "high")) {
      score += 10;
      reason.push("high-severity gaps require attention");
    }

    if (security.status === "block") {
      return {
        bucket: "reject",
        score: 0,
        reason: [...reason, "blocked security score overrides priority"]
      };
    }

    if (policy.status === "review") {
      score += 5;
      reason.push("review-needed items should be surfaced quickly");
    }

    if (!normalized.title && normalized.text.length < 20) {
      score -= 8;
      reason.push("insufficient context lowers priority confidence");
    }

    score = clamp(score, 0, 100);

    if (score >= 80) {
      return { bucket: "blocking", score, reason };
    }
    if (score >= 65) {
      return { bucket: "urgent", score, reason };
    }
    if (score >= 50) {
      return { bucket: "watch", score, reason };
    }
    return { bucket: "later", score, reason };
  }

  private makeExecutionDecision(
    gaps: GapReport,
    security: SecurityReview,
    policy: PolicyDecision,
    priority: PriorityScore
  ): ExecutionDecision {
    const reason: string[] = [];

    if (security.status === "block" || policy.status === "blocked") {
      reason.push("security or policy blocked the flow");
      return {
        state: "BLOCKED",
        executionMode: "reject",
        reason
      };
    }

    if (policy.status === "review") {
      reason.push("governed review required before execution");
      if (priority.bucket === "blocking" || priority.bucket === "urgent") {
        return {
          state: "WATCH",
          executionMode: "human-review",
          reason
        };
      }
      return {
        state: "LATER",
        executionMode: "queue",
        reason
      };
    }

    if (gaps.status === "has-gaps") {
      reason.push("gaps detected; needs completion before direct execution");
      return {
        state: "WATCH",
        executionMode: "queue",
        reason
      };
    }

    if (priority.bucket === "later") {
      reason.push("safe but low urgency");
      return {
        state: "LATER",
        executionMode: "queue",
        reason
      };
    }

    reason.push("approved for structured execution path");
    return {
      state: "APPROVED",
      executionMode: "auto",
      reason
    };
  }
}

export const pantavionKernel = new PantavionKernel();

/*
Example:

import { pantavionKernel } from "@/kernel/kernel";

const result = await pantavionKernel.process({
  title: "AI tools για marketing",
  text: "έλω να βρει, να ομαδοποιήσει και να τα βάλει σωστά σε workspace/category/module."
});

console.log(result);
*/
