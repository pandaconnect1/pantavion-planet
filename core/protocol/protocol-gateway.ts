import type {
  PantavionExecutionReceipt,
  PantavionProtocolEnvelope,
} from './protocol-types';

export interface PantavionProtocolGateway {
  accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt;
}

export function createProtocolGateway(): PantavionProtocolGateway {
  return {
    accept<TPayload>(envelope: PantavionProtocolEnvelope<TPayload>): PantavionExecutionReceipt {
      const reasons: string[] = [];

      if (!envelope.packetId) reasons.push('missing_packet_id');
      if (!envelope.protocolVersion) reasons.push('missing_protocol_version');
      if (!envelope.source?.principalId) reasons.push('missing_source_principal');
      if (!envelope.target?.route) reasons.push('missing_target_route');

      return {
        receiptId: `receipt:${envelope.packetId}`,
        packetId: envelope.packetId,
        status: reasons.length === 0 ? 'accepted' : 'rejected',
        truthZone: envelope.truthZone,
        createdAt: new Date().toISOString(),
        reasons,
      };
    },
  };
}