# Backend System Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real FastAPI + MySQL backend foundation for BlogAINamLun, including persistence, migrations, seed data, archive state, automation APIs, scheduler wiring, and the first frontend migration away from local storage.

**Architecture:** Keep the backend as a modular monolith: one FastAPI app with clear `api`, `services`, `repositories`, `models`, `schemas`, and `core` boundaries. Use MySQL as the production source of truth, Alembic for schema evolution, SQLAlchemy for persistence, and a lightweight in-process scheduler for auto-post checks until scale justifies a separate worker.

**Tech Stack:** FastAPI, SQLAlchemy 2.x, Alembic, MySQL via PyMySQL, Pydantic, APScheduler, pytest, httpx, Docker Compose, existing React 18 + TypeScript frontend.

---

## File Structure Map

- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`
  Purpose: FastAPI app factory, router registration, startup wiring.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/config.py`
  Purpose: environment-driven settings, MySQL DSN, scheduler toggles.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/database.py`
  Purpose: SQLAlchemy engine, session factory, declarative base, dependency helpers.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/scheduler.py`
  Purpose: APScheduler bootstrapping and recurring auto-post trigger.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/*.py`
  Purpose: ORM entities for `posts`, `post_images`, `user_post_states`, `automation_settings`, `automation_history`.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/repositories/*.py`
  Purpose: focused MySQL read/write primitives by domain.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/*.py`
  Purpose: feed logic, archive logic, automation rules, seed orchestration.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/schemas/*.py`
  Purpose: request/response contracts for API endpoints.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/*.py`
  Purpose: health, posts, archive, automation endpoints.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic.ini`
  Purpose: migration configuration entrypoint.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic/env.py`
  Purpose: Alembic engine setup and metadata wiring.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic/versions/*.py`
  Purpose: versioned MySQL schema history.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/**/*.py`
  Purpose: service tests, API tests, scheduler-safe startup checks.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/.env.example`
  Purpose: documented local configuration template.
- `C:/Users/thang/MyProjects/BlogAINamLun/backend/Dockerfile`
  Purpose: container image for FastAPI service.
- `C:/Users/thang/MyProjects/BlogAINamLun/docker-compose.yml`
  Purpose: local orchestration for backend + MySQL.
- `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/*.ts`
  Purpose: frontend API client wrappers for posts, archive, automation.

### Task 1: Bootstrap Modular FastAPI App And MySQL Configuration

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/__init__.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/__init__.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/config.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/database.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/__init__.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/__init__.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/health.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/conftest.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/test_health_api.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/.env.example`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/main.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/requirements.txt`

- [ ] **Step 1: Write the failing health and app-bootstrap tests**

```python
from fastapi.testclient import TestClient

from app.main import create_app


def test_health_endpoint_returns_ok():
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pytest backend/tests/test_health_api.py -q`
Expected: FAIL with import errors because `app.main` and the route do not exist yet.

- [ ] **Step 3: Add backend dependencies and app/config skeleton**

```text
fastapi
uvicorn
sqlalchemy
alembic
pymysql
pydantic-settings
apscheduler
pytest
httpx
```

```python
class Settings(BaseSettings):
    app_name: str = "BlogAINamLun API"
    database_url: str = "mysql+pymysql://root:root@localhost:3306/blog_ai_nam_lun"
    enable_scheduler: bool = True
```

- [ ] **Step 4: Implement the app factory, MySQL settings loader, session dependency, and `/health` route**
- [ ] **Step 5: Re-run the health test**

Run: `pytest backend/tests/test_health_api.py -q`
Expected: PASS

- [ ] **Step 6: Commit the bootstrap slice**

```bash
git add backend/app backend/tests backend/.env.example backend/main.py backend/requirements.txt
git commit -m "feat: bootstrap backend app and mysql config"
```

### Task 2: Add ORM Models And Alembic Migrations For The Full MySQL Schema

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/__init__.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/post.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/post_image.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/user_post_state.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/automation_settings.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/models/automation_history.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic.ini`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic/env.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic/script.py.mako`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/alembic/versions/20260324_01_create_backend_foundation.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/test_schema_bootstrap.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/database.py`

- [ ] **Step 1: Write a failing schema bootstrap test for the expected table set**

```python
from sqlalchemy import inspect


def test_expected_tables_exist(db_engine):
    inspector = inspect(db_engine)
    assert set(inspector.get_table_names()) >= {
        "posts",
        "post_images",
        "user_post_states",
        "automation_settings",
        "automation_history",
    }
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `pytest backend/tests/test_schema_bootstrap.py -q`
Expected: FAIL because tables and migrations do not exist yet.

- [ ] **Step 3: Implement ORM models with practical MySQL constraints**

```python
class Post(Base):
    __tablename__ = "posts"

    id = mapped_column(Integer, primary_key=True)
    author = mapped_column(String(120), nullable=False)
    avatar = mapped_column(String(255), nullable=False)
    content = mapped_column(Text, nullable=False)
    category = mapped_column(String(32), nullable=False, index=True)
    created_at = mapped_column(DateTime, nullable=False, index=True)
    likes = mapped_column(Integer, nullable=False, default=0)
    comments = mapped_column(Integer, nullable=False, default=0)
    source_type = mapped_column(String(32), nullable=False, index=True)
```

- [ ] **Step 4: Wire Alembic to the app metadata and author the initial migration for all tables, indexes, foreign keys, and the single-row automation settings shape**
- [ ] **Step 5: Apply the migration locally**

Run: `alembic -c backend/alembic.ini upgrade head`
Expected: PASS with one migration applied to the configured MySQL database.

- [ ] **Step 6: Re-run schema verification**

Run: `pytest backend/tests/test_schema_bootstrap.py -q`
Expected: PASS

- [ ] **Step 7: Commit the persistence foundation**

```bash
git add backend/app/models backend/app/core/database.py backend/alembic backend/tests/test_schema_bootstrap.py
git commit -m "feat: add mysql schema and migrations"
```

### Task 3: Seed Initial Feed Content And Implement Feed Query Services

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/repositories/posts.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/posts.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/seed.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/schemas/posts.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/posts.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/services/test_posts_service.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/api/test_posts_api.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`

- [ ] **Step 1: Write failing service and API tests for seeded feed retrieval**

```python
def test_seed_posts_are_inserted_only_once(db_session):
    ensure_seed_data(db_session)
    ensure_seed_data(db_session)

    posts = PostsRepository(db_session).list_posts()

    assert len(posts) >= 4
    assert {post.source_type for post in posts} == {"seeded"}
```

```python
def test_get_posts_returns_feed_payload(client):
    response = client.get("/api/posts")

    assert response.status_code == 200
    assert response.json()[0]["images"] is not None
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run: `pytest backend/tests/services/test_posts_service.py backend/tests/api/test_posts_api.py -q`
Expected: FAIL because seeding, repository, service, schema, and route code do not exist yet.

- [ ] **Step 3: Port the seeded post content from `frontend/src/data/mockData.ts` into a backend seed module and keep image ordering explicit**
- [ ] **Step 4: Implement repository and service code that returns feed posts ordered by `created_at` descending, including child images**
- [ ] **Step 5: Register the posts router and call seed initialization during startup only when the table is empty**
- [ ] **Step 6: Re-run the feed tests**

Run: `pytest backend/tests/services/test_posts_service.py backend/tests/api/test_posts_api.py -q`
Expected: PASS

- [ ] **Step 7: Commit the seeded feed slice**

```bash
git add backend/app/repositories/posts.py backend/app/services/posts.py backend/app/services/seed.py backend/app/schemas/posts.py backend/app/api/routes/posts.py backend/app/main.py backend/tests/services/test_posts_service.py backend/tests/api/test_posts_api.py
git commit -m "feat: add seeded feed persistence and posts api"
```

### Task 4: Implement Archive Persistence For Saved And Read State

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/repositories/archive.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/archive.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/schemas/archive.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/archive.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/services/test_archive_service.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/api/test_archive_api.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/posts.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`

- [ ] **Step 1: Write failing tests for save, unsave, read, and archive list flows**

```python
def test_save_post_creates_single_state_row(db_session, seeded_post):
    service = ArchiveService(db_session)

    service.save_post(seeded_post.id)
    service.save_post(seeded_post.id)

    saved_posts = service.list_archive(kind="saved")
    assert len(saved_posts) == 1
```

```python
def test_mark_read_endpoint_marks_post(client, seeded_post):
    response = client.post(f"/api/posts/{seeded_post.id}/read")

    assert response.status_code == 200
    assert response.json()["read"] is True
```

- [ ] **Step 2: Run the archive tests to verify they fail**

Run: `pytest backend/tests/services/test_archive_service.py backend/tests/api/test_archive_api.py -q`
Expected: FAIL because archive repository, service, and routes do not exist yet.

- [ ] **Step 3: Implement archive repository methods for idempotent save/read updates in `user_post_states`**
- [ ] **Step 4: Implement archive service methods that join post content with saved/read state for archive responses**
- [ ] **Step 5: Add `GET /api/archive`, `POST /api/posts/{id}/save`, `DELETE /api/posts/{id}/save`, and `POST /api/posts/{id}/read`**
- [ ] **Step 6: Re-run the archive tests**

Run: `pytest backend/tests/services/test_archive_service.py backend/tests/api/test_archive_api.py -q`
Expected: PASS

- [ ] **Step 7: Commit the archive slice**

```bash
git add backend/app/repositories/archive.py backend/app/services/archive.py backend/app/schemas/archive.py backend/app/api/routes/archive.py backend/app/api/routes/posts.py backend/app/main.py backend/tests/services/test_archive_service.py backend/tests/api/test_archive_api.py
git commit -m "feat: add archive persistence and state apis"
```

### Task 5: Port Automation Settings, Validation, History, And Preview Generation To The Backend

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/repositories/automation.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/automation.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/schemas/automation.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/automation.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/services/test_automation_service.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/api/test_automation_api.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`

- [ ] **Step 1: Write failing tests for settings validation, duplicate-safe candidate generation, and history reads**

```python
def test_generate_preview_avoids_recent_duplicate_title(db_session, automation_settings):
    service = AutomationService(db_session)

    first = service.generate_preview_candidates(settings=automation_settings)
    service.record_candidates(first)
    second = service.generate_preview_candidates(settings=automation_settings)

    assert first[0].title != second[0].title
```

```python
def test_put_settings_persists_mysql_backed_configuration(client):
    response = client.put("/api/automation/settings", json={
        "enabled": True,
        "scheduleMode": "fixed_time",
        "postTime": "08:00",
        "intervalMinutes": 30,
        "sources": ["tiktok", "threads"],
        "trendRangeMode": "week",
        "customDateRange": {"start": None, "end": None},
    })

    assert response.status_code == 200
    assert response.json()["enabled"] is True
```

- [ ] **Step 2: Run the automation tests to verify they fail**

Run: `pytest backend/tests/services/test_automation_service.py backend/tests/api/test_automation_api.py -q`
Expected: FAIL because automation repository, service, schemas, and routes do not exist yet.

- [ ] **Step 3: Port the current rule-based automation logic from `frontend/src/data/automationSettings.ts` into backend service helpers and keep the behavior intentionally aligned**
- [ ] **Step 4: Implement MySQL-backed settings storage, history writes, preview generation, and history retrieval**
- [ ] **Step 5: Add `GET/PUT /api/automation/settings`, `GET /api/automation/history`, and `POST /api/automation/preview`**
- [ ] **Step 6: Re-run the automation tests**

Run: `pytest backend/tests/services/test_automation_service.py backend/tests/api/test_automation_api.py -q`
Expected: PASS

- [ ] **Step 7: Commit the automation-preview slice**

```bash
git add backend/app/repositories/automation.py backend/app/services/automation.py backend/app/schemas/automation.py backend/app/api/routes/automation.py backend/app/main.py backend/tests/services/test_automation_service.py backend/tests/api/test_automation_api.py
git commit -m "feat: add automation settings and preview apis"
```

### Task 6: Implement Post-Now Publishing And The In-Process Scheduler

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/scheduler.py`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/tests/test_scheduler_flow.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/services/automation.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/api/routes/automation.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/main.py`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/app/core/config.py`

- [ ] **Step 1: Write failing tests for publish-now and due-run scheduler behavior**

```python
def test_post_now_creates_feed_post_and_marks_history_posted(db_session, automation_settings):
    service = AutomationService(db_session)

    preview = service.generate_preview_candidates(settings=automation_settings)[0]
    published = service.publish_candidate_now(preview.id)

    assert published.source_type == "automation"
    assert service.get_history_item(preview.id).posted is True
```

```python
def test_scheduler_tick_skips_when_not_due(db_session, automation_settings):
    result = run_scheduler_tick(db_session)
    assert result.executed is False
```

- [ ] **Step 2: Run the publishing and scheduler tests to verify they fail**

Run: `pytest backend/tests/test_scheduler_flow.py -q`
Expected: FAIL because publish-now and scheduler wiring are not implemented yet.

- [ ] **Step 3: Implement transactional publish logic that creates the feed post, links it back to `automation_history`, and updates `last_run_at` plus `last_generated_post_id` together**
- [ ] **Step 4: Implement APScheduler bootstrapping and a guarded once-per-minute tick that logs failures but does not crash the app**
- [ ] **Step 5: Add `POST /api/automation/post-now` and startup/shutdown hooks for the scheduler**
- [ ] **Step 6: Re-run the scheduler tests**

Run: `pytest backend/tests/test_scheduler_flow.py -q`
Expected: PASS

- [ ] **Step 7: Commit the automation runtime slice**

```bash
git add backend/app/core/scheduler.py backend/app/services/automation.py backend/app/api/routes/automation.py backend/app/main.py backend/app/core/config.py backend/tests/test_scheduler_flow.py
git commit -m "feat: add automation publishing and scheduler"
```

### Task 7: Migrate The Frontend Settings, Feed, And Archive Screens To Backend APIs

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/client.ts`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/posts.ts`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/archive.ts`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/api/automation.ts`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/backend-api-contract.test.mjs`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Home.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Archive.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/pages/Settings.tsx`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/src/data/automationSettings.ts`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/automation-settings.test.mjs`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/frontend/tests/settings-ui.test.mjs`

- [ ] **Step 1: Write failing frontend adapter tests for the new API contracts**

```javascript
import test from "node:test";
import assert from "node:assert/strict";

test("posts api uses backend route", async () => {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => [] };
  };

  await listPosts();
  assert.equal(calls[0], "http://localhost:8000/api/posts");
});
```

- [ ] **Step 2: Run the frontend adapter test to verify it fails**

Run: `node --test frontend/tests/backend-api-contract.test.mjs`
Expected: FAIL because the API client modules do not exist yet.

- [ ] **Step 3: Build a small fetch wrapper and move settings reads/writes, preview generation, post-now, feed loading, saved state, and read state to backend endpoints**
- [ ] **Step 4: Keep the UI structure intact and leave `automationSettings.ts` as a thin compatibility layer or remove local-only behavior where it is no longer needed**
- [ ] **Step 5: Re-run backend-aware frontend tests**

Run: `node --test frontend/tests/backend-api-contract.test.mjs frontend/tests/automation-settings.test.mjs frontend/tests/settings-ui.test.mjs`
Expected: PASS

- [ ] **Step 6: Commit the frontend migration slice**

```bash
git add frontend/src/api frontend/src/pages/Home.tsx frontend/src/pages/Archive.tsx frontend/src/pages/Settings.tsx frontend/src/data/automationSettings.ts frontend/tests/backend-api-contract.test.mjs frontend/tests/automation-settings.test.mjs frontend/tests/settings-ui.test.mjs
git commit -m "feat: connect frontend flows to backend apis"
```

### Task 8: Add Docker, Local Runbook, And Final Verification

**Files:**
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/backend/Dockerfile`
- Create: `C:/Users/thang/MyProjects/BlogAINamLun/docker-compose.yml`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/backend/.env.example`
- Modify: `C:/Users/thang/MyProjects/BlogAINamLun/docs/superpowers/specs/2026-03-24-backend-system-foundation-design.md`

- [ ] **Step 1: Write a lightweight verification checklist in the repo docs or spec notes for local startup**
- [ ] **Step 2: Add a MySQL-backed Docker Compose setup with persistent volume, app service, and environment wiring**
- [ ] **Step 3: Confirm migrations, tests, and app startup commands are documented clearly**
- [ ] **Step 4: Run backend verification**

Run: `pytest backend/tests -q`
Expected: PASS

- [ ] **Step 5: Run frontend verification**

Run: `node --test frontend/tests/backend-api-contract.test.mjs frontend/tests/automation-settings.test.mjs frontend/tests/settings-ui.test.mjs`
Expected: PASS

- [ ] **Step 6: Run migration verification against MySQL**

Run: `alembic -c backend/alembic.ini upgrade head`
Expected: PASS

- [ ] **Step 7: Run app startup verification**

Run: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000`
Expected: server starts cleanly, `/health` returns `{"status":"ok"}`.

- [ ] **Step 8: Commit the operational foundation**

```bash
git add backend/Dockerfile docker-compose.yml backend/.env.example docs/superpowers/specs/2026-03-24-backend-system-foundation-design.md
git commit -m "chore: add backend runbook and mysql docker setup"
```
