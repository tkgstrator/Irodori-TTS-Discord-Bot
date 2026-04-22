import { describe, expect, test } from 'bun:test'
import { scenarioSeedSet } from '../prisma/scenario-seeds'
import { ScenarioSeedSetSchema } from '../schemas/scenario-seed.dto'

describe('Scenario seed data', () => {
  test('シナリオ管理ページ向け seed が DTO を満たす', () => {
    const result = ScenarioSeedSetSchema.safeParse(scenarioSeedSet)

    expect(result.success).toBe(true)
  })

  test('シナリオ一覧向けの代表データが揃っている', () => {
    expect(scenarioSeedSet.characters).toHaveLength(8)
    expect(scenarioSeedSet.scenarios).toHaveLength(5)

    const natsu = scenarioSeedSet.scenarios.find((scenario) => scenario.title === '夏の約束')
    const souten = scenarioSeedSet.scenarios.find((scenario) => scenario.title === '蒼天の彼方')

    expect(natsu?.genres).toEqual(['学園', '恋愛'])
    expect(natsu?.cast.map((cast) => cast.alias)).toEqual(['renka', 'shota', 'narrator'])
    expect(souten?.status).toBe('draft')
    expect(souten?.cast).toHaveLength(0)
  })
})
