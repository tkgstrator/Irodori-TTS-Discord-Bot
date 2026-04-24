import { describe, expect, test } from 'bun:test'
import { ScenarioCreateFormSchema, scenarioCharacterLimit } from '../schemas/scenario.dto'

// テスト用の有効なプロット作成入力を組み立てる
const validScenarioInput = {
  title: '夏の約束',
  genres: ['学園', '恋愛'],
  tone: 'ほろ苦い',
  editorModel: 'gemini-2.5-flash',
  writerModel: 'gemini-2.5-flash',
  plotCharacterIds: ['3d0f8e53-45f0-4c18-a1ce-2ff8c0668ea3'],
  promptNote: '放課後の屋上シーンを含める'
}

describe('ScenarioCreateFormSchema', () => {
  test('有効な入力を受け入れる', () => {
    const result = ScenarioCreateFormSchema.safeParse(validScenarioInput)

    expect(result.success).toBe(true)
  })

  test('ジャンル未選択のとき失敗する', () => {
    const result = ScenarioCreateFormSchema.safeParse({
      ...validScenarioInput,
      genres: []
    })

    expect(result.success).toBe(false)
  })

  test('キャラクターを5人選んでも成功する', () => {
    const result = ScenarioCreateFormSchema.safeParse({
      ...validScenarioInput,
      plotCharacterIds: [
        '3d0f8e53-45f0-4c18-a1ce-2ff8c0668ea3',
        '7c2fd0a2-6b77-4f7b-aedc-cc3bd8650fd4',
        'a3d1f4ab-05e5-4a1b-94c4-021cb6ec9d10',
        'c89ed2fb-5246-4e5a-b7e6-a974fdacfd45',
        'f5b3656f-7f01-4a5e-bbc3-d445bc2ad72e'
      ]
    })

    expect(result.success).toBe(true)
  })

  test('キャラクターが上限を超えると失敗する', () => {
    const result = ScenarioCreateFormSchema.safeParse({
      ...validScenarioInput,
      plotCharacterIds: [
        '3d0f8e53-45f0-4c18-a1ce-2ff8c0668ea3',
        '7c2fd0a2-6b77-4f7b-aedc-cc3bd8650fd4',
        'a3d1f4ab-05e5-4a1b-94c4-021cb6ec9d10',
        'c89ed2fb-5246-4e5a-b7e6-a974fdacfd45',
        'f5b3656f-7f01-4a5e-bbc3-d445bc2ad72e',
        'dd6db96b-c0ec-4635-b33b-0ed6c0cbeb87'
      ]
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(`キャラクターは${scenarioCharacterLimit}人まで選択できます`)
  })
})
