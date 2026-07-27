import { describe, expect, test } from 'bun:test'
import { SpeakerConfigSchema, UserSettingsSchema } from '@irodori-tts/shared/settings'

describe('SpeakerConfig', () => {
  test('空オブジェクトは有効（全てサーバー側デフォルト）', () => {
    expect(SpeakerConfigSchema.safeParse({}).success).toBe(true)
  })

  test('範囲内の値を受け付ける', () => {
    const result = SpeakerConfigSchema.safeParse({
      numSteps: 32,
      cfgScaleText: 1.5,
      cfgScaleSpeaker: 2,
      speakerKvScale: 0.8,
      truncationFactor: 1,
      seed: 42
    })
    expect(result.success).toBe(true)
  })

  test('ステップ数の範囲外を弾く', () => {
    expect(SpeakerConfigSchema.safeParse({ numSteps: 0 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ numSteps: 101 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ numSteps: 1.5 }).success).toBe(false)
  })

  test('ノイズ切り詰めは0より大きく1以下', () => {
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 0 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 1.1 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 0.5 }).success).toBe(true)
  })
})

describe('UserSettings', () => {
  test('話者IDが空文字なら弾く', () => {
    expect(UserSettingsSchema.safeParse({ speaker: { currentId: '', settings: {} } }).success).toBe(false)
  })

  test('settings未指定なら空オブジェクトが入る', () => {
    const result = UserSettingsSchema.safeParse({ speaker: { currentId: 'speaker-1' } })
    expect(result.success).toBe(true)
    expect(result.success && result.data.speaker.settings).toEqual({})
  })
})
