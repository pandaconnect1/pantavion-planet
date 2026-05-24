import type { PantavionTruthZone } from '../../types/pantavion';

export type PantavionProtocolPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PantavionProtocolEnvelope<TPayload = unknown> {
  packetId: string;
  protocolVersion: string;
  createdAt: string;
  truthZone: PantavionTruthZone;
  priority: PantavionProtocolPriority;
  source: {
    principalId: string;
    channel: 'ui' | 'api' | 'voice' | 'system' | 'workspace';
  };
  target: {
    surface: 'kernel' | 'identity' | 'protocol' | 'runtime' | 'memory' | 'ops';
    route: string;
  };
  payload: TPayload;
  metadata?: Record<string, unknown>;
}

export interface PantavionExecutionReceipt {
  receiptId: string;
  packetId: string;
  status: 'accepted' | 'rejected' | 'planned' | 'executed' | 'failed';
  truthZone: PantavionTruthZone;
  createdAt: string;
  reasons: string[];
}