---
name: phase-plan
description: View the production readiness phase plan for SIO Delhi. Shows current progress across 17 phases covering security, testing, performance, CI/CD, and deployment. Use when asked about the project roadmap, what to work on next, or production readiness status.
disable-model-invocation: true
---

# Production Readiness Phase Plan

17 sequential phases to take SIO Delhi portal from functional to production-grade. Phases are ordered by dependency and impact. Manual deployment — no automated deploy pipelines.

## Phase Status Legend
- Not started
- In progress
- Complete

## Phase 1: Security & Environment Hardening
Create `.env.example`, verify `.gitignore`, add CSP headers to `api/.htaccess`, rate limiting on login, input length limits on all PHP endpoints, sanitize user-generated text.

## Phase 2: Database Migration System
Replace ad-hoc `portalSetup()` ALTERs with numbered SQL files in `api/migrations/`, create `api/migrate.php` runner with `_migrations` tracking table, document schema in `DESIGN/SCHEMA.md`.

## Phase 3: Code Quality Gates
Add Prettier config, Husky + lint-staged for pre-commit hooks, enable ESLint CI job, tighten ESLint rules from warn to error, add `npm run typecheck` script.

## Phase 4: Frontend API Validation
Define Zod schemas for critical API responses (user, unit, message, perf form) in `src/portal/schemas.ts`. Add `safeParse` wrapper to `api.ts`. Log validation failures in dev.

## Phase 5: Error Handling & Monitoring
Add React Error Boundary wrapping portal routes. Global unhandled rejection handler. Structured PHP error logging (file-based, daily rotation) in `api/logger.php`.

## Phase 6: Accessibility Audit
ARIA labels on icon-only buttons, form label associations, keyboard nav in dialogs (focus trap, Escape), `role="alert"` on errors, screen reader testing, color contrast 4.5:1. Target WCAG 2.1 AA.

## Phase 7: Unit Test Coverage (Target: 60%)
Test utils (csv-utils, constants, date formatting), API client with MSW mocks, React hooks (useNotifications, usePortalAuth), key components (DataTable, DateInput, StatusBadge, EditDialog), permission logic.

## Phase 8: Playwright E2E Setup
Install Playwright, configure `playwright.config.ts`, create auth fixtures for each role, helper utilities, first smoke test (login → dashboard loads).

## Phase 9: E2E Test Suite — Core Flows
Admin member CRUD, CSV import, member profile edit verification, unit president approve/reject, inactive with reasons, revoke + restore, messaging end-to-end, performance form lifecycle, migration flow, mobile viewport.

## Phase 10: Performance Optimization (Portal + Home Page)
**Portal:** Code-split routes with `React.lazy()`, lazy-load Tiptap/charts/Three.js.
**Home page:** Lazy-load Three.js scenes on scroll, defer 14+ font families, compress hero images (WebP/AVIF), tree-shake GSAP plugins, preload critical assets.
**Build:** Split vendor chunks (react, three, gsap, leaflet, tiptap), target initial bundle < 500KB (currently 3.7MB). Add DB indexes on phone, unit_id, status, region_id.

## Phase 11: Backend API Hardening
Request body size limits, CORS configuration, request/response logging, health check endpoint (`GET /api/health`), consistent error response format.

## Phase 12: Real-Time Features (Optional)
Evaluate SSE vs WebSocket vs keep polling. SSE recommended (simpler, PHP-compatible). Add SSE endpoint for notifications, EventSource in NotificationContext with polling fallback.

## Phase 13: Documentation
Rewrite README.md, document all API endpoints in `DESIGN/API.md`, document database schema in `DESIGN/SCHEMA.md`, JSDoc on exported functions.

## Phase 14: CI/CD Quality Gates
CI: lint → typecheck → unit tests → build → E2E tests. Add test coverage threshold (fail < 50%), bundle size check. No automated deployment — commits and deploys are manual.

## Phase 15: Security Audit
Full penetration test of: SQL injection, XSS, CSRF, auth bypass, IDOR, file upload shells, sensitive data exposure, broken access control, HTTP headers, rate limiting, dependency CVEs. Use `/security-audit` skill for detailed checklist with exploitation scenarios.

## Phase 16: Production Deployment (Manual)
Document deployment steps for frontend (GitHub Pages) and API (cPanel FTP/SSH). Environment-specific configs (dev, staging, prod). Database backups (cPanel cron + mysqldump daily).

## Phase 17: Post-Deployment Verification
Verify all roles login, dashboard stats correct, member CRUD works, messaging delivers, perf forms work, migrations process, avatar upload works, notifications appear, mobile responsive. Lighthouse targets: Performance > 85, Accessibility > 90, Best Practices > 90.
