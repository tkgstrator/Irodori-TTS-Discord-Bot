import { test } from '@playwright/test'
import sharp from 'sharp'
import path from 'node:path'

const SCREENSHOT_DIR = path.resolve(import.meta.dirname, '..', 'screenshots')

async function saveAsWebp(buffer: Buffer, name: string) {
  const outputPath = path.join(SCREENSHOT_DIR, `${name}.webp`)
  await sharp(buffer).webp({ quality: 90 }).toFile(outputPath)
}

test('desktop light', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  const buffer = await page.screenshot()
  await saveAsWebp(buffer, 'desktop-light')
})

test('desktop dark', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(300)
  const buffer = await page.screenshot()
  await saveAsWebp(buffer, 'desktop-dark')
})

test('desktop collapsed', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.click('[data-sidebar="trigger"]')
  await page.waitForTimeout(500)
  const buffer = await page.screenshot()
  await saveAsWebp(buffer, 'desktop-collapsed')
})

test('mobile light', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.waitForTimeout(500)
  const buffer = await page.screenshot()
  await saveAsWebp(buffer, 'mobile-light')
})

test('mobile dark', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  await page.waitForTimeout(500)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await page.waitForTimeout(300)
  const buffer = await page.screenshot()
  await saveAsWebp(buffer, 'mobile-dark')
})
