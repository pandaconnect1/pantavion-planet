export type PantavionInventoryItemKind =
  | "page_route"
  | "api_route"
  | "layout"
  | "core_file"
  | "kernel_file"
  | "script"
  | "public_asset"
  | "config"
  | "doc"
  | "unknown";

export type PantavionInventoryRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionInventoryRealnessSignal =
  | "has_route"
  | "has_api_route"
  | "has_core_logic"
  | "has_kernel_contract"
  | "has_static_signal"
  | "has_prototype_signal"
  | "has_disabled_signal"
  | "has_todo_signal"
  | "has_placeholder_signal"
  | "has_provider_need"
  | "has_protected_scope"
  | "needs_work_order";

export type PantavionProjectInventoryItem = {
  path: string;
  kind: PantavionInventoryItemKind;
  route?: string;
  risk: PantavionInventoryRisk;
  mappedCapabilityIds: string[];
  signals: PantavionInventoryRealnessSignal[];
  notes: string[];
};

export type PantavionProjectInventoryReport = {
  generatedAt: string;
  totalItems: number;
  pageRoutes: number;
  apiRoutes: number;
  kernelFiles: number;
  staticOrPrototypeItems: number;
  protectedItems: number;
  workOrderCandidates: number;
  items: PantavionProjectInventoryItem[];
};
