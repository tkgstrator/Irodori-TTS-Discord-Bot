# メッセージ型

> 本書は [`README.md`](./README.md) の §4 に相当する。enum の値定義は [`enums.md`](./enums.md) 参照。

6 種類のメッセージで全ての受け渡しが完結する。全メッセージは `schemaVersion: 1` を持ち、破壊的変更時に版を上げる。

| # | 型 | 送信元 → 送信先 |
|---|---|---|
| 4.1 | [`DramaBrief`](#41-dramabriefuser--editor) | User → Editor |
| 4.2 | [`DramaBible`](#42-dramabibleeditor-が-redis-に保持) | Editor ↔ Redis |
| 4.3 | [`DramaState`](#43-dramastateeditor-が-redis-に保持) | Editor ↔ Redis |
| 4.4 | [`BeatSheet`](#44-beatsheeteditor--writer) | Editor → Writer |
| 4.5 | [`VdsJson`](#45-vdsjsonwriter--runner) | Writer → Runner |
| 4.6 | [`SceneReport`](#46-scenereportrunner--editor) | Runner → Editor |

---

## 4.1 `DramaBrief`（User → Editor）

ユーザーから Editor への最初の要求。1 ドラマにつき 1 回送られる。

```ts
type DramaBrief = {
  schemaVersion: 1
  title?: string                       // 任意のタイトル（WebUI からの識別用）

  genre: {
    categories: Genre[]               // 主ジャンル（1〜3 個推奨、最低 1 個必須）
    tone: Tone                        // 情緒・雰囲気（enum 単一）
  }

  cast: {
    // 主人公は characters の中で relationship: 'self' を持つキャラ（ちょうど 1 人）。
    // 別途 protagonist alias を指定するフィールドは持たない（二重管理を避ける）。
    characters: CharacterSpec[]       // 型は下の CharacterSpec を参照
    narrator?: { uuid: string }       // 存在すればナレーター alias を Bible に含める
  }

  // 物語開始時点の worldTime / season / weather / location は Editor が
  // genre と tone から自動生成して Bible / DramaState に初期値として書き込む。
  // プロット段階では具体的な教室名や時刻は決めず、Editor の初期化と Writer
  // とのやり取りを通じて具体化していく。

  ending: 'loop' | 'closed'            // v1 は 'loop' の挙動に最適化。'closed' は v2 の plotted モードで真価を発揮
}

type CharacterSpec = {
  name: string                        // 表示名（自由文）
  alias: string                       // VDS の alias（§3.4 規則に従う）
  uuid: string                        // Irodori-TTS の話者 UUID

  // ── 必須 enum（WebUI のドロップダウン想定） ───────────────
  // v1 では race は human 固定として省略（フィールドなし）。v2 で復活予定。
  role: Role
  ageGroup: AgeGroup
  gender: Gender
  speechStyle: SpeechStyle
  firstPerson: FirstPerson            // 一人称（enum で指定）

  // ── 必須 enum 配列（WebUI のマルチセレクト） ──────────────
  personality: Personality[]          // 性格タグ 1〜4 個

  // ── 主人公との関係性（必須） ─────────────────────────
  // 主人公自身のエントリは 'self' 固定。1 ドラマにちょうど 1 人。
  // 他のキャラは 'self' 以外を必ず 1 つ選ぶ。
  relationship: Relationship

  // ── 任意 enum ───────────────────────────────────────
  occupation?: Occupation
  attributes?: Attribute[]            // 属性タグ 0〜4 個
  background?: Background[]           // 経歴タグ 0〜3 個

  // ── 他キャラの呼び方 ──────────────────────────────
  // 二人称代名詞（指定すると相手の名前を呼ばず代名詞で固定。例: 'kimi' で「君」のみ）
  secondPerson?: SecondPerson
  // デフォルトの敬称パターン（全キャラに一律適用、例: 'chan' で "エマちゃん"）
  // secondPerson が指定されていればそちらが優先される。
  defaultHonorific?: Honorific
  // 個別の上書き（alias → 呼称の自由文マップ）。
  // 解決順: addressOf[<alias>] があれば最優先 → secondPerson（代名詞）
  //        → defaultHonorific + name → 文脈推測。
  // 例: { hiro: '兄さん' }（固有名詞や特殊呼称のため自由文を許容）
  addressOf?: Record<string, string>

  // ── 自由文補足（v1 で唯一許される自由入力） ─────────────
  personaNote?: string                // 目標・価値観・トラウマ等の総合補足
                                      // キャラの「深み」は全て enum で割り切れないのでこれだけ残す
}
```

各 enum（`Genre` / `Role` / `AgeGroup` / `Gender` / `Race` / `SpeechStyle` / `Occupation` / `Personality` / `Attribute` / `Background` / `Relationship` / `Season` / `Weather`）の値定義は [`enums.md`](./enums.md) を参照。

**`genre` 運用規約:**
複数組み合わせ（「学園×ミステリ」「SF×サスペンス」「ファンタジー×ロマンス」等）を 1〜3 個まで許容する。v1 では enum に無いニッチジャンル（「スチームパンク」「異世界転生」等）は扱わない方針（必要になったら [`roadmap.md`](./roadmap.md) の v2 optional として `Genre` enum を拡張する）。

**`CharacterSpec` 運用規約:**

- `personality` は必須（1〜4 個）。2 個以上で個性の層を作る（例: `['cheerful', 'naive']` で明るいが世間知らず）。
- `attributes` は「キャラ属性タグ」で、日本のアニメ/ゲーム文化に寄せた慣用カテゴリ。不要なら省略。
- **v1 では全キャラ human 固定**。`race` フィールドは存在しない（Race enum は v2 で復活予定、[`enums.md` Race](./enums.md#race) 参照）。
- `firstPerson` は一人称（enum）。`'name'` を選ぶと自分の名前を一人称として使う。`'other'` を選んだ場合は `personaNote` で具体的な一人称を説明する。
- `secondPerson` は二人称代名詞（enum、任意）。指定するとキャラは相手の名前を呼ばず、その代名詞で固定（例: `'kimi'` → 常に「君」）。
- `defaultHonorific` は他キャラを呼ぶときの基本敬称（enum、任意）。例: `'chan'` なら Writer は相手を「◯◯ちゃん」と呼ばせる。`'none'` で呼び捨て。`secondPerson` が指定されていればそちらが優先され、これは無視される。
- `addressOf` は個別の呼称上書き（alias → 呼称の自由文マップ）。例: `{ hiro: '兄さん' }`。固有名詞や特殊呼称を含むため v1 の例外として自由文を許容する。**Writer の解決順**: `addressOf[<alias>]` があれば最優先 → なければ `secondPerson`（代名詞） → なければ `defaultHonorific` を name に付ける → それも無ければ文脈推測。
- **v1 では自由文補足は `personaNote` + `addressOf` の値のみ**。`ageNote` / `raceNote` / `occupationNote` / `speechStyleNote` / `relationshipNote` は存在しない。enum 粒度を越える情報（特殊な年齢、方言の詳細、関係性の補足等）は全て `personaNote` に集約するか、enum の範囲内で割り切る。

**主人公と関係性のルール:**

- `characters` 配列内で `relationship: 'self'` を持つキャラが **主人公で、ちょうど 1 人**。
- 主人公は必ず `role: 'protagonist'` も持つ（`relationship: 'self'` と対になる）。
- それ以外のキャラの `relationship` は `'self'` 以外から必ず選ぶ。
- ナレーターは `role: 'narrator'` かつ `relationship: 'other'`（語り手は主人公との個人的関係を持たない扱い）。
- 他キャラ間の関係性（例：A さんと B さんは兄弟）は v1 では `DramaBible.relationships` の自由文でのみ表現する。キャラ組み合わせの enum 化は v2 optional（[`roadmap.md` §9.8](./roadmap.md#98-キャラ間関係マトリクス)）。

**ナレーター運用規約:**
Bible の `cast.speakers` に `narrator` alias を 1 つ含めることを推奨する。ナレーションは VDS-JSON の `speech` cue として `speaker: 'narrator'` で書く。VDS 仕様側に新 `kind` は追加しない。ナレーターは `CharacterSpec` の `role: 'narrator'`、`ageGroup: 'ageless'`、`gender: 'unknown'`、`firstPerson: 'other'`（三人称の語り手なので本人視点の一人称を使わない）、`personality: ['stoic']`、`personaNote: '三人称の語り手'` 等を既定値とする。`addressOf` は原則指定しない（語り手は登場人物をフルネームや役割で呼ぶ）。

### 4.1.1 入力例：中学生 2 人の学園ライトノベル

主人公・桜羽エマと幼馴染・二階堂ヒロを中心に、学園生活をライトノベル風に流しっぱなしで楽しむ `'loop'` 用途の例。

```ts
const exampleBrief: DramaBrief = {
  schemaVersion: 1,
  title: '桜の咲く教室で',

  genre: {
    categories: ['school_life'],
    tone: 'lighthearted'                    // 軽妙・明るい
  },

  cast: {
    // 主人公は characters 内の relationship: 'self' で特定する（別途 protagonist フィールドなし）
    characters: [
      {
        // ── 主人公：桜羽エマ ───────────────────────
        name: '桜羽エマ',
        alias: 'emma',
        uuid: '7c9e6a55-5b6a-4a4d-9c49-1d5a3b2f6cbb',  // 実話者 UUID に差し替える
        role: 'protagonist',
        ageGroup: 'teen',                   // 中学 2 年生 = 13〜14 歳 → teen (13-17)
        gender: 'female',
        speechStyle: 'casual_youthful',
        firstPerson: 'boku',                // 一人称「ボク」（ボクっ娘）
        personality: ['cheerful', 'curious', 'emotional'],
        relationship: 'self',               // 主人公を一意に特定するキー
        occupation: 'student_middle',
        attributes: ['genki'],
        background: ['late_bloomer'],
        defaultHonorific: 'chan',           // 他キャラを「〜ちゃん」付けで呼ぶ
        personaNote:
          'クラスで文化祭実行委員を務める中学 2 年生。好奇心旺盛で、気になることがあると頭より先に足が出るタイプ。' +
          '幼馴染のヒロには頼りつつも、からかわれると素直にムキになってしまう。'
      },
      {
        // ── 幼馴染：二階堂ヒロ ─────────────────────
        name: '二階堂ヒロ',
        alias: 'hiro',
        uuid: '5680ac39-43c9-487a-bc3e-018c0d29cc38',
        role: 'companion',                  // 主人公と常に行動を共にする相棒
        ageGroup: 'teen',
        gender: 'male',
        speechStyle: 'polite_casual',
        firstPerson: 'watashi',             // 一人称「私」（知的な少年）
        personality: ['stoic', 'logical', 'loyal'],
        relationship: 'childhood_friend',   // 幼馴染
        occupation: 'student_middle',
        attributes: ['glasses', 'bookworm'],
        secondPerson: 'kimi',               // 相手を名前でなく「君（きみ）」で呼ぶ
        personaNote:
          '幼稚園からの付き合いで家は隣同士、朝はいつも一緒に登校する。' +
          '口数は少ないが、エマの突飛な行動を冷静に拾ってフォローする役回り。' +
          '休み時間は文庫本か自作のノートパソコンに向かっていることが多い。'
      }
    ],
    narrator: { uuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' }  // 静かな三人称の語り手
  },

  // setting は DramaBrief には持たない。
  // Editor が genre.categories=['school_life'] + tone='lighthearted' から
  // 自動推定（例: 4 月の朝・晴れ・教室）で Bible / DramaState を初期化する。

  ending: 'loop'                           // 起承転結を設けず日常を流し続ける
}
```

**この例の設計ポイント**

| 選択 | 理由 |
|---|---|
| `ageGroup: 'teen'` | 中学 2 年生は 13〜14 歳なので `'preteen'`（10-12）ではなく `'teen'`（13-17） |
| `role` の使い分け | エマは `'protagonist'`、ヒロは常時同行する相棒なので `'companion'`（`'love_interest'` ではない） |
| `relationship: 'childhood_friend'` | 幼稚園からの幼馴染を表現。`'best_friend'` でも通るが、**長い時間を共有してきた関係**を明示したい場合はこちら |
| `firstPerson` を指定 | エマ=「ボク」（ボクっ娘属性）、ヒロ=「私」（知的な少年）で Writer に一人称の揺れを抑えさせる |
| エマ: `defaultHonorific: 'chan'` | 他キャラを「◯◯ちゃん」と名前＋敬称で呼ぶ（例:「ヒロちゃん」） |
| ヒロ: `secondPerson: 'kimi'` | 相手を名前で呼ばず、常に二人称代名詞「君（きみ）」で呼ぶ。`defaultHonorific: 'kun'`（名前＋「〜君（くん）」）とは**別概念** |
| `personality` を 3 個 | 1 個（`cheerful` だけ等）だと単調になるので層を作る。エマは明るい＋好奇心＋感情的、ヒロは寡黙＋論理的＋忠実、で対比 |
| `attributes` | エマに `'genki'`（元気）、ヒロに `'glasses'` + `'bookworm'` を入れることでライトノベル的な立ち位置を明示 |
| `occupation: 'student_middle'` | 中学生を enum で明示。高校なら `'student_high'` |
| `tone: 'lighthearted'` | `Tone` enum の単一選択。`Genre` の `school_life` と組み合わさり軽妙な学園モノが成立 |
| `setting` は書かない | v1 は Editor に自動初期化を任せる。プロット段階で教室名や時刻を決めない |
| `ending: 'loop'` | BGM 用途なので起承転結を設けず無限に流す |
| `narrator` あり | 三人称の地の文でシーンの切り替えや心情描写を挟める（「桜の花びらが窓の外を舞った」等） |
| 自由文補足は `personaNote` だけ | v1 では `*Note` は `personaNote` に統一、他は enum で表現する |

**この Brief を投入すると**

Editor はこれを基に `DramaBible` を初期化し、毎サイクル以下のような Beat を即興で量産する：
- 朝のホームルーム前のやり取り
- 昼休みの購買めぐり
- 放課後の委員会・部活
- 帰り道でのお喋り

状態（天気・時刻・場所）は Editor の吸収で進行し、`'late_spring'` → `'rainy_season'` → `'midsummer'` と季節が移っても整合が保たれる。

---

## 4.2 `DramaBible`（Editor が Redis に保持）

ドラマ全体の長命状態。Editor のみが読み書きする。

```ts
type DramaBible = {
  schemaVersion: 1
  dramaId: string
  title: string

  genre: {                             // DramaBrief.genre から引き継ぐ
    categories: Genre[]
    tone: Tone
  }

  cast: {                              // DramaBrief.cast を詳細化した形
    // 主人公は speakers の中で relationship: 'self' を持つエントリ（ちょうど 1 つ）。
    // 別途フィールドを持たない（DramaBrief と同じ方針）。
    speakers: Record<string, SpeakerEntry>  // alias → 話者情報（下の SpeakerEntry 参照）
  }

  premise: string                      // 数百字の設定要約
  world: string
  relationships: string                // 他キャラ間の関係（v1 は自由文のみ、roadmap §9.8 参照）
  // 物語内で言及された事実の台帳。初期は空。Editor が VdsJson の吸収で随時追記する。
  // v1 では Writer へも全件開示してよい（戦略的な情報隠蔽は v2 の plotted モードで扱う）。
  facts: Record<string, Fact>
  createdAt: string                    // ISO8601
  updatedAt: string
}

type Fact = {
  factId: string
  content: string                     // 例: "主人公は3年前に実家を出ている"
  acquiredInBeatId: string             // どの Beat の吸収で追加されたか
}

// CharacterSpec をそのまま展開し、Bible 固有のシステム領域を追加。
// Editor は DramaBrief.cast.characters から SpeakerEntry を初期化する際、
// speechStyle や personaNote を必要に応じて詳細化してよい。
type SpeakerEntry = CharacterSpec & {
  deprecated?: boolean                // /synth 404 検出時に立つ
}
```

---

## 4.3 `DramaState`（Editor が Redis に保持）

リアルタイム進行の状態。Editor の吸収で更新される。ハード制約とソフト記述を明確に分けて持つ。

**`flashback` の Beat は DramaState を一切更新しない（[`operations.md` §6](./operations.md#6-writer-の-1-サイクル手順) 参照）**。DramaState は常に「物語のリアルタイム現在」を指す。

```ts
type DramaState = {
  schemaVersion: 1
  dramaId: string

  // ── ハード制約（Editor のコードで自動検証する）──────────
  worldTime: { day: number; hhmm: string }   // リアルタイムの物語内時間。単調増加のみ
  season: Season                             // リアルタイムの季節。後戻り禁止
  weather: Weather                           // リアルタイムの天気。Beat 間で変化可（急変は時間経過を挟む）
  location: string                           // リアルタイムの現在地（DramaBrief.setting.location から引き継ぐ）
  characterStates: Record<string, {          // alias → ハード状態
    status: CharacterStatus
    location: string | null                  // null = 舞台外
    lastSeenBeatId: string
    // ── ソフト記述・知識 ────────────────────────
    mood: string                             // 感情。自由文
    knownFacts: FactRef[]                    // 知っている事実（DramaBible.facts への参照）
    inventory?: string[]
  }>

  // ── 進行 ─────────────────────────────────────
  recentBeats: BeatDigest[]                  // 直近 8 Beat 程度のダイジェスト
  totalPlayedSec: number
  nextBeatIdCounter: number
}

type FactRef = {
  factId: string                             // DramaBible.facts のキー
  acquiredInBeatId: string
  source: FactSource
  beliefStrength: 'certain' | 'suspecting' | 'rumor'
}

type BeatDigest = {
  beatId: string
  sceneKind: SceneKind
  summary: string                            // 1〜2 行の要約
  playedAt: string                           // ISO8601
}
```

`CharacterStatus` / `Season` / `Weather` / `FactSource` / `SceneKind` の値は [`enums.md`](./enums.md) を参照。

**ハード制約の不変ルール:**

- `status` の `dead` は不可逆。`dead` → 他 status は Editor の吸収で拒否。
- `worldTime` は単調増加のみ（リアルタイム時刻）。
- `season` はリアルタイムでは後戻り禁止（`late_spring` → `rainy_season` → `midsummer` の順でのみ進む）。
- `weather` は Beat 間で自由に変化可。ただし `blizzard` → 次の Beat で `sunny` のような急変は時間経過（数時間以上）を挟む。
- `location` は Beat 間で変化可。瞬間移動を避けるため、遠距離の移動は中間 Beat（移動シーン or ナレーション）で埋めるのが望ましい（ハードルールではなく運用指針）。

**`CharacterStatus` の遷移図:**

```mermaid
stateDiagram-v2
    [*] --> awake
    awake --> asleep: 就寝
    asleep --> awake: 起床
    awake --> unconscious: 気絶・昏倒
    unconscious --> awake: 覚醒
    awake --> absent: 退場
    absent --> awake: 再登場
    asleep --> absent
    absent --> asleep
    awake --> dead: 死亡
    asleep --> dead
    unconscious --> dead
    absent --> dead
    dead --> [*]: 不可逆
    note right of dead
      dead は終端状態。
      flashback でのみ
      過去の awake を描ける。
    end note
```

---

## 4.4 `BeatSheet`（Editor → Writer）

Writer に渡す「次に書くべき 1 場面」の指示書。**1 BeatSheet = 1 Beat**。Editor は前サイクルの吸収と併せて次の BeatSheet を組む。

```ts
type BeatSheet = {
  schemaVersion: 1
  dramaId: string
  beat: Beat
  // Bible から抜き出した、この Beat で使ってよい話者のみのスナップショット。
  // Writer はここにない alias を出力してはならない。
  speakers: Record<string, {
    uuid: string
    persona: string
    speechStyle: string
    firstPerson: FirstPerson                  // CharacterSpec から引き継ぐ一人称
    secondPerson?: SecondPerson                // 二人称代名詞（CharacterSpec から引き継ぐ）
    defaultHonorific?: Honorific               // 既定の敬称パターン（CharacterSpec から引き継ぐ）
    addressOf?: Record<string, string>         // 他 alias への個別呼称マップ（CharacterSpec から引き継ぐ）
    // そのキャラが Beat 実行前時点で知っている事実の内容。Editor が Bible.facts と
    // characterStates[alias].knownFacts を照合して content を展開する。Writer は
    // この範囲でのみ喋らせてよい。narrator も同じルールで絞り、語り手の全知化を避ける。
    knownFactsSnapshot: Array<{
      content: string
      beliefStrength: 'certain' | 'suspecting' | 'rumor'
    }>
  }>
  // 直近 5〜10 Beat のあらすじ（時系列、古い→新しい順）。
  // Editor は `DramaState.recentBeats` の末尾 N 個をそのままコピーする。
  // 全体要約ではなく Beat 単位の 1〜2 行要約を並べることで、Writer に
  // 「ついさっき何が起きたか」を正確に伝える（例: AとBが雨で濡れた直後に
  // 傘を持った Cが合流した、という時系列が 2 つの Beat に分けて記録される）。
  recentBeats: BeatDigest[]
  // 前 Beat 末尾の cue 2〜3 個を原文で含める。Beat 間の台詞接続を自然にする。
  precedingTailCues?: Array<{ speaker: string; text: string }>
  constraints: {
    maxCueTextLength: 200              // VDS §3.3 の保険
    maxBeatTextLength: 1500            // この Beat の speech.text 合計の上限
    maxCueCount: number                // 15 前後が目安
    allowedPauseRange: [number, number]  // pause.duration の許容範囲（秒）
  }
}

// BeatDigest の定義は §4.3 DramaState 参照（recentBeats と同じ型を使う）。

type Beat = {
  beatId: string                       // dramaId 内でユニーク
  sceneKind: SceneKind
  goal: string                         // この Beat で達成したいこと（LLM 向けの指針）
  tension: 'low' | 'medium' | 'high'
  presentCharacters: string[]          // 登場する alias の配列（narrator 含めても良い）
  // realtime なら省略可（DramaState の時空を使う）。
  // flashback なら必須（この Beat 独自の時空を宣言）。
  sceneContext?: {
    worldTime: { day: number; hhmm: string }  // 過去の時刻（flashback の場合、DramaState.worldTime より過去）
    season: Season
    weather: Weather
    location: string
    characterOverrides?: Record<string, {     // 当時のキャラ状態の上書き（例: dead な人を awake に）
      status?: CharacterStatus
      location?: string | null
      mood?: string
    }>
  }
  flashbackViewpointAlias?: string     // flashback の視点主（任意）。純ナレーション回想なら省略
  seed?: number                        // 再現性のための共通 seed（任意）
}
```

**realtime の BeatSheet 組み立て:**

Editor は `DramaState` から以下をスナップショットして Writer に渡す：
- `speakers`：`presentCharacters` に含まれ、かつ `characterStates[alias].status === 'awake'` かつ `characterStates[alias].location === DramaState.location` な alias のみ（`narrator` は例外で常時許可）
- `knownFactsSnapshot`：各 alias の `characterStates[alias].knownFacts` を `Bible.facts` と照合して content に展開

**flashback の BeatSheet 組み立て:**

Editor は `Beat.sceneContext` に過去の時空・キャラ状態を宣言する。Writer へ渡す `speakers` と `knownFactsSnapshot` は、この `sceneContext` 時点で存在し・知っていた内容に絞る（未来情報の混入禁止は Editor の責任）。

---

## 4.5 `VdsJson`（Writer → Runner）

Writer の唯一の出力。スキーマは `docs/voice-drama-format.md §4` および `src/schemas/voice-drama.dto.ts` に準拠する。

制約：
- `speech.text` 合計が `constraints.maxBeatTextLength`（1500 字）を超えないこと
- 使用できる alias は `BeatSheet.speakers` のキーのみ
- 各 alias の発話内容は `speakers[alias].knownFactsSnapshot` の範囲に収める（Editor が渡していない事実をそのキャラが知っている前提で喋らせない）
- ナレーションが必要なら `speaker: 'narrator'` の speech cue として書く

---

## 4.6 `SceneReport`（Runner → Editor）

再生結果の **再生メタ** のみ。物語内容の要約は Editor が VdsJson を直接読んで作るため、ここには含めない。

```ts
type SceneReport = {
  schemaVersion: 1
  dramaId: string
  beatId: string
  playedCueCount: number
  skippedCues: Array<{
    index: number                      // VdsJson.cues 内のインデックス
    reason: 'synth_404' | 'synth_error' | 'schema_violation' | 'caption_unsupported'
    detail?: string
  }>
  actualDurationSec: number            // 実再生秒数（worldTime には反映しない、物語内時間は吸収で決める）
  playedAt: string                     // ISO8601
}
```
