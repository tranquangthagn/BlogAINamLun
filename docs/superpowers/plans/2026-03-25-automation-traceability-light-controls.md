# Automation Traceability And Light Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight generation controls and preview traceability so automation settings can steer tone and focus while previews show which trend signals influenced the generated candidate.

**Architecture:** Extend the existing automation settings contract with `tone` and `focusPrompt`, thread those values through prompt construction, and enrich generated candidates with compact `insights` derived from the selected trend signals. Preserve the current automation routes and scheduler flow, then surface the new settings and insight blocks in the Settings page with minimal layout changes.

**Tech Stack:** FastAPI, SQLAlchemy, Pydantic, React, TypeScript, Ant Design, Node test runner, pytest

---

### Task 1: Extend Backend Settings And Preview Schemas

**Files:**
- Modify: `backend/app/models/automation_settings.py`
- Modify: `backend/app/schemas/automation.py`
- Modify: `backend/app/schemas/automation_generation.py`
- Modify: `backend/app/services/automation.py`
- Test: `backend/tests/api/test_automation_api.py`
- Test: `backend/tests/services/test_automation_service.py`
- Test: `backend/tests/conftest.py`

- [ ] **Step 1: Write failing API and service tests for tone, focusPrompt, and insights**

Add assertions that:
- `PUT /api/automation/settings` persists `tone` and `focusPrompt`
- `GET /api/automation/settings` returns defaults for the new fields
- preview candidates include an `insights` list

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `.\.venv\Scripts\python.exe -m pytest tests/api/test_automation_api.py tests/services/test_automation_service.py -q`
Expected: FAIL because the current schemas and service responses do not include the new fields.

- [ ] **Step 3: Implement the minimal backend schema changes**

Update the SQLAlchemy model, Pydantic schemas, and automation service defaults/serialization so:
- settings include `tone` and `focusPrompt`
- generated candidates can carry `insights`
- preview responses serialize the enriched candidate shape

- [ ] **Step 4: Re-run the targeted backend tests**

Run: `.\.venv\Scripts\python.exe -m pytest tests/api/test_automation_api.py tests/services/test_automation_service.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/automation_settings.py backend/app/schemas/automation.py backend/app/schemas/automation_generation.py backend/app/services/automation.py backend/tests/api/test_automation_api.py backend/tests/services/test_automation_service.py backend/tests/conftest.py
git commit -m "feat: add automation traceability schema"
```

### Task 2: Add Prompt Steering And Insight Mapping

**Files:**
- Modify: `backend/app/services/automation_prompts.py`
- Modify: `backend/app/services/automation_gemini.py`
- Modify: `backend/app/services/automation.py`
- Test: `backend/tests/services/test_automation_prompts.py`
- Test: `backend/tests/services/test_automation_gemini.py`
- Test: `backend/tests/services/test_automation_service.py`

- [ ] **Step 1: Write failing tests for prompt steering and preview insights**

Add tests that verify:
- the generated prompt includes the selected tone and optional focus prompt
- generated candidates carry insight objects copied from the trend signals passed into generation
- empty focus prompt stays optional

- [ ] **Step 2: Run the targeted backend tests to verify they fail**

Run: `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_prompts.py tests/services/test_automation_gemini.py tests/services/test_automation_service.py -q`
Expected: FAIL because prompt construction and candidate shaping do not yet support those behaviors.

- [ ] **Step 3: Implement the minimal generation changes**

Update prompt construction and generation shaping so:
- tone and focus prompt are included in the prompt
- insight metadata is copied from the selected trend signals
- all generation paths still use the same orchestration service

- [ ] **Step 4: Re-run the targeted backend tests**

Run: `.\.venv\Scripts\python.exe -m pytest tests/services/test_automation_prompts.py tests/services/test_automation_gemini.py tests/services/test_automation_service.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/automation_prompts.py backend/app/services/automation_gemini.py backend/app/services/automation.py backend/tests/services/test_automation_prompts.py backend/tests/services/test_automation_gemini.py backend/tests/services/test_automation_service.py
git commit -m "feat: add automation prompt steering"
```

### Task 3: Add Frontend Light Controls And Preview Traceability

**Files:**
- Modify: `frontend/src/data/automationSettings.ts`
- Modify: `frontend/src/pages/Settings.tsx`
- Modify: `frontend/src/App.css`
- Test: `frontend/tests/settings-layout.test.mjs`
- Test: `frontend/tests/frontend-hardening.test.mjs`

- [ ] **Step 1: Write failing frontend tests for new controls and insight rendering**

Add assertions that:
- settings data supports `tone` and `focusPrompt`
- the Settings page includes a light-control card
- preview cards render an “AI dang dua tren” section for insight items

- [ ] **Step 2: Run the targeted frontend tests to verify they fail**

Run: `npm test -- settings-layout.test.mjs frontend-hardening.test.mjs`
Expected: FAIL because the UI and frontend settings types do not yet include these controls or insight blocks.

- [ ] **Step 3: Implement the minimal frontend changes**

Update the Settings data types and page so:
- users can choose a tone
- users can edit a short focus prompt
- preview candidates render compact insight blocks with optional summary and links

- [ ] **Step 4: Re-run the targeted frontend tests**

Run: `npm test -- settings-layout.test.mjs frontend-hardening.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/automationSettings.ts frontend/src/pages/Settings.tsx frontend/src/App.css frontend/tests/settings-layout.test.mjs frontend/tests/frontend-hardening.test.mjs
git commit -m "feat: add automation light controls ui"
```

### Task 4: Run Full Verification

**Files:**
- Verify only: `backend/tests/...`
- Verify only: `frontend/tests/...`

- [ ] **Step 1: Run backend test suite**

Run: `.\.venv\Scripts\python.exe -m pytest tests -q`
Expected: PASS

- [ ] **Step 2: Run frontend test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run frontend production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Summarize outcomes and remaining risks**

Report:
- which contracts changed
- verification results
- any remaining warnings such as third-party build noise
