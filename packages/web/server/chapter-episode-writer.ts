import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { GoogleGenAI } from '@google/genai'
import Handlebars from 'handlebars'
import { z } from 'zod'
import {
  getAgeGroupLabel,
  getFirstPersonLabel,
  getGenderLabel,
  getHonorificLabel,
  getOccupationLabel,
  getSecondPersonLabel,
  getSpeechStyleLabel
} from '../lib/character-options'
import type { Cue } from '../lib/scenarios'
import type { ChapterEpisodeRequest } from '../schemas/chapter-episode-request.dto'

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
  }),
  z.object({
    kind: z.literal('scene'),
    name: z.string().trim().nonempty()
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

// Handlebars テンプレートを読み込み、描画関数を返す。
const loadTemplate = (fileName: string) => Handlebars.compile(readFileSync(join(templateDir, fileName), 'utf8'))

const renderEpisodeSystemInstruction = loadTemplate('chapter-episode-system-instruction.hbs')
const renderChapterEpisodePrompt = loadTemplate('chapter-episode-prompt.hbs')

// 空配列を Writer 向けの読みやすい文字列へ整形する。
const formatPromptList = (values: readonly string[], emptyLabel = 'なし') => {
  return values.length > 0 ? values.join('、') : emptyLabel
}

// 空文字や null を Writer 向けの読みやすい文字列へ整形する。
const formatPromptValue = (value: string | null, emptyLabel = 'なし') => {
  if (value === null) {
    return emptyLabel
  }

  return value.trim().length > 0 ? value : emptyLabel
}

// 作品全体の前提を Writer 向けの文章へ整形する。
const buildScenarioSummary = (request: ChapterEpisodeRequest) =>
  [
    `- タイトル: ${request.scenario.title}`,
    `- ジャンル: ${request.scenario.genres.join('、')}`,
    `- トーン: ${request.scenario.tone}`
  ].join('\n')

// 今回の章で扱う内容を Writer 向けの文章へ整形する。
const buildChapterSummary = (request: ChapterEpisodeRequest) =>
  [`- 章タイトル: ${request.chapter.title}`, `- この章で扱う内容: ${request.chapter.synopsis}`].join('\n')

// 登場人物ごとの情報を Writer が読みやすい形へ整形する。
const buildCharacterProfiles = (request: ChapterEpisodeRequest) =>
  request.cast
    .map((item) =>
      [
        `- 話者ID: ${item.alias}`,
        `  - 名前: ${item.character.name}`,
        `  - 年齢層: ${getAgeGroupLabel(item.character.ageGroup)}`,
        `  - 性別: ${getGenderLabel(item.character.gender)}`,
        `  - 職業: ${getOccupationLabel(item.character.occupation)}`,
        `  - 性格: ${formatPromptList(item.character.personalityTags)}`,
        `  - 口調: ${getSpeechStyleLabel(item.character.speechStyle)}`,
        `  - 一人称: ${getFirstPersonLabel(item.character.firstPerson)}`,
        `  - 二人称: ${item.character.secondPerson ? getSecondPersonLabel(item.character.secondPerson) : 'なし'}`,
        `  - 敬称: ${getHonorificLabel(item.character.honorific)}`,
        `  - 属性: ${formatPromptList(item.character.attributeTags)}`,
        `  - 背景: ${formatPromptList(item.character.backgroundTags)}`,
        `  - セリフサンプル: ${formatPromptList(item.character.sampleQuotes)}`,
        `  - 補足メモ: ${formatPromptValue(item.character.memo)}`,
        `  - 声の説明: ${formatPromptValue(item.character.caption)}`
      ].join('\n')
    )
    .join('\n\n')

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

// 章プロットからエピソード生成用プロンプトを組み立てる。
export const buildChapterEpisodePrompt = (request: ChapterEpisodeRequest) =>
  renderChapterEpisodePrompt({
    scenarioSummary: buildScenarioSummary(request),
    chapterSummary: buildChapterSummary(request),
    characterProfiles: buildCharacterProfiles(request)
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
