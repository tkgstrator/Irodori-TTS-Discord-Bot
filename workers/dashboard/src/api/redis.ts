import Redis from 'ioredis'
import { env } from './env'

/**
 * Redis クライアントのキャッシュ
 *
 * db.ts と同じく遅延初期化し、テスト時に接続が張られないようにする。
 */
const cache = new Map<string, Redis>()

/**
 * Redis クライアントを取得する
 */
const loadRedis = (): Redis => {
  const cached = cache.get('redis')
  if (cached !== undefined) {
    return cached
  }

  const client = new Redis(env.REDIS_URL)
  cache.set('redis', client)
  return client
}

/**
 * Redis クライアントへのアクセサ
 */
export const redis: Redis = new Proxy({} as Redis, {
  get: (_target, property: string) => {
    const client = loadRedis()
    const value = client[property as keyof Redis]
    return typeof value === 'function' ? value.bind(client) : value
  }
})

/**
 * JSON.parse の結果を表す型
 */
type JsonParseResult<T> = { ok: true; value: T } | { ok: false }

/**
 * JSON.parse を例外を投げずに実行する
 * @param data パース対象の文字列
 */
export const safeJsonParse = <T>(data: string): JsonParseResult<T> => {
  try {
    return { ok: true, value: JSON.parse(data) as T }
  } catch {
    return { ok: false }
  }
}

/**
 * キー単位で Read-Modify-Write を直列化するための in-flight キュー
 *
 * Bot 側と同じくプロセス内でのみ有効。Bot とダッシュボードの同時更新は
 * last-write-wins になるが、設定は低頻度更新なので許容する。
 */
const inFlight = new Map<string, Promise<unknown>>()

/**
 * 指定キーに紐づく処理を直列化して実行する
 * @param key 直列化の単位となるキー
 * @param fn 直列に実行したい処理
 */
export const withSerialized = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  const prev = inFlight.get(key) ?? Promise.resolve()
  const next = prev.then(fn, fn)
  inFlight.set(key, next)
  try {
    return await next
  } finally {
    if (inFlight.get(key) === next) inFlight.delete(key)
  }
}
