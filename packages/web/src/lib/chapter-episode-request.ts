import { type ChapterEpisodeRequest, ChapterEpisodeRequestSchema } from '@/schemas/chapter-episode-request.dto'
import type { Character } from './characters'
import type { Chapter, Scenario } from './scenarios'

// Character を Writer 用の文脈へ変換する。
const toStoryCharacterContext = (character: Character) => ({
  id: character.id,
  name: character.name,
  ageGroup: character.ageGroup,
  gender: character.gender,
  occupation: character.occupation,
  personalityTags: character.personalityTags,
  speechStyle: character.speechStyle,
  firstPerson: character.firstPerson,
  secondPerson: character.secondPerson,
  honorific: character.honorific,
  attributeTags: character.attributeTags,
  backgroundTags: character.backgroundTags,
  sampleQuotes: character.sampleQuotes,
  memo: character.memo,
  speakerId: character.speakerId,
  caption: character.caption
})

// 章表示用キャラクターから現在の Character を引き当てる。
const resolveCharacter = ({
  chapterCharacter,
  characters
}: {
  chapterCharacter: Chapter['characters'][number]
  characters: readonly Character[]
}) => {
  if (chapterCharacter.speakerId) {
    const matchedBySpeakerId = characters.find((character) => character.speakerId === chapterCharacter.speakerId)

    if (matchedBySpeakerId) {
      return matchedBySpeakerId
    }
  }

  return characters.find((character) => character.name === chapterCharacter.name) ?? null
}

// 章表示用キャラクターから scenario.speakers 上の alias を引き当てる。
const resolveSpeakerAlias = ({
  chapterCharacter,
  scenario
}: {
  chapterCharacter: Chapter['characters'][number]
  scenario: Scenario
}) => {
  if (chapterCharacter.speakerId) {
    const matchedBySpeakerId = scenario.speakers.find((speaker) => speaker.speakerId === chapterCharacter.speakerId)

    if (matchedBySpeakerId) {
      return matchedBySpeakerId.alias
    }
  }

  return scenario.speakers.find((speaker) => speaker.name === chapterCharacter.name)?.alias ?? null
}

// 画面上の scenario / chapter から Writer 実行用 payload を組み立てる。
export const buildChapterEpisodeRequest = ({
  scenario,
  chapterId,
  characters,
  userDirection
}: {
  scenario: Scenario
  chapterId: string
  characters: readonly Character[]
  userDirection?: string
}): ChapterEpisodeRequest => {
  const chapter = scenario.chapters.find((item) => item.id === chapterId)

  if (!chapter) {
    throw new Error('Chapter not found')
  }

  const cast = chapter.characters.flatMap((chapterCharacter) => {
    const character = resolveCharacter({ chapterCharacter, characters })
    const alias = resolveSpeakerAlias({ chapterCharacter, scenario })

    if (character === null || alias === null) {
      return []
    }

    return [
      {
        alias,
        character: toStoryCharacterContext(character)
      }
    ]
  })

  if (cast.length !== chapter.characters.length) {
    throw new Error('Failed to resolve chapter cast')
  }

  const requestResult = ChapterEpisodeRequestSchema.safeParse({
    model: scenario.writerModel,
    scenario: {
      title: scenario.title,
      genres: scenario.genres,
      tone: scenario.tone
    },
    chapter: {
      title: chapter.title,
      synopsis: chapter.synopsis
    },
    cast,
    userDirection: userDirection || undefined
  })

  if (!requestResult.success) {
    throw new Error('Invalid chapter episode request')
  }

  return requestResult.data
}
