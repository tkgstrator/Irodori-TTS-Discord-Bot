import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'

const SCREENSHOT_DIR = path.resolve(import.meta.dirname, '..', 'screenshots')

async function stubCharactersApi(page: Page) {
  await page.route('**/api/characters', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '[]'
    })
  })
}

async function ensureScreenshotDir() {
  await mkdir(SCREENSHOT_DIR, { recursive: true })
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }))

  expect(
    metrics.rootScrollWidth,
    `root scroll width ${metrics.rootScrollWidth} > viewport ${metrics.innerWidth}`
  ).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(
    metrics.bodyScrollWidth,
    `body scroll width ${metrics.bodyScrollWidth} > viewport ${metrics.innerWidth}`
  ).toBeLessThanOrEqual(metrics.innerWidth + 1)
}

test.describe('settings route', () => {
  test.beforeEach(async ({ page }) => {
    await ensureScreenshotDir()
    await stubCharactersApi(page)
  })

  test('desktop layout and interactions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
    const lightButton = page.getByRole('button', { name: /^ライトモード/ })
    const darkButton = page.getByRole('button', { name: /^ダークモード/ })
    const systemButton = page.getByRole('button', { name: /^システム設定/ })

    await expect(lightButton).toBeVisible()
    await expect(darkButton).toBeVisible()
    await expect(systemButton).toBeVisible()
    await expect(page.getByRole('heading', { name: 'LLM の既定モデル' })).toBeVisible()
    await expect(page.getByText('Gemini 3.1 Pro')).toBeVisible()
    await expect(page.getByText('Gemini 2.0 Flash-Lite')).toBeVisible()
    await expect(page.getByText('★が多いほど、速い・高精度・低コストです。')).toBeVisible()
    await expect(page.getByRole('combobox').first()).toBeVisible()
    await expect(page.getByRole('combobox').nth(1)).toBeVisible()

    const themeToggle = page.getByRole('button', { name: /^現在:/ })
    await expect(themeToggle).toBeVisible()
    await themeToggle.hover()
    await expect(page.getByText(/クリックで.*に切り替え/)).toBeVisible()

    await darkButton.click()
    await expect(darkButton).toHaveAttribute('aria-pressed', 'true')

    const editorModelSelect = page.getByRole('combobox').first()
    await editorModelSelect.click()
    await page.getByRole('option', { name: 'Gemini 3.1 Pro' }).click()
    await expect(editorModelSelect).toContainText('Gemini 3.1 Pro')

    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    await expectNoHorizontalOverflow(page)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'settings-desktop-1440.png'),
      fullPage: true
    })
  })

  test('mobile layout and interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: '設定', exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'モバイルナビゲーション' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'LLM の既定モデル' })).toBeVisible()
    await expect(page.getByText('Editor', { exact: true })).toBeVisible()
    await expect(page.getByText('Writer', { exact: true })).toBeVisible()

    const themeToggle = page.getByRole('button', { name: /^現在:/ })
    await expect(themeToggle).toBeVisible()
    await themeToggle.click()
    await expect(page.getByText(/ライトモード|ダークモード|システム設定/).first()).toBeVisible()

    const lightButton = page.getByRole('button', { name: /^ライトモード/ })
    await expect(
      page.getByText('システム設定は OS の外観に追従します。右上の切り替えはクイックアクションとして利用できます。')
    ).toBeVisible()
    await lightButton.click()
    await expect(lightButton).toHaveAttribute('aria-pressed', 'true')

    const writerModelSelect = page.getByRole('combobox').nth(1)
    await writerModelSelect.click()
    await page.getByRole('option', { name: 'Gemini 2.0 Flash-Lite' }).click()
    await expect(writerModelSelect).toContainText('Gemini 2.0 Flash-Lite')
    await expect(page.getByText('Gemini 2.0 Flash-Lite').first()).toBeVisible()

    await expectNoHorizontalOverflow(page)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'settings-mobile-375.png'),
      fullPage: true
    })
  })
})
