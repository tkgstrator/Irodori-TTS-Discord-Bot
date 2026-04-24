import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import app from './app'

app.use('/*', serveStatic({ root: './dist' }))
app.get('/*', serveStatic({ root: './dist', path: '/index.html' }))

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log('Server running on http://localhost:3000')
})
