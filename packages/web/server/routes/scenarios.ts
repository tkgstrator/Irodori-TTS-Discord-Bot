import { Hono } from 'hono'
import {
  type ScenarioApi,
  type ScenarioApiChapter,
  ScenarioApiListSchema,
  type ScenarioApiSpeaker
} from '../../schemas/scenario-api.dto'
import { db } from '../db'

export const scenarios = new Hono()

const speakerStylePalette = [
  {
    colorClass: 'bg-pink-300 text-pink-800',
    nameColor: 'text-pink-700 dark:text-pink-400'
  },
  {
    colorClass: 'bg-blue-300 text-blue-800',
    nameColor: 'text-blue-700 dark:text-blue-400'
  },
  {
    colorClass: 'bg-purple-300 text-purple-800',
    nameColor: 'text-purple-700 dark:text-purple-400'
  },
  {
    colorClass: 'bg-emerald-300 text-emerald-800',
    nameColor: 'text-emerald-700 dark:text-emerald-400'
  },
  {
    colorClass: 'bg-amber-300 text-amber-800',
    nameColor: 'text-amber-700 dark:text-amber-400'
  }
] as const

// 話者 alias ごとの色設定を返す
const resolveSpeakerStyle = (index: number) => speakerStylePalette[index % speakerStylePalette.length]

// シナリオ集計用のステータスを章群から再計算する
const resolveScenarioStatus = ({
  chapterStatuses,
  fallback
}: {
  chapterStatuses: readonly ScenarioApiChapter['status'][]
  fallback: ScenarioApi['status'] | 'failed'
}): ScenarioApi['status'] => {
  if (chapterStatuses.length === 0) {
    return fallback
  }

  if (chapterStatuses.some((status) => status === 'generating')) {
    return 'generating'
  }

  if (chapterStatuses.every((status) => status === 'draft')) {
    return 'draft'
  }

  return 'completed'
}

// DB の cue 行を API 形式へ変換する
const buildCueResponse = (
  cue: Awaited<ReturnType<typeof db.scenario.findMany>>[number]['chapters'][number]['cues'][number]
) => {
  if (cue.kind === 'speech') {
    return {
      kind: 'speech',
      speaker: cue.speakerAlias ?? '',
      text: cue.text ?? ''
    } as const
  }

  return {
    kind: 'pause',
    duration: cue.pauseDuration ?? 0
  } as const
}

// DB の章行を API 形式へ変換する
const buildChapterResponse = (
  chapter: Awaited<ReturnType<typeof db.scenario.findMany>>[number]['chapters'][number]
): ScenarioApiChapter => ({
  id: chapter.id,
  number: chapter.number,
  title: chapter.title,
  status: chapter.status,
  cueCount: chapter.cueCount,
  durationMinutes: chapter.durationMinutes,
  synopsis: chapter.synopsis,
  characters: chapter.characters.map((item) => ({
    name: item.character.name,
    imageUrl: item.character.imageUrl,
    speakerId: item.character.speakerId
  })),
  cues: chapter.cues.map((cue) => buildCueResponse(cue))
})

// DB のシナリオ行を API レスポンスへ変換する
const buildScenarioResponse = (row: Awaited<ReturnType<typeof db.scenario.findMany>>[number]): ScenarioApi => {
  const speakers: ScenarioApiSpeaker[] = row.cast.map((cast, index) => {
    const style = resolveSpeakerStyle(index)

    return {
      alias: cast.alias,
      name: cast.character.name,
      speakerId: cast.character.speakerId,
      initial: cast.character.name.charAt(0) || '?',
      imageUrl: cast.character.imageUrl,
      colorClass: style.colorClass,
      nameColor: style.nameColor
    }
  })
  const chapters = row.chapters.map((chapter) => buildChapterResponse(chapter))

  return {
    id: row.id,
    title: row.title,
    status: resolveScenarioStatus({
      chapterStatuses: chapters.map((chapter) => chapter.status),
      fallback: row.status
    }),
    genres: row.genres,
    tone: row.tone,
    plotCharacters: row.cast.map((cast) => cast.character.name),
    cueCount: chapters.reduce((total, chapter) => total + chapter.cueCount, 0),
    speakerCount: row.cast.length,
    durationMinutes:
      chapters.length === 0 ? null : chapters.reduce((total, chapter) => total + chapter.durationMinutes, 0),
    isAiGenerated: row.status !== 'draft',
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    speakers,
    chapters
  }
}

scenarios.get('/', async (c) => {
  const rows = await db.scenario.findMany({
    include: {
      cast: {
        include: {
          character: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      },
      chapters: {
        include: {
          characters: {
            include: {
              character: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          },
          cues: {
            orderBy: {
              order: 'asc'
            }
          }
        },
        orderBy: {
          number: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  const responseRows = rows.map((row) => buildScenarioResponse(row))
  const responseResult = ScenarioApiListSchema.safeParse(responseRows)

  if (!responseResult.success) {
    console.error('Invalid scenario response.', responseResult.error)
    return c.json({ error: 'Failed to build scenarios' }, 500)
  }

  return c.json(responseResult.data)
})
