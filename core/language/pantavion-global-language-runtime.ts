import { PANTAVION_LANGUAGE_CATALOG, getSupportedPantavionLanguage } from "@/core/language/pantavion-language-catalog";

export const pantavionGlobalLanguageRuntimeContract = {
  id: "pantavion_global_language_runtime_v1",
  storageKey: "pantavion-language",
  cookieName: "pantavion_language",
  truth:
    "The selected Pantavion language must become global across modules. Full automatic translation still requires provider/runtime adapters.",
  supportedLanguages: PANTAVION_LANGUAGE_CATALOG.length,
} as const;

export function resolvePantavionRuntimeLanguage(input: unknown) {
  const code = typeof input === "string" ? input : "el";
  return getSupportedPantavionLanguage(code) ?? getSupportedPantavionLanguage("el") ?? PANTAVION_LANGUAGE_CATALOG[0];
}
