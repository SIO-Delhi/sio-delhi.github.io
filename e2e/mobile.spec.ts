import { test, expect, devices } from '@playwright/test'

test.use(devices['Pixel 5'])

test.describe('Mobile Responsive', () => {
  test('home page is usable on mobile', async ({ page }) => {
    await page.goto('/')
    // Page should load without horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10) // small tolerance
  })

  test('portal login page is usable on mobile', async ({ page }) => {
    await page.goto('/portal/login')
    await expect(page.locator('text=Sign in')).toBeVisible({ timeout: 10_000 })
  })
})
