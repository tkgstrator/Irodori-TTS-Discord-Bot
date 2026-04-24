import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { logger } from 'hono/logger'
import { rateLimiter } from 'hono-rate-limiter'
import { api } from './api/api'

const app = new Hono()

app.use(logger())

app.use(
  '/api/*',
  cors({
    origin: 'http://localhost:3000',
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
    keyGenerator: (c) => c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip') ?? '127.0.0.1'
  })
)

app.route('/api', api)

export default app
