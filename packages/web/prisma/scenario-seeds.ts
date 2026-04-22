import type { PrismaClient } from '../generated/prisma/client'
import type { ScenarioSeedCast, ScenarioSeedCharacter, ScenarioSeedScenario } from '../schemas/scenario-seed.dto'
import {
  ScenarioSeedCharacterSchema,
  ScenarioSeedScenarioSchema,
  ScenarioSeedSetSchema
} from '../schemas/scenario-seed.dto'

type SeedDbClient = Pick<PrismaClient, 'character' | 'scenario' | 'scenarioCast' | '$transaction'>
type SeedDbDelegate = Pick<PrismaClient, 'character' | 'scenario' | 'scenarioCast'>

// シナリオ管理ページで使う安定 ID を定義する
const seedIds = {
  renka: '57fd1aa6-2c64-4f9a-ae14-1b55f4c79701',
  shota: '33571849-554a-4dbc-8221-0cb2c48961ce',
  narrator: 'bc37c5e6-c81a-41af-ae22-c88d40d7a26e',
  sakurako: '2f60e8f8-bc2f-4d96-ae9f-d497c3b46cd2',
  mizuki: '349f86b1-eddf-4627-934d-4626a65386a4',
  hayato: '531c08e2-acde-47ac-bafc-036981902f1a',
  kazuki: 'c02d9b85-5b0d-4e48-8b06-5ea638142e9f',
  tokinari: '5fd8e31e-6900-40d1-a532-06d56d17f0d1',
  natsu: '1b8a6435-6806-4eb0-8b6f-9e205f13f6f7',
  fuyu: '00be5a25-dab0-4ed3-8cb8-725dd4f9e261',
  hoshi: '76150d2f-f27b-48d7-9550-893d76f66726',
  kurenai: '632712b7-75b7-46c4-b22a-f4f27440b1c8',
  souten: '8b46d99c-a4dc-454d-ab66-4e0c6d57e00a'
} as const

// キャラクター seed を検証付きで組み立てる
const createCharacterSeed = (seed: ScenarioSeedCharacter) => {
  const seedResult = ScenarioSeedCharacterSchema.safeParse(seed)

  if (!seedResult.success) {
    throw new Error(`Invalid scenario seed character: ${seedResult.error.message}`)
  }

  return seedResult.data
}

// シナリオ seed を検証付きで組み立てる
const createScenarioSeed = (seed: ScenarioSeedScenario) => {
  const seedResult = ScenarioSeedScenarioSchema.safeParse(seed)

  if (!seedResult.success) {
    throw new Error(`Invalid scenario seed scenario: ${seedResult.error.message}`)
  }

  return seedResult.data
}

// シナリオ管理ページ向けのキャラクター seed を定義する
const scenarioSeedCharacters = [
  createCharacterSeed({
    id: seedIds.renka,
    data: {
      name: '蓮花',
      imageUrl: null,
      ageGroup: 'teen',
      gender: 'female',
      occupation: 'student_high',
      personalityTags: ['明るい', '一途'],
      speechStyle: 'neutral',
      firstPerson: 'watashi',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['優等生'],
      backgroundTags: ['転校生'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.shota,
    data: {
      name: '翔太',
      imageUrl: null,
      ageGroup: 'teen',
      gender: 'male',
      occupation: 'student_high',
      personalityTags: ['無口', '不器用'],
      speechStyle: 'neutral',
      firstPerson: 'ore',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['読書家'],
      backgroundTags: ['秀才'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.narrator,
    data: {
      name: 'ナレーション',
      imageUrl: null,
      ageGroup: 'adult',
      gender: 'unknown',
      occupation: 'writer',
      personalityTags: ['中立'],
      speechStyle: 'neutral',
      firstPerson: 'watashi',
      secondPerson: '',
      honorific: 'san',
      attributeTags: [],
      backgroundTags: [],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.sakurako,
    data: {
      name: '桜子',
      imageUrl: null,
      ageGroup: 'young_adult',
      gender: 'female',
      occupation: 'student_college',
      personalityTags: ['繊細', '好奇心旺盛'],
      speechStyle: 'neutral',
      firstPerson: 'watashi',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['神秘的'],
      backgroundTags: ['帰国子女'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.mizuki,
    data: {
      name: '美月',
      imageUrl: null,
      ageGroup: 'young_adult',
      gender: 'female',
      occupation: 'student_college',
      personalityTags: ['冷静', '知的'],
      speechStyle: 'neutral',
      firstPerson: 'watashi',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['メガネ'],
      backgroundTags: ['研究者志望'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.hayato,
    data: {
      name: '隼人',
      imageUrl: null,
      ageGroup: 'young_adult',
      gender: 'male',
      occupation: 'student_college',
      personalityTags: ['行動派', '誠実'],
      speechStyle: 'neutral',
      firstPerson: 'boku',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['世話焼き'],
      backgroundTags: ['スポーツ推薦'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.kazuki,
    data: {
      name: '和樹',
      imageUrl: null,
      ageGroup: 'young_adult',
      gender: 'male',
      occupation: 'programmer',
      personalityTags: ['内向的', '優しい'],
      speechStyle: 'neutral',
      firstPerson: 'boku',
      secondPerson: '',
      honorific: 'san',
      attributeTags: ['夜型'],
      backgroundTags: ['幼なじみ'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  }),
  createCharacterSeed({
    id: seedIds.tokinari,
    data: {
      name: '時成',
      imageUrl: null,
      ageGroup: 'adult',
      gender: 'male',
      occupation: 'samurai',
      personalityTags: ['厳格', '忠義'],
      speechStyle: 'neutral',
      firstPerson: 'soregashi',
      secondPerson: '',
      honorific: 'dono',
      attributeTags: ['寡黙'],
      backgroundTags: ['名家出身'],
      memo: 'seed:scenario-management',
      speakerId: null
    }
  })
] as const

// シナリオ cast を簡潔に組み立てる
const createCast = (alias: string, characterId: string, role: string, relationship: string): ScenarioSeedCast => ({
  alias,
  characterId,
  role,
  relationship
})

// シナリオ管理ページ向けのシナリオ seed を定義する
const scenarioSeeds = [
  createScenarioSeed({
    id: seedIds.natsu,
    title: '夏の約束',
    genres: ['学園', '恋愛'],
    tone: 'ほろ苦い',
    ending: 'closed',
    status: 'completed',
    narratorId: seedIds.narrator,
    vdsJson: null,
    cast: [
      createCast('renka', seedIds.renka, 'protagonist', 'crush'),
      createCast('shota', seedIds.shota, 'love_interest', 'classmate'),
      createCast('narrator', seedIds.narrator, 'narrator', 'other')
    ]
  }),
  createScenarioSeed({
    id: seedIds.fuyu,
    title: '冬の幻想曲',
    genres: ['ファンタジー', 'ミステリー'],
    tone: '幻想的',
    ending: 'closed',
    status: 'completed',
    narratorId: seedIds.narrator,
    vdsJson: null,
    cast: [
      createCast('sakurako', seedIds.sakurako, 'protagonist', 'other'),
      createCast('mizuki', seedIds.mizuki, 'companion', 'close_friend'),
      createCast('hayato', seedIds.hayato, 'mentor', 'acquaintance'),
      createCast('narrator', seedIds.narrator, 'narrator', 'other')
    ]
  }),
  createScenarioSeed({
    id: seedIds.hoshi,
    title: '星降る夜に',
    genres: ['恋愛', '日常'],
    tone: 'メランコリック',
    ending: 'closed',
    status: 'generating',
    narratorId: null,
    vdsJson: null,
    cast: [
      createCast('renka', seedIds.renka, 'protagonist', 'other'),
      createCast('kazuki', seedIds.kazuki, 'love_interest', 'childhood_friend')
    ]
  }),
  createScenarioSeed({
    id: seedIds.kurenai,
    title: '紅の記憶',
    genres: ['歴史', 'サスペンス'],
    tone: 'シリアス',
    ending: 'closed',
    status: 'completed',
    narratorId: seedIds.narrator,
    vdsJson: null,
    cast: [
      createCast('shota', seedIds.shota, 'protagonist', 'other'),
      createCast('hayato', seedIds.hayato, 'rival', 'enemy'),
      createCast('sakurako', seedIds.sakurako, 'deuteragonist', 'ally'),
      createCast('tokinari', seedIds.tokinari, 'authority', 'mentor'),
      createCast('narrator', seedIds.narrator, 'narrator', 'other')
    ]
  }),
  createScenarioSeed({
    id: seedIds.souten,
    title: '蒼天の彼方',
    genres: ['SF'],
    tone: '緊迫',
    ending: 'closed',
    status: 'draft',
    narratorId: null,
    vdsJson: null,
    cast: []
  })
] as const

const scenarioSeedSetResult = ScenarioSeedSetSchema.safeParse({
  characters: scenarioSeedCharacters,
  scenarios: scenarioSeeds
})

if (!scenarioSeedSetResult.success) {
  throw new Error(`Invalid scenario seed set: ${scenarioSeedSetResult.error.message}`)
}

export const scenarioSeedSet = scenarioSeedSetResult.data

// シード対象のキャラクターを upsert する
const upsertScenarioCharacter = async (client: SeedDbDelegate, character: ScenarioSeedCharacter) => {
  await client.character.upsert({
    where: {
      id: character.id
    },
    create: {
      id: character.id,
      ...character.data
    },
    update: character.data
  })
}

// シード対象のシナリオを upsert する
const upsertScenario = async (client: SeedDbDelegate, scenario: ScenarioSeedScenario) => {
  await client.scenario.upsert({
    where: {
      id: scenario.id
    },
    create: {
      id: scenario.id,
      title: scenario.title,
      genres: scenario.genres,
      tone: scenario.tone,
      ending: scenario.ending,
      status: scenario.status,
      narratorId: scenario.narratorId,
      vdsJson: scenario.vdsJson
    },
    update: {
      title: scenario.title,
      genres: scenario.genres,
      tone: scenario.tone,
      ending: scenario.ending,
      status: scenario.status,
      narratorId: scenario.narratorId,
      vdsJson: scenario.vdsJson
    }
  })
}

// シード対象の cast を upsert する
const upsertScenarioCast = async (client: SeedDbDelegate, scenarioId: string, cast: ScenarioSeedCast) => {
  await client.scenarioCast.upsert({
    where: {
      scenarioId_alias: {
        scenarioId,
        alias: cast.alias
      }
    },
    create: {
      scenarioId,
      characterId: cast.characterId,
      role: cast.role,
      relationship: cast.relationship,
      alias: cast.alias
    },
    update: {
      characterId: cast.characterId,
      role: cast.role,
      relationship: cast.relationship
    }
  })
}

// シードから外れた cast を対象シナリオ内だけ整理する
const pruneScenarioCast = async (client: SeedDbDelegate, scenario: ScenarioSeedScenario) => {
  const aliases = scenario.cast.map((cast) => cast.alias)

  await client.scenarioCast.deleteMany({
    where: {
      scenarioId: scenario.id,
      alias: {
        notIn: aliases
      }
    }
  })
}

// シナリオ管理ページ向けの seed 全体を同期する
export const syncScenarioSeeds = async (client: SeedDbClient) => {
  await client.$transaction(async (tx) => {
    await Promise.all(scenarioSeedSet.characters.map((character) => upsertScenarioCharacter(tx, character)))
    await Promise.all(scenarioSeedSet.scenarios.map((scenario) => upsertScenario(tx, scenario)))
    await Promise.all(scenarioSeedSet.scenarios.map((scenario) => pruneScenarioCast(tx, scenario)))
    await Promise.all(
      scenarioSeedSet.scenarios.flatMap((scenario) =>
        scenario.cast.map((cast) => upsertScenarioCast(tx, scenario.id, cast))
      )
    )
  })

  console.log(`Seed completed with ${scenarioSeedSet.scenarios.length} scenarios.`)
}
