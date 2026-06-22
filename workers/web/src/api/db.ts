import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '../../generated/prisma/client'

const envSchema = z.object({
  DATABASE_URL: z.string().nonempty()
})

const clientCache = new Map<'default', PrismaClient>()

const resolveClient = (): PrismaClient => {
  const cached = clientCache.get('default')
  if (cached) return cached

  const envResult = envSchema.safeParse(process.env)
  if (!envResult.success) {
    throw new Error('DATABASE_URL is required')
  }

  const adapter = new PrismaPg(envResult.data.DATABASE_URL)
  const client = new PrismaClient({ adapter })
  clientCache.set('default', client)
  return client
}

export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = resolveClient()
    const value = (client as unknown as Record<string, unknown>)[prop as string]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
