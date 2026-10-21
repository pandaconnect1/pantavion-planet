/**
 * PantaAI self-hosted inference adapter.
 * The endpoint is server-owned and deliberately restricted to local/private network
 * hosts or Pantavion's own dedicated inference hostname.
 */
export type OwnedInferenceConfig = {
  endpoint: string;
  model: string;
  bearerToken: string;
};

export function getOwnedInferenceConfig(
  env: NodeJS.ProcessEnv = process.env,
): OwnedInferenceConfig | null {
  const raw = env.PANTAVION_OWNED_AI_BASE_URL?.trim();
  const model = env.PANTAVION_OWNED_AI_MODEL?.trim();
  if (!raw || !model) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const hostname = url.hostname.toLowerCase();
  const privateHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".internal") ||
    (hostname.startsWith("pantavion-") && /^[a-z0-9-]+$/.test(hostname) && !hostname.includes("."));
  const ownedTlsHost = hostname === "ai.pantavion.com" && url.protocol === "https:";
  const allowed = (privateHost && (url.protocol === "http:" || url.protocol === "https:")) || ownedTlsHost;

  if (!allowed || url.username || url.password || url.search || url.hash ||
      (url.pathname !== "/" && url.pathname !== "/v1" && url.pathname !== "/v1/")) {
    return null;
  }
  const endpoint = new URL("/v1/chat/completions", url).toString();
  return { endpoint, model, bearerToken: env.PANTAVION_OWNED_AI_BEARER_TOKEN?.trim() || "" };
}

export async function answerWithOwnedInference(
  config: OwnedInferenceConfig,
  message: string,
  system: string,
  signal?: AbortSignal,
): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.bearerToken) headers.Authorization = `Bearer ${config.bearerToken}`;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message.slice(0, 16000) },
      ],
      temperature: 0.4,
      max_tokens: 1024,
      stream: false,
    }),
    signal,
    cache: "no-store",
  });

  if (!response.ok) throw new Error("PANTAVION_OWNED_AI_UPSTREAM_UNAVAILABLE");
  const result = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const answer = result?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) {
    throw new Error("PANTAVION_OWNED_AI_EMPTY_OUTPUT");
  }
  return answer.trim().slice(0, 16000);
}
