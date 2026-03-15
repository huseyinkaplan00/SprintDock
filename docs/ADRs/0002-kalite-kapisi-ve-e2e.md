# ADR-0002: Quality Gate and End-to-End Validation

## Status

Accepted.

## Context

The project needs a repeatable baseline that proves build health, test coverage, and deploy readiness beyond local manual checks.

## Decision

- Add a CI workflow that runs:
  - lint
  - unit/integration tests
  - production build
  - Docker smoke validation
  - Playwright E2E flow
- Keep a single end-to-end flow covering login, project creation, task creation, task detail navigation, and comment creation.

## Consequences

- Regression detection happens earlier
- The repository is easier to evaluate as a portfolio project
- Changes to auth, CRUD, or realtime flows become harder to merge without evidence
