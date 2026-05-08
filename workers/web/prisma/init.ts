import { db } from '../src/api/db'
import { syncSpeakerSeeds } from '../src/api/speaker-import'
import { characterSeedRows } from './character-seeds'
import { rubyDictSeedRows } from './ruby-dict-seeds'

const syncCharacterSeeds = async () => {
  await Promise.all(
    characterSeedRows.map((row) =>
      db.character.upsert({
        where: { id: row.id },
        create: { id: row.id, ...row.data },
        update: row.data
      })
    )
  )
  console.log(`Synced ${characterSeedRows.length} character seeds.`)
}

const syncRubyDictSeeds = async () => {
  for (const dict of rubyDictSeedRows) {
    await db.rubyDict.upsert({
      where: { id: dict.id },
      create: { id: dict.id, name: dict.name },
      update: { name: dict.name }
    })

    const seedWords = new Set(dict.entries.map((e) => e.word))

    await db.rubyDictEntry.deleteMany({
      where: { dictId: dict.id, word: { notIn: [...seedWords] } }
    })

    for (const entry of dict.entries) {
      await db.rubyDictEntry.upsert({
        where: { word_dictId: { word: entry.word, dictId: dict.id } },
        create: { word: entry.word, reading: entry.reading, dictId: dict.id },
        update: { reading: entry.reading }
      })
    }
  }

  console.log(`Synced ${rubyDictSeedRows.length} ruby dict seeds.`)
}

const main = async () => {
  await syncSpeakerSeeds()
  await syncCharacterSeeds()
  await syncRubyDictSeeds()
}

main()
  .catch((error) => {
    console.error('Init failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
