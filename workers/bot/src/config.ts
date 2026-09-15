import { z } from 'zod'

/**
 * 環境変数のスキーマ定義
 */
const EnvSchema = z.object({
  DISCORD_TOKEN: z.string().nonempty('DISCORD_TOKEN is required'),
  /** Irodori-TTS サーバーの `/v1` まで含むベースURL */
  IRODORI_TTS_BASE_URL: z.url().default('http://irodori-tts:8088/v1'),
  /** Irodori-TTS サーバーのAPIキー */
  IRODORI_TTS_API_KEY: z.string().nonempty().optional(),
  /** Irodori-TTS サーバーへ渡すモデルID */
  IRODORI_TTS_MODEL: z.string().nonempty().default('irodori-tts'),
  /** デフォルト話者ID（`GET /v1/audio/voices` で取得できる id） */
  DEFAULT_SPEAKER_ID: z.string().nonempty(),
  REDIS_URL: z.string().default('redis://redis:6379'),
  /** 設定用ダッシュボードの公開URL（`/config` が案内する先） */
  DOMAIN_URL: z.url(),
  /** エラー通知用のDiscord Webhook URL（任意） */
  ERROR_WEBHOOK_URL: z.url().optional()
})

/**
 * 環境変数のバリデーション結果
 */
const env = EnvSchema.safeParse(process.env)

if (!env.success) {
  console.error('Environment validation failed:', JSON.stringify(env.error.format(), null, 2))
  process.exit(1)
}

/**
 * バリデーション済みの設定値
 */
export const config = env.data
