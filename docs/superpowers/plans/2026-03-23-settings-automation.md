# Settings Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished frontend-only settings experience for AI auto-posting, with local persistence, preview/test posting, open-app automation, and duplicate prevention.

**Architecture:** Add a focused frontend settings page backed by a dedicated automation helper/store module. Keep generation, validation, storage, and feed-merging logic in pure functions so the UI layer stays interactive but testable. Integrate the new local automation posts into the existing home feed without introducing backend dependencies.

**Tech Stack:** React 18, TypeScript, existing Ant Design and Framer Motion UI stack, browser localStorage, Node built-in test runner.

---

### Task 1: Create Testable Automation Logic Module

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/automationSettings.ts`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/automation-settings.test.mjs`

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement minimal settings, validation, storage-safe, generator, and duplicate-prevention helpers**
- [ ] **Step 4: Run tests to verify they pass**

### Task 2: Build Settings Page UI

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Settings.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/App.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/App.css`

- [ ] **Step 1: Add a failing UI text/structure test if feasible, otherwise rely on logic tests and strict code integration**
- [ ] **Step 2: Replace placeholder settings route with interactive Settings page**
- [ ] **Step 3: Add hero card, schedule card, source selection, trend range controls, quality card, preview/actions**
- [ ] **Step 4: Wire all clicks and inputs to real frontend state**

### Task 3: Integrate Feed And Simulated Automation

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Home.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/automationSettings.ts`

- [ ] **Step 1: Write failing tests for feed merge and duplicate-safe posting behavior**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Implement feed merge helpers and open-app automation checks**
- [ ] **Step 4: Run tests to verify they pass**

### Task 4: Verification

**Files:**
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/automation-settings.test.mjs`
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/home-text.test.mjs`

- [ ] **Step 1: Run lightweight test suite**
- [ ] **Step 2: Confirm no unnecessary build commands are used**
- [ ] **Step 3: Summarize behavior, assumptions, and remaining frontend-only limitations**
