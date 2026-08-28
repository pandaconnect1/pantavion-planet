export interface PantavionGatewayModelPlan {
  orderedModels: string[];
  primaryModel: string;
  fallbackModels: string[];
}

export const PANTAVION_GATEWAY_DEFAULT_MODELS = [
  "openai/gpt-4.1-mini",
  "google/gemini-3.6-flash",
  "anthropic/claude-sonnet-5",
  "openai/gpt-5.6-sol",
] as const;

export function canonicalPantavionGatewayModelId(value: string) {
  const model = value.trim();
  if (!model || model.includes("/")) return model;
  if (/^(gpt-|o\d|chatgpt-)/i.test(model)) return `openai/${model}`;
  if (/^gemini-/i.test(model)) return `google/${model}`;
  if (/^claude-/i.test(model)) return `anthropic/${model}`;
  return model;
}

function splitConfiguredList(value: string | null | undefined) {
  return String(value || "")
    .split(",")
    .map((item) => canonicalPantavionGatewayModelId(item))
    .filter(Boolean);
}

export function buildPantavionGatewayModelPlan(
  configuredModels: Array<string | null | undefined>,
  configuredList?: string | null,
): PantavionGatewayModelPlan {
  const configured = configuredModels
    .map((value) => canonicalPantavionGatewayModelId(value || ""))
    .filter(Boolean);

  const orderedModels = Array.from(
    new Set<string>([
      ...configured,
      ...splitConfiguredList(configuredList),
      ...PANTAVION_GATEWAY_DEFAULT_MODELS,
    ]),
  );

  const primaryModel = orderedModels[0] || "openai/gpt-4.1-mini";
  return {
    orderedModels,
    primaryModel,
    fallbackModels: orderedModels.filter((model) => model !== primaryModel),
  };
}
