import {
  createPantavionTranslationRuntimeSession,
  evaluatePantavionRealtimeTranslationProvider,
  type PantavionTranslationRuntimeSessionInput,
} from "@/core/communication/pantavion-translation-runtime-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function readRuntimeProviderState(context: PantavionTranslationRuntimeSessionInput["context"]) {
  const providerName = process.env.PANTAVION_REALTIME_TRANSLATION_PROVIDER || "";
  const providerConfigured =
    Boolean(providerName) &&
    (Boolean(process.env.PANTAVION_REALTIME_TRANSLATION_PROVIDER_KEY) ||
      Boolean(process.env.OPENAI_API_KEY) ||
      Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS));

  return evaluatePantavionRealtimeTranslationProvider({
    providerConfigured,
    runtimeEnabled: process.env.PANTAVION_REALTIME_TRANSLATION_RUNTIME_ENABLED === "true",
    adapterImplemented: false,
    founderApprovedForSensitiveContexts:
      process.env.PANTAVION_REALTIME_TRANSLATION_SENSITIVE_CONTEXT_APPROVED === "true",
    context: context || "general",
  });
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const parsed = (await request.json()) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toSessionInput(body: Record<string, unknown>): PantavionTranslationRuntimeSessionInput {
  const context = isString(body.context)
    ? (body.context as PantavionTranslationRuntimeSessionInput["context"])
    : "general";

  return {
    userLanguage: isString(body.userLanguage) ? body.userLanguage : undefined,
    helperLanguage: isString(body.helperLanguage) ? body.helperLanguage : undefined,
    sourceLanguageHint: isString(body.sourceLanguageHint) ? body.sourceLanguageHint : undefined,
    consentAccepted: body.consentAccepted === true,
    requestedMode: isString(body.requestedMode)
      ? (body.requestedMode as PantavionTranslationRuntimeSessionInput["requestedMode"])
      : "automatic_speech_detection",
    context,
  };
}

export async function GET() {
  const readiness = readRuntimeProviderState("general");

  return Response.json({
    ok: true,
    route: "/api/translation/realtime/session",
    status: readiness.status,
    canOpenRealtimeSession: readiness.canOpenRealtimeSession,
    reason: readiness.reason,
    defaultMode: "automatic_speech_detection",
    manualHelperLanguageRole:
      "Backup language for the assistant, nurse, doctor, taxi driver, public service worker, or other person.",
    limitation:
      "Realtime translation is assistive. It is not a legal, medical, emergency, or professional guarantee.",
  });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request);
  const sessionInput = toSessionInput(body);
  const session = createPantavionTranslationRuntimeSession(sessionInput);
  const readiness = readRuntimeProviderState(session.context);

  if (!session.consentAccepted) {
    return Response.json(
      {
        ok: false,
        route: "/api/translation/realtime/session",
        error: "PANTAVION_REALTIME_TRANSLATION_CONSENT_REQUIRED",
        session,
        readiness,
      },
      { status: 400 },
    );
  }

  if (readiness.reason === "PANTAVION_REALTIME_TRANSLATION_PROVIDER_REQUIRED") {
    return Response.json(
      {
        ok: false,
        route: "/api/translation/realtime/session",
        error: "PANTAVION_REALTIME_TRANSLATION_PROVIDER_REQUIRED",
        session,
        readiness,
      },
      { status: 503 },
    );
  }

  if (!readiness.canOpenRealtimeSession) {
    return Response.json(
      {
        ok: false,
        route: "/api/translation/realtime/session",
        error: readiness.reason,
        providerState: "provider_adapter_not_implemented",
        session,
        readiness,
      },
      { status: 501 },
    );
  }

  return Response.json({
    ok: true,
    route: "/api/translation/realtime/session",
    status: readiness.status,
    session,
    warning:
      "Provider adapter reports beta readiness. Provider costs, latency, consent, audit, and context limits still apply.",
  });
}
