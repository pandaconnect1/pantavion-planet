export type IncidentSeverity = "P1" | "P2" | "P3";

export type IncidentStatus =
  | "open"
  | "acknowledged"
  | "recovering"
  | "resolved";

export type IncidentModule =
  | "platform"
  | "deployment"
  | "database"
  | "maps"
  | "messaging"
  | "identity"
  | "news"
  | "social"
  | "sports"
  | "classifieds"
  | "learning"
  | "business"
  | "translation"
  | "emergency";

export interface IncidentInput {
  severity: IncidentSeverity;
  module: IncidentModule;
  summary: string;
  details?: string;
  fallbackState?: string;
  actionRequired?: boolean;
  fingerprint?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface IncidentRecord extends IncidentInput {
  id: string;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AlertMessage {
  incidentId: string;
  severity: IncidentSeverity;
  module: IncidentModule;
  text: string;
}

export interface AlertChannel {
  readonly name: string;
  send(message: AlertMessage): Promise<void>;
}
