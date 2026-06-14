.PHONY: dev build lint typecheck format preview test test-run test-coverage test-ui \
        e2e deploy-backend deploy-frontend deploy-all deploy-sphp migrate test-php help

# Load FTP credentials from .env.local
LOAD_ENV = . $(CURDIR)/.env.local; export

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "── Frontend ──"
	@echo "  dev              Start local dev server (Vite)"
	@echo "  build            Build frontend for production"
	@echo "  preview          Preview production build"
	@echo "  lint             Run ESLint"
	@echo "  typecheck        Run TypeScript type checking"
	@echo "  format           Format code with Prettier"
	@echo "  format:check     Check formatting with Prettier"
	@echo ""
	@echo "── Tests ──"
	@echo "  test             Run Vitest (watch mode)"
	@echo "  test:run         Run Vitest once"
	@echo "  test:coverage    Run Vitest with coverage"
	@echo "  test:ui          Run Vitest with UI"
	@echo "  test-php         Run PHP backend tests"
	@echo "  e2e              Run Playwright E2E tests"
	@echo ""
	@echo "── Deploy ──"
	@echo "  deploy-backend   Deploy PHP API to cPanel (via FTP)"
	@echo "  deploy-frontend  Deploy React frontend to GitHub Pages"
	@echo "  deploy-sphp      Deploy s.php (short-link redirect) to main domain"
	@echo "  deploy-all       Deploy backend + frontend"
	@echo "  migrate          Run DB migrations on production API"

dev:
	npm run dev

build:
	npm run build

preview:
	npm run preview

lint:
	npm run lint

typecheck:
	npm run typecheck

format:
	npm run format

format\:check:
	npm run format:check

test:
	npm run test

test\:run:
	npm run test:run

test\:coverage:
	npm run test:coverage

test\:ui:
	npm run test:ui

test-php:
	@echo "Running PHP backend tests..."
	@for t in api/tests/*_test.php; do \
	  echo "  [$$(basename $$t)]"; \
	  php -f "$$t" 2>&1 | sed 's/^/    /'; \
	  echo ""; \
	done
	@echo "PHP tests done."

e2e:
	npm run e2e

deploy-backend:
	./scripts/deploy-api.sh

deploy-frontend:
	./scripts/deploy-frontend.sh

deploy-sphp:
	@$(LOAD_ENV) \
	echo "Uploading s.php to main domain..."; \
	lftp -c " \
	  set ssl:verify-certificate no; \
	  open -u $$FTP_USER,$$FTP_PASS $$FTP_HOST; \
	  put -O /public_html/ public/s.php; \
	  bye \
	"; \
	echo "s.php deployed."

deploy-all: deploy-backend deploy-frontend

migrate:
	@echo "Running migrations on https://api.siodelhi.org..."
	@curl -s -X POST https://api.siodelhi.org/api/portal/migrate \
	  -H "Content-Type: application/json" \
	  -d '{}' | python3 -m json.tool || echo "Note: run 'php api/migrate.php' directly on the server"
	@echo ""
