#!/bin/bash
# Deploy API to cPanel via FTP
# Usage: ./scripts/deploy-api.sh
#
# Required environment variables:
#   FTP_HOST     — cPanel hostname (e.g., ftp.siodelhi.org)
#   FTP_USER     — FTP username
#   FTP_PASS     — FTP password
#   FTP_PATH     — Remote path (e.g., /public_html/api)
#
# Prerequisites:
#   - lftp installed (apt install lftp / brew install lftp)

set -euo pipefail

# Load credentials from .env.local if present
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ -f "$SCRIPT_DIR/.env.local" ]; then
  set -a
  source "$SCRIPT_DIR/.env.local"
  set +a
fi

echo "=== API Deployment ==="

# Check required vars
for var in FTP_HOST FTP_USER FTP_PASS FTP_PATH; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set. Add to .env.local or export it."
    exit 1
  fi
done

# Check lftp is available
if ! command -v lftp &>/dev/null; then
  echo "Error: lftp is required. Install with: apt install lftp"
  exit 1
fi

# Files/dirs to exclude from upload
EXCLUDES=(
  ".env"
  ".env.example"
  "logs/"
  "tmp/"
  ".clerk_jwks_cache.json"
  "uploads/"
)

EXCLUDE_ARGS=""
for exc in "${EXCLUDES[@]}"; do
  EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude $exc"
done

echo "Syncing api/ to $FTP_HOST:$FTP_PATH ..."

lftp -c "
  set ssl:verify-certificate no;
  open -u $FTP_USER,$FTP_PASS $FTP_HOST;
  mirror --reverse --delete --verbose \
    $EXCLUDE_ARGS \
    api/ $FTP_PATH;
  bye
"

echo "=== API deployed successfully ==="
echo "Run migrations if needed: curl https://api.siodelhi.org/api/health"
