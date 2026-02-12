import { test as base, type Page } from '@playwright/test'

/**
 * Authentication fixtures for E2E tests.
 * Extends the base test with pre-authenticated page contexts.
 *
 * Note: Clerk auth requires real credentials or a test mode setup.
 * For E2E, we use Clerk's test mode or saved auth state.
 */

export interface AuthFixtures {
  authenticatedPage: Page
}

/**
 * Helper to log into the portal via Clerk UI.
 * Adjust selectors if Clerk's UI components change.
 */
export async function loginAsRole(page: Page, phone: string, password: string) {
  await page.goto('/portal/login')
  // Wait for Clerk sign-in form to load
  await page.waitForSelector('[data-clerk-component]', { timeout: 10_000 }).catch(() => {
    // Clerk might render differently — try alternative selector
  })
  // Fill phone/email and password
  await page.fill('input[name="identifier"]', phone)
  await page.click('button[data-localization-key="formButtonPrimary"]')
  await page.fill('input[name="password"]', password)
  await page.click('button[data-localization-key="formButtonPrimary"]')
  // Wait for portal to load
  await page.waitForURL(/\/portal\/(admin|zonal|regional|unit|member)\/dashboard/, { timeout: 15_000 })
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Default: unauthenticated page — tests should call loginAsRole() themselves
    await use(page)
  },
})

export { expect } from '@playwright/test'
