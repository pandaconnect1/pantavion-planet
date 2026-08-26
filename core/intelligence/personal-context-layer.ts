export type PersonalContextScope =
  | "language"
  | "communication_style"
  | "goals"
  | "accessibility"
  | "module_preferences"
  | "workflow_context";

export type PersonalContextAgentKind =
  | "prime"
  | "user_memory"
  | "language"
  | "social"
  | "translation"
  | "education"
  | "commerce"
  | "emergency";

export interface PersonalContextConsent {
  scopes: PersonalContextScope[];
  allowAgentUse: boolean;
  allowPersistence: boolean;
}

export interface PersonalContextInput {
  userId: string;
  language?: string;
  communicationStyle?: "simple" | "standard" | "detailed";
  goals?: string[];
  accessibility?: string[];
  modulePreferences?: string[];
  workflowContext?: Record<string, string | number | boolean>;
  consent: PersonalContextConsent;
}

export interface CompiledPersonalContext {
  userId: string;
  context: Partial<Omit<PersonalContextInput, "userId" | "consent">>;
  allowedAgents: PersonalContextAgentKind[];
  persistenceAllowed: boolean;
  appliedScopes: PersonalContextScope[];
  droppedScopes: PersonalContextScope[];
}

const AGENT_SCOPE_REQUIREMENTS: Record<PersonalContextAgentKind, PersonalContextScope[]> = {
  prime: [],
  user_memory: ["goals", "module_preferences", "workflow_context"],
  language: ["language", "communication_style"],
  social: ["communication_style", "module_preferences"],
  translation: ["language"],
  education: ["goals", "communication_style", "accessibility"],
  commerce: ["goals", "module_preferences"],
  emergency: ["language", "accessibility"],
};

const ALL_SCOPES: PersonalContextScope[] = [
  "language",
  "communication_style",
  "goals",
  "accessibility",
  "module_preferences",
  "workflow_context",
];

function uniqueStrings(values: string[] | undefined, maxItems: number): string[] | undefined {
  if (!values) return undefined;
  const normalized = Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).slice(0, maxItems);
  return normalized.length ? normalized : undefined;
}

function hasScope(consent: PersonalContextConsent, scope: PersonalContextScope) {
  return consent.scopes.includes(scope);
}

export function compilePersonalContext(input: PersonalContextInput): CompiledPersonalContext {
  if (!input.userId || !input.userId.trim()) {
    throw new Error("userId is required");
  }

  const context: CompiledPersonalContext["context"] = {};

  if (hasScope(input.consent, "language") && input.language?.trim()) {
    context.language = input.language.trim().slice(0, 64);
  }
  if (hasScope(input.consent, "communication_style") && input.communicationStyle) {
    context.communicationStyle = input.communicationStyle;
  }
  if (hasScope(input.consent, "goals")) {
    context.goals = uniqueStrings(input.goals, 20);
  }
  if (hasScope(input.consent, "accessibility")) {
    context.accessibility = uniqueStrings(input.accessibility, 20);
  }
  if (hasScope(input.consent, "module_preferences")) {
    context.modulePreferences = uniqueStrings(input.modulePreferences, 30);
  }
  if (hasScope(input.consent, "workflow_context") && input.workflowContext) {
    context.workflowContext = Object.fromEntries(
      Object.entries(input.workflowContext).slice(0, 30),
    );
  }

  const appliedScopes = input.consent.scopes.filter((scope) => {
    switch (scope) {
      case "language": return Boolean(context.language);
      case "communication_style": return Boolean(context.communicationStyle);
      case "goals": return Boolean(context.goals?.length);
      case "accessibility": return Boolean(context.accessibility?.length);
      case "module_preferences": return Boolean(context.modulePreferences?.length);
      case "workflow_context": return Boolean(context.workflowContext && Object.keys(context.workflowContext).length);
    }
  });

  const allowedAgents: PersonalContextAgentKind[] = ["prime"];
  if (input.consent.allowAgentUse) {
    for (const [agent, requiredScopes] of Object.entries(AGENT_SCOPE_REQUIREMENTS) as [PersonalContextAgentKind, PersonalContextScope[]][]) {
      if (agent === "prime") continue;
      if (requiredScopes.some((scope) => appliedScopes.includes(scope))) {
        allowedAgents.push(agent);
      }
    }
  }

  return {
    userId: input.userId.trim(),
    context,
    allowedAgents,
    persistenceAllowed: Boolean(input.consent.allowPersistence),
    appliedScopes,
    droppedScopes: ALL_SCOPES.filter((scope) => !appliedScopes.includes(scope)),
  };
}

export function routePersonalContextToAgent(
  compiled: CompiledPersonalContext,
  requestedAgent: PersonalContextAgentKind,
) {
  if (!compiled.allowedAgents.includes(requestedAgent)) {
    return {
      allowed: false as const,
      agent: requestedAgent,
      reason: "agent_not_allowed_by_consent_or_context",
      context: {},
    };
  }

  const requiredScopes = AGENT_SCOPE_REQUIREMENTS[requestedAgent];
  const allowedContext: CompiledPersonalContext["context"] = {};

  for (const scope of requiredScopes) {
    switch (scope) {
      case "language": allowedContext.language = compiled.context.language; break;
      case "communication_style": allowedContext.communicationStyle = compiled.context.communicationStyle; break;
      case "goals": allowedContext.goals = compiled.context.goals; break;
      case "accessibility": allowedContext.accessibility = compiled.context.accessibility; break;
      case "module_preferences": allowedContext.modulePreferences = compiled.context.modulePreferences; break;
      case "workflow_context": allowedContext.workflowContext = compiled.context.workflowContext; break;
    }
  }

  return {
    allowed: true as const,
    agent: requestedAgent,
    context: allowedContext,
  };
}
