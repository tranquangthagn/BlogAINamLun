# Source Batch Three Posts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current single-candidate automation flow into a local-stable per-source batch pipeline that generates and publishes three category posts (`fashion`, `health`, `tips`) with Vietnamese diacritics and source-backed images.

**Architecture:** Extend automation into three focused layers: a batch planner that expands selected sources into `source x category` jobs, category-aware trend and image providers that keep each job narrow and audience-specific, and a publish-as-ready background runner that processes jobs gradually instead of generating everything in one synchronous burst. Keep feed/history item-based for compatibility, but add enough batch metadata for traceability and UI progress.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, APScheduler, Gemini (`google-genai`), httpx, React, TypeScript, Ant Design, Node test runner, pytest.

---

## File Structure

### Backend files to modify

- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\core\scheduler.py`
  - Integrate the new background job runner into scheduler ticks.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\models\automation_history.py`
  - Persist batch metadata and per-job status details.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\schemas\automation.py`
  - Evolve preview/post-now contracts from single-item to batch-oriented responses.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\schemas\automation_generation.py`
  - Add category job and batch-oriented generation schemas, plus image fields.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation.py`
  - Replace single-candidate orchestration with batch planning, queueing, and item publishing.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_prompts.py`
  - Request Vietnamese with diacritics and encode the young-women persona.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_gemini.py`
  - Generate category-aware posts with image-aware diagnostics.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_trends.py`
  - Add category-aware trend selection and audience-aware query hints.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\posts.py`
  - Ensure published automation posts can persist image URLs cleanly.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\api\routes\automation.py`
  - Return batch receipts and grouped preview responses.

### Backend files to create

- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_batch.py`
  - Batch planner for `source x category` job creation and queue receipts.
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_images.py`
  - Source-backed image provider and fallback selection logic.
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_runner.py`
  - Sequential or low-concurrency background job runner that publishes as ready.
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\alembic\versions\20260325_02_add_automation_batch_metadata.py`
  - Migration for batch/status/image-related persistence.

### Frontend files to modify

- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\api\automation.ts`
  - Consume batch-shaped preview and post-now responses.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\data\automationSettings.ts`
  - Add batch preview types, item status, and images for generated posts.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\pages\Settings.tsx`
  - Render grouped preview by source/category and explain `3 posts per source`.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\App.css`
  - Style grouped batch previews and progress states.

### Tests to modify or create

- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\api\test_automation_api.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_prompts.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_trends.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_service.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\test_scheduler_flow.py`
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_batch.py`
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_images.py`
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_runner.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\backend-api-contract.test.mjs`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\settings-layout.test.mjs`
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\automation-batch-ui.test.mjs`

### Documentation to update

- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\LOCAL-STABLE.md`
  - Document batch behavior and verification path.
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\scripts\backend-dev.ps1`
  - Add optional smoke support for queued batch verification if needed.

---

### Task 1: Lock The New Backend Contracts

**Files:**
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\schemas\automation.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\schemas\automation_generation.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\api\test_automation_api.py`

- [ ] **Step 1: Write the failing API/schema tests**

Add tests that expect:

- preview responses to return a `batchId` and `items`
- each item to expose `source`, `category`, `images`, `status`, and `insights`
- post-now to return a batch receipt with `batchId`, `queuedCount`, and `mode`

- [ ] **Step 2: Run the targeted backend tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\api\test_automation_api.py -q`

Expected: FAIL because current API still returns single-item preview/post-now responses.

- [ ] **Step 3: Implement the minimal schema changes**

Define batch-oriented response models and keep backward compatibility only where needed internally.

- [ ] **Step 4: Run the targeted backend tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\api\test_automation_api.py -q`

Expected: PASS for the new contract cases.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/schemas/automation.py backend/app/schemas/automation_generation.py backend/tests/api/test_automation_api.py
git commit -m "feat: add automation batch response contracts"
```

### Task 2: Add Category-Aware Batch Planning

**Files:**
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_batch.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_batch.py`

- [ ] **Step 1: Write the failing batch planner tests**

Add tests that prove:

- each selected source expands into exactly 3 jobs
- jobs map to `fashion`, `health`, and `tips`
- batch ids are stable within one planned batch
- audience metadata defaults to `18-25` with `18-29` fallback mode available

- [ ] **Step 2: Run the new planner tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_batch.py -q`

Expected: FAIL because no batch planner exists yet.

- [ ] **Step 3: Implement the minimal planner**

Create a focused batch planner module that transforms settings into `source x category` jobs with a shared batch id.

- [ ] **Step 4: Run the planner tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_batch.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/services/automation_batch.py backend/app/services/automation.py backend/tests/services/test_automation_batch.py
git commit -m "feat: add per-source automation batch planner"
```

### Task 3: Make Trend Selection Category And Persona Aware

**Files:**
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_trends.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_trends.py`

- [ ] **Step 1: Write the failing trend-selection tests**

Add tests that prove:

- `fashion` queries prefer fashion/beauty/style hints
- `health` queries prefer wellness/self-care/habit hints
- `tips` queries prefer practical life-hack/shopping/organization hints
- fallback audience widening to under 30 only happens when the primary signal set is sparse

- [ ] **Step 2: Run the trend tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_trends.py -q`

Expected: FAIL because queries and scoring are not category-aware yet.

- [ ] **Step 3: Implement focused trend scoring and query hints**

Keep the provider pragmatic-real, but enrich the request context with category and audience cues, and prefer the best signal per category.

- [ ] **Step 4: Run the trend tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_trends.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/services/automation_trends.py backend/tests/services/test_automation_trends.py
git commit -m "feat: add category-aware trend selection"
```

### Task 4: Add Source-Backed Image Resolution

**Files:**
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_images.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_images.py`

- [ ] **Step 1: Write the failing image-provider tests**

Add tests that prove:

- category jobs resolve 1-3 image URLs
- provider prefers signal-native thumbnails when present
- provider falls back to source/category/topic-based image queries when thumbnails are missing
- image output format matches `Post.images`

- [ ] **Step 2: Run the image-provider tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_images.py -q`

Expected: FAIL because image provider does not exist yet.

- [ ] **Step 3: Implement the minimal image provider**

Keep the implementation small and source-backed; no AI image generation.

- [ ] **Step 4: Run the image-provider tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_images.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/services/automation_images.py backend/app/services/automation.py backend/tests/services/test_automation_images.py
git commit -m "feat: add source-backed automation images"
```

### Task 5: Switch Gemini Prompts To Vietnamese With Diacritics And Persona Tone

**Files:**
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_prompts.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_gemini.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_prompts.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_service.py`

- [ ] **Step 1: Write the failing prompt tests**

Add tests that expect:

- prompts to request Vietnamese with diacritics
- prompts to encode the cute, approachable young-women persona
- prompts to stay narrow to one category job

- [ ] **Step 2: Run the prompt tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_prompts.py tests\services\test_automation_service.py -q`

Expected: FAIL because prompt text still requests Vietnamese without diacritics and single-item behavior.

- [ ] **Step 3: Implement the prompt and generator adjustments**

Update prompt wording, diagnostics, and parsing expectations so outputs are category-specific and readable in Vietnamese with diacritics.

- [ ] **Step 4: Run the prompt tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_prompts.py tests\services\test_automation_service.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/services/automation_prompts.py backend/app/services/automation_gemini.py backend/tests/services/test_automation_prompts.py backend/tests/services/test_automation_service.py
git commit -m "feat: refine automation prompts for vietnamese batch posts"
```

### Task 6: Add Publish-As-Ready Background Runner

**Files:**
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation_runner.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\core\scheduler.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\automation.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_runner.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\test_scheduler_flow.py`

- [ ] **Step 1: Write the failing runner tests**

Add tests that prove:

- queued jobs are processed sequentially or with minimal concurrency
- a completed job publishes immediately
- a failed job does not cancel remaining jobs
- scheduler enqueues work instead of trying to finish the entire source batch inline

- [ ] **Step 2: Run the runner tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_runner.py tests\test_scheduler_flow.py -q`

Expected: FAIL because no runner or queue receipt exists yet.

- [ ] **Step 3: Implement the minimal background runner**

Keep it local-first and in-process; no production queue infrastructure.

- [ ] **Step 4: Run the runner tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\services\test_automation_runner.py tests\test_scheduler_flow.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/app/services/automation_runner.py backend/app/core/scheduler.py backend/app/services/automation.py backend/tests/services/test_automation_runner.py backend/tests/test_scheduler_flow.py
git commit -m "feat: add publish-as-ready automation runner"
```

### Task 7: Persist Batch Metadata And Images

**Files:**
- Create: `C:\Users\thang\MyProjects\BlogAINamLun\backend\alembic\versions\20260325_02_add_automation_batch_metadata.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\models\automation_history.py`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\backend\app\services\posts.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\test_schema_bootstrap.py`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\backend\tests\services\test_automation_service.py`

- [ ] **Step 1: Write the failing persistence tests**

Add tests that prove:

- automation history stores batch id and job status
- published posts persist image URLs
- migration bootstrap reflects the new schema

- [ ] **Step 2: Run the persistence tests to verify failure**

Run: `.\.venv\Scripts\python.exe -m pytest tests\test_schema_bootstrap.py tests\services\test_automation_service.py -q`

Expected: FAIL because current schema lacks batch metadata/image persistence for automation items.

- [ ] **Step 3: Implement the migration and model updates**

Update models, persistence logic, and post serialization.

- [ ] **Step 4: Run the persistence tests to verify pass**

Run: `.\.venv\Scripts\python.exe -m pytest tests\test_schema_bootstrap.py tests\services\test_automation_service.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/alembic/versions/20260325_02_add_automation_batch_metadata.py backend/app/models/automation_history.py backend/app/services/posts.py backend/tests/test_schema_bootstrap.py backend/tests/services/test_automation_service.py
git commit -m "feat: persist automation batch metadata and images"
```

### Task 8: Update Frontend For Grouped Batch Preview And Receipts

**Files:**
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\api\automation.ts`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\data\automationSettings.ts`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\pages\Settings.tsx`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\src\App.css`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\automation-batch-ui.test.mjs`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\settings-layout.test.mjs`
- Test: `C:\Users\thang\MyProjects\BlogAINamLun\frontend\tests\backend-api-contract.test.mjs`

- [ ] **Step 1: Write the failing frontend tests**

Add tests that expect:

- Settings explains `3 bài / mỗi nguồn`
- preview groups items by source and category
- automation preview cards show images
- batch receipts from `post-now` are understood by the frontend API layer

- [ ] **Step 2: Run the targeted frontend tests to verify failure**

Run: `node --test tests\\automation-batch-ui.test.mjs tests\\settings-layout.test.mjs tests\\backend-api-contract.test.mjs`

Expected: FAIL because the frontend still expects single-item preview and single-post `post-now`.

- [ ] **Step 3: Implement the minimal frontend updates**

Update types, API calls, grouped preview rendering, and runtime copy.

- [ ] **Step 4: Run the targeted frontend tests to verify pass**

Run: `node --test tests\\automation-batch-ui.test.mjs tests\\settings-layout.test.mjs tests\\backend-api-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add frontend/src/api/automation.ts frontend/src/data/automationSettings.ts frontend/src/pages/Settings.tsx frontend/src/App.css frontend/tests/automation-batch-ui.test.mjs frontend/tests/settings-layout.test.mjs frontend/tests/backend-api-contract.test.mjs
git commit -m "feat: show grouped automation batches in settings"
```

### Task 9: Refresh Local Stable Tooling And Verify End-To-End

**Files:**
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\scripts\backend-dev.ps1`
- Modify: `C:\Users\thang\MyProjects\BlogAINamLun\LOCAL-STABLE.md`

- [ ] **Step 1: Write any failing smoke or hygiene tests first**

Add or extend tests that assert local docs/scripts mention batch behavior when that change is user-visible and stable.

- [ ] **Step 2: Update local scripts and docs**

Document how preview/post-now now behave for multiple sources and how to verify one controlled batch locally.

- [ ] **Step 3: Run full backend verification**

Run: `.\.venv\Scripts\python.exe -m pytest tests -q`

Expected: PASS.

- [ ] **Step 4: Run full frontend verification**

Run:

```bash
npm test
npm run build
```

Expected: PASS with only the known non-blocking Ant Design `"use client"` build warnings.

- [ ] **Step 5: Run local stable verification**

Run:

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\local-stable.ps1
```

Expected: PASS.

- [ ] **Step 6: Run one controlled live batch smoke**

Run an explicit local preview or post-now flow with one source and confirm:

- 3 category items are planned
- each item contains Vietnamese with diacritics
- each item has images
- publish happens incrementally

- [ ] **Step 7: Commit**

Run:

```bash
git add scripts/backend-dev.ps1 LOCAL-STABLE.md
git commit -m "docs: update local stable workflow for automation batches"
```
