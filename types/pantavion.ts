export const pantavionVersion = '0.1.0-kernel-foundation';

export type PantavionId = string;

export interface PantavionMetadata {
  [key: string]: unknown;
}

export interface PantavionEnvelope<T = unknown> {
  id: PantavionId;
  createdAt: string;
  payload: T;
}

export const pantavionFoundationReady = true;
