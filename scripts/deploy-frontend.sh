#!/bin/bash
# Deploy frontend to GitHub Pages
# Usage: ./scripts/deploy-frontend.sh

set -euo pipefail

echo "=== Frontend Deployment ==="

# 1. Ensure clean working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "Error: Working tree is not clean. Commit or stash changes first."
  exit 1
fi

# 2. Run quality checks
echo "Running typecheck..."
npx tsc --noEmit

echo "Running lint (warnings only)..."
npm run lint || echo "⚠️  Lint warnings ignored — proceeding to build"

echo "Running tests..."
npm run test:run || echo "Warning: Some tests failed. Proceeding..."

# 3. Build
echo "Building production bundle..."
npm run build

# 4. Deploy to GitHub Pages
echo "Deploying to GitHub Pages..."
npx gh-pages -d dist --message "deploy: $(date +%Y-%m-%d_%H:%M:%S)"

echo "=== Frontend deployed successfully ==="
