import type { LooseCue, LooseVdsJson } from '../schemas/voice-drama.dto'

/**
 * `LooseVdsJson` 内の speech cue のうち、`text` が上限を超えるものを
 * 自然な区切り（句点 → 読点 → 空白 → 強制切り）で分割して返す。
 *
 * 入力を `LooseVdsJson`（`text` の max 制約なし）で受け取り、分割後も
 * `LooseVdsJson` を返す。後段で `VdsJsonSchema.pipe()` により max 200 を含む
 * 厳密検証が走る。
 */
export const splitLongSpeechCues = (vds: LooseVdsJson, maxLength: number): LooseVdsJson => {
  const splitCues: LooseCue[] = vds.cues.flatMap((cue): LooseCue[] => {
    if (cue.kind !== 'speech') return [cue]
    if (cue.text.length <= maxLength) return [cue]
    const parts = splitText(cue.text, maxLength)
    return parts.map((part) => ({
      kind: 'speech' as const,
      speaker: cue.speaker,
      text: part,
      ...(cue.options !== undefined ? { options: cue.options } : {})
    }))
  })
  return { ...vds, cues: splitCues }
}

/** 自然な区切り位置を見つける。`maxLength/2` より手前では切らない。 */
const findCutoff = (text: string, maxLength: number): number => {
  const prefix = text.slice(0, maxLength)
  const minCutoff = Math.floor(maxLength / 2)

  const sentenceEnders = ['。', '！', '？', '!', '?']
  const sentenceIdx = Math.max(...sentenceEnders.map((ch) => prefix.lastIndexOf(ch)))
  if (sentenceIdx >= minCutoff) return sentenceIdx + 1

  const commaEnders = ['、', ',']
  const commaIdx = Math.max(...commaEnders.map((ch) => prefix.lastIndexOf(ch)))
  if (commaIdx >= minCutoff) return commaIdx + 1

  const spaceIdx = prefix.lastIndexOf(' ')
  if (spaceIdx >= minCutoff) return spaceIdx + 1

  return maxLength
}

/** 1 つの長い text を複数の短い text に分割する。 */
const splitText = (text: string, maxLength: number): string[] => {
  if (text.length <= maxLength) return [text]
  const cutoff = findCutoff(text, maxLength)
  const head = text.slice(0, cutoff).trim()
  const tail = text.slice(cutoff).trim()
  if (tail.length === 0) return [head]
  return [head, ...splitText(tail, maxLength)]
}
