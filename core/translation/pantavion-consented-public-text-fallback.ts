/** Limited, explicitly consented, PUBLIC text-only translation fallback.
 * Never use for chats, voice, Water, confidential or unattended content.
 * No Vercel dependency, no API secrets, no storage or logging of input text.
 */
export type PublicTextFallbackResult = {
  translatedText: string;
  provider: "mymemory_external_explicit_consent";
};

export async function translateExplicitPublicText(input: {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  consent: boolean;
}, fetcher: typeof fetch = fetch): Promise<PublicTextFallbackResult | null> {
  if (input.consent !== true) return null;
  const source = input.sourceLanguage.trim().toLowerCase();
  const target = input.targetLanguage.trim().toLowerCase();
  if (!/^[a-z]{2,3}$/.test(source) || !/^[a-z]{2,3}$/.test(target) ||
      source === target || source === "auto") return null;
  const text = input.text.trim();
  // MyMemory GET permits at most 500 UTF-8 bytes per text segment.
  if (!text || new TextEncoder().encode(text).length > 480) return null;
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", source + "|" + target);

  try {
    const response = await fetcher(url.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const data = await response.json() as {
      responseStatus?: number;
      responseData?: { translatedText?: unknown };
    };
    if (data.responseStatus !== 200) return null;
    const translatedText = data.responseData?.translatedText;
    if (typeof translatedText !== "string" || !translatedText.trim() ||
        translatedText.trim().toLowerCase() === text.toLowerCase()) return null;
    return {
      translatedText: translatedText.trim().slice(0, 2000),
      provider: "mymemory_external_explicit_consent",
    };
  } catch {
    return null;
  }
}
