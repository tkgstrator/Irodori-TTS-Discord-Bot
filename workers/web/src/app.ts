import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import { rateLimiter } from 'hono-rate-limiter'
import { api } from './api/api'
import { syncSpeakers } from './api/speaker-import'

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

// Number of trusted reverse proxies sitting in front of this app. Each trusted
// proxy appends the address of whoever connected to it to the RIGHT end of the
// `x-forwarded-for` header. To recover the real client address without letting a
// caller spoof the header, we must skip the (hops - 1) rightmost entries added by
// proxy-to-proxy hops and read the next one in — i.e. index `length - hops`.
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

const app = new Hono()

app.use(logger())

app.use(
  '/api/*',
  cors({
    origin: allowedOrigins,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type']
  })
)

app.use('/api/*', csrf())

app.use(
  '/api/*',
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    keyGenerator: (c) => resolveClientIp(c)
  })
)

app.route('/api', api)

export const bootstrap = (): void => {
  syncSpeakers().catch((error) => console.error('Speaker sync failed:', error))
}

export default app
