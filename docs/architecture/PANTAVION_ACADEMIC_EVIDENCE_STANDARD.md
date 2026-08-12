# Pantavion Academic Evidence Standard (PAES)

Status: CANONICAL CROSS-PLATFORM LAW
Scope: ALL Pantavion modules, agents, knowledge surfaces, recommendations, search, education and decision-support systems

## Non-negotiable principle
Pantavion is evidence-first. It must not build authoritative knowledge from unverified web noise, popularity, SEO ranking, anonymous claims, copied summaries or AI-generated circular citations.

The goal is not to claim infallibility. The goal is to minimize error through academic depth, primary evidence, provenance, expert validation, uncertainty disclosure and continuous correction.

## Source hierarchy
Source rank is contextual, but the default evidence order is:

### Tier A — Primary / authoritative
- peer-reviewed primary research and high-quality systematic reviews/meta-analyses
- universities and accredited research institutions
- academic books, scholarly monographs and recognized university/library collections
- official laws, regulations, standards, court/authority material and government/institutional primary records
- primary datasets and original technical/scientific documentation
- recognized international scientific/professional bodies where appropriate

### Tier B — Expert synthesis
- evidence-based professional guidelines
- scholarly reference works and specialist encyclopedias with editorial controls
- university course/reference materials where provenance and authorship are clear
- recognized subject-matter experts, with conflicts/credentials/provenance recorded

### Tier C — Secondary orientation/discovery
- Wikipedia and comparable general encyclopedias
- reputable journalism
- high-quality educational/explanatory sites

Tier C may be used to discover terminology, references or context, but must not normally be the final authority for consequential Pantavion claims when stronger evidence exists. Pantavion should follow citations upstream to the strongest available source.

### Tier D — Unverified/open web
- anonymous pages, forums, influencer posts, SEO content farms, unsourced social posts and similar material

Tier D is not authoritative evidence. It may be analyzed as public opinion/community discourse only when that is the explicit subject, and must be labeled accordingly.

## Evidence object
Every knowledge claim capable of affecting a recommendation should support an evidence record containing, where available:
- source identity and stable locator
- authors/issuing institution
- publication/update date
- evidence tier and evidence type
- discipline/domain
- jurisdiction/territory where relevant
- methodology/study design where relevant
- peer-review/editorial status
- conflicts/funding disclosures where known
- extracted claim(s)
- supporting and contradicting evidence links
- confidence/quality assessment
- validity/review date
- licensing/access/provenance metadata

## Claim rules
1. No citation laundering: citing a secondary page that itself makes an unsupported claim does not elevate the claim.
2. No circular AI evidence: AI-generated text cannot become evidence merely because another AI/page repeats it.
3. Prefer primary sources and evidence syntheses over summaries.
4. Separate fact, inference, recommendation, expert opinion and community sentiment.
5. Material uncertainty must be visible to the user.
6. When credible sources conflict, preserve the disagreement and explain why rather than silently selecting a convenient answer.
7. When evidence is insufficient, say so.
8. Freshness requirements vary by domain; law, medicine, security, prices, standards and fast-moving technology require stricter review windows.
9. Historical knowledge may appropriately rely on archival/primary historical sources rather than recent publications.
10. Local/Indigenous/cultural knowledge must not be discarded merely because it does not fit a Western publication system; provenance and appropriate expert/community authority must be represented explicitly.

## Domain rigor
Pantavion must route claims through domain-specific evidence policies. High-consequence domains require stronger gates, including health/medicine, legal/regulatory, safety/crisis, finance, infrastructure/engineering, child protection and security.

Academic depth does not mean pretending every response is doctoral research. The interface may explain simply, but the underlying evidence chain should be capable of deeper inspection.

## Knowledge pipeline
`Question/Need -> Domain Classification -> Source Retrieval -> Source Rank -> Claim Extraction -> Cross-source Verification -> Conflict/Uncertainty Analysis -> Canonical Knowledge Record -> Recommendation/Explanation -> Citation/Provenance -> Feedback/Correction`

## Wikipedia and comparable sources
Wikipedia is a useful secondary discovery/reference surface but is not Pantavion's canonical authority. Where a Wikipedia statement matters, Pantavion should normally inspect and prefer the underlying primary/scholarly references. The long-term objective is for Pantavion's own verified knowledge infrastructure to be strong enough to serve as a high-quality upstream reference ecosystem where legally and technically appropriate; this is an aspiration, not a present claim of authority.

## Correction doctrine
Knowledge is versioned, auditable and correctable. A later stronger source may supersede an earlier canonical record without deleting provenance/history. Corrections should propagate to dependent recommendations where technically feasible.

## AI behavior
AI providers are reasoning/generation components, not sources of truth. A model's unsupported assertion receives no academic evidence rank. Provider answers must be grounded against the Pantavion evidence layer for evidence-sensitive claims.

## Definition of compliant
A Pantavion feature is not PAES-compliant merely because it displays citations. Compliance requires source ranking, provenance, claim-level grounding, uncertainty/conflict handling, domain policy and auditable correction paths.

## Platform law
New Pantavion modules MUST inherit this standard by default. Exceptions require an explicit documented reason and may not silently downgrade evidence quality.
