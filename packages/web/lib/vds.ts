import {
  type SpeakerRef,
  type VdsJson,
  VdsJsonSchema,
  type VdsSynthOptions,
  type Cue as VoiceDramaCue
} from '@irodori-tts/shared/voice-drama'
import type { Chapter, Scenario } from './scenarios'

// VDS 出力成功時の共通戻り値。
export type VdsExportSuccess = {
  ok: true
  fileName: string
  content: string
}

// VDS 出力失敗時の共通戻り値。
export type VdsExportFailure = {
  ok: false
  reason: string
}

// VDS 出力系 API の共通結果型。
export type VdsExportResult = VdsExportSuccess | VdsExportFailure

const synthOptionKeys = [
  'seed',
  'num_steps',
  'cfg_scale_text',
  'cfg_scale_speaker',
  'speaker_kv_scale',
  'truncation_factor'
] as const

// VDS の 1 行制約に合わせて改行と余分な空白を正規化する。
const normalizeVdsText = (text: string): string => text.replace(/\s*\r?\n\s*/g, ' ').trim()

// caption 文字列向けにバックスラッシュとダブルクォートをエスケープする。
const escapeQuotedText = (text: string): string =>
  normalizeVdsText(text).replaceAll('\\', '\\\\').replaceAll('"', '\\"')

// VDS cue option を仕様順の `k=v` 形式へ整形する。
const formatSynthOptions = (options: VdsSynthOptions | undefined): string => {
  const optionText = synthOptionKeys
    .flatMap((key) => {
      const value = options?.[key]

      return value === undefined ? [] : [`${key}=${value}`]
    })
    .join(', ')

  return optionText.length > 0 ? ` [${optionText}]` : ''
}

// エイリアスに対応する VDS 話者定義を解決する。
const resolveSpeakerRef = ({ scenario, alias }: { scenario: Scenario; alias: string }) => {
  const speaker = scenario.speakers.find((item) => item.alias === alias)

  if (!speaker) {
    return {
      ok: false,
      reason: `話者エイリアス「${alias}」が見つからないため VDS を出力できません`
    } as const
  }

  if (!speaker.speakerId) {
    return {
      ok: false,
      reason: `話者エイリアス「${alias}」に speakerId がないため VDS を出力できません`
    } as const
  }

  return {
    ok: true,
    data: { uuid: speaker.speakerId }
  } as const
}

// VDS-JSON を組み立てて shared schema で検証する。
const buildVdsJson = ({
  scenario,
  title,
  cues
}: {
  scenario: Scenario
  title: string
  cues: readonly VoiceDramaCue[]
}) => {
  const speakerMap = new Map<string, SpeakerRef>()

  for (const cue of cues) {
    if (cue.kind === 'pause') {
      continue
    }

    const speakerRef = resolveSpeakerRef({ scenario, alias: cue.speaker })

    if (!speakerRef.ok) {
      return speakerRef
    }

    if (!speakerMap.has(cue.speaker)) {
      speakerMap.set(cue.speaker, speakerRef.data)
    }
  }

  const parseResult = VdsJsonSchema.safeParse({
    version: 1,
    title: normalizeVdsText(title),
    speakers: Object.fromEntries(speakerMap),
    cues
  })

  if (!parseResult.success) {
    return {
      ok: false,
      reason: 'VDS の形式を組み立てられません'
    } as const
  }

  return {
    ok: true,
    data: parseResult.data
  } as const
}

// VDS の話者定義行を組み立てる。
const serializeSpeakerDirective = ({ alias, speaker }: { alias: string; speaker: SpeakerRef }): string =>
  'uuid' in speaker
    ? `@speaker ${alias} = ${speaker.uuid}`
    : `@speaker ${alias} = caption "${escapeQuotedText(speaker.caption)}"`

// VDS の cue 行を組み立てる。
const serializeCue = (cue: VoiceDramaCue): string => {
  if (cue.kind === 'pause') {
    return `(pause ${cue.duration})`
  }

  return `${cue.speaker}${formatSynthOptions(cue.options)}: ${normalizeVdsText(cue.text)}`
}

// VDS ドキュメント全体をプレーンテキストへ整形する。
const serializeVdsDocument = ({ vds, bodyLines }: { vds: VdsJson; bodyLines: readonly string[] }): string => {
  const titleLines = vds.title ? [`@title: ${normalizeVdsText(vds.title)}`] : []
  const speakerLines = Object.entries(vds.speakers).map(([alias, speaker]) =>
    serializeSpeakerDirective({ alias, speaker })
  )

  return ['@version: 1', ...titleLines, ...speakerLines, '', ...bodyLines].join('\n')
}

// シナリオ全体の章群を VDS 本文へ整形する。
const serializeScenarioBody = (chapters: readonly Chapter[]): string[] =>
  chapters.flatMap((chapter, index) => [
    ...(index > 0 ? [''] : []),
    `# 第${chapter.number}章: ${normalizeVdsText(chapter.title)}`,
    ...chapter.cues.map((cue) => serializeCue(cue))
  ])

// 章単体の VDS 出力内容を組み立てる。
export const createChapterVdsExport = ({
  scenario,
  chapter
}: {
  scenario: Scenario
  chapter: Chapter
}): VdsExportResult => {
  if (chapter.cues.length === 0) {
    return {
      ok: false,
      reason: 'この章には出力できるセリフがありません'
    } as const
  }

  const vdsResult = buildVdsJson({
    scenario,
    title: `${scenario.title} 第${chapter.number}章 ${chapter.title}`,
    cues: chapter.cues
  })

  if (!vdsResult.ok) {
    return vdsResult
  }

  return {
    ok: true,
    fileName: `scenario-${scenario.id}-chapter-${chapter.number}.vds`,
    content: serializeVdsDocument({
      vds: vdsResult.data,
      bodyLines: chapter.cues.map((cue) => serializeCue(cue))
    })
  } as const
}

// 章単体の VDS-JSON 出力内容を組み立てる。
export const createChapterVdsJsonExport = ({
  scenario,
  chapter
}: {
  scenario: Scenario
  chapter: Chapter
}): VdsExportResult => {
  if (chapter.cues.length === 0) {
    return {
      ok: false,
      reason: 'この章には出力できるセリフがありません'
    } as const
  }

  const vdsResult = buildVdsJson({
    scenario,
    title: `${scenario.title} 第${chapter.number}章 ${chapter.title}`,
    cues: chapter.cues
  })

  if (!vdsResult.ok) {
    return vdsResult
  }

  return {
    ok: true,
    fileName: `scenario-${scenario.id}-chapter-${chapter.number}.vds.json`,
    content: `${JSON.stringify(vdsResult.data, null, 2)}\n`
  } as const
}

// シナリオ全体の VDS 出力内容を組み立てる。
export const createScenarioVdsExport = (scenario: Scenario): VdsExportResult => {
  const chapters = scenario.chapters.filter((chapter) => chapter.cues.length > 0)

  if (chapters.length === 0) {
    return {
      ok: false,
      reason: 'このプロットには出力できるセリフがありません'
    } as const
  }

  const vdsResult = buildVdsJson({
    scenario,
    title: scenario.title,
    cues: chapters.flatMap((chapter) => chapter.cues)
  })

  if (!vdsResult.ok) {
    return vdsResult
  }

  return {
    ok: true,
    fileName: `scenario-${scenario.id}.vds`,
    content: serializeVdsDocument({
      vds: vdsResult.data,
      bodyLines: serializeScenarioBody(chapters)
    })
  } as const
}

// シナリオ全体の VDS-JSON 出力内容を組み立てる。
export const createScenarioVdsJsonExport = (scenario: Scenario): VdsExportResult => {
  const chapters = scenario.chapters.filter((chapter) => chapter.cues.length > 0)

  if (chapters.length === 0) {
    return {
      ok: false,
      reason: 'このプロットには出力できるセリフがありません'
    } as const
  }

  const vdsResult = buildVdsJson({
    scenario,
    title: scenario.title,
    cues: chapters.flatMap((chapter) => chapter.cues)
  })

  if (!vdsResult.ok) {
    return vdsResult
  }

  return {
    ok: true,
    fileName: `scenario-${scenario.id}.vds.json`,
    content: `${JSON.stringify(vdsResult.data, null, 2)}\n`
  } as const
}

// 生成した VDS テキストをブラウザからダウンロードする。
export const downloadVdsFile = ({
  fileName,
  content,
  contentType = 'text/vnd.vds;charset=utf-8'
}: {
  fileName: string
  content: string
  contentType?: string
}) => {
  const blob = new Blob([content], {
    type: contentType
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
