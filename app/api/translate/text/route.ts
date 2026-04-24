import { NextResponse } from "next/server";

type TranslationBody = {
  text?: string;
  source?: string;
  target?: string;
};

const dictionary: Record<string, Record<string, string>> = {
  "el:en": {
    "γεια": "hello",
    "καλημέρα": "good morning",
    "ο πλανήτης σε μία ζωντανή οθόνη": "the planet in one living screen",
    "χρειάζομαι βοήθεια": "I need help",
    "είμαι σε κίνδυνο": "I am in danger",
  },
  "en:el": {
    "hello": "γεια",
    "good morning": "καλημέρα",
    "the planet in one living screen": "ο πλανήτης σε μία ζωντανή οθόνη",
    "i need help": "χρειάζομαι βοήθεια",
    "i am in danger": "είμαι σε κίνδυνο",
  },
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TranslationBody;

  const text = String(body.text ?? "").trim();
  const source = String(body.source ?? "el");
  const target = String(body.target ?? "en");
  const key = `${source}:${target}`;
  const normalized = text.toLowerCase();

  const exact = dictionary[key]?.[normalized];

  return NextResponse.json({
    source,
    target,
    input: text,
    output:
      exact ??
      `[Foundation translation packet] ${text}`,
    confidence: exact ? 0.92 : 0.31,
    mode: exact ? "foundation-dictionary" : "provider-ready-fallback",
    providerStatus:
      exact
        ? "Matched local foundation dictionary."
        : "External translation provider is not connected yet. Route/API is live and ready for provider integration.",
    next: [
      "Connect translation provider",
      "Add speech-to-text",
      "Add text-to-speech",
      "Add live subtitles",
      "Add group translation rooms",
    ],
  });
}
