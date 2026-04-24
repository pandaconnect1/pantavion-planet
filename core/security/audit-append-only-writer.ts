// core/security/audit-append-only-writer.ts

export interface PantavionAuditWriteInput {
  eventId: string;
  category: string;
  actorId: string;
  action: string;
  createdAt: string;
}

export interface PantavionAuditWriteRecord extends PantavionAuditWriteInput {
  sequenceNumber: number;
  checksum: string;
}

export interface PantavionAuditAppendOnlySnapshot {
  generatedAt: string;
  recordCount: number;
  latestSequenceNumber: number;
  latestChecksum?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function checksum(value: string): string {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total + value.charCodeAt(index) * (index + 1)) % 1000000007;
  }
  return `chk_${total}`;
}

export class PantavionAuditAppendOnlyWriter {
  private readonly records: PantavionAuditWriteRecord[] = [];

  append(input: PantavionAuditWriteInput): PantavionAuditWriteRecord {
    const sequenceNumber = this.records.length + 1;
    const payload = `${sequenceNumber}|${input.eventId}|${input.category}|${input.actorId}|${input.action}|${input.createdAt}`;
    const record: PantavionAuditWriteRecord = {
      ...input,
      sequenceNumber,
      checksum: checksum(payload),
    };

    this.records.push(record);
    return { ...record };
  }

  list(): PantavionAuditWriteRecord[] {
    return this.records.map((item) => ({ ...item }));
  }

  getSnapshot(): PantavionAuditAppendOnlySnapshot {
    return {
      generatedAt: nowIso(),
      recordCount: this.records.length,
      latestSequenceNumber: this.records[this.records.length - 1]?.sequenceNumber ?? 0,
      latestChecksum: this.records[this.records.length - 1]?.checksum,
    };
  }
}

export default PantavionAuditAppendOnlyWriter;
