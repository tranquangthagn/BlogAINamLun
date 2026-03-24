# Backend System Foundation Design

**Date:** 2026-03-24
**Project:** BlogAINamLun
**Status:** Approved in-session

## Goal

Build the first real backend and system foundation for BlogAINamLun so the app can move from browser-only local state to a durable, testable, deployable platform.

This phase should replace the current mock-only FastAPI setup and prepare the project for real automation, persistent content, and safer operational workflows without over-engineering the architecture.

## Product Context

The current frontend already delivers the intended product experience across:

- feed browsing
- archive browsing
- automation settings and preview flows

However, the product state is still held almost entirely in the browser through local storage and frontend utility functions. The existing backend only exposes a minimal in-memory posts API in [backend/main.py](C:/Users/thang/MyProjects/BlogAINamLun/backend/main.py).

That means the next backend step should prioritize persistence, clean service boundaries, and operational readiness before adding more product surface area.

## Approved Direction

The approved implementation direction is:

**Modular Monolith**

This means:

- one FastAPI application
- one primary relational database
- one codebase for API, business logic, and scheduler
- clear internal module boundaries so the app can scale without becoming tangled

This direction is preferred because it gives the project production-worthy structure while staying appropriately sized for the current product.

## Why Not Other Approaches

### Thin MVP API Only

This would be faster in the very short term, but it would keep too much logic in the frontend and would delay the point where automation can run as a real backend capability.

### Full Multi-Service Architecture

This would add unnecessary complexity too early. The current product does not yet justify separate API, worker, queue, and orchestration layers. Doing that now would slow delivery and raise operational overhead without enough payoff.

## Architecture Overview

The backend will remain a single FastAPI service, but it will be reorganized into focused internal layers:

- `api`: route handlers and HTTP contracts
- `schemas`: request and response models
- `services`: business logic
- `repositories`: database access
- `models`: ORM entities
- `core`: configuration, database bootstrapping, startup wiring

This structure should replace the current all-in-one file pattern and keep domain logic testable and reusable.

## Domain Modules

The first backend version should support four core domains.

### Posts

Responsibilities:

- serve the feed
- store seeded posts and automation-published posts
- support filtering for category and date-based browsing
- expose post data in a shape the current frontend can consume with minimal redesign

### Archive

Responsibilities:

- persist saved state for posts
- persist read state for posts
- support archive queries for saved items and reading history

This replaces browser-only archive behavior and makes the archive portable across sessions and devices.

### Automation

Responsibilities:

- persist automation settings
- generate preview candidates
- persist generation history
- publish selected candidates into the feed
- run scheduled auto-post checks in the backend

The generation behavior should initially mirror the current frontend rule-based logic so that the product behavior remains familiar while responsibility moves to the backend.

### System

Responsibilities:

- environment configuration
- database wiring
- CORS configuration
- startup and shutdown hooks
- health checks
- scheduler startup

This domain exists to make the application operable in development and deployable later without mixing infrastructure details into product modules.

## Data Model

The backend should introduce persistent relational storage with MySQL as the source of truth.

### `posts`

Stores every post that can appear in the feed.

Recommended fields:

- `id`
- `author`
- `avatar`
- `content`
- `category`
- `created_at`
- `likes`
- `comments`
- `source_type` with values such as `seeded` and `automation`

### `post_images`

Stores one-to-many post images so feed entries can preserve the multi-image shape already used in the frontend.

Recommended fields:

- `id`
- `post_id`
- `image_url`
- `position`

### `user_post_states`

Stores archive-related per-post state.

Recommended fields:

- `id`
- `post_id`
- `saved`
- `saved_at`
- `read`
- `read_at`

This table replaces frontend local storage keys for saved and read state.

### `automation_settings`

Stores the active automation configuration for this phase.

Recommended fields:

- `id`
- `enabled`
- `schedule_mode`
- `post_time`
- `interval_minutes`
- `sources`
- `trend_range_mode`
- `custom_start`
- `custom_end`
- `last_run_at`
- `last_generated_post_id`
- `updated_at`

Only one active settings record is needed for the current single-owner product.

### `automation_history`

Stores generated candidates and posting history.

Recommended fields:

- `id`
- `title`
- `content`
- `source`
- `topic_key`
- `category`
- `created_at`
- `posted`
- `published_post_id`

This table tracks what the automation considered and what eventually became visible in the feed.

## Database Flow

The database layer should be treated as a first-class part of the system design rather than an implementation detail.

### Storage Direction

MySQL should be the primary operational database for this phase.

The backend should connect to MySQL through a structured persistence layer:

- API routes receive validated HTTP input
- services apply product rules and orchestration
- repositories execute database reads and writes
- ORM models map domain entities to MySQL tables

This keeps HTTP concerns, business behavior, and persistence concerns separate.

### Schema Lifecycle

Schema changes should be managed through migrations rather than manual database edits.

Required lifecycle:

- define ORM models for each table
- create versioned migrations for schema changes
- apply migrations on local setup and deployment
- keep schema history in the repository

This allows the database to evolve safely as the backend grows.

### Startup Flow

When the backend starts:

- load environment configuration
- build the MySQL connection settings
- initialize the database engine and session factory
- verify connectivity
- run application startup wiring
- ensure seed initialization logic can run when the database is empty

Startup should fail fast if the MySQL configuration is invalid or the database is unavailable.

### Seed Flow

The current frontend includes seeded post content in [mockData.ts](C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/mockData.ts). The backend should preserve a similar first-run experience.

Recommended seed flow:

- detect whether the `posts` table is empty
- insert initial seeded posts and related images
- mark them as `source_type = seeded`
- avoid duplicate inserts on later startups

This gives the product a non-empty initial feed while still allowing database-backed persistence to become the source of truth.

### Runtime Write Flow

Normal writes should follow predictable transaction boundaries.

Examples:

- saving a post updates or creates the related `user_post_states` record
- marking a post as read updates the same state table
- posting an automation candidate creates or links a `posts` record and updates `automation_history`
- automation scheduler runs should update `automation_settings.last_run_at` in the same logical workflow

Operations that belong together should commit together so feed and automation state do not drift apart.

### Read Flow

Read APIs should assemble response data from MySQL in backend services rather than leaving the frontend to merge unrelated data sources.

Examples:

- feed queries should return posts ordered by `created_at`
- archive queries should join post content with saved/read state
- automation history queries should return candidate records in reverse chronological order

This reduces duplicated data logic across frontend pages.

### Automation Database Flow

The automation loop should use the database as the durable record of both settings and outcomes.

Expected flow:

- read active automation settings from MySQL
- read recent automation history from MySQL
- generate candidates in the service layer
- insert new candidate rows into `automation_history`
- when publishing, create the feed post row and related images if needed
- update the selected history row as `posted`
- write the published post reference back to `automation_history`
- update the settings row with the last successful run metadata

This creates a full audit trail for previews, published automation output, and scheduling behavior.

### Database Constraints

The schema should include the minimum constraints needed to keep data trustworthy.

Recommended examples:

- foreign keys from `post_images` and `user_post_states` to `posts`
- a foreign key from `automation_history.published_post_id` to `posts`
- indexed timestamps for sorting recent posts and history
- uniqueness rules where needed to prevent duplicate state rows per post

Constraints should stay focused and practical for the current single-owner application.

## Core Data Principle

Two persistence concepts should remain separate:

- `posts` contains content already published into the feed
- `automation_history` contains candidate content generated by automation

When a candidate is posted, it should remain traceable through history while also creating or linking the published feed post record.

This separation keeps preview behavior, auditability, and feed rendering simpler.

## API Design

The first backend version should expose a clean JSON API for the current frontend.

### System Routes

- `GET /health`
- `GET /health/ready`

`/health` is the liveness probe and should return quickly even when the database is unavailable.

`/health/ready` is the readiness probe and should verify the API can reach MySQL before the app is considered ready for traffic.

### Posts Routes

- `GET /api/posts`

Returns feed posts, including automation-published entries and support for future filtering.

### Archive Routes

- `GET /api/archive`
- `POST /api/posts/{id}/save`
- `DELETE /api/posts/{id}/save`
- `POST /api/posts/{id}/read`

These routes support the saved and read flows currently backed by local browser state.

### Automation Routes

- `GET /api/automation/settings`
- `PUT /api/automation/settings`
- `GET /api/automation/history`
- `POST /api/automation/preview`
- `POST /api/automation/post-now`

These routes replace the browser-only automation utility logic and allow both preview and actual publishing workflows to live in the backend.

## Scheduler Design

The backend should include an internal scheduler in this phase.

Expected behavior:

- run on a short recurring interval, such as once per minute
- load active automation settings
- determine whether the schedule is due
- generate candidates when due
- persist automation history
- publish the selected candidate into `posts`
- update `last_run_at` and `last_generated_post_id`

The scheduler should remain inside the FastAPI service for now. This keeps the system simple while still enabling real background behavior.

If future scale or reliability requirements increase, this can later evolve into a separate worker process.

## Frontend Rollout Strategy

Migration from local storage should happen incrementally so the UI remains stable.

### Phase 1

Build backend modules, database models, migrations, and API routes while preserving current frontend behavior.

### Phase 2

Move the settings page to backend-backed reads and writes for:

- automation settings
- preview generation
- post-now behavior
- generation history

### Phase 3

Move feed, archive, saved, and read state to backend APIs.

### Phase 4

Keep seeded data support so the app does not appear empty on first run, but treat database-backed content as the primary source of truth.

## Error Handling

The backend should provide explicit validation and operational guardrails.

Required behavior:

- reject invalid automation settings with clear API validation messages
- fail fast on startup if required database configuration is missing
- return not found errors for missing posts
- keep scheduler failures from crashing the whole app, while still logging them

## Testing Strategy

The backend foundation is successful only if it is testable.

The first implementation should include tests for:

- automation settings validation
- candidate generation rules
- candidate posting flow
- feed retrieval and merge behavior
- archive saved/read state changes
- health route and key API routes

Tests should focus on service-level correctness first, then add route-level coverage for integration confidence.

## Operational Foundation

The system setup should include:

- `.env`-driven configuration
- MySQL connection settings
- readiness and liveness probes
- migration support
- local development startup instructions
- Docker support for app and MySQL database

This is enough operational structure to make the project reproducible and easier to deploy later without forcing full production platform complexity today.

## Local Runbook Notes

The first local run path should be straightforward:

- copy `backend/.env.example` to `backend/.env`
- start MySQL and backend together through `docker-compose.yml` when local MySQL credentials are unknown or inconsistent
- run Alembic migrations before relying on API data
- verify `GET /health`
- verify `GET /health/ready`
- verify `GET /api/posts`
- verify `PUT /api/automation/settings` and `POST /api/automation/preview`

If local MySQL is running on Windows, keep `CRYPTOGRAPHY_OPENSSL_NO_LEGACY=1` in the environment to avoid OpenSSL legacy-provider startup failures when PyMySQL imports `cryptography`.

This runbook exists to reduce ambiguity between schema setup, seed behavior, and application startup.

## Technical Intent

This work should not attempt to solve everything at once.

It should:

- create a clean backend foundation
- centralize business logic in the backend
- preserve the current frontend experience as much as possible
- open a path for future AI integration, better automation, and deployment

It should not yet:

- introduce authentication
- split into microservices
- add distributed queues
- redesign the frontend experience again

## Success Criteria

This backend foundation is successful when:

- the app has a real persistent backend instead of browser-only state
- automation logic can run through backend APIs and scheduled execution
- the backend code is modular and testable
- the frontend can begin switching to backend data without major UI disruption
- the project is easier to run, reason about, and deploy than the current mock setup
