/**
 * Post-build prerendering script.
 *
 * After `vite build`, this script:
 * 1. Starts a local preview server
 * 2. Uses Puppeteer to visit each route
 * 3. Saves the rendered HTML (with meta tags from react-helmet-async)
 *
 * Usage: npm run build && node scripts/prerender.mjs
 *
 * Prerequisites: npm install -D puppeteer
 */

import { createServer } from 'http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { fetchRoutes } from './fetch-routes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST_DIR = join(__dirname, '..', 'dist')

// Simple static file server for the dist directory
function startServer(port = 4173) {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.webmanifest': 'application/manifest+json',
    }

    const server = createServer((req, res) => {
        let filePath = join(DIST_DIR, req.url === '/' ? '/index.html' : req.url)

        // SPA fallback: if file doesn't exist, serve index.html
        if (!existsSync(filePath)) {
            filePath = join(DIST_DIR, 'index.html')
        }

        try {
            const content = readFileSync(filePath)
            const ext = '.' + filePath.split('.').pop()
            const mime = mimeTypes[ext] || 'application/octet-stream'
            res.writeHead(200, { 'Content-Type': mime })
            res.end(content)
        } catch {
            res.writeHead(404)
            res.end('Not Found')
        }
    })

    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`Preview server running on http://localhost:${port}`)
            resolve(server)
        })
    })
}

async function prerender() {
    // Check if puppeteer is available
    let puppeteer
    try {
        puppeteer = await import('puppeteer')
    } catch {
        console.log('Puppeteer not installed. Skipping prerendering.')
        console.log('To enable prerendering: npm install -D puppeteer')
        return
    }

    if (!existsSync(DIST_DIR)) {
        console.error('dist/ directory not found. Run `vite build` first.')
        process.exit(1)
    }

    const routes = await fetchRoutes()
    console.log(`Prerendering ${routes.length} routes...`)

    const server = await startServer()
    const browser = await puppeteer.default.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    let success = 0
    let failed = 0

    for (const route of routes) {
        try {
            const page = await browser.newPage()

            // Navigate and wait for content to load
            await page.goto(`http://localhost:4173${route}`, {
                waitUntil: 'networkidle0',
                timeout: 15000
            })

            // Wait a bit extra for React to hydrate and helmet to set meta tags
            await page.waitForFunction(() => {
                return document.querySelector('title')?.textContent !== ''
            }, { timeout: 5000 }).catch(() => { /* title might be set already */ })

            const html = await page.content()
            await page.close()

            // Write to dist directory
            const filePath = route === '/'
                ? join(DIST_DIR, 'index.html')
                : join(DIST_DIR, `${route}/index.html`)

            mkdirSync(dirname(filePath), { recursive: true })
            writeFileSync(filePath, html)
            success++
            console.log(`  [OK] ${route}`)
        } catch (err) {
            failed++
            console.error(`  [FAIL] ${route}: ${err.message}`)
        }
    }

    await browser.close()
    server.close()

    console.log(`\nPrerendering complete: ${success} succeeded, ${failed} failed`)
}

prerender()
