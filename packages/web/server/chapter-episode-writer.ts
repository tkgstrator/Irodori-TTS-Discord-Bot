import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenAI } from '@google/genai'
import Handlebars from 'handlebars'
import { z } from 'zod'
import type { Cue } from '../lib/scenarios'
import type { StoryCharacterContext } from '../schemas/story-character-context.dto'

const GeminiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().nonempty()
})

const clientCache = new Map<'default', GoogleGenAI>()
const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'templates')
const minSpeechCueCount = 30
const maxSpeechCueCount = 70
const minCueCount = minSpeechCueCount
const maxCueCount = 100

const EpisodeCueSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('speech'),
    speaker: z.string().nonempty(),
    text: z.string().trim().nonempty().max(200)
  }),
  z.object({
    kind: z.literal('pause'),
    duration: z.number().positive().max(3)
  })
])

// cue 全体の件数と speech 件数をまとめて検証する。
const EpisodeScriptSchema = z
  .object({
    cues: z.array(EpisodeCueSchema).min(minCueCount).max(maxCueCount)
  })
  .superRefine((script, ctx) => {
    const speechCueCount = script.cues.filter((cue) => cue.kind === 'speech').length

    if (speechCueCount < minSpeechCueCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['cues'],
        message: `expected at least ${minSpeechCueCount} speech cues, got ${speechCueCount}`
      })
    }

    if (speechCueCount > maxSpeechCueCount) {
      ctx.addIssue({
        code: 'custom',
        path: ['cues'],
        message: `expected at most ${maxSpeechCueCount} speech cues, got ${speechCueCount}`
      })
    }
  })

export type ChapterEpisodeRequest = {
  model: string
  scenario: {
    title: string
    genres: readonly string[]
    tone: string
  }
  chapter: {
    title: string
    synopsis: string
  }
  cast: ReadonlyArray<{
    alias: string
    character: StoryCharacterContext
  }>
}

// Handlebars テンプレートを読み込み、描画関数を返す。
const loadTemplate = (fileName: string) => Handlebars.compile(readFileSync(join(templateDir, fileName), 'utf8'))

const renderEpisodeSystemInstruction = loadTemplate('chapter-episode-system-instruction.hbs')
const renderChapterEpisodePrompt = loadTemplate('chapter-episode-prompt.hbs')

// 話者 alias の整合も含めた cue 検証スキーマを組み立てる。
const buildEpisodeCueSchema = (speakerAliases: readonly string[]) =>
  z
    .array(EpisodeCueSchema)
    .min(minCueCount)
    .max(maxCueCount)
    .superRefine((cues, ctx) => {
      const speakerAliasSet = new Set(speakerAliases)
      const speechCueCount = cues.filter((cue) => cue.kind === 'speech').length

      if (speechCueCount < minSpeechCueCount) {
        ctx.addIssue({
          code: 'custom',
          path: [],
          message: `expected at least ${minSpeechCueCount} speech cues, got ${speechCueCount}`
        })
      }

      if (speechCueCount > maxSpeechCueCount) {
        ctx.addIssue({
          code: 'custom',
          path: [],
          message: `expected at most ${maxSpeechCueCount} speech cues, got ${speechCueCount}`
        })
      }

      cues.forEach((cue, index) => {
        if (cue.kind === 'speech' && !speakerAliasSet.has(cue.speaker)) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'speaker'],
            message: `unknown speaker alias ${cue.speaker}`
          })
        }
      })
    })

// エピソード応答 JSON の形を検証する。
const parseEpisodeScript = (text: string): readonly Cue[] => {
  const jsonResult = parseJsonText(text)
  const scriptResult = EpisodeScriptSchema.safeParse(jsonResult)

  if (!scriptResult.success) {
    throw new Error(`Invalid episode response: ${formatZodIssues(scriptResult.error)}`)
  }

  return scriptResult.data.cues
}

// 受け取った cue が許可済みの話者 alias だけを参照しているか検証する。
export const validateEpisodeCues = ({
  cues,
  speakerAliases
}: {
  cues: readonly Cue[]
  speakerAliases: readonly string[]
}) => {
  const cueResult = buildEpisodeCueSchema(speakerAliases).safeParse(cues)

  if (!cueResult.success) {
    throw new Error(`Invalid episode response: cues.${formatZodIssues(cueResult.error)}`)
  }
}

const getClient = () => {
  const envResult = GeminiEnvSchema.safeParse(process.env)

  if (!envResult.success) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const cachedClient = clientCache.get('default')

  if (cachedClient) {
    return cachedClient
  }

  const createdClient = new GoogleGenAI({ apiKey: envResult.data.GEMINI_API_KEY })
  clientCache.set('default', createdClient)
  return createdClient
}

const buildEpisodeSystemInstruction = (speakerAliases: readonly string[]) =>
  renderEpisodeSystemInstruction({
    speakerAliases: speakerAliases.map((speakerAlias) => `"${speakerAlias}"`).join(' | ')
  }).trim()

// プロンプトには話者 alias を見せ、内部 speakerId は含めない。
const toPromptCast = (request: ChapterEpisodeRequest) =>
  request.cast.map((item) => ({
    alias: item.alias,
    character: {
      id: item.character.id,
      name: item.character.name,
      ageGroup: item.character.ageGroup,
      gender: item.character.gender,
      occupation: item.character.occupation,
      personalityTags: item.character.personalityTags,
      speechStyle: item.character.speechStyle,
      firstPerson: item.character.firstPerson,
      secondPerson: item.character.secondPerson,
      honorific: item.character.honorific,
      attributeTags: item.character.attributeTags,
      backgroundTags: item.character.backgroundTags,
      memo: item.character.memo
    }
  }))

// 章プロットからエピソード生成用プロンプトを組み立てる。
export const buildChapterEpisodePrompt = (request: ChapterEpisodeRequest) =>
  renderChapterEpisodePrompt({
    scenarioJson: JSON.stringify(request.scenario, null, 2),
    chapterJson: JSON.stringify(request.chapter, null, 2),
    castJson: JSON.stringify(toPromptCast(request), null, 2)
  }).trim()

// Gemini の JSON 文字列を cue 配列として検証する。
export const parseChapterEpisodeText = ({ text }: { text: string }): readonly Cue[] => {
  return parseEpisodeScript(text)
}

// 章プロットからエピソード cue を生成する。
export const writeChapterEpisode = async (request: ChapterEpisodeRequest): Promise<readonly Cue[]> => {
  const client = getClient()
  const speakerAliases = request.cast.map((item) => item.alias)
  const response = await client.models.generateContent({
    model: request.model,
    contents: buildChapterEpisodePrompt(request),
    config: {
      systemInstruction: buildEpisodeSystemInstruction(speakerAliases),
      responseMimeType: 'application/json'
    }
  })

  if (!response.text) {
    throw new Error('Gemini returned empty response')
  }

  return parseChapterEpisodeText({ text: response.text })
}

// cue 配列から再生時間を概算する。
export const estimateEpisodeDuration = (cues: readonly Cue[]): number => {
  const totalSpeechChars = cues.reduce((total, cue) => (cue.kind === 'speech' ? total + cue.text.length : total), 0)
  const totalPauseSeconds = cues.reduce((total, cue) => (cue.kind === 'pause' ? total + cue.duration : total), 0)
  return Number((totalSpeechChars / 330 + totalPauseSeconds / 60 || 0).toFixed(1))
}

const parseJsonText = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }
}

const formatZodIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root'
      return `${path}: ${issue.message}`
    })
    .join('; ')
