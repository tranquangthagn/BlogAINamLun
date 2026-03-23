# Settings Automation Design

**Date:** 2026-03-23
**Project:** BlogAINamLun
**Status:** Draft reviewed in-session

## Goal

Build a real `Cài đặt` page for a personal AI-assisted blog that lets the owner configure and run frontend-driven automatic posting into the feed. The experience should feel modern, cute, polished, and highly interactive, while keeping the implementation mostly in frontend logic.

## Product Intent

This project is for a single owner, not a public multi-user network. The settings flow should therefore optimize for:

- simple personal control
- fast visual understanding
- delightful interactions
- one good AI-generated post per run
- reduced repetition in generated content

## In Scope

- Replace the current placeholder `Cài đặt` route with a real settings page.
- Add a prominent on/off control for automatic posting.
- Allow choosing a daily posting time.
- Allow selecting trend sources individually:
  - Facebook
  - TikTok
  - Instagram
  - Shopee
  - Threads
- Allow choosing exactly one trend time scope:
  - day
  - week
  - quarter
  - custom date or date range
- Provide interactive frontend behavior for clicks, toggles, input, and save actions.
- Persist settings in `localStorage`.
- Generate preview content from current settings.
- Allow immediate test posting into the feed.
- Simulate automatic posting while the app is open.
- Prevent near-duplicate posts using recent local history.

## Out Of Scope

- Real background scheduling when the app/browser is closed.
- Real crawling or API ingestion from Facebook, TikTok, Instagram, Shopee, or Threads.
- Backend persistence or orchestration.
- Real AI model calls in this iteration.

## UX Direction

The settings page should feel like an "AI control room" for the owner:

- soft gradient backgrounds
- glassmorphism cards
- rounded shapes
- cute but tasteful visual language
- motion on load, selection, and preview appearance
- clear hierarchy with a strong hero section

The page should be easy to understand at a glance, with visible current status and a short natural-language summary of the active configuration.

## Page Structure

### 1. Hero Status Card

Purpose:

- explain what the automation does
- show current state
- provide the main enable/disable switch

Contents:

- title for the AI posting assistant
- short helper text
- active/inactive badge
- large automation toggle
- concise status summary

### 2. Posting Schedule Card

Purpose:

- choose when the AI should auto-post

Contents:

- time picker
- summary sentence like "Mỗi ngày lúc 08:00 AI sẽ tự đăng 1 bài"

### 3. Trend Sources Card

Purpose:

- choose which sources the AI can use

Contents:

- individually selectable source pills/cards
- animated active state
- validation preventing empty selection during generation/posting

### 4. Trend Scope Card

Purpose:

- choose one time scope for trend gathering

Contents:

- single-select options: day, week, quarter, custom
- conditional custom date UI when custom is selected

### 5. Content Quality Card

Purpose:

- explain built-in quality rules without overloading the user

Rules displayed:

- one post per run
- avoid repeating recent titles
- avoid repeating recent topic patterns
- rotate source usage when possible

### 6. Preview And Actions Card

Purpose:

- let the owner test the automation safely and quickly

Contents:

- `Tạo bài nháp xem trước`
- `Đăng thử ngay`
- preview area for generated content
- last run status

## Frontend Data Model

The automation configuration should be stored in a single frontend settings object:

```ts
type TrendSource = 'facebook' | 'tiktok' | 'instagram' | 'shopee' | 'threads';
type TrendRangeMode = 'day' | 'week' | 'quarter' | 'custom';

type AutomationSettings = {
  enabled: boolean;
  postTime: string;
  sources: TrendSource[];
  trendRangeMode: TrendRangeMode;
  customDateRange: {
    start: string | null;
    end: string | null;
  };
  lastRunAt: string | null;
  lastGeneratedPostId: number | null;
};
```

Generated and posted AI content should also keep local history:

```ts
type GeneratedPostHistoryItem = {
  id: number;
  title: string;
  content: string;
  source: TrendSource;
  topicKey: string;
  createdAt: string;
  posted: boolean;
};
```

## Persistence

Use `localStorage` for:

- settings
- generated history
- AI-created feed posts

This keeps the experience persistent across refreshes while staying frontend-first.

## Feed Integration

The home feed should merge:

- existing `FAKE_POSTS`
- AI-generated local posts

Newest generated posts should appear near the top so the owner can immediately verify the automation output.

## Generation Model

This iteration uses a frontend content generator, not real AI/network fetches.

The generator should:

- pick one source from enabled sources
- pick a topic pattern that has not been used recently
- derive a title, short body, and metadata that feel trend-inspired
- create only one post per run

## Duplicate Prevention

Duplicate prevention is a hard requirement.

The generator should avoid repetition by checking recent local history and rejecting candidates that are too similar. The first version should apply these rules:

- do not reuse the exact recent title
- do not reuse the same `source + topicKey` combination in the recent window
- prefer a source that has not been used most recently
- if a candidate is too similar, regenerate with another topic variant

This is lightweight but enough for a convincing first version.

## Automation Behavior

Because this is frontend-first, automation only runs while the app is open.

Behavior:

- if automation is enabled
- and current local time passes the configured `postTime`
- and the app has not already auto-posted for that date
- then generate one post and push it into the local feed

This gives real visible behavior without needing backend scheduling.

## Validation Rules

- At least one source must be selected before preview or posting.
- If `custom` range mode is selected, a valid custom range must be present.
- Posting time must always be set.
- Duplicate-prevention history must be updated after preview generation and posting in a way that keeps actual posted content distinct.

## Technical Structure

Planned frontend structure:

- `frontend/src/pages/Settings.tsx`
  - settings page UI
- `frontend/src/data/automationSettings.ts`
  - settings defaults, storage helpers, generation logic, duplicate checks
- existing app route updates in `frontend/src/App.tsx`
- home feed integration updates in `frontend/src/pages/Home.tsx`
- supporting style updates in `frontend/src/App.css`

## Testing Strategy

Prefer lightweight checks instead of full build verification.

Test targets:

- settings serialization/deserialization
- validation for empty sources and invalid custom range
- generation behavior
- duplicate prevention behavior
- feed merge behavior for generated posts

## Risks

- The current codebase has text encoding issues in multiple files. Editing touched files should avoid making those worse.
- Frontend-only scheduling can be misunderstood as true background automation; UI copy should make its current behavior understandable.
- If preview generation writes to history too aggressively, duplicate prevention may become too strict. The implementation should separate preview behavior from committed posted history carefully.

## Success Criteria

This design is successful when:

- the placeholder settings page becomes a polished interactive page
- the owner can configure automation visually
- generated content can be previewed and posted from the settings page
- auto-posting works while the app is open
- posts appear in the home feed
- repeated or near-identical posts are reduced through local logic
