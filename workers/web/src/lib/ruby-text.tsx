import type { ReactNode } from 'react'
import { applyRubyAnnotations, type RubyEntry } from '@/api/ruby-replacer'

const RUBY_PATTERN = /\|([^[]+)\[([^\]]+)\]/g

export const parseRubyText = (text: string): ReactNode[] => {
  const parts: ReactNode[] = []
  const matchArray = Array.from(text.matchAll(RUBY_PATTERN))

  if (matchArray.length === 0) return [text]

  const lastIndex = matchArray.reduce((prev, match) => {
    const before = text.slice(prev, match.index)
    if (before) parts.push(before)

    parts.push(
      <ruby key={match.index}>
        {match[1]}
        <rp>(</rp>
        <rt>{match[2]}</rt>
        <rp>)</rp>
      </ruby>
    )

    return match.index + match[0].length
  }, 0)

  const trailing = text.slice(lastIndex)
  if (trailing) parts.push(trailing)

  return parts
}

export const RubyText = ({ text, entries }: { text: string; entries?: readonly RubyEntry[] }) => {
  const annotated = entries && entries.length > 0 ? applyRubyAnnotations(text, entries) : text
  return <>{parseRubyText(annotated)}</>
}

export type { RubyEntry }
