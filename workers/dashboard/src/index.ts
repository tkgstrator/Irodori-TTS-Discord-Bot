import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './app'

app.use('/*', serveStatic({ root: './dist' }))
app.get('/*', serveStatic({ root: './dist', path: '/index.html' }))

const port = (() => {
  const parsed = Number.parseInt(process.env.PORT ?? '18575', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 18575
})()

serve({ fetch: app.fetch, port }, () => {
  console.log(`Dashboard running on http://localhost:${port}`)
})
