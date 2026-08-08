# PantaTranslate granted microphone fallback fix

- Microphone permission proven by `getUserMedia` is tracked independently from browser Web Speech service errors.
- `not-allowed`, `service-not-allowed`, `audio-capture`, `network`, and `no-speech` from Web Speech fall back to MediaRecorder when microphone access was already proven.
- Browser transcripts pass through the shared accessibility normalizer before translation while preserving the raw transcript for display.
- Device speech synthesis voices are selected dynamically from the device voice list; the public world language catalog is not limited by a manual locale map.
- No Water, Users/Access, Map A, maps, or pipe-network code is changed.
