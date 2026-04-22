import { Hono } from 'hono'
import { characters } from './routes/characters'
import { speakers } from './routes/speakers'

export const api = new Hono()

api.get('/health', (c) => c.json({ status: 'ok' }))
api.route('/characters', characters)
api.route('/speakers', speakers)
