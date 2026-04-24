import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { api } from './api'

const app = new Hono()

app.use(logger())

app.route('/api', api)

app.use('/*', serveStatic({ root: './dist' }))

app.get('/*', serveStatic({ root: './dist', path: '/index.html' }))

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, () => {
  console.log(`Server running on http://localhost:${port}`)
})
