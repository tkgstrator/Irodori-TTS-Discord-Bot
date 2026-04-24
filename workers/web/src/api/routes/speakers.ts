import { Hono } from 'hono'
import { SpeakerIdSchema } from '@/schemas/speaker.dto'
import { getSpeakerImportTemplate, listSpeakerImports } from '../speaker-import'

export const speakers = new Hono()

speakers.get('/', async (c) => {
  const rows = await listSpeakerImports()
  return c.json(rows)
})

speakers.get('/:speakerId/template', async (c) => {
  const speakerIdResult = SpeakerIdSchema.safeParse(c.req.param('speakerId'))

  if (!speakerIdResult.success) {
    return c.json({ error: 'Invalid speaker id' }, 400)
  }

  const template = await getSpeakerImportTemplate(speakerIdResult.data)

  if (!template) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json(template)
})
