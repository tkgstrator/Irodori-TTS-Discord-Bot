# enum リファレンス

> 本書は [`messages.md`](./messages.md) の各メッセージ型から参照される全 enum を 1 箇所に集約したリファレンス。

| enum | 単一/複数 | 必須/任意 | 用途 |
|---|---|---|---|
| [`Genre`](#genre) | 複数（1〜3） | 必須 | ドラマのジャンル |
| [`Role`](#role) | 単一 | 必須 | 物語上の役割 |
| [`AgeGroup`](#agegroup) | 単一 | 必須 | 年齢層 |
| [`Gender`](#gender) | 単一 | 必須 | 性別 |
| [`Race`](#race) | 単一 | 必須 | 種族（現代モノは `human` 固定） |
| [`SpeechStyle`](#speechstyle) | 単一 | 必須 | 口調 |
| [`Trait`](#trait) | 複数（1〜4） | 必須 | 性格タグ |
| [`Occupation`](#occupation) | 単一 | 任意 | 職業 |
| [`Attribute`](#attribute) | 複数（0〜4） | 任意 | キャラ属性タグ |
| [`Background`](#background) | 複数（0〜3） | 任意 | 経歴タグ |
| [`Relationship`](#relationship) | 単一 | 必須 | 主人公との関係 |
| [`CharacterStatus`](#characterstatus) | 単一 | 必須 | キャラの状態 |
| [`Season`](#season) | 単一 | 必須 | 季節（後戻り禁止） |
| [`Weather`](#weather) | 単一 | 必須 | 天気 |
| [`FactSource`](#factsource) | 判別可能 union | 必須 | 知識の取得経路 |
| [`SceneKind`](#scenekind) | 単一 | 必須 | シーン種別（リアルタイム/回想） |

---

## Genre

ドラマのジャンル。`DramaBrief.genre.categories` で 1〜3 個まで組み合わせる。

```ts
type Genre =
  | 'school_life'      // 学園モノ
  | 'slice_of_life'    // 日常系
  | 'romance'          // 恋愛・ラブコメ
  | 'sci_fi'           // SF
  | 'fantasy'          // ファンタジー
  | 'mystery'          // ミステリ・推理
  | 'horror'           // ホラー
  | 'suspense'         // サスペンス・スリラー
  | 'comedy'           // コメディ
  | 'historical'       // 時代劇・歴史
  | 'workplace'        // 職業モノ・社会派
  | 'heartwarming'     // ヒューマンドラマ・ハートフル
```

enum でカバーしきれないニッチ要素（「スチームパンク」「異世界転生」等）は `DramaBrief.genre.subgenre` の自由文で補う。

---

## Role

**物語上の機能的役割**。「物語の中でこのキャラが何を担うか」を表す。`CharacterSpec.role`。

`Role` は **物語の機能** を、[`Relationship`](#relationship) は **主人公との続柄** を表す直交した概念。「主人公の妹」「両親」のような続柄は `Relationship` 側で表現し、`Role` ではそのキャラが物語上どう機能するか（脇役か、敵対者か、笑い担当か等）を選ぶ。

```ts
type Role =
  // ── 物語の主軸 ──────────────────────────────────────
  | 'protagonist'      // 主人公。1 ドラマにちょうど 1 人。relationship は必ず 'self'
  | 'deuteragonist'    // 準主役。2 番手の視点人物。バディ物の片割れなど
  | 'companion'        // 相棒・仲間。常時行動を共にするパートナー。
                       //   組み合わせ例: relationship: 'best_friend' / 'close_friend' / 'party_member'

  // ── 対立軸・競争軸 ─────────────────────────────────
  | 'antagonist'       // 敵役。主人公と正面から対立する主要な敵。
                       //   組み合わせ例: relationship: 'enemy' / 'rival' / 'ex_lover'
  | 'rival'            // ライバル。敵ほど対立せず、競い合う関係。
                       //   組み合わせ例: relationship: 'rival' / 'classmate' / 'colleague'

  // ── 主人公を導く立場 ───────────────────────────────
  | 'mentor'           // 師匠・助言者。主人公を導く役割。
                       //   組み合わせ例: relationship: 'mentor' / 'teacher' / 'sibling_older'
  | 'authority'        // 権威。立場が上の人物（王、上司、親、教師等）。
                       //   組み合わせ例: relationship: 'parent' / 'boss' / 'teacher' / 'master'

  // ── 関係性で物語を彩る ─────────────────────────────
  | 'love_interest'    // 恋愛対象。
                       //   組み合わせ例: relationship: 'lover' / 'crush' / 'spouse' / 'ex_lover'
  | 'comic_relief'     // ムードメーカー。笑いや息抜きを担当。relationship は何でも可
                       //   （妹キャラ・親友・後輩など、主人公の周辺にいる賑やか担当）

  // ── 脇・背景 ──────────────────────────────────────
  | 'supporting'       // 脇役。明確な物語軸ではないが繰り返し登場するキャラ。
                       //   家族の母親、職場の同僚、街の常連など。relationship は何でも可
  | 'narrator'         // 語り手。三人称の地の文を担当。relationship は必ず 'other'
                       //   （主人公との個人的関係を持たない）
  | 'minor'            // 端役。1〜2 回だけ登場する通行人・店員等
```

**「主人公の妹」「家族の両親」を表現する例：**

| キャラ | role | relationship |
|---|---|---|
| 主人公の恋人（女性ヒロイン） | `love_interest` | `lover` |
| 主人公の母親（家庭内の権威） | `authority` | `parent` |
| 主人公の妹（コメディ担当） | `comic_relief` | `sibling_younger` |
| 主人公の兄（メンター的存在） | `mentor` | `sibling_older` |
| 親友 | `companion` | `best_friend` |
| 元恋人で今は敵対 | `antagonist` | `ex_lover` |

---

## AgeGroup

年齢層。`CharacterSpec.ageGroup`。

```ts
type AgeGroup =
  | 'infant'           // 乳幼児 (0-2)
  | 'child'            // 子供 (3-9)
  | 'preteen'          // 小学生 (10-12)
  | 'teen'             // ティーン (13-17)
  | 'young_adult'      // 青年 (18-25)
  | 'adult'            // 大人 (26-40)
  | 'middle_aged'      // 中年 (41-60)
  | 'elderly'          // 高齢 (61+)
  | 'ageless'          // 不老・不詳（AI、神霊等）
```

長寿種・人間換算など特殊な場合は `CharacterSpec.ageNote` で補足。

---

## Gender

性別。`CharacterSpec.gender`。

```ts
type Gender =
  | 'male'
  | 'female'
  | 'nonbinary'
  | 'unknown'
  | 'other'
```

---

## Race

種族。`CharacterSpec.race`。

```ts
type Race =
  | 'human'
  | 'elf'
  | 'dwarf'
  | 'halfling'
  | 'orc'
  | 'beastfolk'        // 獣人
  | 'dragonkin'        // 竜人
  | 'angel'
  | 'demon'
  | 'undead'           // アンデッド（吸血鬼、幽霊等）
  | 'spirit'           // 精霊
  | 'fairy'            // 妖精
  | 'android'          // 人造人間・ロボット
  | 'alien'            // 異星人
  | 'ai'               // AI・デジタル存在
  | 'other'
```

現代モノでは `'human'` 固定。enum に無い種族は `'other'` + `raceNote` で表現。

---

## SpeechStyle

口調。`CharacterSpec.speechStyle`。

```ts
type SpeechStyle =
  | 'polite_formal'    // 敬語・丁寧語
  | 'polite_casual'    // ですます調、やや砕けた
  | 'neutral'          // 標準的な中立口調
  | 'casual_youthful'  // くだけた若者口調
  | 'rough_masculine'  // 粗野・男勝り
  | 'refined_feminine' // 上品・お嬢様風
  | 'archaic_samurai'  // 古風・武士口調
  | 'archaic_court'    // 古語・宮廷語
  | 'dialect_regional' // 方言（詳細は speechStyleNote）
  | 'childlike'        // 舌足らず・幼児語
  | 'eccentric'        // 奇妙（"〜のじゃ", "であります" 等、詳細は speechStyleNote）
```

`'dialect_regional'` / `'eccentric'` を選んだ場合、`CharacterSpec.speechStyleNote` で詳細を必ず指定する。

---

## Trait

性格タグ。`CharacterSpec.traits` で 1〜4 個必須。

```ts
type Trait =
  | 'cheerful' | 'shy' | 'stoic' | 'hot_blooded'
  | 'gentle' | 'kind' | 'serious' | 'lazy'
  | 'cunning' | 'naive' | 'arrogant' | 'humble'
  | 'brave' | 'cowardly' | 'confident' | 'insecure'
  | 'optimistic' | 'pessimistic' | 'logical' | 'emotional'
  | 'stubborn' | 'flexible' | 'curious' | 'indifferent'
  | 'loyal' | 'cynical' | 'perfectionist' | 'hedonistic'
  | 'righteous' | 'vengeful'
```

2 個以上で個性の層を作る。例: `['cheerful', 'naive']` で「明るいが世間知らず」。

---

## Occupation

職業。`CharacterSpec.occupation` で任意。WebUI ではカテゴリ分けで表示する想定。

```ts
type Occupation =
  // 学生系
  | 'student_elementary' | 'student_middle' | 'student_high' | 'student_college'
  // 教育・研究
  | 'teacher' | 'professor' | 'researcher'
  // 医療・介護
  | 'doctor' | 'nurse' | 'caregiver'
  // 技術・ビジネス
  | 'engineer' | 'programmer' | 'scientist'
  | 'office_worker' | 'manager' | 'entrepreneur' | 'freelancer' | 'unemployed' | 'housewife'
  // クリエイティブ
  | 'artist' | 'musician' | 'writer' | 'journalist' | 'chef'
  // 公権力
  | 'detective' | 'police' | 'lawyer' | 'military'
  // 接客
  | 'clerk' | 'server'
  // ファンタジー
  | 'royalty' | 'knight' | 'mage' | 'warrior' | 'priest' | 'merchant' | 'adventurer'
  // 歴史
  | 'samurai' | 'ninja'
  // SF
  | 'pilot' | 'astronaut'
  // その他
  | 'other'
```

`'other'` 選択時は `CharacterSpec.occupationNote` を必須扱い。

---

## Attribute

キャラ属性タグ（日本のアニメ/ゲーム文化に寄せた慣用カテゴリ）。`CharacterSpec.attributes` で 0〜4 個任意。

```ts
type Attribute =
  | 'glasses' | 'senior_type' | 'little_sister_type' | 'big_brother_type'
  | 'tsundere' | 'yandere' | 'kuudere' | 'dandere'
  | 'genki' | 'airhead' | 'maid' | 'butler'
  | 'bookworm' | 'sporty' | 'foodie'
  | 'otaku' | 'gyaru' | 'ojou' | 'hermit' | 'prankster'
```

---

## Background

経歴タグ。`CharacterSpec.background` で 0〜3 個任意。

```ts
type Background =
  | 'orphan' | 'noble_birth' | 'poor_background'
  | 'isekai_transfer' | 'reincarnated' | 'amnesia' | 'time_traveler'
  | 'outsider' | 'returnee'
  | 'prodigy' | 'late_bloomer'
  | 'self_taught' | 'elite_educated'
  | 'military_background' | 'traumatic_past'
```

---

## Relationship

**主人公とこのキャラの続柄**。「主人公から見たこの人物の立ち位置」を表す。`CharacterSpec.relationship`。

[`Role`](#role) が「物語の機能」を表すのに対し、`Relationship` は「主人公個人との具体的な関係」を表す。両方を組み合わせて使う（例：`role: 'comic_relief'` + `relationship: 'sibling_younger'` で「主人公の妹で、笑い担当」）。

```ts
type Relationship =
  // ── 主人公自身 ────────────────────────────────────
  | 'self'             // 主人公本人のエントリ。1 ドラマに 1 つだけ。role は必ず 'protagonist'

  // ── 家族・親族 ────────────────────────────────────
  | 'parent'           // 親（父母どちらも、義理親も含む）
  | 'child'            // 子（実子・養子・継子）
  | 'sibling_older'    // 兄・姉
  | 'sibling_younger'  // 弟・妹
  | 'spouse'           // 配偶者（夫・妻）
  | 'relative'         // それ以外の親族（叔父叔母・従兄弟・祖父母等）

  // ── 友人・知人 ────────────────────────────────────
  | 'best_friend'      // 親友。互いに最も信頼する友人
  | 'close_friend'     // 友人。親しい関係
  | 'childhood_friend' // 幼馴染。長い時間を共有してきた友人
  | 'acquaintance'     // 知り合い。顔と名前を知っている程度

  // ── 恋愛 ──────────────────────────────────────────
  | 'lover'            // 恋人。現在交際中
  | 'crush'            // 想い人。片思いの対象（両思い未確定）
  | 'ex_lover'         // 元恋人。過去に交際していた

  // ── 学校・職場 ────────────────────────────────────
  | 'classmate'        // 同級生（学校）
  | 'senior'           // 先輩（学校・職場）
  | 'junior'           // 後輩（学校・職場）
  | 'teacher'          // 主人公の教師（主人公が学生の場合）
  | 'student'          // 主人公の生徒（主人公が教師の場合）
  | 'boss'             // 上司
  | 'subordinate'      // 部下
  | 'colleague'        // 同僚（同列の同僚）

  // ── 師弟 ──────────────────────────────────────────
  | 'mentor'           // 師匠・指導者（学校教師ではない、人生・技術の師）
  | 'disciple'         // 弟子・門下生

  // ── 対立 ──────────────────────────────────────────
  | 'rival'            // ライバル。競い合う関係（敵意は薄め）
  | 'enemy'            // 敵。明確な敵対関係

  // ── 階級・主従 ────────────────────────────────────
  | 'party_member'     // パーティーメンバー（冒険・任務での仲間）
  | 'servant'          // 主人公に仕える従者・部下（封建的な主従関係）
  | 'master'           // 主人公が仕える主人（主人公が servant の立場の場合）

  // ── その他 ────────────────────────────────────────
  | 'stranger'         // 他人・初対面
  | 'other'            // 上記に該当しない関係。relationshipNote で詳述
                       //   ナレーターはここに分類する（個人的関係を持たない語り手）
```

**運用ポイント:**
- ナレーターは `'other'`（語り手は主人公との個人的関係を持たない扱い）
- 表記しきれない関係（例：「育ての親（血縁なし）」「5 年前に別れた元恋人」）は `relationshipNote` で補足
- 他キャラ間の関係（A と B は兄弟、B と C は恋人等）は v1 では `DramaBible.relationships` の自由文のみで表現する。N×N の enum マトリクスは [`roadmap.md` §9.8](./roadmap.md#98-キャラ間関係マトリクス) で v2 optional 扱い

---

## CharacterStatus

キャラの状態。`DramaState.characterStates[alias].status`。

```ts
type CharacterStatus =
  | 'awake'         // 通常状態
  | 'asleep'        // 就寝中
  | 'unconscious'   // 気絶
  | 'dead'          // 死亡（不可逆）
  | 'absent'        // 舞台外
```

`'dead'` は終端。遷移図は [`messages.md` §4.3](./messages.md#43-dramastatewriter-が-redis-に保持) 参照。

---

## Season

季節。`DramaState.season` および `DramaBrief.setting.season`、`Beat.sceneContext.season`。

```ts
type Season =
  | 'early_spring'    // 3月         梅・桃
  | 'late_spring'     // 4-5月       桜・新緑
  | 'rainy_season'    // 6月         梅雨
  | 'midsummer'       // 7-8月       盛夏・夏祭り
  | 'early_autumn'    // 9月         残暑・中秋
  | 'late_autumn'     // 10-11月     紅葉・晩秋
  | 'early_winter'    // 12月        初冬・師走
  | 'midwinter'       // 1-2月       厳冬・雪
```

リアルタイム軸では後戻り禁止。flashback ではこの制約に従わない。

---

## Weather

天気。`DramaState.weather` および `DramaBrief.setting.weather`、`Beat.sceneContext.weather`。

```ts
type Weather =
  | 'clear'           // 晴天、雲なし
  | 'sunny'           // 晴れ
  | 'partly_cloudy'   // 薄曇り
  | 'cloudy'          // 曇り
  | 'drizzle'         // 霧雨
  | 'rainy'           // 雨
  | 'stormy'          // 嵐・豪雨
  | 'thundery'        // 雷雨
  | 'snowy'           // 雪
  | 'blizzard'        // 吹雪
  | 'foggy'           // 霧
```

Beat 間で自由に変化可。ただし `'blizzard'` → 次で `'sunny'` のような急変は時間経過（数時間以上）を挟む。

---

## FactSource

知識の取得経路。`FactRef.source`。判別可能 union。

```ts
type FactSource =
  | { kind: 'witnessed' }                    // 直接目撃・体験
  | { kind: 'told'; by: string }             // 別 alias から聞いた（by は伝達元 alias）
  | { kind: 'inferred' }                     // 既知情報からの推論
  | { kind: 'document'; docName: string }    // 書類・記録から（docName は資料名）
```

---

## SceneKind

シーン種別。`Beat.sceneKind`。

```ts
type SceneKind = 'realtime' | 'flashback'
```

`'realtime'` は DramaState を更新する通常シーン、`'flashback'` は DramaState を更新しない回想シーン。詳細は [`messages.md` §4.4](./messages.md#44-beatsheetwriter--novelist) と [`operations.md` §6.1](./operations.md#61-吸収フェーズ前サイクルの-vdsjson-を処理) 参照。
