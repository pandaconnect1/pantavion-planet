export type KernelModuleKey =
  | "Kernel"
  | "People"
  | "Chat"
  | "Voice"
  | "Pulse"
  | "Compass"
  | "Mind"
  | "Create"
  | "PantaLearn"
  | "Tools Hub"
  | "Business Layer"
  | "Research Layer"
  | "Ads Center";

export type DeliveryMode =
  | "native-feature"
  | "connector"
  | "catalog"
  | "course"
  | "workflow";

export type IntakeType =
  | "software-builder"
  | "voice-agent"
  | "tool-discovery"
  | "learning-system"
  | "business-framework"
  | "income-system"
  | "data-ml-map"
  | "general";

export type UserSegment =
  | "general-users"
  | "students"
  | "professionals"
  | "freelancers"
  | "founders"
  | "businesses"
  | "developers"
  | "teams"
  | "data-users";

export type MemoryKind =
  | "directive"
  | "decision"
  | "task"
  | "module-state"
  | "research-signal"
  | "run-log"
  | "system";

export type KernelClassification = {
  detectedType: IntakeType;
  targetModule: KernelModuleKey;
  userSegment: UserSegment;
  incomeRelated: boolean;
  learningRelated: boolean;
  toolDiscovery: boolean;
  businessFramework: boolean;
  deliveryMode: DeliveryMode;
  cleanConclusion: string;
};

export type KernelPlanStep = {
  id: string;
  title: string;
  module: KernelModuleKey;
  status: "planned";
  reason: string;
  targetFile?: string;
};

export type KernelMemoryEntry = {
  id: string;
  kind: MemoryKind;
  content: string;
  createdAt: string;
};

export type KernelRunResult = {
  id: string;
  input: string;
  classification: KernelClassification;
  plan: KernelPlanStep[];
  outputs: string[];
  createdAt: string;
};

export type KernelState = {
  constitutionVersion: number;
  kernelName: string;
  memories: KernelMemoryEntry[];
  runs: KernelRunResult[];
  lastUpdatedAt: string;
};
