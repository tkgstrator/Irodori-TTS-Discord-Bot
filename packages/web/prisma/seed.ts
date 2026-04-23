import { db } from '../server/db'
import { syncSpeakerSeeds } from '../server/speaker-import'
import { characterSeedRows } from './character-seeds'
import { syncScenarioSeeds } from './scenario-seeds'

// シード処理全体を実行する
const main = async () => {
  await syncSpeakerSeeds()
  await syncScenarioSeeds(db)
  console.log(`Loaded ${characterSeedRows.length} character seeds.`)
}

main()
  .catch((error) => {
    console.error('Seed failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
