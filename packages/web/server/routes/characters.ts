import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../db'

const characterBody = z.object({
  name: z.string().min(1),
  imageUrl: z.string().nullable().optional(),
  ageGroup: z.string(),
  gender: z.string(),
  occupation: z.string(),
  personalityTags: z.array(z.string()),
  speechStyle: z.string(),
  firstPerson: z.string(),
  secondPerson: z.string(),
  honorific: z.string(),
  attributeTags: z.array(z.string()),
  backgroundTags: z.array(z.string()),
  memo: z.string()
})

export const characters = new Hono()

characters.get('/', async (c) => {
  const rows = await db.character.findMany({ orderBy: { createdAt: 'desc' } })
  return c.json(rows)
})

characters.get('/:id', async (c) => {
  const row = await db.character.findUnique({ where: { id: c.req.param('id') } })
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

characters.post('/', async (c) => {
  const body = characterBody.parse(await c.req.json())
  const row = await db.character.create({ data: body })
  return c.json(row, 201)
})

characters.put('/:id', async (c) => {
  const body = characterBody.parse(await c.req.json())
  const row = await db.character.update({ where: { id: c.req.param('id') }, data: body })
  return c.json(row)
})

characters.delete('/:id', async (c) => {
  await db.character.delete({ where: { id: c.req.param('id') } })
  return c.body(null, 204)
})
