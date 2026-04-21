import { z } from 'zod'
import { CharacterSpecSchema } from './character.dto'
import { EndingSchema, GenreSchema, ToneSchema } from './enums.dto'

/**
 * User → Editor への初期要求。1 ドラマにつき 1 回送られる。
 *
 * 構造の詳細は `docs/agent-protocol/messages.md §4.1 DramaBrief` を参照。
 * v1 では `setting`（worldTime / season / weather / location）は含まれない
 * （Editor が §6.0 初期化フェーズで自動生成する）。
 */
export const DramaBriefSchema = z
  .object({
    schemaVersion: z.literal(1),
    title: z.string().optional(),

    genre: z
      .object({
        categories: GenreSchema.array().min(1).max(3),
        tone: ToneSchema
      })
      .strict(),

    cast: z
      .object({
        characters: CharacterSpecSchema.array().min(1),
        narrator: z.object({ uuid: z.uuid() }).strict().optional()
      })
      .strict(),

    ending: EndingSchema
  })
  .strict()
  .superRefine((brief, ctx) => {
    const { characters } = brief.cast

    // 1. alias の一意性
    const seen = new Set<string>()
    for (const [i, c] of characters.entries()) {
      if (seen.has(c.alias)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cast', 'characters', i, 'alias'],
          message: `alias '${c.alias}' が重複している`
        })
      }
      seen.add(c.alias)
    }

    // 2. 主人公（role: 'protagonist' かつ relationship: 'self'）がちょうど 1 人
    const protagonists = characters.filter((c) => c.role === 'protagonist')
    const selves = characters.filter((c) => c.relationship === 'self')

    if (protagonists.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast', 'characters'],
        message: `role: 'protagonist' を持つキャラはちょうど 1 人必要（現在 ${protagonists.length} 人）`
      })
    }
    if (selves.length !== 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast', 'characters'],
        message: `relationship: 'self' を持つキャラはちょうど 1 人必要（現在 ${selves.length} 人）`
      })
    }

    // 3. role: 'protagonist' と relationship: 'self' は同一キャラ
    for (const [i, c] of characters.entries()) {
      if (c.role === 'protagonist' && c.relationship !== 'self') {
        ctx.addIssue({
          code: 'custom',
          path: ['cast', 'characters', i, 'relationship'],
          message: `role: 'protagonist' のキャラは relationship: 'self' を持つ必要がある`
        })
      }
      if (c.relationship === 'self' && c.role !== 'protagonist') {
        ctx.addIssue({
          code: 'custom',
          path: ['cast', 'characters', i, 'role'],
          message: `relationship: 'self' のキャラは role: 'protagonist' を持つ必要がある`
        })
      }
    }

    // 4. `narrator` という alias を characters に使うのは禁止（予約語扱い）。
    //    ナレーターは cast.narrator に UUID を置く経路に統一する。
    if (characters.some((c) => c.alias === 'narrator')) {
      ctx.addIssue({
        code: 'custom',
        path: ['cast', 'characters'],
        message: `alias 'narrator' は予約語。ナレーターは cast.narrator.uuid を使う`
      })
    }
  })

export type DramaBrief = z.infer<typeof DramaBriefSchema>
