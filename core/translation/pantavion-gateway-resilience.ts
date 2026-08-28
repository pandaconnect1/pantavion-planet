export interface PantavionGatewayLanePlan {
  id: "primary" | "hedge";
  primaryModel: string;
  fallbackModels: string[];
}

export interface PantavionGatewayModelPlan {
  orderedModels: string[];
  lanes: PantavionGatewayLanePlan[];
}

export const PANTAVION_GATEWAY_DEFAULT_MODELS = [
  "openai/gpt-5.6-sol",
  "google/gemini-3.6-flash",
  "anthropic/claude-sonnet-5",
] as const;

export function canonicalPantavionGatewayModelId(value: string) {
  const model = value.trim();
  if (!model || model.includes("/")) return model;
  if (/^(gpt-|o\d|chatgpt-)/i.test(model)) return `openai/${model}`;
  if (/^gemini-/i.test(model)) return `google/${model}`;
  if (/^claude-/i.test(model)) return `anthropic/${model}`;
  return model;
}

function providerNamespace(model: string) {
  const separator = model.indexOf("/");
  return separator > 0 ? model.slice(0, separator).toLowerCase() : "unknown";
}

export function buildPantavionGatewayModelPlan(
  configuredModels: Array<string | null | undefined>,
): PantavionGatewayModelPlan {
  const configured = configuredModels
    .map((value) => canonicalPantavionGatewayModelId(value || ""))
    .filter((value): value is string => Boolean(value));

  const orderedModels = Array.from(
    new Set<string>([
      ...configured,
      ...PANTAVION_GATEWAY_DEFAULT_MODELS,
    ]),
  );

  if (orderedModels.length === 0) {
    return { orderedModels: [], lanes: [] };
  }

  const primaryModel = orderedModels[0];
  const primaryProvider = providerNamespace(primaryModel);
  const primaryLane: PantavionGatewayLanePlan = {
    id: "primary",
    primaryModel,
    fallbackModels: orderedModels.filter((model) => model !== primaryModel),
  };

  const hedgePrimary =
    orderedModels.slice(1).find((model) => providerNamespace(model) !== primaryProvider)
    ?? orderedModels[1];

  if (!hedgePrimary) {
    return { orderedModels, lanes: [primaryLane] };
  }

  const hedgeLane: PantavionGatewayLanePlan = {
    id: "hedge",
    primaryModel: hedgePrimary,
    fallbackModels: orderedModels.filter((model) => model !== hedgePrimary),
  };

  return {
    orderedModels,
    lanes: [primaryLane, hedgeLane],
  };
}
