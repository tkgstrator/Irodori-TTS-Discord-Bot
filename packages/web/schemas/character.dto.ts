import { z } from 'zod'

// 連携済み話者の参照情報を定義する
export const SpeakerLinkSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1)
})

// キャラクター入力の共通項目を定義する
const CharacterBaseSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  imageUrl: z.string().nullable(),
  ageGroup: z.string(),
  gender: z.string(),
  occupation: z.string(),
  personalityTags: z.array(z.string()),
  speechStyle: z.string(),
  firstPerson: z.string(),
  secondPerson: z.string(),
  honorific: z.string(),
  attributeTags: z.array(z.string()),
  backgroundTags: z.array(z.string()),
  memo: z.string(),
  speakerId: z.string().uuid().nullable()
})

// フォーム入力用スキーマを定義する
export const CharacterFormSchema = CharacterBaseSchema.omit({
  imageUrl: true
})

// API リクエスト用スキーマを定義する
export const CharacterInputSchema = CharacterBaseSchema

// 永続化済みキャラクターのレスポンス形式を定義する
export const CharacterSchema = CharacterBaseSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  speaker: SpeakerLinkSchema.nullable()
})

// 一覧レスポンスの形式を定義する
export const CharacterListSchema = z.array(CharacterSchema)

// ルートパラメータ用の ID 形式を定義する
export const CharacterIdSchema = z.string().uuid()

export type CharacterFormValues = z.infer<typeof CharacterFormSchema>
export type CharacterInput = z.infer<typeof CharacterInputSchema>
export type Character = z.infer<typeof CharacterSchema>
export type SpeakerLink = z.infer<typeof SpeakerLinkSchema>
