import { describe, expect, test } from 'bun:test'
import { scenarioSeedSet } from '../prisma/scenario-seeds'
import { plotSeedIds, plotSpeakerSeedIds } from '../src/lib/plot-seed-ids'
import { ScenarioSeedSetSchema } from '../src/schemas/scenario-seed.dto'

describe('Scenario seed data', () => {
  test('シナリオ管理ページ向け seed が DTO を満たす', () => {
    const result = ScenarioSeedSetSchema.safeParse(scenarioSeedSet)

    expect(result.success).toBe(true)
  })

  test('シナリオ一覧向けの代表データが揃っている', () => {
    expect(scenarioSeedSet.scenarios).toHaveLength(5)
    expect(new Set(scenarioSeedSet.characters.map((character) => character.id)).size).toBe(
      scenarioSeedSet.characters.length
    )

    const natsu = scenarioSeedSet.scenarios.find((scenario) => scenario.title === '夏の約束')
    const souten = scenarioSeedSet.scenarios.find((scenario) => scenario.title === '蒼天の彼方')

    expect(natsu?.id).toBe(plotSeedIds.natsu)
    expect(natsu?.narratorSpeakerId).toBe(plotSpeakerSeedIds.yuki)
    expect(natsu?.genres).toEqual(['学園', '恋愛'])
    expect(natsu?.cast.map((cast) => cast.alias)).toEqual(['ema', 'hiro', 'yuki'])
    expect(natsu?.cast.map((cast) => cast.speakerId)).toEqual([
      plotSpeakerSeedIds.ema,
      plotSpeakerSeedIds.hiro,
      plotSpeakerSeedIds.yuki
    ])
    expect(natsu?.chapters.map((chapter) => chapter.number)).toEqual([1, 2, 3, 4])
    expect(natsu?.chapters[0]?.characters).toEqual(['ema', 'hiro', 'yuki'])
    expect(natsu?.chapters[0]?.cues[0]).toEqual({
      kind: 'speech',
      speaker: 'yuki',
      text: '夏の終わり、蝉の声が遠くなった放課後。図書室の窓から差し込む夕日が、古びた机の上の埃を金色に輝かせていた。'
    })
    expect(souten?.id).toBe(plotSeedIds.souten)
    expect(souten?.status).toBe('draft')
    expect(souten?.cast).toHaveLength(0)
    expect(souten?.chapters).toHaveLength(0)
  })
})
