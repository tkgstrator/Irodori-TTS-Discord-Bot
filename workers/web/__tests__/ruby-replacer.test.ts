import { describe, expect, test } from 'bun:test'
import { applyRubyAnnotations } from '../src/api/ruby-replacer'

describe('applyRubyAnnotations', () => {
  test('基本的な置換: 酒寄 → |酒寄[さかより]', () => {
    const result = applyRubyAnnotations('酒寄さんが来た', [{ word: '酒寄', reading: 'さかより' }])
    expect(result).toBe('|酒寄[さかより]さんが来た')
  })

  test('同じテキスト内の複数の単語を置換する', () => {
    const entries = [
      { word: '酒寄', reading: 'さかより' },
      { word: '東京', reading: 'とうきょう' }
    ]
    const result = applyRubyAnnotations('酒寄は東京に住んでいる', entries)
    expect(result).toBe('|酒寄[さかより]は|東京[とうきょう]に住んでいる')
  })

  test('長い単語が短い単語より先にマッチする', () => {
    const entries = [
      { word: '東京', reading: 'とうきょう' },
      { word: '東京都', reading: 'とうきょうと' }
    ]
    const result = applyRubyAnnotations('東京都に行く', entries)
    expect(result).toBe('|東京都[とうきょうと]に行く')
  })

  test('既存の |word[reading] パターンを二重アノテーションしない', () => {
    const entries = [{ word: '酒寄', reading: 'さかより' }]
    const result = applyRubyAnnotations('|酒寄[さかより]さんが来た', entries)
    expect(result).toBe('|酒寄[さかより]さんが来た')
  })

  test('エントリが空のとき元のテキストをそのまま返す', () => {
    const result = applyRubyAnnotations('酒寄さんが来た', [])
    expect(result).toBe('酒寄さんが来た')
  })

  test('マッチするエントリがないとき元のテキストをそのまま返す', () => {
    const result = applyRubyAnnotations('特になし', [{ word: '酒寄', reading: 'さかより' }])
    expect(result).toBe('特になし')
  })

  test('正規表現の特殊文字を含む word を正しく処理する', () => {
    const entries = [{ word: '(笑)', reading: 'わらい' }]
    const result = applyRubyAnnotations('彼は(笑)と言った', entries)
    expect(result).toBe('彼は|(笑)[わらい]と言った')
  })

  test('固有名が一般ルールより優先される', () => {
    const entries = [
      { word: '君', reading: 'きみ' },
      { word: 'ぱとて君', reading: 'ぱとてくん' }
    ]
    const result = applyRubyAnnotations('ぱとて君は君だ', entries)
    expect(result).toBe('|ぱとて君[ぱとてくん]は|君[きみ]だ')
  })

  test('同じ単語の複数の出現箇所をすべて置換する', () => {
    const entries = [{ word: '酒寄', reading: 'さかより' }]
    const result = applyRubyAnnotations('酒寄と酒寄が会った', entries)
    expect(result).toBe('|酒寄[さかより]と|酒寄[さかより]が会った')
  })
})
