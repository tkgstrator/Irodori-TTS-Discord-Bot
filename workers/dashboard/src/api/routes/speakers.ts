import { Hono } from 'hono'
import { requireSession, type SessionVariables } from '../session'
import { getSpeakers } from '../tts'

export const speakers = new Hono<{ Variables: SessionVariables }>()

/**
 * 話者一覧を返す
 */
speakers.get('/', requireSession, async (c) => c.json(await getSpeakers()))
