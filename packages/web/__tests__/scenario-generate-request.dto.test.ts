import { describe, expect, test } from 'bun:test'
import { ScenarioGenerateRequestSchema } from '../src/schemas/scenario-generate-request.dto'

describe('ScenarioGenerateRequestSchema', () => {
  test('LLM 送信用の JSON を受け入れる', () => {
    const result = ScenarioGenerateRequestSchema.safeParse({
      model: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-pro'
      },
      plot: {
        title: '夏の約束',
        genres: ['学園', '恋愛'],
        tone: 'ほろ苦い',
        promptNote: '放課後の屋上で距離が縮まる流れにしたい'
      },
      characters: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: '桜羽エマ',
          ageGroup: 'teen',
          gender: 'female',
          occupation: 'student_high',
          personalityTags: ['kind', 'cheerful'],
          speechStyle: 'neutral',
          firstPerson: 'watashi',
          secondPerson: 'anata',
          honorific: 'san',
          attributeTags: ['transfer-student'],
          backgroundTags: ['library-club'],
          sampleQuotes: ['そうなんだ', 'うれしいな'],
          memo: '感情が顔に出やすい',
          speakerId: null,
          caption: '明るい女子高生。素直で少し高めの声。'
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  test('ジャンル未選択の JSON は失敗する', () => {
    const result = ScenarioGenerateRequestSchema.safeParse({
      model: {
        editor: 'gemini-2.5-flash',
        writer: 'gemini-2.5-flash'
      },
      plot: {
        title: '夏の約束',
        genres: [],
        tone: 'ほろ苦い',
        promptNote: ''
      },
      characters: []
    })

    expect(result.success).toBe(false)
  })
})
