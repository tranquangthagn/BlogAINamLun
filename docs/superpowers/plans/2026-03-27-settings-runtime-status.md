# Settings Runtime Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Settings page show a clear in-progress AI runtime state so stale quota warnings do not mislead the user while preview/post-now requests are running.

**Architecture:** Keep the fix fully inside the existing Settings page state machine. Add one explicit in-flight runtime tone and set it immediately before long-running automation actions, then preserve the existing success/error transitions after each request completes.

**Tech Stack:** React, TypeScript, existing node:test frontend text-based tests

---

### Task 1: Cover the Runtime Status UX

**Files:**
- Modify: `frontend/tests/settings-ui.test.mjs`
- Test: `frontend/tests/settings-ui.test.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions that `Settings.tsx` defines a working runtime tone plus temporary statuses for preview and post-now requests.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- settings-ui.test.mjs`
Expected: FAIL because `Settings.tsx` does not yet contain the new in-flight status copy/state.

- [ ] **Step 3: Write minimal implementation**

Update `frontend/src/pages/Settings.tsx` to:
- extend runtime status tone values with a processing state
- define helper status objects for preview/post-now in progress
- set those statuses before awaiting the long-running requests

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- settings-ui.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Settings.tsx frontend/tests/settings-ui.test.mjs docs/superpowers/plans/2026-03-27-settings-runtime-status.md
git commit -m "fix: clarify settings runtime status during ai requests"
```

### Task 2: Verify Broader Frontend Safety

**Files:**
- Modify: `frontend/src/pages/Settings.tsx`
- Test: `frontend/tests/*.test.mjs`

- [ ] **Step 1: Run the full frontend test suite**

Run: `npm test`
Expected: PASS with all frontend tests green.

- [ ] **Step 2: Review the runtime card copy**

Check that the new messages still read naturally in Vietnamese and still fit the existing UI card.

- [ ] **Step 3: Stop if anything else changed**

Do not alter backend behavior, API mapping, or scheduler logic as part of this UX-only fix.
