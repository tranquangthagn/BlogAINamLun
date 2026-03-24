# Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the sidebar and top bar into a more beautiful dreamy-editorial navigation system without changing routing behavior.

**Architecture:** Keep the navigation behavior and route structure intact, but redesign the visual shell through focused changes to the sidebar component, app shell header markup, and shared app-level styling. Use light structural refinements only where they directly support stronger layout, hierarchy, and motion.

**Tech Stack:** React 18, TypeScript, existing Framer Motion usage, existing CSS architecture in `App.css`.

---

### Task 1: Add Lightweight Redesign Tests

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/settings-ui.test.mjs`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/navigation-shell.test.mjs`

- [ ] **Step 1: Write failing checks for new sidebar/top-bar design markers**
- [ ] **Step 2: Run tests to verify they fail**
- [ ] **Step 3: Keep tests focused on key structure/text/class markers, not pixel styling**
- [ ] **Step 4: Re-run after implementation**

### Task 2: Redesign Sidebar Structure

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Refine brand area into a stronger editorial cluster**
- [ ] **Step 2: Improve nav item structure for richer active/inactive states**
- [ ] **Step 3: Refine footer identity block**
- [ ] **Step 4: Preserve existing route links and sidebar open/closed behavior**

### Task 3: Redesign Top Bar Structure

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/App.tsx`

- [ ] **Step 1: Introduce clearer top-bar zones**
- [ ] **Step 2: Improve search area structure and copy**
- [ ] **Step 3: Upgrade action button treatment**
- [ ] **Step 4: Preserve current menu toggle behavior**

### Task 4: Apply Editorial Styling And Motion

**Files:**
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/App.css`

- [ ] **Step 1: Upgrade sidebar card, spacing, and active ribbon treatment**
- [ ] **Step 2: Redesign floating top strip with stronger composition**
- [ ] **Step 3: Add restrained premium motion and hover states**
- [ ] **Step 4: Adjust responsive behavior for narrower layouts**

### Task 5: Verification

**Files:**
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/navigation-shell.test.mjs`
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/settings-ui.test.mjs`
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/home-feed-integration.test.mjs`
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/home-text.test.mjs`
- Test: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/automation-settings.test.mjs`

- [ ] **Step 1: Run lightweight node-based tests only**
- [ ] **Step 2: Confirm no build command is used**
- [ ] **Step 3: Summarize visual changes, preserved behavior, and any remaining polish ideas**
