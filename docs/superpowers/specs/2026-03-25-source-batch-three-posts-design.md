# Source Batch Three Posts Design

**Date:** 2026-03-25
**Project:** BlogAINamLun
**Status:** Approved in-session

## Goal

Extend the current Gemini-backed automation flow so each selected trend source produces a small post batch instead of a single post.

For every enabled source, the system should generate and publish:

- one `fashion` post
- one `health` post
- one `tips` post

Each post should include Vietnamese content with proper diacritics and at least one source-backed image.

## Product Intent

The current automation flow is good enough for a single AI-generated post, but it does not yet feel like a serious publishing pipeline.

The owner wants each enabled source to behave like a micro content stream:

- three posts per source
- one post per major category already used by the app
- better visual completeness through real images
- better readability through proper Vietnamese text

The owner also wants generation to stay conservative.

This phase should avoid firing a large burst of simultaneous AI calls and instead process work gradually through a local background job flow.

## Audience Constraint

This feature is specifically aimed at young women aged 18-25.

That is the primary audience, not an absolute hard wall.

If a category job has weak or sparse signals, the system may widen the audience lens slightly to include women under 30, as long as the content still feels close to the same lifestyle stage and tone.

That audience requirement must shape the full pipeline:

- trend selection
- image selection
- prompt wording
- title style
- content framing
- tone defaults

The default voice should feel:

- cute
- approachable
- modern
- soft rather than formal

The system should avoid outputs that feel:

- generic lifestyle content for everyone
- overly technical or expert-heavy
- stiff, corporate, or detached
- obviously aimed at a broad mixed audience instead of young women

### Audience Expansion Rule

Audience expansion should be conservative.

Recommended rule:

- primary targeting stays at `18-25`
- fallback targeting may widen to `18-29` only when strong signals are too sparse
- widening should improve relevance density, not dilute the brand voice

Even in fallback mode, the output should still feel:

- youthful
- feminine
- approachable
- lifestyle-relevant for young women

## Approved User Requirements

The feature must satisfy all of the following:

- each selected trend source produces exactly 3 posts
- the 3 posts map to `fashion`, `health`, and `tips`
- posts use Vietnamese with diacritics
- posts include source-backed images first
- image generation by AI is out of scope for this phase
- generation should not happen as one large synchronous burst
- background jobs should process gradually to protect output quality and token usage
- as soon as a single post is ready, it should be published immediately
- the system does not need to wait for the other posts in the same source batch before publishing

## Constraints

### Cost Constraint

Gemini token usage should remain conservative.

This phase should prefer:

- one focused prompt per category post
- low-concurrency or sequential processing
- narrow trend context instead of large multi-topic prompts

### Source-Backed Image Constraint

Images should come from source-backed or stock-style providers first.

This phase does not include:

- AI image generation
- expensive image generation APIs
- heavy media pipelines

### Local-Stable Constraint

The new batch workflow must remain operable on the owner's local machine.

The feature should integrate with the existing scheduler and local stable scripts without introducing production-only infrastructure.

## Current State Summary

Today the automation pipeline works like this:

- a selected source becomes the primary source label
- the trend coordinator fetches a few pragmatic real trend signals
- Gemini generates one preview candidate at a time
- preview and `post-now` operate on a single candidate
- published posts can render images, but automation-generated posts currently use empty image arrays
- prompt instructions currently ask for Vietnamese without diacritics

That means the current behavior is close in spirit, but not yet aligned with the owner workflow.

## Approved Direction

### Per-Source Batch Generation

For every selected source, the system should build a logical batch of three category jobs:

- `<source>-fashion`
- `<source>-health`
- `<source>-tips`

Each category job should:

1. choose the best available trend signal for that source and category
2. choose source-backed images appropriate for that source and category
3. generate one Vietnamese post with diacritics
4. publish the post immediately when ready
5. persist status and diagnostics for that job

### Background Job Execution

The batch should be processed through a small local background job runner rather than one synchronous controller call that tries to finish everything in a single request.

The intended behavior is:

- jobs are enqueued from scheduler or explicit manual action
- jobs are processed gradually
- concurrency stays very low or sequential by default
- one failed job does not cancel the rest of the batch

### Best-Signal-Per-Category Strategy

Each category job should prefer the single best trend signal for its own category instead of sharing one large trend payload across all three categories.

This helps:

- reduce token usage
- keep prompts focused
- improve category relevance
- avoid degraded output caused by overstuffed context

## Architecture Design

### 1. Batch Planner

Add a planning layer that transforms selected sources into category jobs.

Input:

- selected sources
- trend range settings
- tone
- focus prompt

Output:

- a list of category job descriptors, one per `source x category`

Each descriptor should include:

- source
- category
- trend range context
- tone
- focus prompt
- batch id

### 2. Category-Aware Trend Selection

Extend the trend coordinator so category jobs can request signals with category intent.

The system should support category-specific signal selection:

- `fashion`: fashion, beauty, style, outfit, creator-lifestyle style signals
- `health`: wellness, self-care, energy, sleep, hydration, healthy habit signals
- `tips`: practical hacks, productivity, shopping, saving, organizational signals

Each category strategy should be filtered through the target audience lens:

- `fashion`: affordable beauty, soft style, wearable trend looks, easy glow-up routines
- `health`: self-care, energy reset, healthy routines, mood support, body-friendly habits
- `tips`: practical daily-life hacks, study/work balance, smart shopping, tidy living, personal organization

The coordinator should still use pragmatic-real sources for this phase, but the query builder and scoring should become category aware.

### 3. Source Image Provider

Add an image provider layer that resolves 1-3 images for a category job.

Priority order:

1. use a strong source-backed image or thumbnail when available
2. otherwise use a source-backed stock/search query based on source + category + trend topic

Each job should return a stable list of image URLs suitable for the existing `Post.images` field.

### 4. Vietnamese-With-Diacritics Generation

Replace the current no-diacritic prompt instruction.

Gemini prompts should explicitly request:

- natural Vietnamese with diacritics
- concise, readable blog/post style
- one category-aligned post only
- copy that feels cute and approachable for women aged 18-25
- a warm, near-friend tone rather than a dry expert tone

The system should keep one focused prompt per job rather than one large prompt spanning multiple categories.

### 5. Audience-Aware Image Selection

The image provider should prefer visuals that feel appropriate for the same audience.

That means images should lean toward:

- young female lifestyle context
- soft, modern, friendly visual mood
- realistic scenes that match self-care, fashion, and daily-life content

The provider should avoid images that feel:

- too generic or corporate
- visually harsh or mismatched
- off-target for the intended demographic

### 6. Publish-As-Ready Job Runner

The current scheduler should hand work to a small automation job runner.

The job runner should:

- pull one category job at a time
- resolve trend signal and images
- generate post content
- publish immediately when successful
- record success or failure
- continue with the next job

This keeps the runtime simple for local use while still giving the owner an asynchronous pipeline.

## API And Data Contract Design

### Preview

Preview should evolve from a single-candidate flow to a batch-oriented response.

Recommended response shape:

- `batchId`
- `items`

Each preview item should include:

- `source`
- `category`
- `title`
- `content`
- `insights`
- `images`
- `status`

The UI should show all generated preview items grouped by source and category.

### Post-Now

`post-now` should become a batch trigger rather than a single-post shortcut.

Recommended behavior:

- enqueue one category job per selected source and category
- return a batch receipt quickly
- let the background runner publish as jobs complete

Recommended response shape:

- `batchId`
- `queuedCount`
- `mode: queued`

### History

History should remain item-based so the feed and archive keep working naturally.

However, history items should gain enough metadata to trace where they came from:

- batch id
- source
- category
- generation status
- optional failure reason for incomplete jobs

## Frontend Experience

### Settings

Settings should continue to be the operator studio for automation, but now it should communicate batch behavior clearly.

The page should explain:

- each selected source generates 3 category posts
- posts are processed gradually in the background
- posts publish individually when ready
- the generated content is tuned for young women aged 18-25

### Preview UX

Preview should show a clearer grouped structure:

- source group
- three category cards inside that source group

Each card should show:

- category label
- title
- short content
- images
- trend insights
- current status

### Runtime Status UX

Runtime status should surface batch progress in human language.

Examples:

- `Dang xu ly 2/6 bai`
- `Da dang 4/6 bai`
- `1 bai dang cho trend phu hop`

The owner should not need to infer whether the system is stuck or still progressing.

## Failure Handling

This phase must fail softly.

Rules:

- if one category job fails, the remaining jobs continue
- if image resolution fails, the job may either retry with fallback image sourcing or publish with a smaller image set
- if Gemini quota is exhausted mid-batch, unfinished jobs should be marked failed or deferred without corrupting completed work
- if no good trend signal exists for a category, that job should record a clear reason rather than forcing low-quality output

## Testing Design

### Backend Tests

Add coverage for:

- batch planning creates `3 jobs x each selected source`
- category-aware trend selection chooses the best signal for each category
- Vietnamese prompt now requests content with diacritics
- persona-aware prompt instructions target women aged 18-25 with a cute, approachable tone
- image provider returns image lists in the correct format
- job runner publishes jobs incrementally
- one failed job does not cancel sibling jobs
- batch-trigger routes return queue receipts and/or grouped preview data

### Frontend Tests

Add coverage for:

- grouped preview rendering by source and category
- image rendering for automation-generated posts
- operator copy explaining `3 posts per source`
- runtime status updates for partially completed batches

### Local Verification

The local stable workflow should be updated so this feature can be verified without excessive Gemini usage.

Recommended verification path:

1. dry-run preview with mocked trend/image providers
2. controlled manual batch with one real source
3. confirm posts appear incrementally in feed/history

## Out Of Scope

This phase does not include:

- AI image generation
- native platform APIs for TikTok, Facebook, Instagram, Shopee, or Threads
- large-scale queue infrastructure
- production-grade distributed workers
- advanced analytics on which category performs best after publishing

## Success Criteria

This phase is complete when:

- each selected source reliably produces 3 category-targeted posts
- posts are written in Vietnamese with diacritics
- posts include source-backed images
- generation is processed gradually through a local background job flow
- completed posts publish immediately without waiting for the rest of the batch
- the UI communicates per-source batch behavior clearly
- local verification confirms the end-to-end flow behaves predictably
