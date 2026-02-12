import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SIO Delhi/i)
  })

  test('portal login page loads', async ({ page }) => {
    await page.goto('/portal/login')
    // Should see the login page with Clerk component
    await expect(page.locator('text=Sign in')).toBeVisible({ timeout: 10_000 })
  })

  test('portal redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/portal/admin/dashboard')
    // Should redirect to login
    await page.waitForURL(/\/portal\/login/, { timeout: 10_000 })
  })

  test('API health check returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
  })
})
