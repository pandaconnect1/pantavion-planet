# Pantavion Music / Voice Studio — Domain Model v0.1

Status: IMPLEMENTATION FOUNDATION / NOT LIVE
Requirement: `docs/requirements/PANTAVION_MUSIC_VOICE_STUDIO.md`

## Design invariants
- Human voice and authorship remain primary.
- Voice processing requires explicit purpose-aware consent.
- Private is the default for drafts, recordings and dedications.
- Global/cultural capability is data-driven, not hard-coded to Greece/Cyprus or a Western-only genre model.
- Provider output is never canonical truth until validated and written through the Pantavion command path.
- Catalog/rights capability is distinct from user-created composition capability.

## Canonical entities

### VoiceProfile
User-scoped derived profile. Raw audio is not required for long-term retention.

Fields:
- `id`
- `userId`
- `version`
- `comfortableRangeLowHz?`
- `comfortableRangeHighHz?`
- `tessituraLowHz?`
- `tessituraHighHz?`
- `pitchStability?`
- `dynamicProfile?`
- `timbreDescriptors[]`
- `rhythmDescriptors[]`
- `supportedTraditionContexts[]`
- `analysisConfidence`
- `derivedAt`
- `sourceRecordingRetention` = `none | session | user_saved`
- `consentReceiptId`

### MusicCultureContext
Extensible context rather than a country-only classification.

Fields:
- `id`
- `regionCodes[]`
- `languageTags[]`
- `dialectTags[]`
- `traditionTags[]`
- `genreTags[]`
- `modeOrScaleTags[]`
- `rhythmTags[]`
- `instrumentTags[]`
- `vocalTechniqueTags[]`
- `expertiseStatus` = `verified | supported | experimental | unknown`
- `provenance[]`

### VoiceMatchAssessment
A recommendation, never a judgment of singer quality.

Fields:
- `id`
- `userId`
- `voiceProfileVersion`
- `targetType` = `song | style | composition`
- `targetId`
- `cultureContextIds[]`
- `voiceFitScore?`
- `emotionalFitScore?`
- `recommendedKey?`
- `transposeSemitones?`
- `confidence`
- `reasons[]`
- `limitations[]`
- `createdAt`

### LyricProject
- `id`
- `ownerUserId`
- `title?`
- `languageTags[]`
- `cultureContextIds[]`
- `intentTags[]`
- `sourceMode` = `written | spoken_story | mixed`
- `privacy` = `private | selected_people | shareable`
- `currentRevisionId`
- `createdAt`
- `updatedAt`

### LyricRevision
Preserves human provenance and AI assistance history.

Fields:
- `id`
- `projectId`
- `parentRevisionId?`
- `text`
- `authorshipSegments[]`
- `assistanceMode` = `none | spelling | structure | rhyme | creative`
- `createdAt`

### CompositionProject
- `id`
- `ownerUserId`
- `lyricProjectId?`
- `cultureContextIds[]`
- `stylePrompt?`
- `targetVoiceProfileVersion?`
- `targetKey?`
- `tempo?`
- `humanControlMode` = `natural | assisted | creative`
- `privacy`
- `status` = `draft | queued | generating | ready | failed | archived`
- `rightsState`
- `createdAt`
- `updatedAt`

### Dedication
- `id`
- `ownerUserId`
- `compositionProjectId`
- `recipientUserId?`
- `recipientLabel?`
- `message?`
- `privacy`
- `shareTokenHash?`
- `expiresAt?`
- `createdAt`

### RightsProvenanceRecord
- `id`
- `resourceType`
- `resourceId`
- `origin` = `user_created | generated | licensed_catalog | public_domain | unknown`
- `territories[]`
- `usageRights[]`
- `provider?`
- `evidenceRefs[]`
- `createdAt`

## Command boundaries
All mutations follow:

`Command -> Validation -> Canonical Write -> Event Emission`

Initial commands:
- `CreateVoiceProfileAnalysis`
- `DeleteVoiceProfile`
- `AssessVoiceMatch`
- `CreateLyricProject`
- `ReviseLyrics`
- `CreateCompositionProject`
- `GenerateCompositionDraft`
- `CreateDedication`
- `ChangeMusicPrivacy`
- `DeleteMusicProject`

## Events
- `music.voice_profile.created`
- `music.voice_profile.deleted`
- `music.voice_match.assessed`
- `music.lyrics.created`
- `music.lyrics.revised`
- `music.composition.requested`
- `music.composition.ready`
- `music.composition.failed`
- `music.dedication.created`
- `music.privacy.changed`
- `music.project.deleted`

## Provider boundary
Providers must sit behind capability interfaces. Minimum capability descriptors:
- voice analysis
- lyric assistance by language/dialect
- composition by cultural/style context
- transposition/key adaptation
- accompaniment/rendering
- rights/licensing metadata support

No provider is assumed to cover all cultures. Routing must expose unsupported/experimental states instead of fabricating confidence.

## First API contract candidates
- `POST /api/music/voice-profile/analyze`
- `DELETE /api/music/voice-profile`
- `POST /api/music/voice-match`
- `POST /api/music/lyrics/projects`
- `POST /api/music/lyrics/projects/:id/revisions`
- `POST /api/music/compositions`
- `POST /api/music/compositions/:id/generate`
- `POST /api/music/dedications`

These routes are architecture targets, not claims that endpoints are live.

## Next implementation gate
Before UI claims functionality, implement persistence/authorization/consent contracts and provider capability interfaces, then add tests for ownership isolation, privacy defaults, consent denial, unsupported cultural contexts and provider failure.
