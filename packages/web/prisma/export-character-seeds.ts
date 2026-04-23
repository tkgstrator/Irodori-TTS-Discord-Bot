import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { ScenarioSeedCharacterSchema } from '../schemas/scenario-seed.dto'
import { db } from '../server/db'

const characterSeedFilePath = fileURLToPath(new URL('./character-seeds.ts', import.meta.url))
const ScenarioSeedCharacterListSchema = z.array(ScenarioSeedCharacterSchema)

// 現在の DB キャラクターを seed 形式へ変換する
const createCharacterSeedRows = async () => {
  const rows = await db.character.findMany({
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }]
  })

  const seedResult = ScenarioSeedCharacterListSchema.safeParse(
    rows.map((row) => ({
      id: row.id,
      data: {
        name: row.name,
        imageUrl: row.imageUrl,
        ageGroup: row.ageGroup,
        gender: row.gender,
        occupation: row.occupation,
        personalityTags: row.personalityTags,
        speechStyle: row.speechStyle,
        firstPerson: row.firstPerson,
        secondPerson: row.secondPerson,
        honorific: row.honorific,
        attributeTags: row.attributeTags,
        backgroundTags: row.backgroundTags,
        memo: row.memo,
        speakerId: row.speakerId
      }
    }))
  )

  if (!seedResult.success) {
    throw new Error(`Invalid character seeds: ${seedResult.error.message}`)
  }

  return seedResult.data
}

// seed モジュールとして保存するファイル本文を組み立てる
const createCharacterSeedFileContent = (
  seedRows: z.infer<typeof ScenarioSeedCharacterListSchema>
) => `import { z } from 'zod'
import { ScenarioSeedCharacterSchema } from '../schemas/scenario-seed.dto'

const ScenarioSeedCharacterListSchema = z.array(ScenarioSeedCharacterSchema)

const characterSeedRowsResult = ScenarioSeedCharacterListSchema.safeParse(${JSON.stringify(seedRows, null, 2)})

if (!characterSeedRowsResult.success) {
  throw new Error(\`Invalid character seeds: \${characterSeedRowsResult.error.message}\`)
}

export const characterSeedRows = characterSeedRowsResult.data
`

// DB のキャラクターを seed ファイルへ書き出す
const main = async () => {
  const seedRows = await createCharacterSeedRows()
  const fileContent = createCharacterSeedFileContent(seedRows)

  await Bun.write(characterSeedFilePath, fileContent)
  console.log(`Exported ${seedRows.length} character seeds.`)
}

main()
  .catch((error) => {
    console.error('Character seed export failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
