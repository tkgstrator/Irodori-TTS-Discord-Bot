import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { defineConfig } from 'prisma/config'

// Node と Bun の両方で .env を読み込む
const envFilePath = resolve('.env')

if (existsSync(envFilePath)) {
  const envLines = readFileSync(envFilePath, 'utf8').split('\n')

  for (const envLine of envLines) {
    const trimmedLine = envLine.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const normalizedLine = trimmedLine.startsWith('export ') ? trimmedLine.slice(7).trim() : trimmedLine
    const separatorIndex = normalizedLine.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = normalizedLine.slice(0, separatorIndex).trim()
    const rawValue = normalizedLine.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun ./prisma/seed.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
})
