import '@irodori-tts/shared/root-env'
import process from 'node:process'

export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun ./prisma/seed.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
}
