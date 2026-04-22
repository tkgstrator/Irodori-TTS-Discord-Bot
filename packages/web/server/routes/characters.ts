import { Hono } from 'hono'
import { CharacterIdSchema, CharacterInputSchema } from '../../schemas/character.dto'
import { db } from '../db'

export const characters = new Hono()

const characterInclude = {
  speaker: true
} as const

// 連携先の話者 ID が有効かを確認する
const hasValidSpeaker = async (speakerId: string | null) => {
  if (speakerId === null) {
    return true
  }

  const speaker = await db.speaker.findUnique({
    where: {
      id: speakerId
    }
  })

  return speaker !== null
}

characters.get('/', async (c) => {
  const rows = await db.character.findMany({
    include: characterInclude,
    orderBy: {
      createdAt: 'desc'
    }
  })

  return c.json(rows)
})

characters.get('/:id', async (c) => {
  const idResult = CharacterIdSchema.safeParse(c.req.param('id'))

  if (!idResult.success) {
    return c.json({ error: 'Invalid character id' }, 400)
  }

  const row = await db.character.findUnique({
    where: {
      id: idResult.data
    },
    include: characterInclude
  })

  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

characters.post('/', async (c) => {
  const bodyResult = CharacterInputSchema.safeParse(await c.req.json())

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  if (!(await hasValidSpeaker(bodyResult.data.speakerId))) {
    return c.json({ error: 'Invalid speaker id' }, 400)
  }

  const row = await db.character.create({
    data: bodyResult.data,
    include: characterInclude
  })

  return c.json(row, 201)
})

characters.put('/:id', async (c) => {
  const idResult = CharacterIdSchema.safeParse(c.req.param('id'))
  const bodyResult = CharacterInputSchema.safeParse(await c.req.json())

  if (!idResult.success) {
    return c.json({ error: 'Invalid character id' }, 400)
  }

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  if (!(await hasValidSpeaker(bodyResult.data.speakerId))) {
    return c.json({ error: 'Invalid speaker id' }, 400)
  }

  const existing = await db.character.findUnique({ where: { id: idResult.data } })

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  const row = await db.character.update({
    where: { id: idResult.data },
    data: bodyResult.data,
    include: characterInclude
  })

  return c.json(row)
})

characters.delete('/:id', async (c) => {
  const idResult = CharacterIdSchema.safeParse(c.req.param('id'))

  if (!idResult.success) {
    return c.json({ error: 'Invalid character id' }, 400)
  }

  const existing = await db.character.findUnique({ where: { id: idResult.data } })

  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.character.delete({ where: { id: idResult.data } })
  return c.body(null, 204)
})
