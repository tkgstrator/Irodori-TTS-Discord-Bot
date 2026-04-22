import { describe, expect, test } from 'bun:test'
import { canRegenerateChapter } from '../lib/scenarios'

// 再生成判定用の最小章配列を返す。
const createChapters = () =>
  [
    {
      id: 'ch1',
      number: 1,
      title: 'chapter 1',
      status: 'completed',
      cueCount: 1,
      durationMinutes: 1,
      synopsis: 'chapter 1 synopsis',
      speakers: [],
      cues: []
    },
    {
      id: 'ch2',
      number: 2,
      title: 'chapter 2',
      status: 'completed',
      cueCount: 1,
      durationMinutes: 1,
      synopsis: 'chapter 2 synopsis',
      speakers: [],
      cues: []
    }
  ] as const

describe('canRegenerateChapter', () => {
  test('後続章がある章は再生成できない', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'ch1')).toBe(false)
  })

  test('最後の章は再生成できる', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'ch2')).toBe(true)
  })

  test('存在しない章 ID は再生成不可', () => {
    const chapters = createChapters()

    expect(canRegenerateChapter(chapters, 'missing')).toBe(false)
  })
})
