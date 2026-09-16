import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { getSpeakers } from '../src/api/tts'

afterEach(() => {
  mock.restore()
})

describe('getSpeakers', () => {
  test('話者の表示情報と既定値をUI向けに変換する', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          object: 'list',
          data: [
            {
              id: '2560d383-109b-53de-a97c-b144fcbdc093',
              object: 'voice',
              name: '橘シェリー',
              cv: '声優名',
              category: { id: 'detective', label: '探偵' },
              defaults: {
                num_steps: 40,
                cfg_scale_text: 3,
                cfg_scale_speaker: 5,
                speaker_kv_scale: 1.2,
                truncation_factor: 0.8,
                seed: 42,
                ignored: 'value'
              }
            }
          ]
        }),
        { headers: { 'content-type': 'application/json' } }
      )
    )

    expect(await getSpeakers()).toEqual([
      {
        uuid: '2560d383-109b-53de-a97c-b144fcbdc093',
        name: '橘シェリー',
        cv: '声優名',
        categoryLabel: '探偵',
        defaults: {
          numSteps: 40,
          cfgScaleText: 3,
          cfgScaleSpeaker: 5,
          speakerKvScale: 1.2,
          truncationFactor: 0.8,
          seed: 42
        }
      }
    ])
  })
})
