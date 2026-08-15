# Interpreter full-turn audio recovery — 2026-08-15

Live failure reproduced on mobile with Greek ↔ Nepali:
- Greek → Nepali returned only a very short fragment.
- Nepali → Greek returned no usable result.

Recovered evidence used for this bounded fix:
- historical realtime Interpreter used continuous/interim browser speech recognition;
- mobile server speech-to-text fallback already exists;
- multilingual transcription and language detection runtime already exist;
- MediaRecorder finalization had previously been fixed before STT upload.

Canonical decision for this increment:
- do not special-case Nepali;
- use the same full-turn MediaRecorder → server STT → translation → TTS path for every selected language;
- request echo cancellation, noise suppression and automatic gain control where the browser/device supports them;
- replace the 15-second cap with an explicit stop and a 2-minute safety ceiling for conversation turns;
- do not claim seminar/conference mode yet: long-form sessions require streaming/chunk rotation and endurance verification.

Acceptance gate:
1. CI/typecheck/build green.
2. Preview deploy green.
3. Mobile re-test Greek ↔ Nepali in both directions with multi-sentence speech.
4. Repeat on at least two additional language pairs before claiming universal behavior.
5. Merge only after the bounded change is reviewable and safe.
