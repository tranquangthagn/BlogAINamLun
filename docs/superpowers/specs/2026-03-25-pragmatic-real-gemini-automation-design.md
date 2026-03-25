# Pragmatic Real Gemini Automation Design

**Date:** 2026-03-25
**Project:** BlogAINamLun
**Status:** Approved in-session

## Goal

Upgrade BlogAINamLun automation from a rule-based mock flow to a real end-to-end pipeline that:

- gathers real trend signals from pragmatic sources
- uses Gemini to generate actual post content
- preserves the current preview, post-now, history, and scheduler flows
- stays inexpensive enough to run on Gemini API free tier first
- keeps a clean upgrade path to future platform-native trend providers

## Product Intent

This phase should make the automation feature feel truly alive without forcing the project into production-scale complexity too early.

The result should:

- feel real to the owner
- produce better preview candidates than the current template system
- keep control centered in the existing `Settings` page
- preserve backend durability and scheduler support
- avoid architecture choices that would block a later move to native TikTok, Facebook, Instagram, Shopee, or Threads integrations

## Constraints

### Cost Constraint

The owner does not want to spend much money.

Therefore the first implementation must be designed around:

- Gemini API free tier assumptions
- low request frequency
- conservative token usage
- graceful handling of quota exhaustion

### Security Constraint

Secrets must never be hardcoded in the repository.

Gemini access must use environment-driven configuration such as:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`

### Upgrade Constraint

This phase must not hardwire the automation logic to one temporary trend source. The system should support replacing pragmatic sources with platform-native providers later without rewriting the whole automation flow.

## Approved Direction

### Build A Modular Provider Pipeline

The backend automation domain should be split into four responsibilities:

1. trend retrieval
2. trend normalization
3. Gemini-based content generation
4. publication orchestration

`AutomationService` should remain the workflow entry point, but it should stop owning all generation logic directly.

Instead, it should orchestrate a pipeline built from focused collaborators.

## Why This Direction

### Why Not Keep Everything Inside `AutomationService`

That would be the fastest implementation in the short term, but it would entangle:

- source retrieval
- prompt logic
- Gemini calling
- duplicate prevention
- publishing

This would make a later move to native platform integrations painful.

### Why Not Build A Full Worker/Queue Architecture Now

That would be too heavy for the current single-owner product. The in-process scheduler and modular monolith backend are still the right foundation for this phase.

## Architecture Overview

The backend remains a modular monolith, but the automation module should grow these internal boundaries:

- `trend providers`
  - fetch raw signals from pragmatic real sources
- `trend normalization`
  - convert raw source items into one consistent internal shape
- `content generator`
  - build prompts and call Gemini
- `automation orchestration`
  - existing service logic that handles settings, preview, history, scheduler, and publishing

The frontend should continue using the current API surface as much as possible:

- `GET /api/automation/settings`
- `PUT /api/automation/settings`
- `GET /api/automation/history`
- `POST /api/automation/preview`
- `POST /api/automation/post-now`

This keeps the current settings UI stable while backend behavior becomes real.

## Trend Strategy

### Definition Of “Pragmatic Real”

For this phase, “real” means the automation uses real external signals, but does not yet depend on official native APIs for every social network.

Approved source strategy:

- use Google Trends where practical as a primary trend signal source
- use RSS/news/web feeds as supporting fallback sources
- normalize these real signals into the existing source vocabulary in the product

This means a user can still choose:

- Facebook
- TikTok
- Instagram
- Shopee
- Threads

But in this phase the backend may interpret those selections as source preferences and category hints rather than guaranteed direct native ingestion from those exact platforms.

### Source Mapping Intent

Example direction:

- `tiktok` and `threads` may bias toward fast-moving social or creator-style trend signals
- `shopee` may bias toward shopping, product, or consumer trend signals
- `instagram` may bias toward visual lifestyle, beauty, or fashion trend signals

The mapping should be explicit and replaceable later.

## Internal Trend Shape

All providers should normalize into one shared backend shape similar to:

```python
class TrendSignal(BaseModel):
    source: str
    title: str
    summary: str | None
    url: str | None
    category_hint: str | None
    published_at: datetime | None
    score: float
```

This is the key abstraction that enables future platform-native upgrades. Future providers should only need to produce `TrendSignal` objects.

## Gemini Generation Strategy

### Provider Choice

This phase should use Gemini as the AI writer.

### Model Strategy

Default behavior should prefer a Flash-class Gemini model to control cost and latency.

Expected configuration shape:

- `GEMINI_MODEL=gemini-2.5-flash`

The exact default can remain configurable, but the implementation should assume:

- fast model first
- stronger model optional later

### Prompt Design

Prompting should be short, structured, and token-conscious.

The prompt should include:

- selected trend signals
- chosen product source label
- chosen trend time range
- style expectations for BlogAINamLun
- output contract for title and body
- guardrails to avoid repetitive content

The prompt should avoid:

- large copied articles
- long raw feed dumps
- oversized history windows

### Output Contract

Gemini should return structured data that can be converted into current preview responses:

- title
- content
- category
- source
- topic fingerprint or reasoning tag if useful

The backend should validate and sanitize the response before it reaches API consumers.

## Cost Control Strategy

This phase must be intentionally quota-aware.

Approved cost controls:

- only call Gemini for:
  - preview generation
  - post-now
  - scheduler runs that are actually due
- keep preview candidate count small
- cache or reuse fresh trend results briefly when appropriate
- send only a limited number of top trend signals into each prompt
- keep prompt and response schema compact
- fail softly when quota is exhausted

### Quota Failure Behavior

If Gemini returns quota or rate-limit errors:

- the API should return a clear, user-friendly backend error
- the app should not crash
- optional fallback to the current lightweight rule-based generator is acceptable if it is clearly treated as a backup path

This fallback is useful because the project values reliability and low cost.

## Backend Module Design

Recommended file direction:

- `backend/app/services/automation.py`
  - orchestration only
- `backend/app/services/automation_trends.py`
  - provider registry and trend retrieval coordination
- `backend/app/services/automation_gemini.py`
  - Gemini client wrapper and generation logic
- `backend/app/services/automation_prompts.py`
  - prompt building and response shaping

This split should stay focused. Each file should have one reason to change.

## Configuration

Recommended new settings:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AUTOMATION_PROVIDER_MODE`
- optional provider-specific source toggles or feed URLs if needed

Recommended defaults:

- `AUTOMATION_PROVIDER_MODE=pragmatic_real`
- `GEMINI_MODEL` set to a Flash-class model

These should be added to:

- backend environment config
- `.env.example`
- any local runbook or setup docs created in this phase

## API Surface

The backend should preserve the existing route structure, but response content becomes AI-generated from real trend signals.

Small response extensions are acceptable if high-value and backward-compatible, for example:

- trend metadata for previews
- generation source detail

However, this phase should avoid a large frontend contract rewrite.

## Scheduler Behavior

The scheduler should remain in-process and continue to trigger:

- preview generation only when due
- posting when due and automation is enabled

The scheduler must use the same real pipeline as manual actions, not a separate mock path.

That keeps automation behavior consistent between:

- `preview`
- `post now`
- scheduled posting

## Error Handling

The backend should handle these failure classes cleanly:

- no usable trend signals found
- provider fetch failure
- Gemini quota/rate-limit failure
- malformed Gemini output
- database persistence errors

The preferred behavior is:

- fail with a clear reason
- preserve the current saved settings
- avoid partially-written automation history rows when generation fails before a valid candidate exists

## Persistence Expectations

Existing tables are sufficient for this phase unless small additions become clearly necessary.

The current `automation_history` table can still store:

- generated title
- generated content
- source
- topic key
- category
- created timestamp
- posted state
- linked post id

If the implementation benefits from storing extra diagnostic metadata, it should only add schema changes if the value is clear and durable.

## Testing Strategy

The testing approach should cover:

- unit tests for trend normalization
- unit tests for prompt construction
- unit tests for duplicate prevention with real-signal inputs
- unit tests for Gemini response shaping and fallback behavior
- API tests for preview and post-now routes
- scheduler flow tests using the new pipeline

Tests should avoid live external calls by default. Real network integrations should be wrapped so they can be stubbed in tests.

## Rollout Strategy

Recommended implementation sequence:

1. add config and Gemini client wrapper
2. add pragmatic trend providers and normalized trend shape
3. wire preview generation through real trend + Gemini
4. wire post-now and scheduler through the same path
5. add graceful fallback and quota-aware handling
6. keep frontend changes minimal and focused on status/error display if needed

## Future Upgrade Path

This design is successful only if it preserves a clean path to platform-native real sources later.

That future upgrade should be able to happen by:

- adding new provider implementations
- updating provider selection rules
- leaving the rest of the automation orchestration intact

The architecture should make `pragmatic_real` a stepping stone, not a dead end.

## Success Criteria

This design is successful when:

- preview generation uses real external signals
- generated content comes from Gemini rather than hardcoded templates
- manual posting and scheduled posting both use the same real pipeline
- free-tier-aware safeguards keep costs low
- the app remains stable under quota or provider failures
- future migration to platform-native real providers remains straightforward
