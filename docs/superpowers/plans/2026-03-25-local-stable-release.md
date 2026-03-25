# Local Stable Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BlogAINamLun reliable to boot, verify, and operate on local by standardizing smoke checks, migration flow, and local operator docs.

**Architecture:** Extend the existing PowerShell helpers rather than inventing a separate local toolchain. Keep `mysql-sandbox.ps1` as the database entry point, strengthen `backend-dev.ps1` with a real smoke path, add one top-level local stability script that orchestrates backend and frontend verification, and document the whole flow in a short runbook.

**Tech Stack:** PowerShell, FastAPI, Uvicorn, Alembic, MySQL sandbox, Node/Vite, pytest

---

### Task 1: Add Local-Stable Tooling Expectations Tests

**Files:**
- Modify: `frontend/tests/repo-hygiene.test.mjs`

- [ ] **Step 1: Write failing repo-hygiene assertions**

Add assertions that:
- `scripts/backend-dev.ps1` includes a `smoke` action
- a top-level local stable script exists
- a local runbook exists

- [ ] **Step 2: Run the repo hygiene test to verify it fails**

Run: `node --test tests/repo-hygiene.test.mjs`
Expected: FAIL because the new action/script/doc do not exist yet.

- [ ] **Step 3: Keep the failing test in place**

Do not implement the tooling yet. Move to the next task with the red state established.

### Task 2: Extend Backend Helper With A Real Smoke Action

**Files:**
- Modify: `scripts/backend-dev.ps1`

- [ ] **Step 1: Implement support for local smoke verification**

Add:
- `smoke` to the action validate set
- optional database URL override behavior suitable for sandbox use
- health polling for `/health` and `/health/ready`
- route checks for `/api/automation/settings`
- optional preview execution only when explicitly requested and Gemini is configured

- [ ] **Step 2: Keep failure messages explicit**

Ensure the script clearly reports:
- missing Python
- missing Gemini config when preview smoke is requested
- backend not becoming healthy in time

### Task 3: Add A Top-Level Local Stability Check Script

**Files:**
- Create: `scripts/local-stable.ps1`

- [ ] **Step 1: Implement one orchestration script for local confidence**

The script should:
- optionally start MySQL sandbox
- run backend doctor
- run backend tests
- run backend migrate
- run backend smoke
- run frontend tests
- run frontend build

- [ ] **Step 2: Keep the script conservative**

Default to:
- no live Gemini preview unless explicitly requested
- local MySQL sandbox port 3307
- fail fast on the first important error

### Task 4: Add A Short Local Runbook

**Files:**
- Create: `LOCAL-STABLE.md`

- [ ] **Step 1: Document the exact local operator flow**

Include:
- prerequisites
- startup commands
- smoke commands
- optional live Gemini preview flow
- what success looks like

- [ ] **Step 2: Keep the runbook practical**

Prefer concrete commands over long explanation.

### Task 5: Turn The Repo-Hygiene Test Green

**Files:**
- Modify: `frontend/tests/repo-hygiene.test.mjs`
- Verify: `scripts/backend-dev.ps1`
- Verify: `scripts/local-stable.ps1`
- Verify: `LOCAL-STABLE.md`

- [ ] **Step 1: Re-run the repo-hygiene test**

Run: `node --test tests/repo-hygiene.test.mjs`
Expected: PASS

### Task 6: Run Full Local-Stable Verification

**Files:**
- Verify only

- [ ] **Step 1: Run backend tests**

Run: `.\.venv\Scripts\python.exe -m pytest tests -q`
Expected: PASS

- [ ] **Step 2: Run frontend tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run frontend build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Run scripted local stable check**

Run: `powershell -ExecutionPolicy Bypass -File scripts/local-stable.ps1`
Expected: PASS through sandbox start, migrate, smoke, frontend tests, and build.

- [ ] **Step 5: Optionally run one live preview smoke**

Run only if `GEMINI_API_KEY` is configured:

`powershell -ExecutionPolicy Bypass -File scripts/local-stable.ps1 -WithGeminiPreview`

Expected: one controlled preview succeeds.

- [ ] **Step 6: Summarize results and remaining gaps**

Report:
- which scripts were added
- which commands now define the local-stable workflow
- any remaining third-party warnings that do not block local use
