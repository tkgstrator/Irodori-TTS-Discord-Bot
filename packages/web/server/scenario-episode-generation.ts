import type { ChapterEpisodeRequest } from '../src/schemas/chapter-episode-request.dto'
import { estimateEpisodeDuration, validateEpisodeCues, writeChapterEpisode } from './chapter-episode-writer'
import { db } from './db'

// 章生成成功時の cue とステータスを永続化する。
const persistCompletedEpisodeGeneration = async ({
  chapterId,
  cues,
  scenarioId
}: {
  chapterId: string
  cues: Awaited<ReturnType<typeof writeChapterEpisode>>
  scenarioId: string
}) => {
  await db.$transaction(async (tx) => {
    await tx.scenarioCue.deleteMany({
      where: {
        chapterId
      }
    })

    await tx.scenarioCue.createMany({
      data: cues.map((cue, index) => {
        if (cue.kind === 'speech') {
          return {
            chapterId,
            order: index + 1,
            kind: 'speech' as const,
            speakerAlias: cue.speaker,
            text: cue.text,
            pauseDuration: null,
            sceneName: null
          }
        }
        if (cue.kind === 'scene') {
          return {
            chapterId,
            order: index + 1,
            kind: 'scene' as const,
            speakerAlias: null,
            text: null,
            pauseDuration: null,
            sceneName: cue.name
          }
        }
        return {
          chapterId,
          order: index + 1,
          kind: 'pause' as const,
          speakerAlias: null,
          text: null,
          pauseDuration: cue.duration,
          sceneName: null
        }
      })
    })

    await tx.scenarioChapter.update({
      where: {
        id: chapterId
      },
      data: {
        status: 'completed',
        cueCount: cues.length,
        durationMinutes: estimateEpisodeDuration(cues),
        generationError: null
      }
    })

    await tx.scenario.update({
      where: {
        id: scenarioId
      },
      data: {
        status: 'completed'
      }
    })
  })
}

// 章生成失敗時のステータスとエラー文言を永続化する。
const persistFailedEpisodeGeneration = async ({
  chapterId,
  errorMessage,
  scenarioId
}: {
  chapterId: string
  errorMessage: string
  scenarioId: string
}) => {
  await db.$transaction(async (tx) => {
    await tx.scenarioChapter.update({
      where: {
        id: chapterId
      },
      data: {
        status: 'failed',
        generationError: errorMessage
      }
    })

    await tx.scenario.update({
      where: {
        id: scenarioId
      },
      data: {
        status: 'failed'
      }
    })
  })
}

// Gemini から章エピソードを生成し、結果を DB に反映する。
export const runScenarioEpisodeGeneration = async ({
  chapterId,
  request,
  scenarioId,
  validateCues = validateEpisodeCues,
  writeEpisode = writeChapterEpisode
}: {
  chapterId: string
  request: ChapterEpisodeRequest
  scenarioId: string
  validateCues?: typeof validateEpisodeCues
  writeEpisode?: typeof writeChapterEpisode
}) => {
  try {
    const cues = await writeEpisode(request)

    validateCues({
      cues,
      speakerAliases: request.cast.map((item) => item.alias)
    })

    await persistCompletedEpisodeGeneration({
      chapterId,
      cues,
      scenarioId
    })
  } catch (error) {
    console.error('Failed to create chapter episode.', error)

    await persistFailedEpisodeGeneration({
      chapterId,
      errorMessage: error instanceof Error ? error.message : 'Failed to create chapter episode',
      scenarioId
    })
  }
}
