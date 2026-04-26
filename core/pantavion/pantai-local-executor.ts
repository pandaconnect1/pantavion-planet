import type {
  PantaiExecutionRequest,
  PantaiExecutionResult,
} from "./live-backend-contract";

function cleanInput(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 1000);
}

function detectIntent(input: string): string {
  const text = input.toLowerCase();

  if (!text) return "empty_request";
  if (text.includes("sos") || text.includes("emergency") || text.includes("help")) return "sos_flow";
  if (text.includes("contact") || text.includes("epaf") || text.includes("import")) return "contact_import";
  if (text.includes("message") || text.includes("chat") || text.includes("send")) return "communication";
  if (text.includes("ai") || text.includes("kernel") || text.includes("panta")) return "pantai_execution";
  if (text.includes("stripe") || text.includes("payment") || text.includes("money")) return "commercial_gate";
  if (text.includes("legal") || text.includes("law") || text.includes("privacy")) return "legal_gate";

  return "general_execution";
}

function buildPlan(intent: string): string[] {
  switch (intent) {
    case "sos_flow":
      return [
        "Validate emergency consent and identity state",
        "Collect best available location or fallback location",
        "Build emergency packet",
        "Dispatch only to trusted contacts or approved responder routes",
        "Record audit event when database exists",
      ];
    case "contact_import":
      return [
        "Require explicit user consent",
        "Accept only user-provided contacts or official connector export",
        "Never scrape third-party apps or messages",
        "Normalize contacts into Pantavion contact schema",
        "Store only after auth and database are active",
      ];
    case "communication":
      return [
        "Validate sender identity",
        "Validate recipient and consent scope",
        "Create Pantavion message envelope",
        "Apply abuse and rate-limit checks",
        "Send through Pantavion-owned messaging layer when storage is active",
      ];
    case "pantai_execution":
      return [
        "Parse user intent locally",
        "Select Pantavion-owned capability",
        "Generate deterministic plan",
        "Execute safe local action",
        "Return result without exposing third-party AI providers",
      ];
    case "commercial_gate":
      return [
        "Block live payments until commercial policy is complete",
        "Use hosted checkout only when approved",
        "Never handle raw card data",
        "Block marketplace payouts until KYC/KYB model exists",
      ];
    case "legal_gate":
      return [
        "Route to jurisdiction and policy review",
        "Check privacy, minors, restricted content, and safety class",
        "Block risky operation until legal gate passes",
      ];
    default:
      return [
        "Parse request",
        "Classify capability family",
        "Generate first safe execution plan",
        "Return guarded result",
      ];
  }
}

export function executePantaiLocal(request: PantaiExecutionRequest): PantaiExecutionResult {
  const input = cleanInput(request.input);
  const intent = detectIntent(input);
  const plan = buildPlan(intent);

  const execution = plan.map((step, index) => {
    return `Step ${index + 1}: ${step}`;
  });

  const warnings: string[] = [];

  if (!input) {
    warnings.push("No input was provided. Returning baseline kernel readiness flow.");
  }

  warnings.push("This endpoint is Pantavion-owned local execution. It does not call OpenAI, Claude, Gemini, or external AI providers.");
  warnings.push("Persistent memory, accounts, messaging, SOS dispatch, and contact import still require database and auth gates.");

  return {
    ok: true,
    engine: "pantavion-local-kernel",
    provider: "pantavion-owned",
    intent,
    plan,
    execution,
    warnings,
    nextRequiredInfrastructure: [
      "PostgreSQL or owned database layer",
      "Auth/account system",
      "Persistent memory tables",
      "Consent ledger",
      "Audit/event ledger",
      "Rate limiting and abuse protection",
    ],
  };
}
