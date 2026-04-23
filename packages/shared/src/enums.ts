import { z } from 'zod'

/**
 * エージェントプロトコルで使う全 enum 定義。
 *
 * 各 enum の意味・運用規約は `docs/agent-protocol/enums.md` を参照。
 * `z.toJSONSchema()` で JSON Schema に変換して Gemini の Structured Output
 * に渡すことを想定している。
 */

// ── DramaBrief / DramaBible 向け ────────────────────────────────

/** ジャンル。`DramaBrief.genre.categories` で 1〜3 個組み合わせる。 */
export const GenreSchema = z.enum([
  'school_life',
  'slice_of_life',
  'romance',
  'sci_fi',
  'fantasy',
  'mystery',
  'horror',
  'suspense',
  'comedy',
  'historical',
  'workplace',
  'heartwarming'
])

/** 情緒・雰囲気。`DramaBrief.genre.tone`。 */
export const ToneSchema = z.enum([
  'lighthearted',
  'humorous',
  'uplifting',
  'dreamy',
  'bittersweet',
  'melancholic',
  'serious',
  'intense',
  'dark'
])

/** エンディング種別。 */
export const EndingSchema = z.enum(['loop', 'closed'])

// ── CharacterSpec 向け ─────────────────────────────────────────

/** 物語上の役割。 */
export const RoleSchema = z.enum([
  'protagonist',
  'deuteragonist',
  'companion',
  'supporting',
  'antagonist',
  'rival',
  'mentor',
  'authority',
  'love_interest',
  'comic_relief',
  'narrator',
  'minor'
])

/** 年齢層。 */
export const AgeGroupSchema = z.enum([
  'infant',
  'child',
  'preteen',
  'teen',
  'young_adult',
  'adult',
  'middle_aged',
  'elderly',
  'ageless'
])

/** 性別。 */
export const GenderSchema = z.enum(['male', 'female', 'nonbinary', 'unknown', 'other'])

/**
 * 種族。
 *
 * **v1 では未使用**（`CharacterSpec.race` フィールドを持たない、全員 human 固定）。
 * v2 でファンタジー/SF 対応時に復活する想定でリファレンスとして残す。
 */
export const RaceSchema = z.enum([
  'human',
  'elf',
  'dwarf',
  'halfling',
  'orc',
  'beastfolk',
  'dragonkin',
  'angel',
  'demon',
  'undead',
  'spirit',
  'fairy',
  'android',
  'alien',
  'ai',
  'other'
])

/** 口調。 */
export const SpeechStyleSchema = z.enum([
  'polite_formal',
  'polite_casual',
  'neutral',
  'casual_youthful',
  'rough_masculine',
  'refined_feminine',
  'archaic_samurai',
  'archaic_court',
  'dialect_regional',
  'childlike',
  'eccentric'
])

/**
 * 一人称。`CharacterSpec.firstPerson`。
 *
 * `'name'` は「自分の名前を一人称として使う」指定（例: エマ→「エマはね…」）。
 * `'other'` は enum に無い一人称で、詳細は `personaNote` に書く。
 */
export const FirstPersonSchema = z.enum([
  'watashi', // 私
  'watakushi', // わたくし
  'atashi', // あたし
  'boku', // 僕
  'boku_katakana', // ボク
  'ore', // 俺
  'uchi', // うち
  'washi', // ワシ
  'wagahai', // わがはい
  'ware', // 我
  'yo', // 余
  'soregashi', // それがし
  'name', // 自分の名前
  'other'
])

/**
 * 二人称代名詞。`CharacterSpec.secondPerson`。
 *
 * 指定するとこのキャラは相手の名前を呼ばず、この代名詞で相手を指すようになる。
 * 未指定なら「相手の name + 敬称」で呼ぶ（通常動作）。
 */
export const SecondPersonSchema = z.enum([
  'kimi', // 君
  'omae', // お前
  'anata', // あなた
  'kisama', // 貴様
  'temae', // てめえ
  'onushi', // お主
  'sonata', // そなた
  'nanji', // 汝
  'other'
])

/**
 * 他キャラを呼ぶときのデフォルト敬称パターン。`CharacterSpec.defaultHonorific`。
 *
 * `addressOf[<alias>]` の個別指定が優先され、無ければこの敬称が相手の `name` に付く。
 * `secondPerson` が指定されていれば、そちら（代名詞呼称）が `defaultHonorific` より優先される。
 */
export const HonorificSchema = z.enum([
  'none', // 呼び捨て
  'family_name', // 苗字
  'given_name', // 名前
  'full_name', // フルネーム
  'san', // 〜さん
  'chan', // 〜ちゃん
  'kun', // 〜君
  'sama', // 〜様
  'senpai', // 〜先輩
  'sensei', // 〜先生
  'tan', // 〜たん
  'dono' // 〜殿
])

/** 性格タグ。`CharacterSpec.personality` で 1〜4 個必須。 */
export const PersonalitySchema = z.enum([
  'cheerful',
  'shy',
  'stoic',
  'hot_blooded',
  'gentle',
  'kind',
  'serious',
  'lazy',
  'cunning',
  'naive',
  'arrogant',
  'humble',
  'brave',
  'cowardly',
  'confident',
  'insecure',
  'optimistic',
  'pessimistic',
  'logical',
  'emotional',
  'stubborn',
  'flexible',
  'curious',
  'indifferent',
  'loyal',
  'cynical',
  'perfectionist',
  'hedonistic',
  'righteous',
  'vengeful'
])

/** 職業。 */
export const OccupationSchema = z.enum([
  // 学生系
  'student_elementary',
  'student_middle',
  'student_high',
  'student_college',
  // 教育・研究
  'teacher',
  'professor',
  'researcher',
  // 医療・介護
  'doctor',
  'nurse',
  'caregiver',
  // 技術・ビジネス
  'engineer',
  'programmer',
  'scientist',
  'office_worker',
  'manager',
  'entrepreneur',
  'freelancer',
  'unemployed',
  'housewife',
  // クリエイティブ
  'artist',
  'musician',
  'writer',
  'journalist',
  'chef',
  // 公権力
  'detective',
  'police',
  'lawyer',
  'military',
  // 接客
  'clerk',
  'server',
  // ファンタジー
  'royalty',
  'knight',
  'mage',
  'warrior',
  'priest',
  'merchant',
  'adventurer',
  // 歴史
  'samurai',
  'ninja',
  // SF
  'pilot',
  'astronaut',
  // その他
  'other'
])

/** キャラ属性タグ（日本のアニメ/ゲーム慣用）。`CharacterSpec.attributes` で 0〜4 個任意。 */
export const AttributeSchema = z.enum([
  'glasses',
  'senior_type',
  'little_sister_type',
  'big_brother_type',
  'tsundere',
  'yandere',
  'kuudere',
  'dandere',
  'genki',
  'airhead',
  'maid',
  'butler',
  'bookworm',
  'sporty',
  'foodie',
  'otaku',
  'gyaru',
  'ojou',
  'hermit',
  'prankster'
])

/** 経歴タグ。`CharacterSpec.background` で 0〜3 個任意。 */
export const BackgroundSchema = z.enum([
  'orphan',
  'noble_birth',
  'poor_background',
  'isekai_transfer',
  'reincarnated',
  'amnesia',
  'time_traveler',
  'outsider',
  'returnee',
  'prodigy',
  'late_bloomer',
  'self_taught',
  'elite_educated',
  'military_background',
  'traumatic_past'
])

/**
 * 主人公との関係。
 *
 * `'self'` は主人公本人のエントリ専用（1 ドラマに 1 つだけ）。
 * それ以外のキャラは `'self'` 以外から 1 つ選ぶ。
 */
export const RelationshipSchema = z.enum([
  'self',
  'parent',
  'child',
  'sibling_older',
  'sibling_younger',
  'spouse',
  'relative',
  'best_friend',
  'close_friend',
  'childhood_friend',
  'acquaintance',
  'lover',
  'crush',
  'ex_lover',
  'classmate',
  'senior',
  'junior',
  'teacher',
  'student',
  'boss',
  'subordinate',
  'colleague',
  'mentor',
  'disciple',
  'rival',
  'enemy',
  'party_member',
  'servant',
  'master',
  'stranger',
  'other'
])

// ── DramaState 向け ────────────────────────────────────────────

/** キャラの状態。`'dead'` は不可逆（他 status への遷移を Editor の吸収で拒否）。 */
export const CharacterStatusSchema = z.enum(['awake', 'asleep', 'unconscious', 'dead', 'absent'])

/**
 * 季節。`DramaState.season` はリアルタイムでは後戻り禁止。
 * flashback の `Beat.sceneContext.season` はこの制約に従わない。
 */
export const SeasonSchema = z.enum([
  'early_spring',
  'late_spring',
  'rainy_season',
  'midsummer',
  'early_autumn',
  'late_autumn',
  'early_winter',
  'midwinter'
])

/** 天気。Beat 間で変化可（`blizzard` → 次で `sunny` のような急変は時間経過を挟む）。 */
export const WeatherSchema = z.enum([
  'clear',
  'sunny',
  'partly_cloudy',
  'cloudy',
  'drizzle',
  'rainy',
  'stormy',
  'thundery',
  'snowy',
  'blizzard',
  'foggy'
])

/** 知識の確信度。 */
export const BeliefStrengthSchema = z.enum(['certain', 'suspecting', 'rumor'])

/** 知識の取得経路。判別可能 union。 */
export const FactSourceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('witnessed') }),
  z.object({ kind: z.literal('told'), by: z.string().nonempty() }),
  z.object({ kind: z.literal('inferred') }),
  z.object({ kind: z.literal('document'), docName: z.string().nonempty() })
])

// ── Beat 向け ──────────────────────────────────────────────────

/** シーン種別（リアルタイム or 回想）。 */
export const SceneKindSchema = z.enum(['realtime', 'flashback'])

/** Beat の緊張度。 */
export const TensionSchema = z.enum(['low', 'medium', 'high'])

// ── SceneReport 向け ───────────────────────────────────────────

/** 再生中に cue がスキップされた理由。 */
export const SkipReasonSchema = z.enum(['synth_404', 'synth_error', 'schema_violation', 'caption_unsupported'])

// ── 型エクスポート ─────────────────────────────────────────────

export type Genre = z.infer<typeof GenreSchema>
export type Tone = z.infer<typeof ToneSchema>
export type Ending = z.infer<typeof EndingSchema>
export type Role = z.infer<typeof RoleSchema>
export type AgeGroup = z.infer<typeof AgeGroupSchema>
export type Gender = z.infer<typeof GenderSchema>
export type Race = z.infer<typeof RaceSchema>
export type SpeechStyle = z.infer<typeof SpeechStyleSchema>
export type FirstPerson = z.infer<typeof FirstPersonSchema>
export type SecondPerson = z.infer<typeof SecondPersonSchema>
export type Honorific = z.infer<typeof HonorificSchema>
export type Personality = z.infer<typeof PersonalitySchema>
export type Occupation = z.infer<typeof OccupationSchema>
export type Attribute = z.infer<typeof AttributeSchema>
export type Background = z.infer<typeof BackgroundSchema>
export type Relationship = z.infer<typeof RelationshipSchema>
export type CharacterStatus = z.infer<typeof CharacterStatusSchema>
export type Season = z.infer<typeof SeasonSchema>
export type Weather = z.infer<typeof WeatherSchema>
export type BeliefStrength = z.infer<typeof BeliefStrengthSchema>
export type FactSource = z.infer<typeof FactSourceSchema>
export type SceneKind = z.infer<typeof SceneKindSchema>
export type Tension = z.infer<typeof TensionSchema>
export type SkipReason = z.infer<typeof SkipReasonSchema>
