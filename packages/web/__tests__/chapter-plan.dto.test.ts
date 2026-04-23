import { describe, expect, test } from 'bun:test'
import { ChapterPlanSchema } from '../schemas/chapter-plan.dto'

describe('ChapterPlanSchema', () => {
  test('章設計の JSON を受け入れる', () => {
    const result = ChapterPlanSchema.safeParse({
      schemaVersion: 1,
      dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
      chapter: {
        number: 2,
        title: '再会',
        summary: '天文台で再会した二人が、前回より少し踏み込んだ会話を交わす。',
        goal: '二人の距離を一段深める。',
        emotionalArc: '緊張から安堵へ移り、最後に小さな期待を残す。'
      },
      continuity: {
        mustKeep: ['前章で交わした次の約束を忘れない。'],
        reveals: ['レイアが星に特別な思い入れを持っていることを明かしてよい。'],
        unresolvedThreads: ['ちえりが抱える不安は次章へ持ち越す。']
      },
      beatOutline: [
        {
          order: 1,
          sceneKind: 'realtime',
          summary: '待ち合わせ場所でぎこちなく挨拶する。',
          goal: '前章からの接続を自然に作る。',
          tension: 'low',
          presentCharacterIds: ['11111111-1111-4111-8111-111111111111']
        },
        {
          order: 2,
          sceneKind: 'realtime',
          summary: '星空の話題から互いの内面へ会話を広げる。',
          goal: '感情線を一歩進める。',
          tension: 'medium',
          presentCharacterIds: ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222']
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  test('beatOutline の order が重複していたら失敗する', () => {
    const result = ChapterPlanSchema.safeParse({
      schemaVersion: 1,
      dramaId: '76150d2f-f27b-48d7-9550-893d76f66726',
      chapter: {
        number: 2,
        title: '再会',
        summary: '再会の章。',
        goal: '再会させる。',
        emotionalArc: '戸惑いから期待へ。'
      },
      continuity: {
        mustKeep: [],
        reveals: [],
        unresolvedThreads: []
      },
      beatOutline: [
        {
          order: 1,
          sceneKind: 'realtime',
          summary: '最初の場面。',
          goal: '状況を始める。',
          tension: 'low',
          presentCharacterIds: ['11111111-1111-4111-8111-111111111111']
        },
        {
          order: 1,
          sceneKind: 'flashback',
          summary: '回想場面。',
          goal: '背景を補う。',
          tension: 'medium',
          presentCharacterIds: ['22222222-2222-4222-8222-222222222222']
        }
      ]
    })

    expect(result.success).toBe(false)
  })
})
