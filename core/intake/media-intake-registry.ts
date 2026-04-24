// core/intake/media-intake-registry.ts

export interface PantavionMediaIntakeRecord {
  intakeKey: string;
  mediaType: 'text' | 'thread' | 'document' | 'image' | 'video' | 'audio' | 'stream' | 'link' | 'idea';
  extractionRequired: boolean;
  memoryWriteRequired: boolean;
  safetyEvaluationRequired: boolean;
}

export interface PantavionMediaIntakeSnapshot {
  generatedAt: string;
  intakeCount: number;
  extractionRequiredCount: number;
  memoryWriteRequiredCount: number;
  safetyEvaluationRequiredCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const MEDIA_INTAKE: PantavionMediaIntakeRecord[] = [
  { intakeKey: 'text-intake', mediaType: 'text', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: false },
  { intakeKey: 'thread-intake', mediaType: 'thread', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: false },
  { intakeKey: 'document-intake', mediaType: 'document', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: false },
  { intakeKey: 'image-intake', mediaType: 'image', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: true },
  { intakeKey: 'video-intake', mediaType: 'video', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: true },
  { intakeKey: 'audio-intake', mediaType: 'audio', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: true },
  { intakeKey: 'stream-intake', mediaType: 'stream', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: true },
  { intakeKey: 'link-intake', mediaType: 'link', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: false },
  { intakeKey: 'idea-intake', mediaType: 'idea', extractionRequired: true, memoryWriteRequired: true, safetyEvaluationRequired: false },
];

export function listMediaIntakeRecords(): PantavionMediaIntakeRecord[] {
  return MEDIA_INTAKE.map((item) => cloneValue(item));
}

export function getMediaIntakeSnapshot(): PantavionMediaIntakeSnapshot {
  const list = listMediaIntakeRecords();

  return {
    generatedAt: nowIso(),
    intakeCount: list.length,
    extractionRequiredCount: list.filter((item) => item.extractionRequired).length,
    memoryWriteRequiredCount: list.filter((item) => item.memoryWriteRequired).length,
    safetyEvaluationRequiredCount: list.filter((item) => item.safetyEvaluationRequired).length,
  };
}

export default listMediaIntakeRecords;
