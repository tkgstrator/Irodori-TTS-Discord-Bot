import { Hono } from 'hono'
import { auth } from './routes/auth'
import { meSettings } from './routes/me-settings'
import { speakers } from './routes/speakers'
import type { SessionVariables } from './session'

export const api = new Hono<{ Variables: SessionVariables }>()

api.get('/health', (c) => c.json({ status: 'ok' }))

api.route('/auth', auth)
api.route('/me', meSettings)
api.route('/speakers', speakers)
