import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { db } from '../src/api/db'
import type { CharacterInput } from '../src/schemas/character.dto'

// CharacterInput の配列フィールドを Prisma 用の JSON 文字列へ変換する
const toCharacterPrismaData = (input: CharacterInput) => ({
  ...input,
  personalityTags: JSON.stringify(input.personalityTags),
  attributeTags: JSON.stringify(input.attributeTags),
  backgroundTags: JSON.stringify(input.backgroundTags),
  sampleQuotes: JSON.stringify(input.sampleQuotes)
})

// テストで作成したレコードの ID を保持する
const createdIds = new Set<string>()
const createdSpeakerIds = new Set<string>()

// テスト用のキャラクター入力を組み立てる
const createCharacterInput = (): CharacterInput => {
  const token = crypto.randomUUID()

  return {
    name: `DB Test ${token}`,
    imageUrl: null,
    ageGroup: 'young_adult',
    gender: 'male',
    occupation: 'student_high',
    personalityTags: ['明るい', '論理的'],
    speechStyle: 'neutral',
    firstPerson: 'boku',
    secondPerson: '',
    honorific: 'san',
    attributeTags: ['眼鏡'],
    backgroundTags: ['天才'],
    sampleQuotes: ['よろしくな'],
    memo: `db-test:${token}`,
    speakerId: null,
    caption: '穏やかな青年。自然で聞き取りやすい声。'
  }
}

// テスト用の話者入力を組み立てる
const createSpeakerInput = () => {
  const token = crypto.randomUUID()

  return {
    id: token,
    name: `Speaker ${token}`
  }
}

// クリーンアップ対象として ID を登録する
const trackId = (id: string) => {
  createdIds.add(id)
}

// クリーンアップ対象として話者 ID を登録する
const trackSpeakerId = (id: string) => {
  createdSpeakerIds.add(id)
}

beforeAll(async () => {
  await db.$connect()
})

afterEach(async () => {
  if (createdIds.size === 0) {
    return
  }

  const ids = Array.from(createdIds)
  createdIds.clear()

  await db.character.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  })

  if (createdSpeakerIds.size === 0) {
    return
  }

  const speakerIds = Array.from(createdSpeakerIds)
  createdSpeakerIds.clear()

  await db.speaker.deleteMany({
    where: {
      id: {
        in: speakerIds
      }
    }
  })
})

afterAll(async () => {
  await db.$disconnect()
})

describe('Character DB operations', () => {
  test('create したキャラクターを DB から取得できる', async () => {
    const input = createCharacterInput()
    const created = await db.character.create({ data: toCharacterPrismaData(input) })
    trackId(created.id)

    const row = await db.character.findUnique({
      where: {
        id: created.id
      }
    })

    expect(row).not.toBeNull()
    expect(row?.id).toBe(created.id)
    expect(row?.name).toBe(input.name)
    expect(row?.memo).toBe(input.memo)
    expect(row?.sampleQuotes).toEqual(JSON.stringify(input.sampleQuotes))
  })

  test('delete したキャラクターは DB から取得できない', async () => {
    const input = createCharacterInput()
    const created = await db.character.create({ data: toCharacterPrismaData(input) })

    await db.character.delete({
      where: {
        id: created.id
      }
    })

    const row = await db.character.findUnique({
      where: {
        id: created.id
      }
    })

    expect(row).toBeNull()
  })

  test('speaker と連携したキャラクターを取得できる', async () => {
    const speaker = await db.speaker.create({
      data: createSpeakerInput()
    })
    trackSpeakerId(speaker.id)

    const input = {
      ...createCharacterInput(),
      speakerId: speaker.id
    }
    const created = await db.character.create({ data: toCharacterPrismaData(input) })
    trackId(created.id)

    const row = await db.character.findUnique({
      where: {
        id: created.id
      },
      include: {
        speaker: true
      }
    })

    expect(row?.speaker?.id).toBe(speaker.id)
    expect(row?.speaker?.name).toBe(speaker.name)
  })
})
