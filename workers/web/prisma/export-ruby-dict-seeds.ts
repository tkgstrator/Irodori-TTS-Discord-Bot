import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { db } from '../src/api/db'
import type { RubyDictSeed } from './ruby-dict-seeds'

const rubyDictSeedFilePath = fileURLToPath(new URL('./ruby-dict-seeds.ts', import.meta.url))

const createRubyDictSeedRows = async (): Promise<readonly RubyDictSeed[]> => {
  const dicts = await db.rubyDict.findMany({
    include: { entries: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })

  return dicts.map((dict) => ({
    id: dict.id,
    name: dict.name,
    entries: dict.entries.map((entry) => ({
      word: entry.word,
      reading: entry.reading
    }))
  }))
}

const createRubyDictSeedFileContent = (seedRows: readonly RubyDictSeed[]) =>
  `import { z } from 'zod'

const RubyDictSeedEntrySchema = z.object({
  word: z.string().min(1),
  reading: z.string().min(1)
})

const RubyDictSeedSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  entries: z.array(RubyDictSeedEntrySchema)
})

const RubyDictSeedListSchema = z.array(RubyDictSeedSchema)

export type RubyDictSeed = z.infer<typeof RubyDictSeedSchema>

const rubyDictSeedRowsResult = RubyDictSeedListSchema.safeParse(${JSON.stringify(seedRows, null, 2)})

if (!rubyDictSeedRowsResult.success) {
  throw new Error(\`Invalid ruby dict seeds: \${rubyDictSeedRowsResult.error.message}\`)
}

export const rubyDictSeedRows = rubyDictSeedRowsResult.data
`

const main = async () => {
  const seedRows = await createRubyDictSeedRows()
  const fileContent = createRubyDictSeedFileContent(seedRows)

  await Bun.write(rubyDictSeedFilePath, fileContent)
  console.log(`Exported ${seedRows.length} ruby dict seeds.`)
}

main()
  .catch((error) => {
    console.error('Ruby dict seed export failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
