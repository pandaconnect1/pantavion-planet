# Donor Batch 002 — pantavion-voice translation / voice audit

Source repository: `pandaconnect1/pantavion-voice`
Canonical destination: `pandaconnect1/pantavion-planet`
Batch status: `RECOVERED_AND_CLASSIFIED`

## Recovered capabilities

| # | Donor path | Recovered capability | Recovery State | Decision | Canonical target | Live State |
|---|---|---|---|---|---|---|
| 1 | `app/voice/page.tsx` | Broad language/dialect selector; browser speech recognition; browser TTS; translation UI | PARTIAL | ARCHIVE_SHELL + MERGE_UNIQUE | `app/translate`, `app/interpreter`, canonical language/voice registries | donor not live |
| 2 | `app/api/translate/route.ts` | Thin text-translation proxy to MyMemory public endpoint | PARTIAL | ARCHIVE_NOT_FOR_PRODUCTION | canonical governed provider router | donor not live |

## Provider/API audit

The donor `app/api/translate/route.ts` accepts `{ text, targetLang }`, forwards source text to `api.mymemory.translated.net`, uses `langpair=auto|<target>`, returns only `responseData.translatedText`, and converts all exceptions to an empty string.

This route must not be promoted into canonical production because it lacks the Pantavion requirements for explicit provider governance, privacy/cost policy, provenance, timeout/retry/error taxonomy, source-language fidelity, bidirectional conversation state, provider health, confidence and owner activation gates.

Decision: `ARCHIVE_NOT_FOR_PRODUCTION`. It remains provenance for the historical intent that translation was meant to be real, but it is not a safe canonical provider implementation.

## Language/dialect recovery

The donor Voice page contains useful region-level speech/locale choices including, among others:

- English UK/US and Greek;
- Arabic Levant, Gulf, Egypt and Maghreb/Morocco;
- Kurdish Kurmanji and Sorani;
- French France/Canada;
- Spanish Spain/Mexico/Argentina/Colombia;
- Portuguese Portugal/Brazil;
- Chinese Simplified/Traditional;
- substantial South Asian, Southeast Asian, East African, West African and Southern African coverage.

These entries are requirements/evidence, not proof of provider support. Every recovered locale must be delta-checked against canonical `globalEmergencyLanguages`, `pantavion-language-coverage-matrix`, `pantavion-natural-language-universe`, speech normalization and provider capability matrices before merge.

Decision: `INVESTIGATE -> MERGE_UNIQUE`. Missing locale/dialect metadata belongs in canonical registries; duplicated or less accurate metadata is archived.

## Canonical comparison

Canonical Pantavion already has a materially stronger translation/voice surface with microphone permission handling, browser and server recording paths, speech normalization, speech-to-text integration, bidirectional translation flow, device voice selection and user-facing error/status handling.

Canonical `PANTAVION_MULTIMODAL_LANGUAGE_CONTRACT` explicitly requires text/speech/audio/image/subtitle support, bidirectional conversation, at least 250 languages and a 7,200-dialect roadmap. Its current truth state remains `contract_ready_provider_blocked` / `productionReady: false` until production providers and privacy/cost controls are activated.

Therefore this donor batch does **not** claim Translation/Interpreter is production complete. It contributes historical locale coverage and intent while rejecting the weak donor provider route.

## Canonical actions

1. Compare every donor language/dialect code against canonical language registries.
2. Merge only genuinely missing locale/dialect metadata with provenance.
3. Do not add MyMemory as an implicit production default.
4. Provider activation must pass privacy, cost, reliability, quality, health and owner/admin gates.
5. Bidirectional translation must be verified end-to-end through canonical `/api/pantavion/translate`, STT, TTS/device voice and the real UI.
6. `VERIFIED_LIVE` requires real production responses; registry coverage alone is never sufficient.

## Batch gate

`RECOVERED_AND_CLASSIFIED` only. No donor file in this batch is marked `MIGRATED` or `VERIFIED_LIVE` solely from recovery.
