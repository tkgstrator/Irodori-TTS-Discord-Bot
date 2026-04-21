import { z } from 'zod'

/**
 * ヘルスチェックレスポンス（`GET /health`）
 */
export const HealthResponseSchema = z.object({
  status: z.string(),
  speakers: z.number().int().nonnegative()
})

/**
 * 話者情報（`GET /speakers` の要素）
 *
 * - `uuid`: LoRAに埋め込まれた安定UUID。`POST /synth` の `speaker_id` に渡す値。
 * - `name`: LoRAメタデータ由来の表示名。
 * - `defaults`: LoRAごとのデフォルトサンプリングパラメータ。未指定項目はここにフォールバックする。
 */
export const SpeakerInfoSchema = z.object({
  uuid: z.string(),
  name: z.string(),
  defaults: z.record(z.string(), z.unknown()).optional()
})

/**
 * 話者一覧レスポンス（`GET /speakers`）
 */
export const SpeakersResponseSchema = z.object({
  speakers: z.array(SpeakerInfoSchema)
})

/**
 * 音声合成リクエスト（`POST /synth`）
 *
 * `speaker_id` と `text` 以外は任意。省略した場合はLoRAメタデータのデフォルト、
 * さらにサーバー組み込みデフォルトにフォールバックする。
 */
export const SynthRequestSchema = z.object({
  speaker_id: z.string(),
  text: z.string().nonempty(),
  /** 再現用乱数シード。負値で自動。 */
  seed: z.number().int().nullable().optional(),
  /** Rectified-flow のサンプリングステップ数（既定 40）。 */
  num_steps: z.number().int().nullable().optional(),
  /** テキスト条件付けへのCFGスケール（既定 3.0）。 */
  cfg_scale_text: z.number().nullable().optional(),
  /** 話者条件付けへのCFGスケール（既定 5.0）。 */
  cfg_scale_speaker: z.number().nullable().optional(),
  /** 話者ストリーム向けの追加KVキャッシュスケール。 */
  speaker_kv_scale: z.number().nullable().optional(),
  /** ノイズ切り詰め係数（例: 0.8）。 */
  truncation_factor: z.number().nullable().optional()
})

// 型エクスポート
export type HealthResponse = z.infer<typeof HealthResponseSchema>
export type SpeakerInfo = z.infer<typeof SpeakerInfoSchema>
export type SpeakersResponse = z.infer<typeof SpeakersResponseSchema>
export type SynthRequest = z.infer<typeof SynthRequestSchema>
