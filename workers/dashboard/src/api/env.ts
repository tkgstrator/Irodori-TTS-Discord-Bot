import { z } from 'zod'

/**
 * dashboard の環境変数スキーマ
 *
 * Bot と同じ Redis を共有するため `REDIS_URL` の既定値は compose のサービス名を指す。
 */
const EnvSchema = z.object({
  /** Bot と共有する Redis の接続URL */
  REDIS_URL: z.string().nonempty().default('redis://redis:6379'),
  // OAuth 系は開発用バイパス利用時に未設定でも起動できるよう optional にし、
  // 実際にログイン処理へ入る時点で存在チェックする（discord.ts の requireOAuthConfig）。
  /** Discord アプリケーションのクライアントID */
  DISCORD_CLIENT_ID: z.string().optional(),
  /** Discord アプリケーションのクライアントシークレット */
  DISCORD_CLIENT_SECRET: z.string().optional(),
  /** OAuth のリダイレクト先（Discord Developer Portal に登録した値と一致させる） */
  OAUTH_REDIRECT_URI: z.string().optional(),
  /**
   * 話者未設定ユーザーに割り当てる既定の話者UUID（Bot と同じ値を設定する）
   *
   * 未設定でも起動できるようにし、その場合は Irodori-TTS の先頭の話者に
   * フォールバックする（tts.ts の resolveDefaultSpeakerId）。
   */
  DEFAULT_SPEAKER_ID: z.string().optional(),
  /** Irodori-TTS サーバーのベースURL */
  IRODORI_TTS_BASE_URL: z.string().nonempty().default('http://irodori-tts:8765'),
  /** Cookie に Secure 属性を付けるか（本番は true） */
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  // DEV_AUTH_BYPASS 自体は dev-auth.ts が process.env から直接読む。
  // 認証を外すゲートがキャッシュ状態に左右されないようにするため、ここでは扱わない。
  /** バイパス時に成りすますDiscordユーザーID */
  DEV_AUTH_USER_ID: z.string().nonempty().default('000000000000000000'),
  /** バイパス時に表示するユーザー名 */
  DEV_AUTH_USERNAME: z.string().nonempty().default('dev-user')
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
