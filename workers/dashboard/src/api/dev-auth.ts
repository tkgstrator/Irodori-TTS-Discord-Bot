import { env } from './env'
import type { Session } from './session'

/**
 * 開発用ログインバイパスが有効かどうか
 *
 * 二重ゲート方式にしている。`DEV_AUTH_BYPASS=true` を立てても
 * `NODE_ENV=production` では常に false になるため、本番ビルドで
 * 事故的に認証が外れることはない。
 */
export const isDevAuthBypassEnabled = (): boolean =>
  process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true'

/**
 * バイパス時に使う擬似セッション
 *
 * Redis には保存せず、リクエストごとに組み立てる。Discordのトークンは
 * 持たないため、ギルド一覧などDiscord APIを叩く機能は利用できない。
 */
export const createDevSession = (): Session => ({
  id: 'dev-auth-bypass',
  data: {
    user: {
      id: env.DEV_AUTH_USER_ID,
      username: env.DEV_AUTH_USERNAME,
      globalName: env.DEV_AUTH_USERNAME,
      avatar: null
    },
    tokens: {
      accessToken: 'dev-auth-bypass',
      refreshToken: 'dev-auth-bypass',
      expiresAt: Number.MAX_SAFE_INTEGER
    }
  }
})

/**
 * バイパスが有効なら警告を出す
 *
 * 起動時に一度だけ呼び、認証が外れている状態を見落とさないようにする。
 */
export const warnIfDevAuthBypassEnabled = (): void => {
  if (isDevAuthBypassEnabled()) {
    console.warn(
      `[dev-auth] ログインバイパスが有効です（user=${env.DEV_AUTH_USER_ID}）。開発環境専用の設定であることを確認してください。`
    )
  }
}
