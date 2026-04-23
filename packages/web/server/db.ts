import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { PrismaClient } from '../generated/prisma/client'

// PostgreSQL 接続文字列の必須チェックを行う
const envSchema = z.object({
  DATABASE_URL: z.string().nonempty()
})

const envResult = envSchema.safeParse(process.env)

if (!envResult.success) {
  throw new Error('DATABASE_URL is required')
}

const adapter = new PrismaPg(envResult.data.DATABASE_URL)

export const db = new PrismaClient({ adapter })
