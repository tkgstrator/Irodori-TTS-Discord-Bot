import { describe, expect, test } from 'bun:test'
import { preprocessForTts, preprocessMessageForTts } from '../src/utils/text-preprocess'

describe('preprocessMessageForTts', () => {
  test('マルチラインのコードブロックを完全除去する', () => {
    const input = ['前の文', '```ts', 'const x = 1', 'console.log(x)', '```', '後の文'].join('\n')
    const result = preprocessMessageForTts(input)
    expect(result).not.toContain('const x')
    expect(result).not.toContain('console.log')
    expect(result).not.toContain('```')
    expect(result).not.toContain('コード省略')
    expect(result).toContain('前の文')
    expect(result).toContain('後の文')
  })

  test('インラインコードを完全除去する', () => {
    const input = '関数 `hello()` を呼ぶ'
    const result = preprocessMessageForTts(input)
    expect(result).not.toContain('hello')
    expect(result).not.toContain('`')
  })

  test('スポイラーを「ネタバレ」に置換する', () => {
    const input = '今日の夕飯は||カレー||でした'
    const result = preprocessMessageForTts(input)
    expect(result).not.toContain('カレー')
    expect(result).toContain('ネタバレ')
  })

  test('メッセージ全体がコードブロックのみなら空文字になる', () => {
    const input = ['```', 'x = 1', '```'].join('\n')
    const result = preprocessMessageForTts(input).trim()
    expect(result).toBe('')
  })
})

describe('preprocessForTts', () => {
  test('URLを「URL省略」に置換する', () => {
    const input = '詳しくは https://example.com/docs を参照'
    const result = preprocessForTts(input)
    expect(result).not.toContain('https')
    expect(result).toContain('URL省略')
  })

  test('ユーザー / ロール / チャンネルのメンションを除去する', () => {
    const input = '<@123> と <@&456> と <#789> こんにちは'
    const result = preprocessForTts(input)
    expect(result).not.toContain('<@')
    expect(result).not.toContain('<#')
    expect(result).toContain('こんにちは')
  })

  test('カスタム絵文字を絵文字名に変換する', () => {
    const input = 'いいね <:thumbsup:123> アニメ <a:wave:456>'
    const result = preprocessForTts(input)
    expect(result).toContain('thumbsup')
    expect(result).toContain('wave')
    expect(result).not.toContain('<:')
    expect(result).not.toContain('<a:')
  })

  test('連続した空白を1つにまとめてtrimする', () => {
    const input = '   こんにちは   世界   '
    const result = preprocessForTts(input)
    expect(result).toBe('こんにちは 世界')
  })

  test('空文字はnullを返す', () => {
    expect(preprocessForTts('')).toBeNull()
    expect(preprocessForTts('   ')).toBeNull()
  })

  test('200文字を超える場合は切り詰めて「以下省略」を付ける', () => {
    const input = 'あ'.repeat(250)
    const result = preprocessForTts(input)
    expect(result).not.toBeNull()
    if (result !== null) {
      expect(result.length).toBeLessThanOrEqual(250)
      expect(result.endsWith('以下省略')).toBe(true)
    }
  })

  test('200文字以下ならそのまま返る', () => {
    const input = 'あ'.repeat(200)
    const result = preprocessForTts(input)
    expect(result).toBe(input)
  })
})

describe('message + line パイプライン', () => {
  test('改行分割前にコードブロック除去すればフェンス行が漏れない', () => {
    const content = ['挨拶', '```python', 'print("hi")', '```', 'おわり'].join('\n')
    const lines = preprocessMessageForTts(content)
      .split('\n')
      .map((line) => preprocessForTts(line))
      .filter((line): line is string => line !== null)
    expect(lines).toEqual(['挨拶', 'おわり'])
  })
})
