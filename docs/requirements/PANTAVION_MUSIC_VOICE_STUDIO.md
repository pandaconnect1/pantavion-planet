# Pantavion Music / Voice Studio — Canonical Product Requirement

Status: ADOPTED / SPEC_ONLY
Decision: KEEP + EVOLVE
Canonical target: Pantavion Audio / Voice ecosystem
Live state: SPEC_ONLY

## Human purpose
Pantavion Music / Voice Studio exists to help a person turn emotion, memory, story and intention into music while preserving the person's own voice and authorship. AI enhances the human; it does not replace the human.

## Global-by-design requirement
Pantavion Music / Voice Studio is a global product from its foundation, not a Greece/Cyprus product later translated for other markets. Discovery, Voice Match, Emotional Match, creation and composition must be designed for users and musical cultures across all seven continents.

Global coverage is not satisfied by translating labels. The capability model must be able to represent languages and dialects, local and regional genres, vocal traditions and techniques, rhythm systems, scales/modes and tuning traditions, characteristic instrumentation, performance conventions and cultural context. It must support both contemporary global music and regional/traditional forms.

Examples include — without creating a closed taxonomy — Greek/Cypriot laiko, entechno and rembetiko; Arabic and regional maqam-based traditions; Turkish traditions; Indian classical, folk and contemporary/Bollywood forms; East and Southeast Asian traditions and contemporary K-pop/J-pop/C-pop; African regional traditions and contemporary forms such as Afrobeats; European folk/classical/contemporary forms; North American blues, jazz, gospel, country, rock, hip-hop and related traditions; Latin American and Caribbean forms; Oceanian and Indigenous traditions; and music made by communities connected to Antarctica. Coverage must expand through an extensible cultural/music ontology rather than a hard-coded country list.

Voice Match must be culturally aware. A singer using Arabic, Indian, African, East Asian, Indigenous or other vocal traditions must not be judged solely against a Western equal-tempered/pop-vocal model. The system should distinguish technical compatibility from cultural/style conventions and avoid ranking cultures as superior or inferior.

Local authenticity requires appropriate metadata, rights/provenance, regional expertise and evaluation. Pantavion should communicate uncertainty when a tradition is not yet adequately supported rather than pretending universal expertise.

Principle: **Global by design, culturally aware, locally authentic.**

## Core journeys
1. **Find what suits my voice** — capture a short spoken/sung sample, estimate comfortable vocal range and characteristics, then recommend songs/styles that can make the natural voice sound its best.
2. **Sing any song** — recommendations never restrict choice. For a song outside the comfortable range, suggest a safer/more natural key or transposition and allow the original key when the user chooses it.
3. **Emotional Match** — let the user choose music because it expresses what they feel, independently of technical Voice Match.
4. **Create my song** — emotion/story -> user's words -> optional lyric assistance -> genre/style -> melody/composition -> key adapted to the user's voice -> rehearsal -> recording.
5. **Dedicate it to someone** — create a personal musical dedication from a story, memory, gratitude, love, apology, celebration, grief or other human expression; keep private or share by explicit choice.
6. **I don't know what to say** — user may speak freely; Pantavion helps structure the user's story into lyrics without erasing the user's meaning or personal language.

## Voice Match
Analyze only with user consent. Candidate signals include comfortable pitch range, tessitura, pitch stability, dynamics, timbral descriptors, rhythm/phrasing and performance comfort. Present recommendations as assistance, not judgments of whether someone is a good or bad singer.

Example output concepts:
- Voice Fit score
- Emotional Fit score
- comfortable key
- suggested transposition
- songs/styles likely to showcase the natural voice

## Music creation
Support broad musical expression, including but not limited to laiko, entechno, pop, rock, ballad, acoustic, R&B, soul, jazz, blues, country, electronic, dance, Latin, reggae and traditional/regional styles. Allow combinations and user-described styles rather than a fixed closed taxonomy.

## Human-control modes
- Natural: preserve the recorded voice with minimal processing.
- Assisted: optional subtle production/pitch/timing assistance controlled by the user.
- Creative: stronger user-requested production/transformation tools with clear disclosure.

Never silently replace the user's real performance with an artificial 'perfect' performance.

## Privacy and consent
Voice analysis, recording, retention and sharing require clear purpose-aware controls. Private creation is the default for personal drafts/dedications. Sharing is an explicit user action. Voice-derived profiles must have deletion/reset controls. Avoid unnecessary raw-audio retention.

## Rights and provenance
Track ownership/provenance of user lyrics, recordings, generated composition elements and licensed/catalog material. Do not imply that copyrighted catalog songs can be reproduced, distributed or transformed without the required rights/licences. Rights/licensing must account for territorial differences where applicable.

## Product surfaces
Primary entry points:
- Find songs for my voice
- Create my song
- Make a dedication
- I don't know what to say

Potential integration points: Pantavion Voice, Audio/Radio, Social, Chat and user profile, subject to privacy/entitlement rules.

## Canonical implementation path
This requirement is not considered DONE by being documented or by having a static UI.

SPEC -> architecture/data contracts -> provider capability layer -> backend live -> UI connected -> tests -> deploy -> verified live.

Initial implementation slices:
1. Voice Profile + consent/data contract.
2. Global music/culture ontology and capability registry.
3. Voice Match analysis contract with culture/style-aware evaluation.
4. Recommendation engine interface and song/style UI with transposition suggestions.
5. Story/lyrics workspace with multilingual/dialect-aware assistance and revision history.
6. Composition job/provider abstraction with regional capability and rights/provenance metadata.
7. Recording/rehearsal flow and natural/assisted/creative controls.
8. Dedication privacy/share flow.
9. Cross-region evaluation, automated tests, abuse/privacy checks, deployment and live verification.

## Definition of DONE
DONE only when backend-live, UI-connected, tested, deployed and verified-live. Until then this feature remains PARTIAL or SPEC_ONLY according to its actual state.
