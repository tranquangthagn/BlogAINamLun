# Automation Traceability And Light Controls Design

**Date:** 2026-03-25
**Project:** BlogAINamLun
**Status:** Approved in-session

## Goal

Upgrade the automation experience so the owner can:

- see which trend signals influenced each generated candidate
- lightly steer generation quality without editing raw prompts
- keep the existing preview, post-now, and scheduler flow intact

## Product Intent

The current automation pipeline is now real, but it still hides too much of its reasoning from the owner.

This phase should make the system feel more trustworthy and controllable by:

- exposing the small set of trend inputs behind each candidate
- adding simple writing controls that shape the next generation run
- keeping the UI lightweight enough for quick daily use

## Constraints

### Simplicity Constraint

The owner wants light controls, not a prompt-engineering console.

This phase should not add:

- raw prompt editing
- advanced model parameters
- heavy analytics dashboards

### Cost Constraint

The project should remain friendly to Gemini free tier usage.

This phase must avoid:

- extra live generation calls
- bloated prompts
- duplicate generation passes just for explanation

### Compatibility Constraint

The new controls and preview metadata should fit into the current API and settings flow without forcing a large frontend rewrite.

## Approved Direction

### Add Traceability And Light Generation Controls

The automation experience should gain two user-facing capabilities:

1. traceability for each generated candidate
2. lightweight control over writing tone and focus

The backend should keep generating content through the same pipeline, but it should return enough metadata for the frontend to explain what happened.

## Why This Direction

### Why Not Add Only Traceability

Showing trend signals would improve trust, but the owner would still have no simple way to nudge the style of the generated post.

### Why Not Add Full Prompt Editing

That would create unnecessary complexity, encourage brittle prompt tweaks, and make the settings UI feel heavier than the product needs right now.

The approved middle ground is to expose intent, not internals.

## Experience Overview

The owner should be able to:

- open `Settings`
- choose a writing tone
- type one short instruction for the next run
- generate preview candidates
- inspect the trend signals that influenced each candidate
- decide whether to post now or adjust settings and try again

## Writing Controls

The settings model should gain two new fields:

- `tone`
- `focusPrompt`

### Tone

`tone` should be a small preset-like field that keeps generation simple and consistent.

Example direction:

- `thuc_dung`
- `gan_gui`
- `bat_trend`
- `trung_tinh`

The exact labels shown in the UI can stay human-friendly Vietnamese, while the backend stores a stable internal value.

### Focus Prompt

`focusPrompt` should be a short free-text hint from the owner.

It is intended for light steering such as:

- emphasize practical takeaways
- write for beginners
- keep the hook softer

This field should remain optional. If it is empty, generation should proceed normally.

## Traceability Model

Each generated preview should return an `insights` collection derived from the trend signals actually passed into Gemini.

Recommended shape for each item:

```python
class PreviewInsight(BaseModel):
    title: str
    summary: str | None
    url: str | None
    score: float
    published_at: datetime | None
```

This should not expose raw prompt text. It should only expose the source signals in a compact, user-meaningful form.

## Backend Design

### Settings Contract

`AutomationSettingsPayload` and `AutomationSettingsResponse` should be extended with:

- `tone`
- `focusPrompt`

The persistence layer should store these values with the automation settings row so they apply consistently across:

- preview
- post-now
- scheduler runs

### Prompt Builder

`automation_prompts.py` should include `tone` and `focusPrompt` in the prompt in a short and token-conscious way.

The prompt should:

- keep the current structured JSON output contract
- add a brief tone instruction
- add a short optional focus hint
- continue to embed only a small number of top trend signals

### Candidate Shaping

Generated preview responses should include:

- the existing candidate content
- diagnostics already supported by the generation pipeline
- compact `insights` copied from the selected trend signals

This keeps traceability aligned with the actual model input.

### Scheduler Consistency

Scheduled generation and manual actions must continue to use the same stored settings, including:

- `tone`
- `focusPrompt`

That preserves consistency between what the owner previews and what the scheduler later publishes.

## API Surface

The following routes should remain the core workflow:

- `GET /api/automation/settings`
- `PUT /api/automation/settings`
- `GET /api/automation/history`
- `POST /api/automation/preview`
- `POST /api/automation/post-now`

The contract should be extended in a backward-compatible way:

- settings responses include the new light-control fields
- preview responses include `insights`

No route restructuring is needed.

## Frontend Design

### Settings Controls

The `Settings` page should gain a lightweight card for writing direction.

It should include:

- tone selection using compact pills, tags, or segmented options
- a short text area for `focusPrompt`

The card should feel like a small extension of the existing control surface, not a new advanced panel.

### Preview Traceability

Each preview candidate should show a small block such as:

- `AI dang dua tren`
- 1 to 3 compact trend signal items

Each item may include:

- headline
- short summary when available
- optional source link
- optional freshness cue if the publish time exists

The layout should remain readable on both desktop and mobile.

## Error Handling

The system should degrade gracefully when traceability data is partial.

Examples:

- if a signal has no summary, the UI still renders the title cleanly
- if a signal has no URL, the UI omits the source link
- if focus prompt is empty, no warning is needed

The feature should never block generation purely because metadata is incomplete.

## Persistence Expectations

This phase may require a small schema update for automation settings so `tone` and `focusPrompt` are stored durably.

Existing history storage can remain unchanged unless adding insight persistence becomes clearly necessary.

For this phase, keeping `insights` as generation-time response metadata is sufficient.

## Testing Strategy

The test plan should cover:

- backend schema and prompt tests for `tone` and `focusPrompt`
- backend service tests confirming preview responses include `insights`
- API tests for backward-compatible settings and preview payloads
- frontend tests for the new light-control card
- frontend tests for preview traceability rendering with and without optional fields

Tests should remain stubbed by default and should not introduce additional live Gemini usage.

## Rollout Sequence

Recommended order:

1. extend automation settings schema and API contract
2. update prompt construction with light controls
3. attach preview insights to generated candidates
4. add settings UI for tone and focus prompt
5. render traceability blocks in preview cards
6. verify preview, post-now, and scheduler still use the same stored settings

## Success Criteria

This design is successful when:

- the owner can choose a simple tone and focus hint in `Settings`
- preview candidates show which trend signals influenced them
- generation stays lightweight and free-tier-friendly
- manual and scheduled generation both honor the same stored controls
- the UI feels more trustworthy without becoming a prompt editor
