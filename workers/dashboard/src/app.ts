import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import { rateLimiter } from 'hono-rate-limiter'
import { api } from './api/api'
import type { SessionVariables } from './api/session'

// このアプリの前に立つ信頼できるリバースプロキシの数。
// 各プロキシは `x-forwarded-for` の右端に接続元を追加していくため、
// 偽装を許さずに実クライアントIPを得るには `length - hops` を読む。
const trustedProxyHops = (() => {
  const parsed = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
})()

const resolveClientIp = (c: { req: { header: (name: string) => string | undefined } }): string => {
  const forwardedFor = c.req.header('x-forwarded-for')
  if (!forwardedFor) {
    return c.req.header('cf-connecting-ip') ?? '127.0.0.1'
  }

  const hops = forwardedFor
    .split(',')
    .map((hop) => hop.trim())
    .filter((hop) => hop.length > 0)

  const trustedIndex = hops.length - trustedProxyHops
  return (trustedIndex >= 0 ? hops[trustedIndex] : hops[0]) ?? '127.0.0.1'
}

const app = new Hono<{ Variables: SessionVariables }>()

app.use(logger())

// OAuth のコールバックは Discord からの遷移で Origin を持たないため CSRF 判定から外す。
app.use('/api/*', async (c, next) => {
  if (c.req.path.startsWith('/api/auth/callback') || c.req.path.startsWith('/api/auth/login')) {
    return next()
  }
  return csrf()(c, next)
})

app.use(
  '/api/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    keyGenerator: (c) => resolveClientIp(c)
  })
)

app.route('/api', api)

export default app
