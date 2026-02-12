import { test, expect } from '@playwright/test'
import { loginAsRole } from './fixtures/auth'

test.describe('Messaging', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsRole(page, process.env.E2E_ADMIN_PHONE || '', process.env.E2E_ADMIN_PASSWORD || '')
  })

  test('compose page loads', async ({ page }) => {
    await page.goto('/portal/admin/messages/compose')
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 })
  })

  test('inbox page loads', async ({ page }) => {
    await page.goto('/portal/admin/messages/inbox')
    await page.waitForTimeout(2000)
    // Either messages list or empty state should be visible
    const hasMessages = await page.locator('.portal-message-item').first().isVisible().catch(() => false)
    const hasEmpty = await page.locator('text=No messages').isVisible().catch(() => false)
    expect(hasMessages || hasEmpty).toBe(true)
  })
})
