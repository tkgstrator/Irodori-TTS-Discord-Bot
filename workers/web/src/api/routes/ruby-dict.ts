import { Hono } from 'hono'
import {
  RubyDictEntryIdSchema,
  RubyDictEntryInputSchema,
  RubyDictIdSchema,
  RubyDictInputSchema
} from '@/schemas/ruby-dict.dto'
import { db } from '../db'

export const rubyDict = new Hono()

rubyDict.get('/', async (c) => {
  const rows = await db.rubyDict.findMany({
    include: { entries: true },
    orderBy: { name: 'asc' }
  })
  return c.json(rows)
})

rubyDict.post('/', async (c) => {
  const bodyResult = RubyDictInputSchema.safeParse(await c.req.json())
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }
  const row = await db.rubyDict.create({
    data: { name: bodyResult.data.name },
    include: { entries: true }
  })
  return c.json(row, 201)
})

rubyDict.put('/:id', async (c) => {
  const idResult = RubyDictIdSchema.safeParse(c.req.param('id'))
  const bodyResult = RubyDictInputSchema.safeParse(await c.req.json())

  if (!idResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  const existing = await db.rubyDict.findUnique({ where: { id: idResult.data } })
  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  const row = await db.rubyDict.update({
    where: { id: idResult.data },
    data: { name: bodyResult.data.name },
    include: { entries: true }
  })
  return c.json(row)
})

rubyDict.delete('/:id', async (c) => {
  const idResult = RubyDictIdSchema.safeParse(c.req.param('id'))
  if (!idResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }

  const existing = await db.rubyDict.findUnique({ where: { id: idResult.data } })
  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.rubyDict.delete({ where: { id: idResult.data } })
  return c.body(null, 204)
})

rubyDict.get('/:dictId/entries', async (c) => {
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))
  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }

  const rows = await db.rubyDictEntry.findMany({
    where: { dictId: dictIdResult.data },
    orderBy: { word: 'asc' }
  })
  return c.json(rows)
})

rubyDict.post('/:dictId/entries', async (c) => {
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))
  const bodyResult = RubyDictEntryInputSchema.safeParse(await c.req.json())

  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  const dict = await db.rubyDict.findUnique({ where: { id: dictIdResult.data } })
  if (!dict) {
    return c.json({ error: 'Dictionary not found' }, 404)
  }

  const existing = await db.rubyDictEntry.findFirst({
    where: { word: bodyResult.data.word, dictId: dictIdResult.data }
  })
  if (existing) {
    return c.json({ error: 'Duplicate word in this dictionary' }, 409)
  }

  const row = await db.rubyDictEntry.create({
    data: { word: bodyResult.data.word, reading: bodyResult.data.reading, dictId: dictIdResult.data }
  })
  return c.json(row, 201)
})

rubyDict.put('/:dictId/entries/:entryId', async (c) => {
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))
  const entryIdResult = RubyDictEntryIdSchema.safeParse(c.req.param('entryId'))
  const bodyResult = RubyDictEntryInputSchema.safeParse(await c.req.json())

  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }
  if (!entryIdResult.success) {
    return c.json({ error: 'Invalid entry id' }, 400)
  }
  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  const existing = await db.rubyDictEntry.findFirst({
    where: { id: entryIdResult.data, dictId: dictIdResult.data }
  })
  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  const row = await db.rubyDictEntry.update({
    where: { id: entryIdResult.data },
    data: { word: bodyResult.data.word, reading: bodyResult.data.reading }
  })
  return c.json(row)
})

rubyDict.delete('/:dictId/entries/:entryId', async (c) => {
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))
  const entryIdResult = RubyDictEntryIdSchema.safeParse(c.req.param('entryId'))

  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }
  if (!entryIdResult.success) {
    return c.json({ error: 'Invalid entry id' }, 400)
  }

  const existing = await db.rubyDictEntry.findFirst({
    where: { id: entryIdResult.data, dictId: dictIdResult.data }
  })
  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.rubyDictEntry.delete({ where: { id: entryIdResult.data } })
  return c.body(null, 204)
})

rubyDict.get('/scenario/:scenarioId', async (c) => {
  const scenarioIdResult = RubyDictIdSchema.safeParse(c.req.param('scenarioId'))
  if (!scenarioIdResult.success) {
    return c.json({ error: 'Invalid scenario id' }, 400)
  }

  const rows = await db.scenarioRubyDict.findMany({
    where: { scenarioId: scenarioIdResult.data },
    include: { dict: { include: { entries: true } } }
  })
  return c.json(rows.map((srd) => srd.dict))
})

rubyDict.post('/scenario/:scenarioId/:dictId', async (c) => {
  const scenarioIdResult = RubyDictIdSchema.safeParse(c.req.param('scenarioId'))
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))

  if (!scenarioIdResult.success) {
    return c.json({ error: 'Invalid scenario id' }, 400)
  }
  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }

  const existing = await db.scenarioRubyDict.findFirst({
    where: { scenarioId: scenarioIdResult.data, dictId: dictIdResult.data }
  })
  if (existing) {
    return c.json({ error: 'Already associated' }, 409)
  }

  const row = await db.scenarioRubyDict.create({
    data: { scenarioId: scenarioIdResult.data, dictId: dictIdResult.data }
  })
  return c.json(row, 201)
})

rubyDict.delete('/scenario/:scenarioId/:dictId', async (c) => {
  const scenarioIdResult = RubyDictIdSchema.safeParse(c.req.param('scenarioId'))
  const dictIdResult = RubyDictIdSchema.safeParse(c.req.param('dictId'))

  if (!scenarioIdResult.success) {
    return c.json({ error: 'Invalid scenario id' }, 400)
  }
  if (!dictIdResult.success) {
    return c.json({ error: 'Invalid dictionary id' }, 400)
  }

  const existing = await db.scenarioRubyDict.findFirst({
    where: { scenarioId: scenarioIdResult.data, dictId: dictIdResult.data }
  })
  if (!existing) {
    return c.json({ error: 'Not found' }, 404)
  }

  await db.scenarioRubyDict.delete({ where: { id: existing.id } })
  return c.body(null, 204)
})
