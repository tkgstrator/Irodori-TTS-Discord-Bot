import { z } from 'zod'

/**
 * VDS-JSON（ボイスドラマ台本の機械可読表現）。
 *
 * 仕様は `docs/voice-drama-format.md` 参照。LLM に Structured Output で
 * 生成させる前提の設計で、`.strict()` により未知フィールドは拒否する。
 *
 * プレーンテキスト形式（VDS, `.vds`）とは意味的に等価で、パース後は同じ
 * 内部表現（Cueリスト）に落ちる（§2-2）。
 */

/**
 * エイリアス（alias）の正規表現（§3.4）。
 *
 * `@speaker` で定義され、cue の `speaker` フィールドから参照される識別子。
 */
const ALIAS_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/

/**
 * `POST /synth` のサンプリングパラメータ（§4.1 `SynthOptions`）。
 *
 * レンジは `src/schemas/user-settings.dto.ts` の `SpeakerConfigSchema` と揃える。
 * 未指定項目はサーバー側の LoRA デフォルト → 組み込みデフォルトにフォールバックする。
 */
export const VdsSynthOptionsSchema = z
  .object({
    /** 再現用乱数シード。未指定でランダム。 */
    seed: z.number().int().optional(),
    /** Rectified-flow のサンプリングステップ数。 */
    num_steps: z.number().int().min(1).max(100).optional(),
    /** テキスト条件付けへのCFGスケール。 */
    cfg_scale_text: z.number().positive().optional(),
    /** 話者条件付けへのCFGスケール。 */
    cfg_scale_speaker: z.number().positive().optional(),
    /** 話者ストリーム向けKVキャッシュスケール。 */
    speaker_kv_scale: z.number().positive().optional(),
    /** ノイズ切り詰め係数（0より大1以下）。 */
    truncation_factor: z.number().positive().max(1).optional()
  })
  .strict()

/**
 * 話者参照（§4.1 `SpeakerRef`）。
 *
 * - `{ uuid }`: LoRA経路。`POST /synth` の `speaker_id` に渡すUUID。
 * - `{ caption }`: VoiceDesign経路（自然文記述）。現行API未対応のため実行時エラーになる（§6.3）。
 *
 * 1エイリアスは UUID か caption のいずれか一方のみ（§3.4 排他制約）。
 */
export const SpeakerRefSchema = z.union([
  z.object({ uuid: z.uuid() }).strict(),
  z.object({ caption: z.string().nonempty() }).strict()
])

/**
 * セリフcue（§4.1 `Cue.speech`）。
 *
 * `text` の上限は §3.3 の「1 cue = 30秒以内」を受けた保険値。仕様書上は
 * 文字数制限を明文化していないが、LLMが長文セリフを書くのを抑えるために
 * クライアント側で弾く（§6.2 警告のヒューリスティックをハード制約に昇格）。
 */
export const SpeechCueSchema = z
  .object({
    kind: z.literal('speech'),
    speaker: z.string().regex(ALIAS_PATTERN),
    text: z.string().nonempty().max(200),
    options: VdsSynthOptionsSchema.optional()
  })
  .strict()

/**
 * 無音cue（§4.1 `Cue.pause`、§3.6）。
 */
export const PauseCueSchema = z
  .object({
    kind: z.literal('pause'),
    duration: z.number().positive()
  })
  .strict()

/**
 * cue（§4.1 `Cue`）。`kind` で判別する discriminated union。
 */
export const CueSchema = z.discriminatedUnion('kind', [SpeechCueSchema, PauseCueSchema])

/**
 * VDS-JSON のルート型（§4.1 `VdsJson`）。
 *
 * `superRefine` で以下の致命的エラー（§6.1）を追加検証する:
 * - cue が参照する speaker エイリアスが `speakers` に未定義
 */
export const VdsJsonSchema = z
  .object({
    version: z.literal(1),
    title: z.string().optional(),
    defaults: VdsSynthOptionsSchema.optional(),
    speakers: z.record(z.string().regex(ALIAS_PATTERN), SpeakerRefSchema),
    cues: z.array(CueSchema).min(1)
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const [index, cue] of data.cues.entries()) {
      if (cue.kind === 'speech' && !(cue.speaker in data.speakers)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cues', index, 'speaker'],
          message: `未定義の speaker エイリアス: ${cue.speaker}`
        })
      }
    }
  })

/**
 * `text` の max 200 字制約を外したゆるい speech cue スキーマ。
 *
 * Writer の cue 自動分割（長い text を複数の cue に切り分ける前処理）で
 * 「分割前」の受け皿として使う。分割後に `VdsJsonSchema` で最終検証される。
 */
export const LooseSpeechCueSchema = z
  .object({
    kind: z.literal('speech'),
    speaker: z.string().regex(ALIAS_PATTERN),
    text: z.string().nonempty(),
    options: VdsSynthOptionsSchema.optional()
  })
  .strict()

export const LooseCueSchema = z.discriminatedUnion('kind', [LooseSpeechCueSchema, PauseCueSchema])

/**
 * `text` の max 200 字制約を外したゆるい VDS-JSON ルートスキーマ。
 *
 * Gemini 等の生成器が 200 字を超える text を返しても、一旦このスキーマで
 * 受けて型を確定させ、`transform` で自然な区切りで分割した後に
 * `VdsJsonSchema` へ pipe することで厳密検証を通す用途。
 */
export const LooseVdsJsonSchema = z
  .object({
    version: z.literal(1),
    title: z.string().optional(),
    defaults: VdsSynthOptionsSchema.optional(),
    speakers: z.record(z.string().regex(ALIAS_PATTERN), SpeakerRefSchema),
    cues: z.array(LooseCueSchema).min(1)
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const [index, cue] of data.cues.entries()) {
      if (cue.kind === 'speech' && !(cue.speaker in data.speakers)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cues', index, 'speaker'],
          message: `未定義の speaker エイリアス: ${cue.speaker}`
        })
      }
    }
  })

// 型エクスポート
export type VdsSynthOptions = z.infer<typeof VdsSynthOptionsSchema>
export type SpeakerRef = z.infer<typeof SpeakerRefSchema>
export type SpeechCue = z.infer<typeof SpeechCueSchema>
export type PauseCue = z.infer<typeof PauseCueSchema>
export type Cue = z.infer<typeof CueSchema>
export type VdsJson = z.infer<typeof VdsJsonSchema>
export type LooseSpeechCue = z.infer<typeof LooseSpeechCueSchema>
export type LooseCue = z.infer<typeof LooseCueSchema>
export type LooseVdsJson = z.infer<typeof LooseVdsJsonSchema>
