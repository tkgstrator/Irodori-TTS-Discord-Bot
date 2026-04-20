import { describe, expect, test } from 'bun:test'
import { SpeakerConfigSchema, SpeakerConfigUpdateSchema, UserSettingsSchema } from '../src/schemas/userSettings.dto'

describe('SpeakerConfigSchema', () => {
  test('正常な値でバリデーションが成功する', () => {
    const validData = {
      numSteps: 40,
      cfgScaleText: 3.0,
      cfgScaleSpeaker: 5.0,
      speakerKvScale: 1.2,
      truncationFactor: 0.8,
      seed: 42
    }
    const result = SpeakerConfigSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  test('全項目省略可（未設定はLoRAデフォルトに委ねる）', () => {
    const result = SpeakerConfigSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.numSteps).toBeUndefined()
      expect(result.data.cfgScaleText).toBeUndefined()
      expect(result.data.cfgScaleSpeaker).toBeUndefined()
      expect(result.data.speakerKvScale).toBeUndefined()
      expect(result.data.truncationFactor).toBeUndefined()
      expect(result.data.seed).toBeUndefined()
    }
  })

  test('numStepsが範囲外の場合はバリデーションエラー', () => {
    expect(SpeakerConfigSchema.safeParse({ numSteps: 0 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ numSteps: 101 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ numSteps: 1.5 }).success).toBe(false)
  })

  test('cfg_scale系は0より大でなければならない', () => {
    expect(SpeakerConfigSchema.safeParse({ cfgScaleText: 0 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ cfgScaleText: -1 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ cfgScaleSpeaker: 0 }).success).toBe(false)
  })

  test('truncationFactorは(0, 1]の範囲内でなければならない', () => {
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 0 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 1.1 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 0.5 }).success).toBe(true)
    expect(SpeakerConfigSchema.safeParse({ truncationFactor: 1.0 }).success).toBe(true)
  })

  test('seedは整数でなければならない', () => {
    expect(SpeakerConfigSchema.safeParse({ seed: 1.5 }).success).toBe(false)
    expect(SpeakerConfigSchema.safeParse({ seed: 42 }).success).toBe(true)
    expect(SpeakerConfigSchema.safeParse({ seed: -1 }).success).toBe(true)
  })
})

describe('SpeakerConfigUpdateSchema', () => {
  test('部分的な更新が可能', () => {
    const partialData = { numSteps: 60 }
    const result = SpeakerConfigUpdateSchema.safeParse(partialData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.numSteps).toBe(60)
    }
  })

  test('空のオブジェクトも許可', () => {
    const result = SpeakerConfigUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test('範囲外の値は拒否', () => {
    expect(SpeakerConfigUpdateSchema.safeParse({ numSteps: 200 }).success).toBe(false)
  })
})

describe('UserSettingsSchema', () => {
  const UUID = '7c9e6a55-5b6a-4a4d-9c49-1d5a3b2f6cbb'

  test('正常な値でバリデーションが成功する', () => {
    const validData = {
      speaker: {
        currentId: UUID,
        settings: {
          [UUID]: {
            numSteps: 40,
            cfgScaleText: 3.0
          }
        }
      }
    }
    const result = UserSettingsSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  test('speaker.settingsのデフォルト値が適用される', () => {
    const minimalData = {
      speaker: {
        currentId: UUID
      }
    }
    const result = UserSettingsSchema.safeParse(minimalData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.speaker.settings).toEqual({})
    }
  })

  test('currentIdが空文字列の場合はバリデーションエラー', () => {
    const invalidData = {
      speaker: {
        currentId: '',
        settings: {}
      }
    }
    const result = UserSettingsSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  test('複数の話者設定が可能', () => {
    const otherUuid = '5680ac39-43c9-487a-bc3e-018c0d29cc38'
    const validData = {
      speaker: {
        currentId: UUID,
        settings: {
          [UUID]: { numSteps: 40 },
          [otherUuid]: { numSteps: 60, cfgScaleText: 4.0 }
        }
      }
    }
    const result = UserSettingsSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
