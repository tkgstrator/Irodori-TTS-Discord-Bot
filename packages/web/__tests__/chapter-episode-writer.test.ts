import { describe, expect, test } from 'bun:test'
import {
  buildChapterEpisodePrompt,
  estimateEpisodeDuration,
  parseChapterEpisodeText,
  validateEpisodeCues
} from '../server/chapter-episode-writer'

describe('chapter episode writer', () => {
  test('章プロットからエピソード用プロンプトを組み立てる', () => {
    const prompt = buildChapterEpisodePrompt({
      model: 'gemini-2.5-flash',
      scenario: {
        title: '夏の約束',
        genres: ['学園', '恋愛'],
        tone: 'ほろ苦い'
      },
      chapter: {
        title: '出会い',
        synopsis: '転校初日に二人が出会う。'
      },
      cast: [
        {
          alias: 'char1',
          character: {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            name: '桜羽エマ',
            ageGroup: 'young_adult',
            gender: 'female',
            occupation: 'student_high',
            personalityTags: ['cheerful'],
            speechStyle: 'neutral',
            firstPerson: 'watashi',
            secondPerson: '',
            honorific: 'san',
            attributeTags: ['kind'],
            backgroundTags: ['transfer_student'],
            sampleQuotes: ['はじめまして'],
            memo: '明るい',
            speakerId: '11111111-1111-4111-8111-111111111111'
          }
        }
      ]
    })

    expect(prompt).toContain('夏の約束')
    expect(prompt).toContain('出会い')
    expect(prompt).toContain('char1')
    expect(prompt).toContain('cheerful')
    expect(prompt).not.toContain('"speakerId"')
  })

  test('生成された cue JSON を検証できる', () => {
    const cues = parseChapterEpisodeText({
      text: JSON.stringify({
        cues: [
          ...Array.from({ length: 30 }, (_, index) => ({
            kind: 'speech',
            speaker: 'char1',
            text: `台詞${index + 1}`
          })),
          ...Array.from({ length: 10 }, () => ({
            kind: 'pause',
            duration: 1.2
          }))
        ]
      })
    })

    expect(cues).toHaveLength(40)
  })

  test('speech 数が少なすぎる JSON は失敗する', () => {
    expect(() =>
      parseChapterEpisodeText({
        text: JSON.stringify({
          cues: [
            ...Array.from({ length: 20 }, (_, index) => ({
              kind: 'speech',
              speaker: 'char1',
              text: `短い台詞${index + 1}`
            })),
            ...Array.from({ length: 20 }, () => ({
              kind: 'pause',
              duration: 1
            }))
          ]
        })
      })
    ).toThrow('at least 30 speech cues')
  })

  test('未知の alias は失敗する', () => {
    expect(() =>
      validateEpisodeCues({
        cues: [
          {
            kind: 'speech',
            speaker: 'char9',
            text: '不正な話者です。'
          }
        ],
        speakerAliases: ['char1']
      })
    ).toThrow('unknown speaker alias')
  })

  test('cue 配列から再生時間を概算できる', () => {
    const duration = estimateEpisodeDuration([
      {
        kind: 'speech',
        speaker: 'char1',
        text: 'a'.repeat(330)
      },
      {
        kind: 'pause',
        duration: 3
      }
    ])

    expect(duration).toBe(1.1)
  })
})
