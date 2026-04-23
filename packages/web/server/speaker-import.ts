import { Buffer } from 'node:buffer'
import { z } from 'zod'
import type { SpeakerLink } from '../schemas/character.dto'
import { CharacterInputSchema, SpeakerLinkSchema } from '../schemas/character.dto'
import {
  SpeakerIdSchema,
  SpeakerImportListSchema,
  SpeakerImportTemplateSchema,
  SpeakerImportValuesSchema
} from '../schemas/speaker.dto'
import { db } from './db'

const DefaultIrodoriTtsBaseUrl = 'http://irodori-tts:8765'

const SpeakerSourceEnvSchema = z.object({
  IRODORI_TTS_BASE_URL: z.string().url().optional()
})

const SpeakerSourceDefaultsSchema = z.object({
  num_steps: z.number(),
  cfg_scale_text: z.number(),
  cfg_scale_speaker: z.number()
})

const SpeakerSourceSchema = z.object({
  uuid: SpeakerIdSchema,
  name: z.string().nonempty(),
  defaults: SpeakerSourceDefaultsSchema
})

const SpeakerSourceListResponseSchema = z.object({
  speakers: z.array(SpeakerSourceSchema).min(1)
})

// seed 用のキャラクター画像を話者名に対応付ける
const characterIconUrlMap = new Map([
  [
    '桜羽エマ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_b0f18e85-525e-430d-9c15-d789a43695ba_small.webp'
  ],
  [
    '氷上メルル',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_5dcbe390-f8f5-4f55-bd4e-d9f370ea54b9_small.webp'
  ],
  [
    '沢渡ココ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_317b3eac-38bb-4774-9074-d4d371c708c1_small.webp'
  ],
  [
    '宝生マーゴ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_83900586-6507-4770-9d37-0ad7f9e9d541_small.webp'
  ],
  [
    '橘シェリー',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_084c2579-df5a-41fb-a53a-dded352e54a5_small.webp'
  ],
  [
    '佐伯ミリア',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_4e6ae30c-1369-47b2-9f80-34ffbcd8c2f1_small.webp'
  ],
  [
    '二階堂ヒロ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_74c6edb6-d088-4b36-867a-fdc170598f33_small.webp'
  ],
  [
    '蓮見レイア',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_a731580a-32a6-478f-81d8-70d0df981e71_small.webp'
  ],
  [
    '黒部ナノカ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_cfbb3a7a-a566-483f-8536-699a1f754d5b_small.webp'
  ],
  [
    '城ヶ崎ノア',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_b2b4cd7e-777a-42a7-b890-e94052e864c1_small.webp'
  ],
  [
    '遠野ハンナ',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_b28d1b47-c8fb-47a2-9f92-ae2026df6e56_small.webp'
  ],
  [
    '夏目アンアン',
    'https://storage.googleapis.com/studio-design-asset-files/projects/6kq9vB8bap/s-1681x1653_v-fms_webp_8668e78d-559d-4847-bcef-70cd76c6940f_small.webp'
  ]
])

// 話者テンプレートに使う既定値を定義する
const speakerCharacterDefaults = {
  ageGroup: 'teen',
  gender: 'female',
  occupation: 'student_high',
  personalityTags: [],
  speechStyle: 'neutral',
  firstPerson: 'watashi',
  secondPerson: '',
  honorific: 'san',
  attributeTags: [],
  backgroundTags: []
} as const

// 環境変数から irodori-tts のベース URL を取得する
const getIrodoriTtsBaseUrl = () => {
  const envResult = SpeakerSourceEnvSchema.safeParse(process.env)

  if (!envResult.success) {
    throw new Error('Invalid speaker source environment.')
  }

  return envResult.data.IRODORI_TTS_BASE_URL ?? DefaultIrodoriTtsBaseUrl
}

// irodori-tts から現在の話者一覧を取得する
export const fetchSpeakerSourceList = async () => {
  const speakerUrl = new URL('/speakers', getIrodoriTtsBaseUrl())
  const response = await fetch(speakerUrl)

  if (!response.ok) {
    throw new Error(`Failed to fetch speakers: ${response.status}`)
  }

  const body = await response.json()
  const parsedResult = SpeakerSourceListResponseSchema.safeParse(body)

  if (!parsedResult.success) {
    throw new Error('Invalid speaker response.')
  }

  return parsedResult.data.speakers
}

// 名前に対応するキャラクター画像の data URL を取得する
const fetchCharacterImageUrl = async (speakerName: string) => {
  const iconUrl = characterIconUrlMap.get(speakerName)

  if (!iconUrl) {
    return null
  }

  const response = await fetch(iconUrl)

  if (!response.ok) {
    throw new Error(`Failed to download icon asset: ${speakerName}`)
  }

  const contentType = response.headers.get('content-type')

  if (!contentType?.startsWith('image/')) {
    throw new Error(`Invalid icon content type: ${speakerName}`)
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer())
  return `data:${contentType};base64,${imageBuffer.toString('base64')}`
}

// seed 用の話者レコードを組み立てる
export const buildSeedSpeakerRecord = (speaker: z.infer<typeof SpeakerSourceSchema>) => {
  const speakerResult = SpeakerLinkSchema.safeParse({
    id: speaker.uuid,
    name: speaker.name
  })

  if (!speakerResult.success) {
    throw new Error(`Invalid seed speaker: ${speaker.name}`)
  }

  return speakerResult.data
}

// 新規作成フォーム向けの話者テンプレートを組み立てる
const buildSpeakerImportTemplate = (speaker: SpeakerLink) => {
  const valuesResult = SpeakerImportValuesSchema.safeParse({
    ...speakerCharacterDefaults,
    memo: ''
  })

  if (!valuesResult.success) {
    throw new Error(`Invalid speaker form values: ${speaker.name}`)
  }

  const templateResult = SpeakerImportTemplateSchema.safeParse({
    speaker,
    values: valuesResult.data
  })

  if (!templateResult.success) {
    throw new Error(`Invalid speaker import template: ${speaker.name}`)
  }

  return templateResult.data
}

// seed 用の CharacterInput を組み立てる
export const buildSeedSpeakerCharacter = async (speaker: SpeakerLink) => {
  const characterResult = CharacterInputSchema.safeParse({
    ...speakerCharacterDefaults,
    name: speaker.name,
    imageUrl: await fetchCharacterImageUrl(speaker.name),
    memo: '',
    speakerId: speaker.id
  })

  if (!characterResult.success) {
    throw new Error(`Invalid seed character: ${speaker.name}`)
  }

  return characterResult.data
}

// 旧シードから残った話者メモを作る
const createLegacySpeakerMemo = (speakerName: string) => `seed:speaker:${speakerName}`

// 話者レコードを作成または更新する
const upsertSpeaker = async (speaker: SpeakerLink) => {
  await db.speaker.upsert({
    where: {
      id: speaker.id
    },
    create: {
      id: speaker.id,
      name: speaker.name
    },
    update: {
      name: speaker.name
    }
  })
}

// 既存キャラクターを新しい話者連携へ移行する
const linkLegacyCharacter = async (speaker: SpeakerLink) => {
  const legacyMemo = createLegacySpeakerMemo(speaker.name)
  const linkedCharacter = await db.character.findFirst({
    where: {
      speakerId: speaker.id
    }
  })

  if (linkedCharacter) {
    if (linkedCharacter.memo === legacyMemo) {
      await db.character.update({
        where: {
          id: linkedCharacter.id
        },
        data: {
          memo: ''
        }
      })
    }

    return true
  }

  const legacyCharacter = await db.character.findFirst({
    where: {
      OR: [
        {
          memo: legacyMemo
        },
        {
          AND: [
            {
              name: speaker.name
            },
            {
              speakerId: null
            }
          ]
        }
      ]
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  if (!legacyCharacter) {
    return false
  }

  await db.character.update({
    where: {
      id: legacyCharacter.id
    },
    data: {
      speakerId: speaker.id,
      memo: legacyCharacter.memo === legacyMemo ? '' : legacyCharacter.memo
    }
  })

  console.log(`Linked legacy character: ${speaker.name}`)
  return true
}

// 話者に対応する初期キャラクターを不足分だけ作成する
const ensureSeedCharacter = async (speaker: SpeakerLink) => {
  const linked = await linkLegacyCharacter(speaker)

  if (linked) {
    return
  }

  const character = await buildSeedSpeakerCharacter(speaker)
  await db.character.create({
    data: character
  })

  console.log(`Created seed character: ${speaker.name}`)
}

// 話者 seed の同期全体を実行する
export const syncSpeakerSeeds = async () => {
  const sourceSpeakers = await fetchSpeakerSourceList()
  const speakers = sourceSpeakers.map((speaker) => buildSeedSpeakerRecord(speaker))

  await Promise.all(speakers.map((speaker) => upsertSpeaker(speaker)))
  await Promise.all(speakers.map((speaker) => ensureSeedCharacter(speaker)))

  console.log(`Seed completed with ${speakers.length} speakers.`)
}

// 一覧表示用の話者データを返す
export const listSpeakerImports = async () => {
  const speakers = await db.speaker.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  const parsedResult = SpeakerImportListSchema.safeParse(
    speakers.map((speaker) => ({
      speakerId: speaker.id,
      name: speaker.name
    }))
  )

  if (!parsedResult.success) {
    throw new Error('Invalid speaker import list.')
  }

  return parsedResult.data
}

// 指定した話者のテンプレートを返す
export const getSpeakerImportTemplate = async (speakerId: string) => {
  const speaker = await db.speaker.findUnique({
    where: {
      id: speakerId
    }
  })

  if (!speaker) {
    return null
  }

  return buildSpeakerImportTemplate({
    id: speaker.id,
    name: speaker.name
  })
}
