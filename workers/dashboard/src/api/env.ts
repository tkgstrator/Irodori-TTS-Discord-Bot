import { z } from 'zod'

/**
 * dashboard の環境変数スキーマ
 *
 * Bot と同じ Redis を共有するため `REDIS_URL` の既定値は compose のサービス名を指す。
 */
const EnvSchema = z.object({
  /** Bot と共有する Redis の接続URL */
  REDIS_URL: z.string().nonempty().default('redis://redis:6379'),
  /** Discord アプリケーションのクライアントID */
  DISCORD_CLIENT_ID: z.string().nonempty(),
  /** Discord アプリケーションのクライアントシークレット */
  DISCORD_CLIENT_SECRET: z.string().nonempty(),
  /** OAuth のリダイレクト先（Discord Developer Portal に登録した値と一致させる） */
  OAUTH_REDIRECT_URI: z.string().nonempty(),
  /** 話者未設定ユーザーに割り当てる既定の話者UUID（Bot と同じ値を設定する） */
  DEFAULT_SPEAKER_ID: z.string().nonempty(),
  /** Irodori-TTS サーバーのベースURL */
  IRODORI_TTS_BASE_URL: z.string().nonempty().default('http://irodori-tts:8765'),
  /** Cookie に Secure 属性を付けるか（本番は true） */
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true')
})

type Env = z.infer<typeof EnvSchema>

/**
 * 環境変数のパース結果キャッシュ
 *
 * モジュール読み込み時に検証すると環境変数が揃っていないテストで落ちるため、
 * 初回参照時に遅延して検証する。
 */
const cache = new Map<string, Env>()

/**
 * 検証済みの環境変数を取得する
 */
const loadEnv = (): Env => {
  const cached = cache.get('env')
  if (cached !== undefined) {
    return cached
  }

  const parsed = EnvSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid environment variables: ${parsed.error.message}`)
  }

  cache.set('env', parsed.data)
  return parsed.data
}

/**
 * 環境変数へのアクセサ
 *
 * `env.REDIS_URL` のように参照した時点で検証が走る。
 */
export const env: Env = new Proxy({} as Env, {
  get: (_target, property: string) => loadEnv()[property as keyof Env]
})
