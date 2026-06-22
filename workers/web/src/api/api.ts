import { Hono } from 'hono'
import { characters } from './routes/characters'
import { rubyDict } from './routes/ruby-dict'
import { scenarios } from './routes/scenarios'
import { speakers } from './routes/speakers'

export const api = new Hono()

api.get('/health', (c) => c.json({ status: 'ok' }))
api.route('/characters', characters)
api.route('/ruby-dict', rubyDict)
api.route('/scenarios', scenarios)
api.route('/speakers', speakers)
