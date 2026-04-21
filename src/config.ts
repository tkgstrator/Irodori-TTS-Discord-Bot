import { z } from 'zod'

/**
 * 環境変数のスキーマ定義
 */
const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().nonempty('DISCORD_TOKEN is required'),
  /** Irodori-TTS サーバーのベースURL */
  IRODORI_TTS_BASE_URL: z.url().default('http://irodori-tts:8765'),
  /** デフォルト話者UUID（`GET /speakers` で取得できる uuid） */
  DEFAULT_SPEAKER_ID: z.string().nonempty(),
  REDIS_URL: z.string().default('redis://redis:6379'),
  /** エラー通知用のDiscord Webhook URL（任意） */
  ERROR_WEBHOOK_URL: z.url().optional()
})

/**
 * 環境変数のバリデーション結果
 */
const env = EnvSchema.safeParse(process.env)

if (!env.success) {
  console.error('Environment validation failed:', env.error.format())
  process.exit(1)
}

/**
 * バリデーション済みの設定値
 */
export const config = env.data
