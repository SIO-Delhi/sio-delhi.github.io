# Security Audit Checklist

Status: **In Progress**
Last updated: 2026-02-11

## SQL Injection

- [x] All queries use PDO prepared statements with `?` placeholders
- [x] No string concatenation in SQL queries
- [x] `$_GET`, `$_POST`, `$_REQUEST` never used directly in SQL

**Verification**: Grep all `.php` files for direct variable usage in queries.

## XSS (Cross-Site Scripting)

- [x] React JSX auto-escapes all `{variable}` output
- [ ] Audit for `dangerouslySetInnerHTML` usage — verify all inputs are sanitized with DOMPurify
- [x] PHP API returns JSON only (no HTML rendering of user content)
- [x] Input sanitization helpers in `api/validate.php`

**Verification**: Search for `dangerouslySetInnerHTML` and `innerHTML` in frontend code.

## CSRF (Cross-Site Request Forgery)

- [x] Auth uses `Authorization: Bearer` header (not cookies)
- [x] Browsers don't auto-attach custom headers on cross-origin requests
- [x] No endpoint falls back to cookie auth

## Authentication & Authorization

- [x] All non-public routes call `requireAuth()` in `api/index.php`
- [x] JWT signature verified (RS256) via Clerk JWKS
- [x] Role checked server-side for all write operations
- [x] Public routes explicitly listed in `$publicRoutes` array

**Verification**: Test each endpoint with: no token (401), member token on admin routes (403), tampered token (401).

## IDOR (Insecure Direct Object Reference)

- [x] Unit presidents can only see their unit's members
- [x] Regional presidents can only see their region's data
- [ ] Verify message endpoints check sender/recipient ownership
- [ ] Verify edit request endpoints check member scope

## File Upload

- [x] Upload directory blocks PHP execution (`.htaccess` with `php_flag engine off`)
- [x] Separate `.htaccess` in `api/uploads/` directory
- [x] File size limits enforced (16MB max in `.htaccess`)
- [x] MIME type validation in upload handlers
- [ ] Verify UUID filenames used (no original filenames)
- [ ] Verify path traversal prevention (`../` stripped)

## Sensitive Data Exposure

- [x] `.env` in `.gitignore`
- [x] `.env.example` contains only placeholder values
- [x] PHP `display_errors` should be `Off` in production
- [x] API error responses return generic messages (no stack traces)
- [x] `logError()` logs details server-side only
- [ ] Verify `formatUser()` never returns password field
- [ ] Run `git log --all -p -- .env` to check git history

## HTTP Security Headers

- [x] `X-Content-Type-Options: nosniff`
- [x] `X-Frame-Options: DENY`
- [x] `X-XSS-Protection: 1; mode=block`
- [x] `Strict-Transport-Security` (HSTS)
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [x] `Content-Security-Policy` configured

**Verification**: `curl -I https://api.siodelhi.org/api/health`

## Rate Limiting

- [x] Login endpoint: 10 attempts per minute per IP
- [x] API write operations: 60 requests per minute per IP
- [x] Returns 429 when exceeded
- [x] File-based rate limiting (no Redis dependency)

## CORS

- [x] Explicit allowlist of origins in `api/index.php`
- [x] `Access-Control-Allow-Origin` set dynamically based on request origin
- [x] `Access-Control-Allow-Credentials: true`
- [x] Localhost/127.0.0.1 allowed for development only

## Dependencies

- [ ] Run `npm audit --production` — target 0 critical/high
- [ ] Review any dependency with > 1 year since last update
- [ ] Pin dependency versions in `package.json`

## Body Size Limits

- [x] 1MB limit on POST/PUT requests (except uploads and avatars)
- [x] 16MB upload limit in `.htaccess`
- [x] `enforceBodyLimit()` called in router

## Access Control for Sensitive Files

- [x] `config.php` and `db.php` blocked by `.htaccess`
- [x] `.env` blocked by `.htaccess`
- [x] `.clerk_jwks_cache.json` blocked by `.htaccess`
- [x] `api/logs/` blocked by `.htaccess` (created dynamically)

## Verification Commands

```bash
# Check for secrets in git history
git log --all -p -- .env | head -50

# Check npm vulnerabilities
npm audit --production

# Verify security headers
curl -I https://api.siodelhi.org/api/health

# Test rate limiting (run 11 times rapidly)
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}" -X POST https://api.siodelhi.org/api/portal/auth/me; echo; done

# Test auth required
curl -s https://api.siodelhi.org/api/portal/users | jq .

# Test CORS from disallowed origin
curl -s -H "Origin: https://evil.com" -I https://api.siodelhi.org/api/health | grep Access-Control
```
