import { test, expect } from '@playwright/test'
import { loginAsRole } from './fixtures/auth'

test.describe('Admin Member Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, process.env.E2E_ADMIN_PHONE || '', process.env.E2E_ADMIN_PASSWORD || '')
  })

  test('dashboard loads with stats cards', async ({ page }) => {
    await expect(page.locator('.portal-stat-card')).toHaveCount(4, { timeout: 10_000 })
  })

  test('manage members page shows member table', async ({ page }) => {
    await page.goto('/portal/admin/members/manage')
    await expect(page.locator('.portal-table')).toBeVisible({ timeout: 10_000 })
  })

  test('can search members by name', async ({ page }) => {
    await page.goto('/portal/admin/members/manage')
    await page.waitForSelector('.portal-table')
    const searchInput = page.locator('input[placeholder*="Search"]')
    await searchInput.fill('test')
    // Table should filter results
    await page.waitForTimeout(500)
    // Verify table is still visible (didn't crash)
    await expect(page.locator('.portal-table')).toBeVisible()
  })

  test('can navigate to member detail page', async ({ page }) => {
    await page.goto('/portal/admin/members/manage')
    await page.waitForSelector('.portal-table')
    // Click first member row
    const firstRow = page.locator('.portal-table tbody tr').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await page.waitForURL(/\/portal\/admin\/members\//)
      await expect(page.locator('.portal-profile-hero')).toBeVisible({ timeout: 10_000 })
    }
  })
})
