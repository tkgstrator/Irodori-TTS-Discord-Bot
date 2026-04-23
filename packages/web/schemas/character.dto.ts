import {
  AgeGroupSchema,
  FirstPersonSchema,
  GenderSchema,
  HonorificSchema,
  OccupationSchema,
  SecondPersonSchema,
  SpeechStyleSchema
} from '@irodori-tts/shared/enums'
import { z } from 'zod'

// 連携済み話者の参照情報を定義する
export const SpeakerLinkSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nonempty()
})

// キャラクター入力の共通項目を定義する
const CharacterBaseSchema = z.object({
  name: z.string().min(1, '名前は必須です'),
  imageUrl: z.string().nullable(),
  ageGroup: AgeGroupSchema,
  gender: GenderSchema,
  occupation: OccupationSchema,
  personalityTags: z.array(z.string()),
  speechStyle: SpeechStyleSchema,
  firstPerson: FirstPersonSchema,
  secondPerson: z.union([SecondPersonSchema, z.literal('')]),
  honorific: HonorificSchema,
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
  createdAt: z.string().nonempty(),
  updatedAt: z.string().nonempty(),
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
