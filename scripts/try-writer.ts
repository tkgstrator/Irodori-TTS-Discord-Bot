/**
 * Writer の動作確認スクリプト。
 *
 * 使い方:
 *   bun run scripts/try-writer.ts
 *
 * 環境変数 `GEMINI_API_KEY` が設定されている必要がある（`.env` 参照）。
 * 学園モノの BeatSheet を Writer に投げて、返ってきた VDS-JSON を標準出力に表示する。
 */

import type { BeatSheet } from '../src/schemas/agent-protocol'
import { write } from '../src/agents/writer'

const sheet: BeatSheet = {
  schemaVersion: 1,
  dramaId: 'demo-school-001',
  beat: {
    beatId: 'beat-001',
    sceneKind: 'realtime',
    goal:
      '朝の登校中、エマとヒロが桜並木を歩きながら雑談する。エマが文化祭の準備が大変だと愚痴り、ヒロが冷静にフォローする。最後にエマが気合いを入れ直して教室に向かう',
    tension: 'low',
    presentCharacters: ['emma', 'hiro', 'narrator']
  },
  speakers: {
    emma: {
      uuid: '7c9e6a55-5b6a-4a4d-9c49-1d5a3b2f6cbb',
      persona:
        '好奇心旺盛な中学 2 年生の桜羽エマ。クラスの文化祭実行委員。ヒロには頼りつつも、からかわれるとムキになる。',
      speechStyle: 'くだけた若者口調。元気で明るい、早口気味',
      knownFactsSnapshot: [
        { content: '自分は中学 2 年生、桜ヶ丘中学校 2-A 所属', beliefStrength: 'certain' },
        { content: '文化祭実行委員を務めている', beliefStrength: 'certain' },
        { content: 'ヒロは幼馴染で家が隣同士、一緒に登校する仲', beliefStrength: 'certain' },
        { content: '今日は 4 月半ばの朝、桜が散り始めている', beliefStrength: 'certain' }
      ]
    },
    hiro: {
      uuid: '5680ac39-43c9-487a-bc3e-018c0d29cc38',
      persona:
        '寡黙で論理的な中学 2 年生の二階堂ヒロ。口数は少ないが、エマの突飛な行動を冷静に拾ってフォローする。',
      speechStyle: 'くだけた若者口調。短めの落ち着いた言い回し',
      knownFactsSnapshot: [
        { content: '自分は中学 2 年生、桜ヶ丘中学校 2-A 所属', beliefStrength: 'certain' },
        { content: 'エマは幼馴染で家が隣同士', beliefStrength: 'certain' },
        { content: '本を読むのが好き。自作 PC を持っている', beliefStrength: 'certain' },
        { content: '今日は 4 月半ばの朝、桜が散り始めている', beliefStrength: 'certain' }
      ]
    },
    narrator: {
      uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      persona: '三人称の語り手。感情を抑えた落ち着いた声で情景を描写する',
      speechStyle: '常体と敬体を適度に混ぜた情景描写。一文が短めで読点控えめ',
      knownFactsSnapshot: [
        { content: '舞台は現代日本の地方都市、桜ヶ丘中学校での学園生活', beliefStrength: 'certain' },
        { content: '現在 4 月半ばの朝、桜が散り始めている', beliefStrength: 'certain' },
        { content: '通学路は桜並木', beliefStrength: 'certain' }
      ]
    }
  },
  recentBeats: [],
  constraints: {
    maxCueTextLength: 200,
    maxBeatTextLength: 1500,
    maxCueCount: 15,
    allowedPauseRange: [0.5, 2.5]
  }
}

const main = async (): Promise<void> => {
  console.log('--- BeatSheet ---')
  console.log(`goal: ${sheet.beat.goal}`)
  console.log(`presentCharacters: ${sheet.beat.presentCharacters.join(', ')}`)
  console.log('')
  console.log('Writer に問い合わせ中... (Gemini)')

  const startedAt = Date.now()
  const vds = await write(sheet)
  const elapsedMs = Date.now() - startedAt

  console.log(`\n--- VdsJson (${elapsedMs}ms) ---`)
  console.log(JSON.stringify(vds, null, 2))

  const totalText = vds.cues
    .filter((c) => c.kind === 'speech')
    .map((c) => (c.kind === 'speech' ? c.text.length : 0))
    .reduce((a, b) => a + b, 0)
  console.log(`\n--- stats ---`)
  console.log(`cue 数: ${vds.cues.length}`)
  console.log(`speech 本文合計文字数: ${totalText}`)
}

await main()
