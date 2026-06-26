export type PantavionAIResult =
  | {
      ok: true;
      provider: "openai" | "anthropic";
      model: string;
      text: string;
    }
  | {
      ok: false;
      provider: "none" | "openai" | "anthropic" | "unknown";
      status: "provider_not_configured" | "provider_error" | "provider_response_invalid";
      message: string;
    };

function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export async function callPantavionAI(input: {
  system: string;
  prompt: string;
}): Promise<PantavionAIResult> {
  const provider = process.env.PANTAVION_AI_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "none") {
    return {
      ok: false,
      provider: "none",
      status: "provider_not_configured",
      message: "No AI provider configured. Set PANTAVION_AI_PROVIDER=openai or anthropic with the matching API key.",
    };
  }

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY?.trim();
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";

    if (!key) {
      return {
        ok: false,
        provider: "openai",
        status: "provider_not_configured",
        message: "OPENAI_API_KEY is missing.",
      };
    }

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: timeoutSignal(45_000),
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: input.system },
            { role: "user", content: input.prompt },
          ],
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          provider: "openai",
          status: "provider_error",
          message: `OpenAI request failed with HTTP ${res.status}.`,
        };
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;

      if (!text) {
        return {
          ok: false,
          provider: "openai",
          status: "provider_response_invalid",
          message: "OpenAI response did not include text content.",
        };
      }

      return { ok: true, provider: "openai", model, text };
    } catch (error) {
      return {
        ok: false,
        provider: "openai",
        status: "provider_error",
        message: error instanceof Error ? error.message : "Unknown OpenAI error.",
      };
    }
  }

  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-latest";

    if (!key) {
      return {
        ok: false,
        provider: "anthropic",
        status: "provider_not_configured",
        message: "ANTHROPIC_API_KEY is missing.",
      };
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: timeoutSignal(45_000),
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1800,
          system: input.system,
          messages: [{ role: "user", content: input.prompt }],
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          provider: "anthropic",
          status: "provider_error",
          message: `Anthropic request failed with HTTP ${res.status}.`,
        };
      }

      const json = await res.json();
      const text = Array.isArray(json?.content)
        ? json.content
            .map((part: { type?: string; text?: string }) => part.text ?? "")
            .join("\n")
            .trim()
        : "";

      if (!text) {
        return {
          ok: false,
          provider: "anthropic",
          status: "provider_response_invalid",
          message: "Anthropic response did not include text content.",
        };
      }

      return { ok: true, provider: "anthropic", model, text };
    } catch (error) {
      return {
        ok: false,
        provider: "anthropic",
        status: "provider_error",
        message: error instanceof Error ? error.message : "Unknown Anthropic error.",
      };
    }
  }

  return {
    ok: false,
    provider: "unknown",
    status: "provider_not_configured",
    message: `Unsupported PANTAVION_AI_PROVIDER: ${provider}`,
  };
}
