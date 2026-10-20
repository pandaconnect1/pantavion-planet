/**
 * Server-only, opt-in OpenAI-compatible model adapter for Pantavion agents.
 * No provider request occurs unless the caller runs a worker and configures credentials.
 * Never import this module into browser/client components.
 */
import type { AgentModelAdapter, AgentModelRequest, AgentModelResult } from "./pantavion-independent-agent-runtime";

export type ProviderAdapterOptions = {
  id: string;
  endpoint: string;
  model: string;
  apiKey: string | undefined;
  timeoutMs?: number;
  maxOutputTokens?: number;
  fetchImpl?: typeof fetch;
};

const MAX_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_TOKENS = 8192;
const MAX_OBJECTIVE_CHARS = 24_000;

function assertEndpoint(endpoint: string): URL {
  const url = new URL(endpoint);
  if (url.hostname !== "api.openai.com") throw new Error("Model endpoint host is not allowlisted");
  if (url.pathname !== "/v1/chat/completions" || url.search) throw new Error("Model endpoint path is not allowlisted");
  if (url.port) throw new Error("Model endpoint port is not allowlisted");
  if (url.protocol !== "https:") throw new Error("Model endpoint must use HTTPS");
  if (url.username || url.password || url.hash) throw new Error("Invalid model endpoint");
  return url;
}

export function createOpenAICompatibleAgentAdapter(options: ProviderAdapterOptions): AgentModelAdapter {
  const endpoint = assertEndpoint(options.endpoint);
  const timeoutMs = Math.max(1000, Math.min(options.timeoutMs ?? 45_000, MAX_TIMEOUT_MS));
  const maxTokens = Math.max(1, Math.min(options.maxOutputTokens ?? 4096, MAX_OUTPUT_TOKENS));
  const transport = options.fetchImpl ?? fetch;

  return {
    id: options.id,
    async isConfigured() {
      return Boolean(options.apiKey?.trim() && options.model.trim());
    },
    async infer(request: AgentModelRequest, signal?: AbortSignal): Promise<AgentModelResult> {
      if (!options.apiKey?.trim()) throw new Error("Model adapter is not configured");
      if (!options.model.trim()) throw new Error("Model identifier is missing");
      if (!request.jobId.trim() || !request.objective.trim()) throw new Error("Job and objective required");
      if (request.objective.length > MAX_OBJECTIVE_CHARS) throw new Error("Objective exceeds size limit");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error("Model request timed out")), timeoutMs);
      const onAbort = () => controller.abort(signal?.reason);
      if (signal?.aborted) onAbort();
      else signal?.addEventListener("abort", onAbort, { once: true });
      try {
        const response = await transport(endpoint.toString(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${options.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: options.model,
            messages: [
              { role: "system", content: request.systemPolicy },
              {
                role: "user",
                content: JSON.stringify({
                  jobId: request.jobId,
                  objective: request.objective,
                  evidenceRefs: request.evidenceRefs.slice(0, 200),
                }),
              },
            ],
            max_tokens: Math.min(request.maxOutputTokens, maxTokens),
          }),
          signal: controller.signal,
          cache: "no-store",
          redirect: "error",
        });
        if (!response.ok) {
          // Do not include provider response bodies: they can echo secrets or sensitive data.
          throw new Error(`Model provider HTTP ${response.status}`);
        }
        const body: unknown = await response.json();
        if (!body || typeof body !== "object" || !("choices" in body)) {
          throw new Error("Malformed model response");
        }
        const result = body as {
          choices?: Array<{ message?: { content?: unknown } }>;
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const output = result.choices?.[0]?.message?.content;
        if (typeof output !== "string" || !output.trim()) throw new Error("Empty model response");
        return {
          provider: options.id,
          model: options.model,
          output,
          usage: {
            inputTokens: result.usage?.prompt_tokens,
            outputTokens: result.usage?.completion_tokens,
          },
        };
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}

/** Environment credentials must be supplied only by the server-side worker. */
export function createAgentAdapterFromEnv(env: NodeJS.ProcessEnv = process.env): AgentModelAdapter {
  return createOpenAICompatibleAgentAdapter({
    id: env.PANTAVION_AGENT_PROVIDER_ID || "openai-compatible",
    endpoint: env.PANTAVION_AGENT_MODEL_ENDPOINT || "https://api.openai.com/v1/chat/completions",
    model: env.PANTAVION_AGENT_MODEL || "",
    apiKey: env.PANTAVION_AGENT_API_KEY,
  });
}
