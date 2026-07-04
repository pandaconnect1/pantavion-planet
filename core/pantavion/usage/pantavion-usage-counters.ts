// core/pantavion/usage/pantavion-usage-counters.ts

import type { PantavionPlanKey } from "../entitlements/pantavion-entitlement-resolver";
import { getPantavionPlanQuotas } from "../entitlements/pantavion-entitlement-resolver";

export type PantavionUsageFamily =
  | "workflow_actions"
  | "discovery_runs"
  | "simulation_runs"
  | "voice_sessions"
  | "billing_attempts";

export type PantavionUsageCounter = {
  actorKey: string;
  family: PantavionUsageFamily;
  used: number;
  limit: number;
  remaining: number;
  updatedAt: string;
};

export type PantavionUsageConsumeInput = {
  actorKey: string;
  family: PantavionUsageFamily;
  amount?: number;
  limit: number;
};

export type PantavionUsageConsumeResult = {
  allowed: boolean;
  counter: PantavionUsageCounter;
  reason: string;
};

export class PantavionUsageCounterStore {
  private readonly counters = new Map<string, PantavionUsageCounter>();

  private makeKey(actorKey: string, family: PantavionUsageFamily) {
    return `${actorKey}:${family}`;
  }

  ensure(actorKey: string, family: PantavionUsageFamily, limit: number) {
    const key = this.makeKey(actorKey, family);
    const existing = this.counters.get(key);

    if (existing) {
      if (existing.limit !== limit) {
        const updated: PantavionUsageCounter = {
          ...existing,
          limit,
          remaining: Math.max(limit - existing.used, 0),
          updatedAt: new Date().toISOString(),
        };
        this.counters.set(key, updated);
        return updated;
      }
      return existing;
    }

    const created: PantavionUsageCounter = {
      actorKey,
      family,
      used: 0,
      limit,
      remaining: limit,
      updatedAt: new Date().toISOString(),
    };

    this.counters.set(key, created);
    return created;
  }

  consume(input: PantavionUsageConsumeInput): PantavionUsageConsumeResult {
    const amount = input.amount ?? 1;
    const counter = this.ensure(input.actorKey, input.family, input.limit);

    if (counter.used + amount > counter.limit) {
      return {
        allowed: false,
        counter,
        reason: `Quota exceeded for ${input.family}.`,
      };
    }

    const updated: PantavionUsageCounter = {
      ...counter,
      used: counter.used + amount,
      remaining: Math.max(counter.limit - (counter.used + amount), 0),
      updatedAt: new Date().toISOString(),
    };

    this.counters.set(this.makeKey(input.actorKey, input.family), updated);

    return {
      allowed: true,
      counter: updated,
      reason: `Usage consumed for ${input.family}.`,
    };
  }

  get(actorKey: string, family: PantavionUsageFamily): PantavionUsageCounter | null {
    return this.counters.get(this.makeKey(actorKey, family)) ?? null;
  }

  getAllForActor(actorKey: string): PantavionUsageCounter[] {
    return Array.from(this.counters.values()).filter((item) => item.actorKey === actorKey);
  }

  reset(actorKey: string, family?: PantavionUsageFamily) {
    if (family) {
      this.counters.delete(this.makeKey(actorKey, family));
      return;
    }

    for (const key of Array.from(this.counters.keys())) {
      if (key.startsWith(`${actorKey}:`)) {
        this.counters.delete(key);
      }
    }
  }

  getSummary() {
    const items = Array.from(this.counters.values());
    return {
      total: items.length,
      nearLimit: items.filter((item) => item.limit > 0 && item.remaining <= Math.ceil(item.limit * 0.2)).length,
      exhausted: items.filter((item) => item.remaining === 0).length,
    };
  }
}

export function createPantavionUsageCounterStore() {
  return new PantavionUsageCounterStore();
}

export function getPantavionDefaultUsageLimit(
  planKey: PantavionPlanKey,
  family: PantavionUsageFamily
): number {
  const quotas = getPantavionPlanQuotas(planKey);
  return quotas[family] ?? 0;
}

export function isPantavionUsageFamily(value: string): value is PantavionUsageFamily {
  return [
    "workflow_actions",
    "discovery_runs",
    "simulation_runs",
    "voice_sessions",
    "billing_attempts",
  ].includes(value);
}
