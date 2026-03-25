# Phase 1 Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten the frontend side of phase 1 by removing stale browser-only leftovers, standardizing test execution, and reducing the initial bundle weight.

**Architecture:** Keep the current product surface intact while cleaning internal boundaries. Move shared post typing out of mock seed data, remove unused local-storage persistence helpers from the automation helper module, and split route loading so the shell can render before page chunks land.

**Tech Stack:** React 18, TypeScript, Vite, Node test runner

---

### Task 1: Add regression tests for phase-1 hardening

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/frontend-hardening.test.mjs`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/package.json`

- [ ] **Step 1: Write failing tests for the expected frontend cleanup and script surface**
- [ ] **Step 2: Run the new test file and verify it fails for the current code**
- [ ] **Step 3: Add package scripts needed for repeatable test execution**
- [ ] **Step 4: Re-run the test file and verify the script-related checks pass**

### Task 2: Decouple shared frontend types from mock data

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/types/post.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/mockData.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/archive.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/automation.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/posts.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/components/PostCard.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/automationSettings.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Archive.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Home.tsx`

- [ ] **Step 1: Move the `Post` contract into a dedicated shared type module**
- [ ] **Step 2: Update frontend imports so app code no longer depends on `mockData.ts` for typing**
- [ ] **Step 3: Re-run the hardening tests and verify the mock-data coupling check passes**

### Task 3: Remove legacy browser-storage helpers and split page loading

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/automationSettings.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/App.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/vite.config.ts`

- [ ] **Step 1: Remove unused local-storage persistence helpers that no longer match the backend-backed app flow**
- [ ] **Step 2: Lazy-load route pages and add a lightweight suspense fallback for the shell**
- [ ] **Step 3: Add Vite chunking hints to separate core vendor groups**
- [ ] **Step 4: Re-run tests and production build to verify the cleaned frontend still works**
