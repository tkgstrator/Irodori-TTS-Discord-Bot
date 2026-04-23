import { Hono } from 'hono'
import { z } from 'zod'
import { ChapterPlanRequestSchema } from '../../schemas/chapter-plan-request.dto'
import {
  type ScenarioApi,
  type ScenarioApiChapter,
  ScenarioApiListSchema,
  ScenarioApiSchema,
  type ScenarioApiSpeaker
} from '../../schemas/scenario-api.dto'
import {
  ScenarioAppendChapterApiSchema,
  ScenarioCreateApiSchema,
  ScenarioUpdateApiSchema
} from '../../schemas/scenario-write.dto'
import { estimateEpisodeDuration, validateEpisodeCues, writeChapterEpisode } from '../chapter-episode-writer'
import { planChapter } from '../chapter-planner'
import { db } from '../db'

export const scenarios = new Hono()
const ScenarioIdSchema = z.string().uuid()

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

const scenarioInclude = {
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
} as const

// キャラクター数から簡易 alias を割り当てる。
const createCastAlias = (index: number) => `char${index + 1}`

// 指定 ID のキャラクターを作成順で取得する。
const findCharactersByIds = async (characterIds: readonly string[]) => {
  if (characterIds.length === 0) {
    return []
  }

  return db.character.findMany({
    where: {
      id: {
        in: characterIds
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
}

// 既存 cast から削除対象と追加対象の characterId を算出する。
const resolveCastChanges = ({
  currentCharacterIds,
  requestedCharacterIds
}: {
  currentCharacterIds: readonly string[]
  requestedCharacterIds: readonly string[]
}) => {
  const currentCharacterIdSet = new Set(currentCharacterIds)
  const requestedCharacterIdSet = new Set(requestedCharacterIds)

  return {
    removedCharacterIds: currentCharacterIds.filter((characterId) => !requestedCharacterIdSet.has(characterId)),
    addedCharacterIds: requestedCharacterIds.filter((characterId) => !currentCharacterIdSet.has(characterId))
  }
}

// シナリオ取得結果を API スキーマで検証して返す。
const toScenarioApi = (row: Awaited<ReturnType<typeof db.scenario.findUnique>>): ScenarioApi => {
  if (row === null) {
    throw new Error('Scenario not found')
  }

  const responseResult = ScenarioApiSchema.safeParse(buildScenarioResponse(row))

  if (!responseResult.success) {
    throw new Error('Invalid scenario response')
  }

  return responseResult.data
}

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
    include: scenarioInclude,
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

scenarios.post('/', async (c) => {
  const bodyResult = ScenarioCreateApiSchema.safeParse(await c.req.json())

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  if (bodyResult.data.characterIds.length > 0) {
    const characters = await findCharactersByIds(bodyResult.data.characterIds)

    if (characters.length !== bodyResult.data.characterIds.length) {
      return c.json({ error: 'Some characters were not found' }, 400)
    }
  }

  const row = await db.scenario.create({
    data: {
      title: bodyResult.data.title,
      genres: bodyResult.data.genres,
      tone: bodyResult.data.tone,
      ending: 'loop',
      status: 'draft',
      cast: {
        create: bodyResult.data.characterIds.map((characterId, index) => ({
          characterId,
          role: index === 0 ? 'protagonist' : 'companion',
          relationship: index === 0 ? 'self' : 'other',
          alias: createCastAlias(index)
        }))
      }
    },
    include: scenarioInclude
  })

  return c.json(toScenarioApi(row), 201)
})

scenarios.put('/:id', async (c) => {
  const bodyResult = ScenarioUpdateApiSchema.safeParse(await c.req.json())

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  const scenarioId = c.req.param('id')
  const scenarioIdResult = ScenarioIdSchema.safeParse(scenarioId)

  if (!scenarioIdResult.success) {
    return c.json({ error: 'Invalid scenario id' }, 400)
  }

  const scenario = await db.scenario.findUnique({
    where: {
      id: scenarioIdResult.data
    },
    include: {
      cast: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      chapters: {
        orderBy: {
          number: 'asc'
        }
      }
    }
  })

  if (scenario === null) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (bodyResult.data.characterIds.length > 0) {
    const characters = await findCharactersByIds(bodyResult.data.characterIds)

    if (characters.length !== bodyResult.data.characterIds.length) {
      return c.json({ error: 'Some characters were not found' }, 400)
    }
  }

  const currentCharacterIds = scenario.cast.map((cast) => cast.characterId)
  const hasCreatedChapters = scenario.chapters.length > 0
  const { removedCharacterIds, addedCharacterIds } = resolveCastChanges({
    currentCharacterIds,
    requestedCharacterIds: bodyResult.data.characterIds
  })

  if (hasCreatedChapters && removedCharacterIds.length > 0) {
    return c.json({ error: 'Cannot remove cast members after chapters have been created' }, 409)
  }

  await db.$transaction(async (tx) => {
    await tx.scenario.update({
      where: {
        id: scenario.id
      },
      data: {
        title: bodyResult.data.title,
        genres: bodyResult.data.genres,
        tone: bodyResult.data.tone
      }
    })

    if (!hasCreatedChapters) {
      await tx.scenarioCast.deleteMany({
        where: {
          scenarioId: scenario.id
        }
      })

      if (bodyResult.data.characterIds.length > 0) {
        await tx.scenarioCast.createMany({
          data: bodyResult.data.characterIds.map((characterId, index) => ({
            scenarioId: scenario.id,
            characterId,
            role: index === 0 ? 'protagonist' : 'companion',
            relationship: index === 0 ? 'self' : 'other',
            alias: createCastAlias(index)
          }))
        })
      }
    } else if (addedCharacterIds.length > 0) {
      await tx.scenarioCast.createMany({
        data: addedCharacterIds.map((characterId, index) => ({
          scenarioId: scenario.id,
          characterId,
          role: 'companion',
          relationship: 'other',
          alias: createCastAlias(currentCharacterIds.length + index)
        }))
      })
    }
  })

  const row = await db.scenario.findUnique({
    where: {
      id: scenario.id
    },
    include: scenarioInclude
  })

  return c.json(toScenarioApi(row))
})

scenarios.post('/:id/chapters', async (c) => {
  const bodyResult = ScenarioAppendChapterApiSchema.safeParse(await c.req.json())

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  const scenario = await db.scenario.findUnique({
    where: {
      id: c.req.param('id')
    },
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
        orderBy: {
          number: 'asc'
        }
      }
    }
  })

  if (scenario === null) {
    return c.json({ error: 'Not found' }, 404)
  }

  if (scenario.chapters[scenario.chapters.length - 1]?.status === 'generating') {
    return c.json({ error: 'Scenario is already generating a chapter' }, 409)
  }

  const nextChapterNumber =
    scenario.chapters.length > 0 ? Math.max(...scenario.chapters.map((chapter) => chapter.number)) + 1 : 1
  const selectedCharacterIds =
    bodyResult.data.characterIds.length > 0
      ? bodyResult.data.characterIds
      : scenario.cast.map((cast) => cast.characterId)
  const castCharacterIds = new Set(scenario.cast.map((cast) => cast.characterId))

  if (!selectedCharacterIds.every((characterId) => castCharacterIds.has(characterId))) {
    return c.json({ error: 'Chapter characters must belong to the scenario cast' }, 400)
  }

  const selectedCharacterNames = selectedCharacterIds.flatMap((characterId) => {
    const matchedCast = scenario.cast.find((cast) => cast.characterId === characterId)
    return matchedCast ? [matchedCast.character.name] : []
  })
  const title = bodyResult.data.title.trim() || `第${nextChapterNumber}章`
  const synopsis =
    bodyResult.data.synopsis.trim() ||
    (selectedCharacterNames.length > 0
      ? `${selectedCharacterNames.join('・')}を中心に第${nextChapterNumber}章のプロットを作成しました。`
      : `第${nextChapterNumber}章のプロットを作成しました。`)

  await db.$transaction(async (tx) => {
    await tx.scenarioChapter.create({
      data: {
        scenarioId: scenario.id,
        number: nextChapterNumber,
        title,
        status: 'draft',
        cueCount: 0,
        durationMinutes: 0,
        synopsis,
        characters: {
          create: selectedCharacterIds.map((characterId) => ({
            characterId
          }))
        }
      }
    })

    await tx.scenario.update({
      where: {
        id: scenario.id
      },
      data: {
        status: 'draft'
      }
    })
  })

  const row = await db.scenario.findUnique({
    where: {
      id: scenario.id
    },
    include: scenarioInclude
  })

  return c.json(toScenarioApi(row), 201)
})

scenarios.post('/:id/chapter-plan', async (c) => {
  const idResult = ScenarioIdSchema.safeParse(c.req.param('id'))
  const bodyResult = ChapterPlanRequestSchema.safeParse(await c.req.json())

  if (!idResult.success) {
    return c.json({ error: 'Invalid scenario id' }, 400)
  }

  if (!bodyResult.success) {
    return c.json({ error: 'Invalid request body', details: bodyResult.error.flatten() }, 400)
  }

  if (bodyResult.data.dramaId !== idResult.data) {
    return c.json({ error: 'Scenario id mismatch' }, 400)
  }

  try {
    const plan = await planChapter(bodyResult.data)
    return c.json(plan)
  } catch (error) {
    console.error('Failed to generate chapter plan.', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to generate chapter plan' }, 502)
  }
})

scenarios.post('/:id/chapters/:chapterId/create', async (c) => {
  const scenario = await db.scenario.findUnique({
    where: {
      id: c.req.param('id')
    },
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
    }
  })

  if (scenario === null) {
    return c.json({ error: 'Not found' }, 404)
  }

  const chapter = scenario.chapters.find((item) => item.id === c.req.param('chapterId'))
  const chapterIndex = scenario.chapters.findIndex((item) => item.id === c.req.param('chapterId'))

  if (!chapter) {
    return c.json({ error: 'Chapter not found' }, 404)
  }

  if (chapter.status !== 'draft' && chapter.status !== 'completed') {
    return c.json({ error: 'Only draft or completed chapters can be created' }, 409)
  }

  if (chapter.status === 'completed' && chapterIndex !== scenario.chapters.length - 1) {
    return c.json({ error: 'Only the latest completed chapter can be regenerated' }, 409)
  }

  const chapterCharacterIds = new Set(chapter.characters.map((item) => item.characterId))
  const cast = scenario.cast.filter((item) => chapterCharacterIds.has(item.characterId))

  if (cast.length === 0) {
    return c.json({ error: 'Chapter cast is empty' }, 400)
  }

  if (cast.some((item) => item.character.speakerId === null)) {
    return c.json({ error: 'All chapter characters must have a linked speakerId' }, 400)
  }

  try {
    const cues = await writeChapterEpisode({
      model: 'gemini-2.5-flash',
      scenario: {
        title: scenario.title,
        genres: scenario.genres,
        tone: scenario.tone
      },
      chapter: {
        title: chapter.title,
        synopsis: chapter.synopsis
      },
      cast: cast.map((item) => ({
        alias: item.alias,
        character: item.character
      }))
    })
    validateEpisodeCues({
      cues,
      speakerAliases: cast.map((item) => item.alias)
    })

    await db.$transaction(async (tx) => {
      await tx.scenarioCue.deleteMany({
        where: {
          chapterId: chapter.id
        }
      })

      await tx.scenarioCue.createMany({
        data: cues.map((cue, index) =>
          cue.kind === 'speech'
            ? {
                chapterId: chapter.id,
                order: index + 1,
                kind: 'speech',
                speakerAlias: cue.speaker,
                text: cue.text,
                pauseDuration: null
              }
            : {
                chapterId: chapter.id,
                order: index + 1,
                kind: 'pause',
                speakerAlias: null,
                text: null,
                pauseDuration: cue.duration
              }
        )
      })

      await tx.scenarioChapter.update({
        where: {
          id: chapter.id
        },
        data: {
          status: 'completed',
          cueCount: cues.length,
          durationMinutes: estimateEpisodeDuration(cues)
        }
      })

      await tx.scenario.update({
        where: {
          id: scenario.id
        },
        data: {
          status: 'completed'
        }
      })
    })

    const row = await db.scenario.findUnique({
      where: {
        id: scenario.id
      },
      include: scenarioInclude
    })

    return c.json(toScenarioApi(row))
  } catch (error) {
    console.error('Failed to create chapter episode.', error)
    return c.json({ error: error instanceof Error ? error.message : 'Failed to create chapter episode' }, 502)
  }
})

scenarios.delete('/:id/chapters/:chapterId/episode', async (c) => {
  const scenario = await db.scenario.findUnique({
    where: {
      id: c.req.param('id')
    },
    include: {
      chapters: {
        include: {
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
    }
  })

  if (scenario === null) {
    return c.json({ error: 'Not found' }, 404)
  }

  const chapter = scenario.chapters.find((item) => item.id === c.req.param('chapterId'))
  const chapterIndex = scenario.chapters.findIndex((item) => item.id === c.req.param('chapterId'))

  if (!chapter) {
    return c.json({ error: 'Chapter not found' }, 404)
  }

  if (chapter.status !== 'completed') {
    return c.json({ error: 'Only completed chapters can delete episodes' }, 409)
  }

  if (chapterIndex !== scenario.chapters.length - 1) {
    return c.json({ error: 'Only the latest completed chapter can delete episodes' }, 409)
  }

  await db.$transaction(async (tx) => {
    await tx.scenarioCue.deleteMany({
      where: {
        chapterId: chapter.id
      }
    })

    await tx.scenarioChapter.update({
      where: {
        id: chapter.id
      },
      data: {
        status: 'draft',
        cueCount: 0,
        durationMinutes: 0
      }
    })

    await tx.scenario.update({
      where: {
        id: scenario.id
      },
      data: {
        status: 'draft'
      }
    })
  })

  const row = await db.scenario.findUnique({
    where: {
      id: scenario.id
    },
    include: scenarioInclude
  })

  return c.json(toScenarioApi(row))
})
