# Local Stable Release Design

**Date:** 2026-03-25
**Project:** BlogAINamLun
**Status:** Approved in-session

## Goal

Ship a local-stable release of BlogAINamLun that can be started, verified, and used repeatedly on the owner's machine without hidden setup drift.

## Product Intent

The project already has real backend and Gemini-backed automation, but the local operator experience still depends too much on memory and ad-hoc commands.

This phase should make the local experience feel reliable by:

- standardizing how local services are started
- reducing environment and migration drift
- giving the owner a repeatable smoke path
- documenting the shortest trustworthy local workflow

## Constraints

### Local-First Constraint

This phase is only about a stable local release.

It does not include:

- production deploy
- CI/CD
- auth and multi-user hardening
- deep observability stacks

### Cost Constraint

Gemini usage should remain optional and conservative during local verification.

Local smoke workflows should:

- prove the app boots and routes are healthy without forcing AI generation every time
- only run a real preview when the owner explicitly wants it and an API key is available

### Simplicity Constraint

The local run flow should stay lightweight.

The owner should not need to remember many custom commands or edit multiple files just to verify the app still works.

## Approved Direction

### Add A Repeatable Local Stable Workflow

The local-stable phase should add three things:

1. a stronger backend helper flow that supports doctor, migrate, and smoke verification cleanly
2. a top-level local stability check script that runs the essential backend and frontend checks in one place
3. a short local runbook that explains the exact startup and smoke flow

## What "Local Stable" Means

The project is considered locally stable when:

- MySQL sandbox or another documented local database path can be started reliably
- backend migrations match current code
- backend boots cleanly
- frontend builds and tests pass
- health endpoints respond correctly
- automation settings and history routes are reachable
- optional Gemini preview can be tested with one controlled call

## Local Workflow Design

The local operator flow should be:

1. start local MySQL sandbox if needed
2. run backend doctor
3. run migrations
4. run backend smoke
5. run frontend tests and build
6. optionally run one real AI preview

This should be expressible through one short runbook and one or two scripts at most.

## Backend Helper Expectations

`scripts/backend-dev.ps1` should be extended so it can help with local-stable verification, not only developer bootstrapping.

Recommended capabilities:

- keep existing `doctor`, `test`, `serve`, `migrate`
- add a `smoke` action
- support a simple way to target the local MySQL sandbox URL
- report whether Gemini is configured without printing the secret itself

The smoke action should:

- optionally run migrations first
- start the backend temporarily on a local port
- wait for `/health` and `/health/ready`
- verify a small set of API routes
- optionally attempt one real preview when requested and when Gemini is configured

## Top-Level Stable Check Script

The repo should also provide a top-level local check command that ties the moving pieces together.

Recommended responsibilities:

- start the MySQL sandbox if requested
- run backend doctor
- run backend tests
- run migrations
- run backend smoke
- run frontend tests
- run frontend build

This script should optimize for confidence, not minimal runtime.

## Documentation Design

The project currently lacks a simple root-level readme-like operator guide.

This phase should add a concise local runbook with:

- prerequisites
- exact commands
- what success looks like
- what to do if Gemini is not configured
- how to trigger one real preview safely

The runbook should be short enough that the owner can actually use it during day-to-day work.

## Error Handling Expectations

Local tooling should fail early and clearly when:

- no usable Python exists
- MySQL sandbox binaries are missing
- database migration fails
- backend health never becomes ready
- Gemini preview is requested without a configured key

The scripts should explain what is missing instead of silently continuing.

## Testing And Verification

This phase should include:

- repo-level tests that assert the new local scripts and docs exist and expose the expected actions
- fresh backend test execution
- fresh frontend test execution
- fresh frontend build
- one local smoke verification through the scripted path

## Success Criteria

This design is successful when:

- the owner can follow one documented local workflow and get the app running
- backend and frontend checks can be triggered repeatably from scripts
- migrations and health checks are part of the standard local verification path
- Gemini preview remains optional but easy to smoke test when configured
- the project feels operationally stable on local before any production work begins
