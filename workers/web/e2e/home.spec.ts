import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { expect, type Page, test } from '@playwright/test'

const screenshotDir = path.resolve(import.meta.dirname, '..', 'screenshots')

// スクリーンショット出力先を事前に作成する。
const ensureScreenshotDir = async () => {
  await mkdir(screenshotDir, { recursive: true })
}

// 横スクロールが発生していないことを検証する。
const expectNoHorizontalOverflow = async (page: Page) => {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    rootScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth
  }))

  expect(metrics.rootScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1)
}

test.describe('home route', () => {
  test.beforeEach(async () => {
    await ensureScreenshotDir()
  })

  test('desktop layout and interactions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1200 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'キャラクター設計からシナリオ整理まで、今すぐ始められるホーム' })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: '主要メニュー' })).toBeVisible()

    const newCharacterLink = page.getByRole('link', { name: 'キャラクターを追加' })
    const settingsLink = page.getByRole('link', { name: '設定を開く' })

    await expect(newCharacterLink).toBeVisible()
    await expect(settingsLink).toBeVisible()

    await newCharacterLink.hover()
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()

    await expectNoHorizontalOverflow(page)

    await page.screenshot({
      path: path.join(screenshotDir, 'home-desktop-1440.png'),
      fullPage: true
    })
  })

  test('mobile layout and interactions', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'キャラクター設計からシナリオ整理まで、今すぐ始められるホーム' })
    ).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'モバイルナビゲーション' })).toBeVisible()

    const scenariosLink = page.getByRole('link', { name: 'プロット一覧へ' })
    await expect(scenariosLink).toBeVisible()

    await scenariosLink.click()
    await expect(page).toHaveURL(/\/plots$/)
    await page.goto('/')

    await expectNoHorizontalOverflow(page)

    await page.screenshot({
      path: path.join(screenshotDir, 'home-mobile-375.png'),
      fullPage: true
    })
  })
})
