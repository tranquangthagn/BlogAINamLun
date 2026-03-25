# Pragmatic Real Gemini Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock automation generator with a real, low-cost pipeline that fetches pragmatic trend signals, generates content through Gemini, and keeps preview, post-now, and scheduler behavior aligned.

**Architecture:** Keep `AutomationService` as the orchestration entry point, but move trend retrieval, prompt building, Gemini generation, and fallback behavior into focused collaborators. Preserve the current route contract and database tables so the frontend can keep using the same settings and preview flows while the backend becomes real.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, APScheduler, pytest, Gemini API via Python SDK, pragmatic RSS/news/Google-trend-style providers, PowerShell helper scripts

---

## File Map

### Existing files to modify

- `backend/app/core/config.py`
  - add Gemini and provider-mode settings, plus provider-specific defaults
- `backend/app/schemas/automation.py`
  - extend response models only if preview metadata or error detail needs a backward-compatible field
- `backend/app/services/automation.py`
  - reduce to orchestration, duplicate prevention, history persistence, publish flow coordination
- `backend/app/core/scheduler.py`
  - make scheduler run the same real automation pipeline and surface soft-failure reasons cleanly
- `backend/app/api/routes/automation.py`
  - preserve endpoints while mapping backend exceptions to clear API responses if needed
- `backend/tests/test_config.py`
  - verify new config defaults and env parsing
- `backend/tests/services/test_automation_service.py`
  - replace mock-template assumptions with real-pipeline orchestration tests
- `backend/tests/test_scheduler_flow.py`
  - verify scheduler uses the same generation pipeline and failure handling path
- `backend/tests/api/test_automation_api.py`
  - verify preview and post-now behavior with stubbed providers and Gemini client
- `backend/requirements.txt`
  - add the Gemini SDK and any lightweight feed parsing dependency chosen during implementation
- `scripts/backend-dev.ps1`
  - optionally add a `smoke-automation` or equivalent helper if it materially improves local verification

### New files to create

- `backend/app/schemas/automation_generation.py`
  - internal typed models for `TrendSignal`, generation request context, generated candidate payload, and fallback result metadata
- `backend/app/services/automation_trends.py`
  - provider registry, provider protocol/base class, source-preference mapping, and normalized trend retrieval
- `backend/app/services/automation_prompts.py`
  - compact prompt builder and Gemini response shaping helpers
- `backend/app/services/automation_gemini.py`
  - Gemini client wrapper, structured-response parsing, quota/rate-limit error translation, fallback trigger decisions
- `backend/tests/services/test_automation_trends.py`
  - trend normalization, provider mapping, top-signal selection, and "no usable trend" cases
- `backend/tests/services/test_automation_gemini.py`
  - prompt payload validation, Gemini response parsing, malformed output handling, quota-aware fallback decisions
- `backend/tests/services/test_automation_prompts.py`
  - prompt content budget and source/range injection checks
- `backend/.env.example`
  - document the backend runtime variables, including Gemini config, without storing secrets
- `docs/superpowers/plans/2026-03-25-pragmatic-real-gemini-automation-implementation.md`
  - this plan file

### Files intentionally left alone at first

- `frontend/src/pages/Settings.tsx`
  - keep the current UX stable unless backend errors require a small, explicit status-message follow-up
- `backend/app/models/automation_history.py`
  - only add columns if a durable metadata need appears during implementation
- `backend/app/models/automation_settings.py`
  - current persisted settings are sufficient for the first pragmatic-real phase

## Implementation Notes

- Use TDD for every backend slice: write the smallest failing test, make it pass, then refactor.
- Prefer one new responsibility per file. Do not move existing code around unless it directly improves the new boundary.
- Keep external network access behind wrappers so tests stay offline.
- Make fallback behavior explicit. A quota-limited or malformed Gemini response should not look identical to a successful AI generation path.
- Keep the default cost profile low:
  - one top source preference at a time
  - limited trend signal count per prompt
  - Flash-class Gemini model by default
  - no background generation unless a real preview/post/scheduled run is due

### Task 1: Add Gemini and Provider Configuration

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/requirements.txt`
- Create: `backend/.env.example`
- Test: `backend/tests/test_config.py`

- [ ] **Step 1: Write the failing config tests**

```python
def test_settings_default_to_pragmatic_real_gemini_flash():
    settings = Settings(database_url="sqlite+pysqlite:///:memory:")
    assert settings.automation_provider_mode == "pragmatic_real"
    assert settings.gemini_model == "gemini-2.5-flash"
    assert settings.gemini_api_key is None
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/test_config.py -v`
Expected: FAIL with missing `automation_provider_mode`, `gemini_model`, or `gemini_api_key`

- [ ] **Step 3: Add minimal settings fields and env parsing**

```python
class Settings(BaseSettings):
    automation_provider_mode: str = "pragmatic_real"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    automation_trend_cache_minutes: int = 15
```

- [ ] **Step 4: Add runtime dependency placeholders**

Implementation notes:
- add the current Gemini Python SDK package
- add only one lightweight parser helper if needed for RSS normalization
- do not add heavy scraping dependencies in this phase

- [ ] **Step 5: Create `backend/.env.example` with safe defaults**

```env
DATABASE_URL=mysql+pymysql://root:root@localhost:3307/blog_ai_nam_lun
ENABLE_SCHEDULER=true
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
AUTOMATION_PROVIDER_MODE=pragmatic_real
AUTOMATION_TREND_CACHE_MINUTES=15
```

- [ ] **Step 6: Run config tests to verify they pass**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/test_config.py -v`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/core/config.py backend/tests/test_config.py backend/requirements.txt backend/.env.example
git commit -m "feat: add Gemini automation config"
```

### Task 2: Define Internal Automation Generation Models

**Files:**
- Create: `backend/app/schemas/automation_generation.py`
- Test: `backend/tests/services/test_automation_trends.py`
- Test: `backend/tests/services/test_automation_gemini.py`

- [ ] **Step 1: Write the failing schema-focused tests**

```python
def test_trend_signal_requires_title_and_source():
    signal = TrendSignal(source="tiktok", title="Hot creator hook", score=0.9)
    assert signal.title == "Hot creator hook"
```

```python
def test_generated_candidate_carries_fallback_metadata():
    candidate = GeneratedCandidate(
        title="AI title",
        content="AI body",
        source="tiktok",
        category="general",
        topic_key="creator-hook",
        fallback_used=False,
    )
    assert candidate.fallback_used is False
```

- [ ] **Step 2: Run the schema tests to verify they fail**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_trends.py tests/services/test_automation_gemini.py -v`
Expected: FAIL because the new internal schema module does not exist

- [ ] **Step 3: Create focused internal models**

```python
class TrendSignal(BaseModel):
    source: str
    title: str
    summary: str | None = None
    url: str | None = None
    category_hint: str | None = None
    published_at: datetime | None = None
    score: float
```

Implementation notes:
- also add `TrendRequestContext`, `GeneratedCandidate`, and `GenerationDiagnostics`
- keep these internal models separate from API response models so route contracts stay stable

- [ ] **Step 4: Re-run the schema tests**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_trends.py tests/services/test_automation_gemini.py -v`
Expected: PASS for the schema-only assertions

- [ ] **Step 5: Commit**

```bash
git add backend/app/schemas/automation_generation.py backend/tests/services/test_automation_trends.py backend/tests/services/test_automation_gemini.py
git commit -m "feat: add automation generation models"
```

### Task 3: Build the Pragmatic Trend Provider Layer

**Files:**
- Create: `backend/app/services/automation_trends.py`
- Modify: `backend/app/services/automation.py`
- Test: `backend/tests/services/test_automation_trends.py`
- Test: `backend/tests/services/test_automation_service.py`

- [ ] **Step 1: Write the failing provider and normalization tests**

```python
def test_registry_maps_tiktok_to_social_style_trends():
    provider = TrendProviderRegistry().provider_for_sources(["tiktok", "threads"])
    assert provider.provider_key == "social_rss"
```

```python
def test_collect_trends_returns_normalized_signals_sorted_by_score():
    signals = coordinator.collect(
        settings_payload={"sources": ["shopee"], "trendRangeMode": "week", ...}
    )
    assert [signal.title for signal in signals] == ["Top shopping trend", "Second signal"]
```

- [ ] **Step 2: Run the trend tests to verify they fail**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_trends.py -v`
Expected: FAIL because the provider registry and coordinator do not exist

- [ ] **Step 3: Implement the smallest provider registry and normalized collection flow**

Implementation notes:
- create a provider protocol or base class with `fetch_signals(context) -> list[TrendSignal]`
- keep source-to-provider mapping explicit and replaceable
- start with deterministic, low-risk pragmatic providers such as RSS/news feed adapters or stub-friendly HTTP providers
- normalize every provider result into `TrendSignal`
- sort by score descending and trim to a small maximum before returning

- [ ] **Step 4: Add duplicate-friendly orchestration hooks to `AutomationService`**

Implementation notes:
- inject or construct the trend coordinator in `AutomationService`
- keep title-fingerprint duplicate prevention inside the service layer, not in provider code

- [ ] **Step 5: Re-run trend and service tests**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_trends.py tests/services/test_automation_service.py -v`
Expected: PASS for provider mapping and normalized trend collection tests

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/automation_trends.py backend/app/services/automation.py backend/tests/services/test_automation_trends.py backend/tests/services/test_automation_service.py
git commit -m "feat: add pragmatic automation trend providers"
```

### Task 4: Add Prompt Builder and Gemini Client Wrapper

**Files:**
- Create: `backend/app/services/automation_prompts.py`
- Create: `backend/app/services/automation_gemini.py`
- Test: `backend/tests/services/test_automation_prompts.py`
- Test: `backend/tests/services/test_automation_gemini.py`

- [ ] **Step 1: Write the failing prompt-builder and Gemini-wrapper tests**

```python
def test_prompt_builder_limits_signal_count_and_mentions_range():
    prompt = build_generation_prompt(context, signals)
    assert "7 ngay gan day" in prompt
    assert prompt.count("Trend:") <= 3
```

```python
def test_gemini_wrapper_translates_rate_limit_to_domain_error(fake_client):
    fake_client.raise_rate_limit()
    with pytest.raises(AutomationQuotaError):
        GeminiContentGenerator(fake_client).generate(context, signals)
```

- [ ] **Step 2: Run the prompt and Gemini tests to verify they fail**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_prompts.py tests/services/test_automation_gemini.py -v`
Expected: FAIL because the prompt builder and Gemini wrapper do not exist yet

- [ ] **Step 3: Implement the compact prompt builder**

Implementation notes:
- include source label, trend range label, and only the highest-value signal snippets
- request a small structured output containing `title`, `content`, `category`, and `topic_key`
- keep prompt text token-conscious and avoid dumping raw feeds

- [ ] **Step 4: Implement the Gemini wrapper with explicit error translation**

Implementation notes:
- read `gemini_api_key` and `gemini_model` from `Settings`
- if no key is configured, raise a dedicated domain error early
- convert SDK/network/rate-limit failures into backend-specific exceptions
- parse the Gemini response into `GeneratedCandidate`

- [ ] **Step 5: Re-run the prompt and Gemini tests**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_prompts.py tests/services/test_automation_gemini.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/automation_prompts.py backend/app/services/automation_gemini.py backend/tests/services/test_automation_prompts.py backend/tests/services/test_automation_gemini.py
git commit -m "feat: add Gemini automation generator"
```

### Task 5: Refactor `AutomationService` to Orchestrate Real Preview Generation

**Files:**
- Modify: `backend/app/services/automation.py`
- Modify: `backend/app/schemas/automation.py`
- Test: `backend/tests/services/test_automation_service.py`
- Test: `backend/tests/api/test_automation_api.py`

- [ ] **Step 1: Write the failing preview orchestration tests**

```python
def test_generate_preview_uses_real_pipeline_and_skips_recent_duplicate_titles(db_session, stub_trend_coordinator, stub_generator):
    service = AutomationService(db_session, trends=stub_trend_coordinator, generator=stub_generator)
    first = service.generate_preview_candidates(settings_payload=payload)
    service.record_candidates(first)
    second = service.generate_preview_candidates(settings_payload=payload)
    assert first[0].title != second[0].title
```

```python
def test_preview_returns_soft_failure_when_gemini_quota_is_exhausted(client):
    response = client.post("/api/automation/preview", json=payload)
    assert response.status_code == 503
```

- [ ] **Step 2: Run service and API tests to verify they fail**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_service.py tests/api/test_automation_api.py -v`
Expected: FAIL because preview still uses template-only generation

- [ ] **Step 3: Refactor preview generation to call the trend coordinator and Gemini wrapper**

Implementation notes:
- build a `TrendRequestContext` from saved settings or payload
- collect normalized signals
- generate one small candidate batch from Gemini
- filter recent duplicate titles before returning
- only persist when the existing code path explicitly records candidates

- [ ] **Step 4: Add explicit fallback behavior**

Implementation notes:
- if Gemini is unavailable because of quota/rate-limit/malformed output, return a clear domain error or a clearly-marked fallback candidate
- do not silently pretend an AI result succeeded
- keep the fallback path deterministic and lightweight if enabled

- [ ] **Step 5: Re-run service and API tests**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_service.py tests/api/test_automation_api.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/automation.py backend/app/schemas/automation.py backend/tests/services/test_automation_service.py backend/tests/api/test_automation_api.py
git commit -m "feat: wire real automation preview pipeline"
```

### Task 6: Reuse the Real Pipeline for Post-Now and Scheduler Runs

**Files:**
- Modify: `backend/app/services/automation.py`
- Modify: `backend/app/core/scheduler.py`
- Test: `backend/tests/test_scheduler_flow.py`
- Test: `backend/tests/services/test_automation_service.py`

- [ ] **Step 1: Write the failing post-now and scheduler tests**

```python
def test_post_now_records_ai_generated_candidate_before_publishing(db_session, stub_pipeline):
    service = AutomationService(db_session, pipeline=stub_pipeline)
    post = service.post_now_from_settings()
    assert post["sourceType"] == "automation"
```

```python
def test_scheduler_tick_returns_soft_failure_reason_on_generation_error(db_session):
    result = run_scheduler_tick(db_session)
    assert result.executed is False
    assert result.reason == "generation_failed"
```

- [ ] **Step 2: Run the scheduler-focused tests to verify they fail**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/test_scheduler_flow.py tests/services/test_automation_service.py -v`
Expected: FAIL because post-now and scheduler do not yet share an explicit real pipeline with failure reasons

- [ ] **Step 3: Refactor post-now to reuse preview generation internals**

Implementation notes:
- avoid duplicating generation logic
- ensure history is recorded before publication so later audit/history screens stay consistent
- update `last_run_at` and `last_generated_post_id` only after successful publish

- [ ] **Step 4: Refine scheduler failure behavior**

Implementation notes:
- return `not_due`, `published`, or `generation_failed`
- do not crash the scheduler loop on provider/Gemini failures
- keep session cleanup behavior unchanged

- [ ] **Step 5: Re-run the scheduler and service tests**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/test_scheduler_flow.py tests/services/test_automation_service.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/automation.py backend/app/core/scheduler.py backend/tests/test_scheduler_flow.py backend/tests/services/test_automation_service.py
git commit -m "feat: reuse real automation pipeline for scheduler"
```

### Task 7: Tighten API Behavior and Local Verification Workflow

**Files:**
- Modify: `backend/app/api/routes/automation.py`
- Modify: `scripts/backend-dev.ps1`
- Test: `backend/tests/api/test_automation_api.py`

- [ ] **Step 1: Write the failing route-behavior tests**

```python
def test_preview_returns_503_with_clear_message_when_generation_unavailable(client):
    response = client.post("/api/automation/preview", json=payload)
    assert response.status_code == 503
    assert response.json()["detail"] == "Automation generation temporarily unavailable"
```

- [ ] **Step 2: Run the API test to verify it fails**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/api/test_automation_api.py -v`
Expected: FAIL because route errors are not translated consistently yet

- [ ] **Step 3: Add route-level exception translation and optional smoke helper**

Implementation notes:
- keep the route contract stable
- only add a backend helper command if it shortens repeated verification for preview/post-now
- if `backend-dev.ps1` gains a new action, document its required env variables inline in the script help text

- [ ] **Step 4: Re-run the API test**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/api/test_automation_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/api/routes/automation.py backend/tests/api/test_automation_api.py scripts/backend-dev.ps1
git commit -m "feat: harden automation API error handling"
```

### Task 8: Verify the Whole Backend Slice and Update Runbook Notes

**Files:**
- Modify: `backend/.env.example`
- Modify: `docs/superpowers/plans/2026-03-25-pragmatic-real-gemini-automation-implementation.md`
- Optionally modify: `docs/superpowers/specs/2026-03-25-pragmatic-real-gemini-automation-design.md` only if a plan-to-spec clarification is needed

- [ ] **Step 1: Run the focused backend automation test suite**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests/test_config.py tests/services/test_automation_trends.py tests/services/test_automation_prompts.py tests/services/test_automation_gemini.py tests/services/test_automation_service.py tests/test_scheduler_flow.py tests/api/test_automation_api.py -v`
Expected: PASS

- [ ] **Step 2: Run the full backend test suite**

Run (from `backend`): `.\.venv\Scripts\python.exe -m pytest tests -q`
Expected: PASS

- [ ] **Step 3: Run a local backend doctor check**

Run: `powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 doctor`
Expected: reports a usable Python interpreter and backend environment

- [ ] **Step 4: Run a migration check**

Run: `powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 migrate`
Expected: Alembic upgrade completes against the configured database

- [ ] **Step 5: Run an application smoke check with Gemini disabled**

Run: `powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 serve`
Expected: API boots and `/health` stays healthy even if `GEMINI_API_KEY` is unset

- [ ] **Step 6: Run an application smoke check with Gemini enabled**

Run:
```powershell
$env:GEMINI_API_KEY="set-real-key-here"
$env:GEMINI_MODEL="gemini-2.5-flash"
powershell -ExecutionPolicy Bypass -File scripts/backend-dev.ps1 serve
```
Expected: `/api/automation/preview` can generate a real candidate when pragmatic providers return usable signals

- [ ] **Step 7: Update docs if verification uncovered any setup nuance**

Implementation notes:
- keep docs changes minimal and factual
- never store the real Gemini key in files, scripts, commits, or test fixtures

- [ ] **Step 8: Commit**

```bash
git add backend/.env.example scripts/backend-dev.ps1 docs/superpowers/plans/2026-03-25-pragmatic-real-gemini-automation-implementation.md
git commit -m "docs: capture Gemini automation verification flow"
```
