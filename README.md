# SIO Delhi Portal

Organization management portal with member tracking, messaging, performance reviews, and content management.

## Tech Stack

- **Frontend**: React 19 + TypeScript 5.9 + Vite 7
- **Styling**: TailwindCSS 4 + custom portal CSS tokens (dark theme)
- **Auth**: Clerk (JWT RS256, phone/email login)
- **Backend**: PHP (plain) on cPanel shared hosting
- **Database**: MySQL
- **Testing**: Vitest + MSW (unit), Playwright (E2E)
- **CI**: GitHub Actions (lint, typecheck, test, build)
- **Deploy**: GitHub Pages (frontend) + cPanel FTP (API)

## Prerequisites

- Node.js 18+
- npm 9+
- A Clerk account with publishable + secret keys

## Setup

```bash
# Clone and install
git clone <repo-url>
cd siodel
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Clerk publishable key

# For API development
cp api/.env.example api/.env
# Edit api/.env with DB credentials and Clerk secret key
```

## Development

```bash
npm run dev          # Start dev server (https://localhost:443)
```

The Vite dev server proxies `/api` requests to `https://api.siodelhi.org`. For local API development, update the proxy target in `vite.config.ts`.

**Note**: Dev server uses HTTPS with `@vitejs/plugin-basic-ssl`. Add `local.siodelhi.org` to your `/etc/hosts` file pointing to `127.0.0.1` for Clerk authentication to work with production keys.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run unit tests (watch) |
| `npm run test:run` | Run unit tests (once) |
| `npm run test:coverage` | Run tests with coverage |

## Project Structure

```
src/
  components/        # Public site components (layout, admin, UI)
  pages/             # Public site pages (Home, PostDetail, utilities)
  portal/            # Member management portal
    components/      # Portal UI components (DataTable, Sidebar, dialogs)
    pages/           # Portal pages (Dashboard, Manage, ViewMember, etc.)
    hooks/           # Custom hooks (useNotifications, useDialogA11y)
    context/         # React context (PortalAuth, Notifications)
    __tests__/       # Unit tests
    api.ts           # Portal API client
    types.ts         # TypeScript types
    constants.ts     # Role configs, permissions, CSV fields
    schemas.ts       # Zod validation schemas
  context/           # App-level context (Theme, Content, Tool)
  hooks/             # App-level hooks
  lib/               # Shared utilities (api client)

api/
  index.php          # Main API router
  config.php         # Environment config
  db.php             # Database connection (PDO singleton)
  auth.php           # Clerk JWT verification
  rate-limit.php     # File-based rate limiting
  validate.php       # Input validation helpers
  logger.php         # Structured JSON logging
  routes/            # Route handlers
    portal.php       # All portal endpoints
    sections.php     # CMS sections
    posts.php        # CMS posts
    popups.php       # Event popups
    upload.php       # File upload/download
    stats.php        # Storage/DB stats
    forms.php        # Dynamic forms
    analytics.php    # Visit tracking
  migrations/        # Numbered SQL migrations
  uploads/           # User-uploaded files

DESIGN/
  SKILL.md           # Development playbook & phase plan
  SCHEMA.md          # Database schema documentation
  API.md             # API endpoint documentation
```

## Portal Roles

| Role | Access |
|------|--------|
| `admin` | Full access — manage all entities, users, settings |
| `zonal_secretary` | Read-only org view, manage titles/performance/messaging |
| `regional_president` | Manage units and members in assigned region |
| `unit_president` | Manage members in assigned unit |
| `campus_president` | Manage members in assigned campus |
| `member` | View own profile, fill performance forms, messaging |

## Architecture Notes

- **No framework on backend**: PHP uses plain PDO with prepared statements. No ORM, no dependency injection. Functions follow `portalVerbNoun()` naming.
- **Auth flow**: Clerk handles login UI and JWT issuance. Backend verifies JWT signature (RS256) and extracts user claims. Portal user lookup happens via `POST /portal/auth/me`.
- **Role-based filtering**: Backend filters data by role. Unit presidents only see their unit's members. Regional presidents see their region. Admin/zonal see everything.
- **Dark theme**: Portal uses custom CSS properties (`--p-*` tokens) for consistent dark theme across all components.

## Deployment

**Frontend**: Build with `npm run build`, deploy `dist/` to GitHub Pages.

**API**: Upload `api/` directory to cPanel via FTP/SSH. Ensure `.env` is configured on the server.

See `DESIGN/API.md` for endpoint documentation and `DESIGN/SCHEMA.md` for database schema.
