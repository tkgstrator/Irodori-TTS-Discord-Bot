import { Hono } from 'hono'
import { characters } from './routes/characters'

export const api = new Hono()

api.get('/health', (c) => c.json({ status: 'ok' }))
api.route('/characters', characters)
