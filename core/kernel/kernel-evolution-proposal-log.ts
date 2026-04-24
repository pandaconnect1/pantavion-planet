// core/kernel/kernel-evolution-proposal-log.ts

import type { PantavionConstitutionalKernelKey } from './kernel-constitution-registry';

export type PantavionKernelProposalTargetType =
  | 'constitutional'
  | 'derivative';

export type PantavionKernelProposalStatus =
  | 'proposed'
  | 'simulated'
  | 'approved'
  | 'rolled-out'
  | 'rejected';

export interface PantavionKernelEvolutionProposalRecord {
  proposalId: string;
  targetKernelKey: string;
  targetType: PantavionKernelProposalTargetType;
  proposedBy: string;
  title: string;
  rationale: string;
  createdAt: string;
  status: PantavionKernelProposalStatus;
  simulationRequired: boolean;
  rollbackReady: boolean;
  lineageRequired: boolean;
  parentKernelKey?: PantavionConstitutionalKernelKey;
  notes: string[];
}

export interface PantavionKernelEvolutionProposalInput {
  targetKernelKey: string;
  targetType: PantavionKernelProposalTargetType;
  proposedBy: string;
  title: string;
  rationale: string;
  status?: PantavionKernelProposalStatus;
  simulationRequired?: boolean;
  rollbackReady?: boolean;
  lineageRequired?: boolean;
  parentKernelKey?: PantavionConstitutionalKernelKey;
  notes?: string[];
}

export interface PantavionKernelEvolutionProposalSnapshot {
  generatedAt: string;
  proposalCount: number;
  proposedCount: number;
  simulatedCount: number;
  approvedCount: number;
  rolledOutCount: number;
  rejectedCount: number;
  latestProposalId?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class PantavionKernelEvolutionProposalLog {
  private readonly proposals: PantavionKernelEvolutionProposalRecord[] = [];

  appendProposal(
    input: PantavionKernelEvolutionProposalInput,
  ): PantavionKernelEvolutionProposalRecord {
    const record: PantavionKernelEvolutionProposalRecord = {
      proposalId: createId('kpr'),
      targetKernelKey: input.targetKernelKey,
      targetType: input.targetType,
      proposedBy: input.proposedBy,
      title: input.title,
      rationale: input.rationale,
      createdAt: nowIso(),
      status: input.status ?? 'proposed',
      simulationRequired: input.simulationRequired ?? true,
      rollbackReady: input.rollbackReady ?? true,
      lineageRequired: input.lineageRequired ?? true,
      parentKernelKey: input.parentKernelKey,
      notes: cloneValue(input.notes ?? []),
    };

    this.proposals.unshift(record);
    return cloneValue(record);
  }

  listProposals(): PantavionKernelEvolutionProposalRecord[] {
    return this.proposals.map((item) => cloneValue(item));
  }

  getSnapshot(): PantavionKernelEvolutionProposalSnapshot {
    const list = this.listProposals();

    return {
      generatedAt: nowIso(),
      proposalCount: list.length,
      proposedCount: list.filter((item) => item.status === 'proposed').length,
      simulatedCount: list.filter((item) => item.status === 'simulated').length,
      approvedCount: list.filter((item) => item.status === 'approved').length,
      rolledOutCount: list.filter((item) => item.status === 'rolled-out').length,
      rejectedCount: list.filter((item) => item.status === 'rejected').length,
      latestProposalId: list[0]?.proposalId,
    };
  }

  clear(): void {
    this.proposals.length = 0;
  }
}

export function createKernelEvolutionProposalLog(): PantavionKernelEvolutionProposalLog {
  return new PantavionKernelEvolutionProposalLog();
}

export default createKernelEvolutionProposalLog;
