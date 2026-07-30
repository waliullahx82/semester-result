import { expect, test } from '@playwright/test'

test('search opens a complete individual result', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Find an individual result').fill('2024331001')
  await page.getByRole('button', { name: 'View result' }).click()
  await expect(page.getByRole('heading', { name: 'WASIF JAMIL SIDDIQUE' })).toBeVisible()
  await expect(page.getByText('Complete', { exact: true })).toBeVisible()
  await expect(page.getByRole('table')).toContainText('Capstone Project Work I')
})

test('leaderboard can switch to a course ranking', async ({ page }) => {
  await page.goto('/leaderboard')
  await expect(page.getByText('90 ranked records')).toBeVisible()
  await page.getByLabel('Ranking view').selectOption('eee-0714-1212d')
  await expect(page).toHaveURL(/course=eee-0714-1212d/)
  await expect(page.getByRole('heading', { name: 'Electronic Devices and Circuits Lab' })).toBeVisible()
})

test('analysis provides a chart and equivalent table', async ({ page }) => {
  await page.goto('/analysis')
  await expect(page.getByRole('img', { name: /Grade distribution/ })).toBeVisible()
  await expect(page.getByRole('table')).toBeVisible()
})

test('theme preference persists', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('source PDFs remain directly accessible', async ({ page, request }) => {
  await page.goto('/sources')
  const href = await page.getByRole('link', { name: 'Open PDF' }).first().getAttribute('href')
  expect(href).toBeTruthy()
  const response = await request.get(href!)
  expect(response.ok()).toBeTruthy()
  expect(response.headers()['content-type']).toContain('application/pdf')
})
