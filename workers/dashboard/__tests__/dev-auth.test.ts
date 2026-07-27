import { afterEach, describe, expect, test } from 'bun:test'

const withEnv = async (vars: Record<string, string | undefined>, fn: () => Promise<void>) => {
  const previous = Object.fromEntries(Object.keys(vars).map((key) => [key, process.env[key]]))
  Object.entries(vars).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  })

  try {
    await fn()
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    })
  }
}

/**
 * env.ts はパース結果をキャッシュするため、毎回モジュールを読み直す
 */
const loadDevAuth = async () => {
  const suffix = Math.trunc(performance.now() * 1000)
  return import(`../src/api/dev-auth.ts?cache=${suffix}`)
}

afterEach(() => {
  delete process.env.DEV_AUTH_BYPASS
})

describe('isDevAuthBypassEnabled', () => {
  test('DEV_AUTH_BYPASSが未設定なら無効', async () => {
    await withEnv(
      { DEV_AUTH_BYPASS: undefined, NODE_ENV: 'development', DEFAULT_SPEAKER_ID: 'speaker-1' },
      async () => {
        const { isDevAuthBypassEnabled } = await loadDevAuth()
        expect(isDevAuthBypassEnabled()).toBe(false)
      }
    )
  })

  test('開発環境でtrueなら有効', async () => {
    await withEnv({ DEV_AUTH_BYPASS: 'true', NODE_ENV: 'development', DEFAULT_SPEAKER_ID: 'speaker-1' }, async () => {
      const { isDevAuthBypassEnabled } = await loadDevAuth()
      expect(isDevAuthBypassEnabled()).toBe(true)
    })
  })

  test('本番環境ではtrueでも必ず無効', async () => {
    await withEnv({ DEV_AUTH_BYPASS: 'true', NODE_ENV: 'production', DEFAULT_SPEAKER_ID: 'speaker-1' }, async () => {
      const { isDevAuthBypassEnabled } = await loadDevAuth()
      expect(isDevAuthBypassEnabled()).toBe(false)
    })
  })
})
