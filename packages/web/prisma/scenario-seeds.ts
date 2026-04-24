import type { PrismaClient } from '../generated/prisma/client'
import { plotSeedIds, plotSpeakerSeedIds } from '../src/lib/plot-seed-ids'
import type { CharacterInput } from '../src/schemas/character.dto'
import type {
  ScenarioSeedCast,
  ScenarioSeedChapter,
  ScenarioSeedCue,
  ScenarioSeedScenario
} from '../src/schemas/scenario-seed.dto'
import {
  ScenarioSeedChapterSchema,
  ScenarioSeedScenarioSchema,
  ScenarioSeedSetSchema
} from '../src/schemas/scenario-seed.dto'
import { characterSeedRows } from './character-seeds'

// CharacterInput の配列フィールドを Prisma 用の JSON 文字列へ変換する
const toCharacterPrismaData = (input: CharacterInput) => ({
  ...input,
  personalityTags: JSON.stringify(input.personalityTags),
  attributeTags: JSON.stringify(input.attributeTags),
  backgroundTags: JSON.stringify(input.backgroundTags),
  sampleQuotes: JSON.stringify(input.sampleQuotes)
})

type SeedDbClient = Pick<
  PrismaClient,
  | 'character'
  | 'scenario'
  | 'scenarioCast'
  | 'scenarioChapter'
  | 'scenarioChapterCharacter'
  | 'scenarioCue'
  | '$transaction'
>
type SeedDbDelegate = Pick<
  PrismaClient,
  'character' | 'scenario' | 'scenarioCast' | 'scenarioChapter' | 'scenarioChapterCharacter' | 'scenarioCue'
>
const scenarioSeedCharacterMemo = 'seed:scenario-management'

// シナリオ seed を検証付きで組み立てる
const createScenarioSeed = (seed: ScenarioSeedScenario) => {
  const seedResult = ScenarioSeedScenarioSchema.safeParse(seed)

  if (!seedResult.success) {
    throw new Error(`Invalid scenario seed scenario: ${seedResult.error.message}`)
  }

  return seedResult.data
}

// 章 seed を検証付きで組み立てる
const createChapterSeed = (seed: ScenarioSeedChapter) => {
  const seedResult = ScenarioSeedChapterSchema.safeParse(seed)

  if (!seedResult.success) {
    throw new Error(`Invalid scenario seed chapter: ${seedResult.error.message}`)
  }

  return seedResult.data
}

// DB へ反映するキャラクター seed 一覧
const scenarioSeedCharacters = characterSeedRows

// シナリオ cast を簡潔に組み立てる
const createCast = (alias: string, speakerId: string, role: string, relationship: string): ScenarioSeedCast => ({
  alias,
  speakerId,
  role,
  relationship
})

// speech cue を簡潔に組み立てる
const createSpeechCue = (speaker: string, text: string): ScenarioSeedCue => ({
  kind: 'speech',
  speaker,
  text
})

// pause cue を簡潔に組み立てる
const createPauseCue = (duration: number): ScenarioSeedCue => ({
  kind: 'pause',
  duration
})

// シナリオ管理ページ向けのシナリオ seed を定義する
const scenarioSeeds = [
  createScenarioSeed({
    id: plotSeedIds.natsu,
    title: '夏の約束',
    genres: ['学園', '恋愛'],
    tone: 'ほろ苦い',
    ending: 'closed',
    status: 'completed',
    narratorSpeakerId: plotSpeakerSeedIds.yuki,
    vdsJson: null,
    cast: [
      createCast('ema', plotSpeakerSeedIds.ema, 'protagonist', 'crush'),
      createCast('hiro', plotSpeakerSeedIds.hiro, 'love_interest', 'classmate'),
      createCast('yuki', plotSpeakerSeedIds.yuki, 'narrator', 'other')
    ],
    chapters: [
      createChapterSeed({
        id: 'ch1',
        number: 1,
        title: '出会い',
        status: 'completed',
        durationMinutes: 1.5,
        synopsis:
          '桜羽エマが転校初日に二階堂ヒロと校門前で偶然ぶつかり、散らばったノートを拾い集めるところから物語が始まる。',
        characters: ['ema', 'hiro', 'yuki'],
        cues: [
          createSpeechCue(
            'yuki',
            '夏の終わり、蝉の声が遠くなった放課後。図書室の窓から差し込む夕日が、古びた机の上の埃を金色に輝かせていた。'
          ),
          createPauseCue(0.8),
          createSpeechCue('ema', 'また来てたんだ。この本、気に入ってるの？'),
          createSpeechCue('hiro', '……べつに。どこにいても同じだから。'),
          createPauseCue(1.5),
          createSpeechCue('ema', 'そんなこと言わないで。……ねえ、名前、教えてくれる？'),
          createPauseCue(0.5),
          createSpeechCue('hiro', '……ヒロ。'),
          createSpeechCue('ema', 'ヒロくん。私はエマ。よろしくね。')
        ]
      }),
      createChapterSeed({
        id: 'ch2',
        number: 2,
        title: '秘密の場所',
        status: 'completed',
        durationMinutes: 2,
        synopsis: '二階堂ヒロが屋上への秘密の抜け道を桜羽エマだけに教え、二人は放課後の秘密の時間を過ごすようになる。',
        characters: ['ema', 'hiro'],
        cues: [
          createSpeechCue('hiro', '……ここ、誰も来ない。'),
          createSpeechCue('ema', 'わあ、屋上って初めて。空が近いね！'),
          createPauseCue(1),
          createSpeechCue('hiro', '騒ぐなよ。見つかったら面倒だ。'),
          createSpeechCue('ema', 'ふふ、秘密基地みたい。ヒロくんの秘密の場所なんだ。'),
          createPauseCue(0.5),
          createSpeechCue('hiro', '……お前だけだからな。教えたの。'),
          createSpeechCue('ema', 'えっ……うん。約束する、誰にも言わない。'),
          createSpeechCue('hiro', '……勝手にしろ。'),
          createSpeechCue('ema', 'じゃあ明日も来るね、ヒロくん。')
        ]
      }),
      createChapterSeed({
        id: 'ch3',
        number: 3,
        title: 'すれ違い',
        status: 'completed',
        durationMinutes: 1,
        synopsis: '文化祭の準備で忙しくなり、桜羽エマと二階堂ヒロの間に小さな誤解が生まれてしまう。',
        characters: ['ema', 'hiro', 'yuki'],
        cues: [
          createSpeechCue('yuki', '文化祭まであと三日。教室は準備の熱気に包まれていた。'),
          createSpeechCue('ema', 'ヒロくん、今日も屋上——'),
          createSpeechCue('hiro', '……今日は無理。'),
          createPauseCue(1),
          createSpeechCue('ema', 'そう……。最近ずっとそうだよね。'),
          createSpeechCue('hiro', '……悪い。'),
          createSpeechCue(
            'yuki',
            'エマは小さく笑って背を向けた。その肩が少しだけ震えているのを、ヒロは気づかなかった。'
          )
        ]
      }),
      createChapterSeed({
        id: 'ch4',
        number: 4,
        title: '告白',
        status: 'generating',
        durationMinutes: 1.5,
        synopsis: '夏祭りの夜、花火の光に照らされながら二階堂ヒロが桜羽エマに想いを伝える。',
        characters: ['ema', 'hiro'],
        cues: []
      })
    ]
  }),
  createScenarioSeed({
    id: plotSeedIds.fuyu,
    title: '冬の幻想曲',
    genres: ['ファンタジー', 'ミステリー'],
    tone: '幻想的',
    ending: 'closed',
    status: 'completed',
    narratorSpeakerId: plotSpeakerSeedIds.yuki,
    vdsJson: null,
    cast: [
      createCast('sherry', plotSpeakerSeedIds.sherry, 'protagonist', 'other'),
      createCast('meruru', plotSpeakerSeedIds.meruru, 'companion', 'close_friend'),
      createCast('coco', plotSpeakerSeedIds.coco, 'mentor', 'acquaintance'),
      createCast('yuki', plotSpeakerSeedIds.yuki, 'narrator', 'other')
    ],
    chapters: []
  }),
  createScenarioSeed({
    id: plotSeedIds.hoshi,
    title: '星降る夜に',
    genres: ['恋愛', '日常'],
    tone: 'メランコリック',
    ending: 'closed',
    status: 'generating',
    narratorSpeakerId: null,
    vdsJson: null,
    cast: [
      createCast('chieri', plotSpeakerSeedIds.chieri, 'protagonist', 'other'),
      createCast('leia', plotSpeakerSeedIds.leia, 'love_interest', 'childhood_friend')
    ],
    chapters: []
  }),
  createScenarioSeed({
    id: plotSeedIds.kurenai,
    title: '紅の記憶',
    genres: ['歴史', 'サスペンス'],
    tone: 'シリアス',
    ending: 'closed',
    status: 'completed',
    narratorSpeakerId: plotSpeakerSeedIds.yuki,
    vdsJson: null,
    cast: [
      createCast('hiro', plotSpeakerSeedIds.hiro, 'protagonist', 'other'),
      createCast('margo', plotSpeakerSeedIds.margo, 'rival', 'enemy'),
      createCast('hanna', plotSpeakerSeedIds.hanna, 'deuteragonist', 'ally'),
      createCast('nanoka', plotSpeakerSeedIds.nanoka, 'authority', 'mentor'),
      createCast('yuki', plotSpeakerSeedIds.yuki, 'narrator', 'other')
    ],
    chapters: []
  }),
  createScenarioSeed({
    id: plotSeedIds.souten,
    title: '蒼天の彼方',
    genres: ['SF'],
    tone: '緊迫',
    ending: 'closed',
    status: 'draft',
    narratorSpeakerId: null,
    vdsJson: null,
    cast: [],
    chapters: []
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
const upsertScenarioSeedCharacter = async (
  client: SeedDbDelegate,
  characterSeed: (typeof scenarioSeedSet.characters)[number]
) => {
  const prismaData = toCharacterPrismaData(characterSeed.data)
  await client.character.upsert({
    where: {
      id: characterSeed.id
    },
    create: {
      id: characterSeed.id,
      ...prismaData
    },
    update: prismaData
  })
}

// cast で使う話者連携キャラクターを解決する
const resolveScenarioCharacterIds = async (client: SeedDbDelegate, scenarios: readonly ScenarioSeedScenario[]) => {
  const speakerIds = Array.from(
    new Set(
      scenarios.flatMap((scenario) => [
        ...scenario.cast.map((cast) => cast.speakerId),
        ...(scenario.narratorSpeakerId ? [scenario.narratorSpeakerId] : [])
      ])
    )
  )

  if (speakerIds.length === 0) {
    return new Map<string, string>()
  }

  const characters = await client.character.findMany({
    where: {
      speakerId: {
        in: speakerIds
      }
    },
    select: {
      id: true,
      name: true,
      speakerId: true
    }
  })

  const characterMap = new Map(
    characters.flatMap((character) => (character.speakerId ? [[character.speakerId, character.id] as const] : []))
  )

  speakerIds.forEach((speakerId) => {
    if (!characterMap.has(speakerId)) {
      throw new Error(`Linked character not found for speaker: ${speakerId}`)
    }
  })

  return characterMap
}

// alias ごとに永続化済みキャラクター ID を解決する
const resolveScenarioAliasMap = (scenario: ScenarioSeedScenario, characterMap: ReadonlyMap<string, string>) =>
  new Map(
    scenario.cast.map((cast) => {
      const characterId = characterMap.get(cast.speakerId)

      if (!characterId) {
        throw new Error(`Linked character not found for speaker: ${cast.speakerId}`)
      }

      return [cast.alias, characterId] as const
    })
  )

// シード対象のシナリオを upsert する
const upsertScenario = async (
  client: SeedDbDelegate,
  scenario: ScenarioSeedScenario,
  characterMap: ReadonlyMap<string, string>
) => {
  await client.scenario.upsert({
    where: {
      id: scenario.id
    },
    create: {
      id: scenario.id,
      title: scenario.title,
      genres: JSON.stringify(scenario.genres),
      tone: scenario.tone,
      ending: scenario.ending,
      status: scenario.status,
      narratorId: scenario.narratorSpeakerId ? (characterMap.get(scenario.narratorSpeakerId) ?? null) : null,
      vdsJson: scenario.vdsJson ?? null
    },
    update: {
      title: scenario.title,
      genres: JSON.stringify(scenario.genres),
      tone: scenario.tone,
      ending: scenario.ending,
      status: scenario.status,
      narratorId: scenario.narratorSpeakerId ? (characterMap.get(scenario.narratorSpeakerId) ?? null) : null,
      vdsJson: scenario.vdsJson ?? null
    }
  })
}

// シード対象の章を upsert する
const upsertScenarioChapter = async (client: SeedDbDelegate, scenarioId: string, chapter: ScenarioSeedChapter) =>
  client.scenarioChapter.upsert({
    where: {
      scenarioId_number: {
        scenarioId,
        number: chapter.number
      }
    },
    create: {
      id: chapter.id,
      scenarioId,
      number: chapter.number,
      title: chapter.title,
      status: chapter.status,
      cueCount: chapter.cues.length,
      durationMinutes: chapter.durationMinutes,
      synopsis: chapter.synopsis
    },
    update: {
      title: chapter.title,
      status: chapter.status,
      cueCount: chapter.cues.length,
      durationMinutes: chapter.durationMinutes,
      synopsis: chapter.synopsis
    },
    select: {
      id: true
    }
  })

// シード対象の章内登場人物を同期する
const syncScenarioChapterCharacters = async (
  client: SeedDbDelegate,
  chapterId: string,
  chapter: ScenarioSeedChapter,
  aliasMap: ReadonlyMap<string, string>
) => {
  await client.scenarioChapterCharacter.deleteMany({
    where: {
      chapterId
    }
  })

  if (chapter.characters.length === 0) {
    return
  }

  await client.scenarioChapterCharacter.createMany({
    data: chapter.characters.map((alias) => {
      const characterId = aliasMap.get(alias)

      if (!characterId) {
        throw new Error(`Linked character not found for alias: ${alias}`)
      }

      return {
        chapterId,
        characterId
      }
    })
  })
}

// シード対象の cue を同期する
const syncScenarioChapterCues = async (client: SeedDbDelegate, chapterId: string, chapter: ScenarioSeedChapter) => {
  await client.scenarioCue.deleteMany({
    where: {
      chapterId
    }
  })

  if (chapter.cues.length === 0) {
    return
  }

  await client.scenarioCue.createMany({
    data: chapter.cues.map((cue, index) => ({
      chapterId,
      order: index + 1,
      kind: cue.kind,
      speakerAlias: cue.kind === 'speech' ? cue.speaker : null,
      text: cue.kind === 'speech' ? cue.text : null,
      pauseDuration: cue.kind === 'pause' ? cue.duration : null,
      synthOptions: null
    }))
  })
}

// シード対象の cast を upsert する
const upsertScenarioCast = async (
  client: SeedDbDelegate,
  scenarioId: string,
  cast: ScenarioSeedCast,
  characterMap: ReadonlyMap<string, string>
) => {
  const characterId = characterMap.get(cast.speakerId)

  if (!characterId) {
    throw new Error(`Linked character not found for speaker: ${cast.speakerId}`)
  }

  await client.scenarioCast.upsert({
    where: {
      scenarioId_alias: {
        scenarioId,
        alias: cast.alias
      }
    },
    create: {
      scenarioId,
      characterId,
      role: cast.role,
      relationship: cast.relationship,
      alias: cast.alias
    },
    update: {
      characterId,
      role: cast.role,
      relationship: cast.relationship
    }
  })
}

// シードから外れた章を対象シナリオ内だけ整理する
const pruneScenarioChapters = async (client: SeedDbDelegate, scenario: ScenarioSeedScenario) => {
  const numbers = scenario.chapters.map((chapter) => chapter.number)

  await client.scenarioChapter.deleteMany({
    where: {
      scenarioId: scenario.id,
      number: {
        notIn: numbers
      }
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

// 旧プロット seed が作った未連携キャラクターだけを整理する
const pruneLegacyScenarioCharacters = async (client: SeedDbDelegate) => {
  await client.character.deleteMany({
    where: {
      memo: scenarioSeedCharacterMemo,
      speakerId: null
    }
  })
}

// シナリオ管理ページ向けの seed 全体を同期する
export const syncScenarioSeeds = async (client: SeedDbClient) => {
  await client.$transaction(async (tx) => {
    await Promise.all(scenarioSeedSet.characters.map((characterSeed) => upsertScenarioSeedCharacter(tx, characterSeed)))

    const characterMap = await resolveScenarioCharacterIds(tx, scenarioSeedSet.scenarios)

    await Promise.all(scenarioSeedSet.scenarios.map((scenario) => upsertScenario(tx, scenario, characterMap)))
    await Promise.all(scenarioSeedSet.scenarios.map((scenario) => pruneScenarioChapters(tx, scenario)))
    await Promise.all(scenarioSeedSet.scenarios.map((scenario) => pruneScenarioCast(tx, scenario)))
    await Promise.all(
      scenarioSeedSet.scenarios.flatMap((scenario) =>
        scenario.cast.map((cast) => upsertScenarioCast(tx, scenario.id, cast, characterMap))
      )
    )
    await Promise.all(
      scenarioSeedSet.scenarios.flatMap((scenario) => {
        const aliasMap = resolveScenarioAliasMap(scenario, characterMap)

        return scenario.chapters.map(async (chapter) => {
          const chapterRow = await upsertScenarioChapter(tx, scenario.id, chapter)

          await syncScenarioChapterCharacters(tx, chapterRow.id, chapter, aliasMap)
          await syncScenarioChapterCues(tx, chapterRow.id, chapter)
        })
      })
    )
    await pruneLegacyScenarioCharacters(tx)
  })

  console.log(
    `Seed completed with ${scenarioSeedSet.characters.length} characters and ${scenarioSeedSet.scenarios.length} scenarios.`
  )
}
