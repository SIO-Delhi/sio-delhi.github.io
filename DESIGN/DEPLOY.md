# Deployment Guide

## Frontend (GitHub Pages)

### Build & Deploy

```bash
# Option 1: Automated script
./scripts/deploy-frontend.sh

# Option 2: Manual
npm run build
npx gh-pages -d dist
```

### Requirements
- `VITE_CLERK_PUBLISHABLE_KEY` set in `.env`
- `VITE_API_URL` set to `https://api.siodelhi.org` for production builds

### Verification
- [ ] Visit https://siodelhi.org — home page loads
- [ ] Visit https://siodelhi.org/portal — redirects to login
- [ ] Check browser console for errors
- [ ] Verify no `VITE_` secrets exposed (only publishable key)

## API (cPanel FTP/SSH)

### Deploy

```bash
# Option 1: Automated script (requires lftp + env vars)
FTP_HOST=ftp.siodelhi.org FTP_USER=user FTP_PASS=pass FTP_PATH=/public_html/api ./scripts/deploy-api.sh

# Option 2: Manual FTP upload
# Upload api/ contents to server, excluding:
#   - .env (already on server)
#   - logs/ (server-only)
#   - uploads/ (server-only, user data)
#   - .clerk_jwks_cache.json (server-only)
```

### Requirements
- `api/.env` configured on server with production credentials
- MySQL database accessible from cPanel
- PHP 8.0+ with PDO MySQL extension

### Post-Deploy

```bash
# Run migrations (if schema changed)
php api/migrate.php

# Verify health
curl https://api.siodelhi.org/api/health
# Expected: {"status":"ok","message":"API is running","db":"connected"}
```

## Post-Deployment Verification

### Functional Checks

- [ ] **Health check**: `GET /api/health` returns `{ status: "ok", db: "connected" }`
- [ ] **Login**: Admin, zonal, regional, unit president, member can all log in
- [ ] **Dashboard**: Stats load correctly for each role
- [ ] **Member CRUD**: Add, edit, delete member works end-to-end
- [ ] **Messaging**: Compose and send a message, verify in recipient inbox
- [ ] **Performance**: Create form, fill it, view responses
- [ ] **Migrations**: Create request, approve it, verify member reassigned
- [ ] **Avatar upload**: Upload photo, verify it displays
- [ ] **Notifications**: Badge updates when new messages arrive
- [ ] **Mobile**: Test on real phone — sidebar collapses, tables scroll

### Performance Checks

- [ ] Lighthouse Performance score > 85
- [ ] Lighthouse Accessibility score > 90
- [ ] Lighthouse Best Practices score > 90
- [ ] Portal dashboard loads in < 2s on 4G
- [ ] Home page FCP < 1.5s on desktop

### Security Checks

- [ ] `curl -I` on API shows all security headers
- [ ] No console errors on any page
- [ ] `.env` file not accessible via web
- [ ] Upload directory doesn't execute PHP

## Rollback

### Frontend
```bash
# GitHub Pages keeps history — revert to previous commit
git log --oneline gh-pages
git checkout gh-pages
git reset --hard <previous-commit>
git push -f origin gh-pages
```

### API
```bash
# Keep a backup before deploying
cp -r api/ api_backup_$(date +%Y%m%d)/

# Restore from backup
cp -r api_backup_YYYYMMDD/* api/
```

### Database
```bash
# Daily backup (set up as cPanel cron)
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_$(date +%Y%m%d).sql

# Restore
mysql -u $DB_USER -p$DB_PASS $DB_NAME < backup_YYYYMMDD.sql
```
