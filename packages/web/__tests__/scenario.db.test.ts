import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { api } from '../server/api'
import { db } from '../server/db'

const createdScenarioIds = new Set<string>()
const createdCharacterIds = new Set<string>()

// テスト用のキャラクター入力を組み立てる。
const createCharacterInput = (label: string) => {
  const token = crypto.randomUUID()

  return {
    name: `${label}-${token}`,
    imageUrl: null,
    ageGroup: 'young_adult',
    gender: 'female',
    occupation: 'student_high',
    personalityTags: ['明るい'],
    speechStyle: 'neutral',
    firstPerson: 'watashi',
    secondPerson: '',
    honorific: 'san',
    attributeTags: [],
    backgroundTags: [],
    memo: `scenario-db-test:${token}`,
    speakerId: null
  }
}

// クリーンアップ対象のシナリオ ID を登録する。
const trackScenarioId = (id: string) => {
  createdScenarioIds.add(id)
}

// クリーンアップ対象のキャラクター ID を登録する。
const trackCharacterId = (id: string) => {
  createdCharacterIds.add(id)
}

// テスト用キャラクターを DB に作成する。
const createCharacter = async (label: string) => {
  const row = await db.character.create({
    data: createCharacterInput(label)
  })

  trackCharacterId(row.id)
  return row
}

beforeAll(async () => {
  await db.$connect()
})

afterEach(async () => {
  if (createdScenarioIds.size > 0) {
    const scenarioIds = Array.from(createdScenarioIds)
    createdScenarioIds.clear()

    await db.scenario.deleteMany({
      where: {
        id: {
          in: scenarioIds
        }
      }
    })
  }

  if (createdCharacterIds.size > 0) {
    const characterIds = Array.from(createdCharacterIds)
    createdCharacterIds.clear()

    await db.character.deleteMany({
      where: {
        id: {
          in: characterIds
        }
      }
    })
  }
})

afterAll(async () => {
  await db.$disconnect()
})

describe('Scenario DB operations', () => {
  test('POST /scenarios でシナリオを DB に保存できる', async () => {
    const ema = await createCharacter('ema')
    const hiro = await createCharacter('hiro')
    const response = await api.request('/scenarios', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'DB 保存テスト',
        genres: ['学園', '恋愛'],
        tone: 'ほろ苦い',
        characterIds: [ema.id, hiro.id]
      })
    })

    expect(response.status).toBe(201)

    const body = await response.json()
    trackScenarioId(body.id)

    const row = await db.scenario.findUnique({
      where: {
        id: body.id
      },
      include: {
        cast: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    expect(row).not.toBeNull()
    expect(row?.title).toBe('DB 保存テスト')
    expect(row?.ending).toBe('loop')
    expect(row?.cast).toHaveLength(2)
    expect(row?.cast[0]?.role).toBe('protagonist')
    expect(row?.cast[0]?.relationship).toBe('self')
    expect(row?.cast[1]?.alias).toBe('char2')
  })

  test('POST /scenarios/:id/chapters で下書き章を DB に保存できる', async () => {
    const ema = await createCharacter('ema')
    const hiro = await createCharacter('hiro')
    const createScenarioResponse = await api.request('/scenarios', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: '章保存テスト',
        genres: ['学園'],
        tone: 'ほろ苦い',
        characterIds: [ema.id, hiro.id]
      })
    })
    const scenarioBody = await createScenarioResponse.json()
    trackScenarioId(scenarioBody.id)

    const response = await api.request(`/scenarios/${scenarioBody.id}/chapters`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: '第1章',
        synopsis: '二人が放課後に再会し、少し距離を縮める。',
        characterIds: [ema.id]
      })
    })

    expect(response.status).toBe(201)

    const row = await db.scenario.findUnique({
      where: {
        id: scenarioBody.id
      },
      include: {
        chapters: {
          include: {
            characters: {
              include: {
                character: true
              }
            }
          },
          orderBy: {
            number: 'asc'
          }
        }
      }
    })

    expect(row?.status).toBe('draft')
    expect(row?.chapters).toHaveLength(1)
    expect(row?.chapters[0]?.title).toBe('第1章')
    expect(row?.chapters[0]?.status).toBe('draft')
    expect(row?.chapters[0]?.synopsis).toBe('二人が放課後に再会し、少し距離を縮める。')
    expect(row?.chapters[0]?.characters.map((item) => item.characterId)).toEqual([ema.id])
  })

  test('PUT /scenarios/:id で章未作成のプロットを更新できる', async () => {
    const ema = await createCharacter('ema')
    const hiro = await createCharacter('hiro')
    const yuki = await createCharacter('yuki')
    const createScenarioResponse = await api.request('/scenarios', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: '更新前タイトル',
        genres: ['学園'],
        tone: 'ほろ苦い',
        characterIds: [ema.id, hiro.id]
      })
    })
    const scenarioBody = await createScenarioResponse.json()
    trackScenarioId(scenarioBody.id)

    const response = await api.request(`/scenarios/${scenarioBody.id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: '更新後タイトル',
        genres: ['学園', '恋愛'],
        tone: '軽快',
        characterIds: [yuki.id]
      })
    })

    expect(response.status).toBe(200)

    const row = await db.scenario.findUnique({
      where: {
        id: scenarioBody.id
      },
      include: {
        cast: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    expect(row?.title).toBe('更新後タイトル')
    expect(row?.genres).toEqual(['学園', '恋愛'])
    expect(row?.tone).toBe('軽快')
    expect(row?.cast.map((cast) => cast.characterId)).toEqual([yuki.id])
  })

  test('PUT /scenarios/:id は章作成後のキャスト変更を拒否する', async () => {
    const ema = await createCharacter('ema')
    const hiro = await createCharacter('hiro')
    const yuki = await createCharacter('yuki')
    const createScenarioResponse = await api.request('/scenarios', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'キャスト固定テスト',
        genres: ['学園'],
        tone: 'ほろ苦い',
        characterIds: [ema.id, hiro.id]
      })
    })
    const scenarioBody = await createScenarioResponse.json()
    trackScenarioId(scenarioBody.id)

    await api.request(`/scenarios/${scenarioBody.id}/chapters`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: '第1章',
        synopsis: '章生成中',
        characterIds: [ema.id]
      })
    })

    const response = await api.request(`/scenarios/${scenarioBody.id}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'キャスト固定テスト',
        genres: ['学園'],
        tone: 'ほろ苦い',
        characterIds: [ema.id, yuki.id]
      })
    })

    expect(response.status).toBe(409)

    const row = await db.scenario.findUnique({
      where: {
        id: scenarioBody.id
      },
      include: {
        cast: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    expect(row?.cast.map((cast) => cast.characterId)).toEqual([ema.id, hiro.id])
  })
})
