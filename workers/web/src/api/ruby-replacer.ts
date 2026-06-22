export interface RubyEntry {
  readonly word: string
  readonly reading: string
}

const escapeRegex = (str: string): string => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const applyRubyAnnotations = (text: string, entries: readonly RubyEntry[]): string => {
  if (entries.length === 0) return text

  const sorted = [...entries].sort((a, b) => b.word.length - a.word.length)
  const readingMap = new Map(sorted.map((e) => [e.word, e.reading]))

  const existingPattern = /\|[^[]+\[[^\]]+\]/g
  const protectedRanges: Array<readonly [number, number]> = []
  for (const match of text.matchAll(existingPattern)) {
    protectedRanges.push([match.index, match.index + match[0].length] as const)
  }

  const isProtected = (start: number, end: number): boolean => protectedRanges.some(([s, e]) => start < e && end > s)

  const pattern = new RegExp(sorted.map((e) => escapeRegex(e.word)).join('|'), 'g')

  return text.replace(pattern, (match, offset) => {
    if (isProtected(offset, offset + match.length)) return match
    const reading = readingMap.get(match)
    return reading !== undefined ? `|${match}[${reading}]` : match
  })
}
