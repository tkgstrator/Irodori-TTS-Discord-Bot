import { db } from '../server/db'
import { syncSpeakerSeeds } from '../server/speaker-import'

// シード処理全体を実行する
const main = async () => {
  await syncSpeakerSeeds()
}

main()
  .catch((error) => {
    console.error('Seed failed.', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
