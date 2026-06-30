import { readFileSync } from "node:fs";

const source = readFileSync("core/startup/startup-builder-stack.ts", "utf8");
const audit = readFileSync("core/startup/startup-builder-audit.ts", "utf8");
const route = readFileSync("app/api/kernel/startup-builder-stack/route.ts", "utf8");

const requiredSourceTokens = [
  "PANTAVION_STARTUP_BUILDER_STACK",
  "assessPantavionStartupBuilderRequest",
  "startup_ideation_engine",
  "market_research_intake",
  "business_model_canvas",
  "product_plan_builder",
  "code_writer_runtime",
  "deployment_planner",
  "legal_checklist_builder",
  "finance_checklist_builder",
  "brand_content_studio",
  "sales_outreach_assistant",
  "ops_support_builder",
  "analytics_growth_registry",
  "company_workspace_agents",
  "requiresFounderApproval",
  "requiresRepoSafetyGate",
  "requiresSensitiveVaultCheck",
  "allowedForAutomaticExecution",
  "allowedForExecutionAfterApproval",
  "requiredChecks"
];

const requiredAuditTokens = [
  "startup-builder-stack-audit.jsonl",
  "appendPantavionStartupBuilderAudit"
];

const requiredRouteTokens = [
  "export async function GET",
  "export async function POST",
  "appendPantavionStartupBuilderAudit",
  "startup.builder.request.assessed"
];

const missing = [
  ...requiredSourceTokens.filter((token) => !source.includes(token)),
  ...requiredAuditTokens.filter((token) => !audit.includes(token)),
  ...requiredRouteTokens.filter((token) => !route.includes(token))
];

if (missing.length > 0) {
  console.error("Startup builder stack audit failed. Missing tokens:");
  for (const token of missing) {
    console.error(`- ${token}`);
  }
  process.exit(1);
}

console.log("Startup builder stack audit passed.");
