import { describe, expect, test } from 'bun:test'
import { VdsJsonSchema } from '@irodori-tts/shared/voice-drama'

const CHIERI_UUID = '7c9e6a55-5b6a-4a4d-9c49-1d5a3b2f6cbb'
const TSUMUGI_UUID = '5680ac39-43c9-487a-bc3e-018c0d29cc38'

describe('VdsJsonSchema', () => {
  test('仕様書 §4.2 の最小例（UUID＋caption混在、defaults、pause、options）がパースできる', () => {
    const input = {
      version: 1,
      title: '夜明けの対話',
      defaults: { num_steps: 40 },
      speakers: {
        chieri: { type: 'lora', uuid: CHIERI_UUID },
        young_woman: { type: 'caption', caption: '落ち着いた女性の声で、やわらかく自然に読み上げてください。' }
      },
      cues: [
        { kind: 'speech', speaker: 'chieri', text: 'おはよう、つむぎ。' },
        { kind: 'speech', speaker: 'young_woman', text: 'おはようございます、ちえりさん。' },
        { kind: 'pause', duration: 0.8 },
        {
          kind: 'speech',
          speaker: 'chieri',
          text: '今日はね、特別な日なんだ。',
          options: { seed: 42, cfg_scale_text: 3.5 }
        },
        { kind: 'speech', speaker: 'young_woman', text: '何かあるんですか、わたし全然聞いてませんでした。' }
      ]
    }
    const result = VdsJsonSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  test('UUID だけの最小構成でパースできる', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'こんにちは' }]
    })
    expect(result.success).toBe(true)
  })

  test('version が 1 以外の場合は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 2,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })

  test('未定義 speaker エイリアスを参照する cue は拒否（§6.1）', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [
        { kind: 'speech', speaker: 'a', text: 'ok' },
        { kind: 'speech', speaker: 'unknown', text: 'ng' }
      ]
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'cues.1.speaker')).toBe(true)
    }
  })

  test('SpeakerRef は type: lora に caption フィールドを追加すると .strict() により拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID, caption: '女性の声' } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })

  test('SpeakerRef が UUID 形式でない文字列は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: 'not-a-uuid' } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })

  test('cues が空配列は拒否（1 つ以上必要）', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: []
    })
    expect(result.success).toBe(false)
  })

  test('cue.text が空文字列は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: '' }]
    })
    expect(result.success).toBe(false)
  })

  test('cue.text が 200 字を超えるものは拒否（§3.3 30 秒上限の保険）', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'あ'.repeat(201) }]
    })
    expect(result.success).toBe(false)
  })

  test('options の num_steps が範囲外（>100）なら拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x', options: { num_steps: 101 } }]
    })
    expect(result.success).toBe(false)
  })

  test('options の truncation_factor は (0, 1] の範囲内のみ許可', () => {
    const base = {
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } }
    }
    expect(
      VdsJsonSchema.safeParse({
        ...base,
        cues: [{ kind: 'speech', speaker: 'a', text: 'x', options: { truncation_factor: 0 } }]
      }).success
    ).toBe(false)
    expect(
      VdsJsonSchema.safeParse({
        ...base,
        cues: [{ kind: 'speech', speaker: 'a', text: 'x', options: { truncation_factor: 1.1 } }]
      }).success
    ).toBe(false)
    expect(
      VdsJsonSchema.safeParse({
        ...base,
        cues: [{ kind: 'speech', speaker: 'a', text: 'x', options: { truncation_factor: 1.0 } }]
      }).success
    ).toBe(true)
  })

  test('pause.duration が 0 または負なら拒否', () => {
    const base = {
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } }
    }
    expect(
      VdsJsonSchema.safeParse({
        ...base,
        cues: [
          { kind: 'speech', speaker: 'a', text: 'x' },
          { kind: 'pause', duration: 0 }
        ]
      }).success
    ).toBe(false)
    expect(
      VdsJsonSchema.safeParse({
        ...base,
        cues: [
          { kind: 'speech', speaker: 'a', text: 'x' },
          { kind: 'pause', duration: -1 }
        ]
      }).success
    ).toBe(false)
  })

  test('未知のトップレベルフィールドは .strict() により拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }],
      unknownField: 'boom'
    })
    expect(result.success).toBe(false)
  })

  test('未知の cue フィールドは .strict() により拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x', foo: 1 }]
    })
    expect(result.success).toBe(false)
  })

  test('エイリアス名が識別子パターンに合わない場合は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { '1invalid': { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: '1invalid', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })

  test('複数話者＋pause＋options混在の現実的なシナリオがパースできる', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      title: '二人芝居',
      defaults: { num_steps: 40, cfg_scale_text: 3.2 },
      speakers: {
        chieri: { type: 'lora', uuid: CHIERI_UUID },
        tsumugi: { type: 'lora', uuid: TSUMUGI_UUID }
      },
      cues: [
        { kind: 'speech', speaker: 'chieri', text: '…今日、話しておきたいことがあるの。' },
        { kind: 'pause', duration: 1.2 },
        {
          kind: 'speech',
          speaker: 'tsumugi',
          text: 'なんですか？ 緊張します。',
          options: { cfg_scale_speaker: 4.5 }
        },
        { kind: 'pause', duration: 0.5 },
        { kind: 'speech', speaker: 'chieri', text: '実は、ね。' }
      ]
    })
    expect(result.success).toBe(true)
  })

  test('scene cue がパースできる', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [
        { kind: 'speech', speaker: 'a', text: 'こんにちは' },
        { kind: 'scene', name: '第1幕' },
        { kind: 'speech', speaker: 'a', text: 'さようなら' }
      ]
    })
    expect(result.success).toBe(true)
  })

  test('scene cue の name が空文字列は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [
        { kind: 'speech', speaker: 'a', text: 'x' },
        { kind: 'scene', name: '' }
      ]
    })
    expect(result.success).toBe(false)
  })

  test('defaults に gap フィールドを指定できる', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      defaults: { gap: 0.5 },
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(true)
  })

  test('defaults.gap が負値なら拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      defaults: { gap: -1 },
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })

  test('defaults.gap が 0 なら許可（gap 無効化）', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      defaults: { gap: 0 },
      speakers: { a: { type: 'lora', uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(true)
  })

  test('SpeakerRef に type フィールドがない旧形式は拒否', () => {
    const result = VdsJsonSchema.safeParse({
      version: 1,
      speakers: { a: { uuid: CHIERI_UUID } },
      cues: [{ kind: 'speech', speaker: 'a', text: 'x' }]
    })
    expect(result.success).toBe(false)
  })
})
