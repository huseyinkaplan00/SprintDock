# Applied Improvements

This document summarizes the key improvements implemented in SprintDock to make the product more robust, deployable, and easier to evaluate.

## 1) CI and Quality Gate

File: `.github/workflows/ci.yml`

Checks included:

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Docker smoke validation
- Playwright end-to-end flow

Effect:

- Every change passes through the same baseline quality gate
- Lower regression risk across local and hosted environments

## 2) End-to-End Flow Coverage

Files:

- `apps/web/playwright.config.js`
- `apps/web/e2e/auth-and-crud.spec.js`

Covered flow:

- OTP login
- Project creation
- Task creation
- Task detail navigation
- Comment creation

## 3) UI Consistency

Implemented:

- Protected pages share a single application shell
- Sidebar and topbar are standardized
- Tables, toasts, and form behaviors are consolidated into shared UI components

## 4) Frontend Performance

File: `apps/web/src/app/routes/index.jsx`

Implemented:

- Route-based lazy loading with `React.lazy`
- `Suspense` fallbacks and skeleton loading states

## 5) Realtime Deployment Readiness

Implemented:

- Frontend reads hosted API endpoints from environment variables instead of local/ngrok URLs
- API and worker are cleanly separated for managed services
- Worker supports a `/health` endpoint when deployed as a web service

## 6) Mobile UX Hardening

Implemented:

- Full OTP paste support
- Reduced iOS input zoom issues
- Improved keyboard/focus visibility when the mobile keyboard opens
- Simplified table scrolling behavior on narrow screens

## 7) Information Architecture

Implemented:

- Reduced raw ObjectId exposure in the UI
- Removed repeated metadata blocks where possible
- Improved task and project breadcrumb/title rendering

## 8) Deployment Reliability

Implemented:

- Replaced native `bcrypt` with deploy-friendly `bcryptjs`
- Added `PORT`-aware boot behavior and health compatibility
- Aligned CORS and Socket allowlists with the Vercel + Render deployment model

Note: Public API contracts remain unchanged. Endpoint paths, Rabbit routing keys, and Socket event names are intentionally preserved.
