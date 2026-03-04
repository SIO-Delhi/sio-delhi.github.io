.PHONY: dev build deploy deploy-prod

# Run the local development server
dev:
	npm run dev

# Build the project locally
build:
	npm run build

# Deploy a preview to Vercel
deploy:
	vercel

# Deploy to Vercel production
deploy-prod:
	vercel --prod
