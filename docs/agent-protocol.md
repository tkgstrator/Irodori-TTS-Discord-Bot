# ボイスドラマ生成エージェント間プロトコル仕様

ボイスドラマを LLM エージェント構成で連続生成するための、エージェント間で受け渡すメッセージの仕様を定義する。出力形式の VDS-JSON は `docs/voice-drama-format.md` に準拠する。

本ドキュメントは **仕様定義のみ** を扱い、エージェントの実装・LLM プロンプト・Runner の再生パイプラインは別タスクで行う。

---

## 1. 背景・狙い

単一 LLM に長時間ドラマを書かせると、主役の口調のズレ・ネタのループ・冗長化・キャラ整合性の破綻（寝たキャラが会話する、死んだキャラが復活する等）が早期に顕在化する。長期メモリの管理と 1 シーン単位の執筆を役割分離し、**状態をハード制約とソフト記述の二層で持つ**ことで、BGM として流しっぱなしにできる品質を維持する。

---

## 2. 設計方針

1. **短いサイクルで連続運転する**。1 回の Novelist 呼び出しは約 4〜5 分ぶん（本文 1500 字）に抑え、Writer がループでこれを連打することで任意長の再生を実現する。1 回にまとめて長い台本を書かせる設計は取らない。
2. **状態は二層**で持つ。ハード制約（`status` / `location` / `worldTime`）は機械が突合し、ソフト記述（`mood` / `knownFacts` / `relationships`）は LLM がソフトに効かせる。
3. **Writer = stateful / Novelist = stateless**。長期メモリは Writer のみが保持し、Novelist は毎回渡されるコンテキストだけで書く。
4. **状態更新は SceneReport 駆動**。Novelist が書いた内容ではなく、**実際に再生された内容** を真実とする。
5. **先読みパイプライン**。Runner は再生中に次 Beat の執筆・合成をキューに積み、切れ目を `pause` cue だけに留める。

---

## 3. 責務分離

```
[User]
  │  DramaBrief                       （要求投入）
  ▼
[Writer: 脚本家]   ←→ Redis（DramaBible, DramaState）
  │  BeatSheet (= 1 Beat)             （逐次発注、1 回ぶん 1500 字相当）
  ▼
[Novelist: 小説家] （stateless、1 回の出力は 1500 字以内）
  │  VdsJson                          （docs/voice-drama-format.md §4）
  ▼
[Runner: 実行]     → /synth を順次実行、WAV を再生（先読み合成）
  │  SceneReport                     （実際に再生された結果、skip の有無）
  ▲
[Writer]                             （Report で DramaState を更新 → 次 BeatSheet を発注）
```

---

## 4. メッセージ型

5 種類のメッセージで全ての受け渡しが完結する。全メッセージは `schemaVersion: 1` を持ち、破壊的変更時に版を上げる。

### 4.1 `DramaBrief`（User → Writer）

ユーザーから Writer への最初の要求。1 ドラマにつき 1 回送られる。

```ts
type DramaBrief = {
  schemaVersion: 1
  title?: string
  genre: string                       // 例: "日常SF", "ホラー", "ラブコメ"
  tone: string                        // 例: "軽妙", "静謐", "抒情的"
  characters: Array<{
    name: string
    role: string                      // "主人公", "相棒", "敵役" 等
    speechStyleHint: string
    speakerAlias: string              // VDS の alias（§3.4 規則に従う）
    speakerUuid: string               // Irodori-TTS の話者UUID
  }>
  includeNarrator: boolean            // ナレーター alias を Bible に含めるか（規約：true を既定）
  narratorUuid?: string               // includeNarrator=true のとき必須
  initialWorldTime: { day: number; hhmm: string }  // 物語開始時点のワールド時刻
  initialLocation: string             // 物語開始時点の場所
  targetDurationMinutes: number       // 目標尺（BGM用途なら0=無限）
  ending: 'loop' | 'closed'
  extraNotes?: string
}
```

**ナレーター運用規約:**
Bible の `speakers` に `narrator` alias を 1 つ含めることを推奨する。ナレーションは VDS-JSON の `speech` cue として `speaker: 'narrator'` で書く。VDS 仕様側に新 `kind` は追加しない。

### 4.2 `DramaBible`（Writer が Redis に保持）

ドラマ全体の長命状態。Writer のみが読み書きする。

```ts
type DramaBible = {
  schemaVersion: 1
  dramaId: string
  title: string
  genre: string
  tone: string
  premise: string                     // 数百字の設定要約
  world: string
  speakers: Record<string, {          // alias → 話者情報
    uuid: string
    persona: string                   // キャラ人物像（1〜3行）
    speechStyle: string               // 口調の具体例
    deprecated?: boolean              // /synth 404 検出時に立つ
  }>
  relationships: string
  arcPlan: Array<{                    // 全体プロット（closed の場合）
    actId: string
    summary: string
    status: 'pending' | 'active' | 'done'
  }>
  createdAt: string                   // ISO8601
  updatedAt: string
}
```

### 4.3 `DramaState`（Writer が Redis に保持）

直近の進行状態。Report 駆動で更新される。ハード制約とソフト記述を明確に分けて持つ。

```ts
type DramaState = {
  schemaVersion: 1
  dramaId: string

  // ── ハード制約（機械で突合する）─────────────────────
  worldTime: { day: number; hhmm: string }   // 物語内時間。単調増加のみ
  currentLocation: string                    // 現在のシーン場所
  characterStates: Record<string, {          // alias → ハード状態
    status: CharacterStatus                  // 次項参照
    location: string | null                  // null = 舞台外
    lastSeenBeatId: string
    // ── ソフト記述 ──────────────────────────────
    mood: string                             // 感情。自由文
    knownFacts: string[]                     // 知っている事実。重複許可
    inventory?: string[]
  }>

  // ── 進行 ─────────────────────────────────────
  currentActId?: string                      // arcPlan 参照
  recentBeats: BeatDigest[]                  // 直近 8 Beat 程度のダイジェスト
  flags: Record<string, unknown>             // 任意フラグ（例: "告白済み": true）
  totalPlayedSec: number
  nextBeatIdCounter: number
}

type CharacterStatus =
  | 'awake'         // 通常状態
  | 'asleep'        // 就寝中
  | 'unconscious'   // 気絶
  | 'dead'          // 死亡（不可逆）
  | 'absent'        // 舞台外

type BeatDigest = {
  beatId: string
  summary: string                            // 1〜2 行の要約
  playedAt: string                           // ISO8601
}
```

**不可逆な status 遷移:**
- `dead` への遷移は一方向。`dead` から他 status への遷移は Writer のバリデーションで拒否する。
- `absent` は任意方向に遷移可能。

### 4.4 `BeatSheet`（Writer → Novelist）

Novelist に渡す「次に書くべき 1 場面」の指示書。**1 BeatSheet = 1 Beat**。Writer は SceneReport を受けるたびに次の BeatSheet を発注する。

```ts
type BeatSheet = {
  schemaVersion: 1
  dramaId: string
  beat: Beat
  // Bible から抜き出した、この Beat で使ってよい話者のみのスナップショット。
  // Novelist はここにない alias を出力してはならない。
  speakers: Record<string, {
    uuid: string
    persona: string
    speechStyle: string
  }>
  // 直近の流れ（200〜400字の要約）。前 Beat までの文脈を掴むためだけに使う。
  precedingSummary: string
  // 前 Beat 末尾の cue 2〜3 個を原文で含める。Beat 間の台詞接続を自然にする。
  precedingTailCues?: Array<{ speaker: string; text: string }>
  constraints: {
    maxCueTextLength: 200              // VDS §3.3 の保険
    maxBeatTextLength: 1500            // この Beat の speech.text 合計の上限
    maxCueCount: number                // 15 前後が目安
    allowedPauseRange: [number, number]  // pause.duration の許容範囲（秒）
  }
}

type Beat = {
  beatId: string                       // dramaId 内でユニーク
  location: string                     // シーンの場所
  worldTimeStart: { day: number; hhmm: string }
  presentCharacters: string[]          // 登場する alias の配列（narrator 含めても良い）
  goal: string                         // この Beat で達成したいこと（LLM 向けの指針）
  tension: 'low' | 'medium' | 'high'
  // ── ハード契約（Writer が事前・事後チェック）─────────
  preconditions: {
    presentMustBeAwake: string[]       // ここに並ぶ alias は status='awake' 必須
    locationMustMatch: true            // presentCharacters の location が location と一致必須
    requiredFlags?: Record<string, unknown>  // 例: { "告白済み": true }
  }
  effects: {
    worldTimeAdvanceMin: number        // この Beat で進める物語内時間（分）
    characterDeltas?: Record<string, { // alias → 差分
      status?: CharacterStatus
      location?: string | null
      gainedFacts?: string[]
    }>
    setFlags?: Record<string, unknown>
    // narrator は preconditions の対象外（常時利用可）
  }
  seed?: number                        // 再現性のための共通 seed（任意）
}
```

### 4.5 `VdsJson`（Novelist → Runner）

Novelist の唯一の出力。スキーマは `docs/voice-drama-format.md §4` および `src/schemas/voice-drama.dto.ts` に準拠する。

制約：
- `speech.text` 合計が `constraints.maxBeatTextLength`（1500 字）を超えないこと
- 使用できる alias は `BeatSheet.speakers` のキーのみ
- ナレーションが必要なら `speaker: 'narrator'` の speech cue として書く

### 4.6 `SceneReport`（Runner → Writer）

再生結果の報告。Writer はこれを受けて DramaState を更新する。

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
  actualDurationSec: number
  // 実際に再生された内容の要約。Novelist が VdsJson に同梱して返すか、
  // Writer が別途要約するかは実装で決める（§7）。
  narrativeSummary: string
}
```

---

## 5. 状態の置き場（Redis）

既存の Redis をそのまま使う。キー設計は下記に従う。

| キー | 型 | 内容 | 寿命 |
|------|-----|------|------|
| `drama:<dramaId>:bible` | Hash / JSON string | `DramaBible` | 長命（ユーザーが削除するまで） |
| `drama:<dramaId>:state` | Hash / JSON string | `DramaState` | 長命（ドラマ終了で削除） |
| `drama:<dramaId>:queue:beats` | Stream | 生成予定の `BeatSheet` を積む | エフェメラル |
| `drama:<dramaId>:queue:reports` | Stream | Runner からの `SceneReport` を積む | エフェメラル |
| `drama:<dramaId>:lock:writer` | String (NX/EX) | Writer の二重起動防止 | 数十秒の TTL |

- 1 ドラマ = 1 `dramaId`。Discord のギルド × ユーザーで発番する想定（具体形は実装時に決める）。
- Writer は `dramaId` ごとにシングルトン。並行処理は別プロセスで分離する。

---

## 6. Writer の Beat 生成手順（ハード制約の突合）

Writer は新しい Beat を生成するたび、以下の順で自己検証を通してから BeatSheet を発注する。

1. **キャラ選定**: `presentCharacters` 候補は `characterStates[alias].status === 'awake'` かつ `location === <目的場所>` の alias のみ。`narrator` は常時利用可。
2. **不在キャラの扱い**: 登場させたいが別 location にいる・`asleep` 等の場合は、**先に移動/起床の Beat を挟む**。「死者の除外」のようなケースは LLM に選ばせず Writer 側で機械的にフィルタする。
3. **時刻の単調性**: `worldTimeStart` は `DramaState.worldTime` と同じか進んでいる。`effects.worldTimeAdvanceMin` は正の数。フラッシュバックは v1 では禁止。
4. **フラグ整合**: `preconditions.requiredFlags` を満たさない場合は、先にフラグを立てる別 Beat を挟む。
5. **effects の検証**: `dead` へ遷移させる Beat は明示的に（事故・病死等）書く。`dead` → 他 status は拒否。
6. **BeatSheet 組み立て**: 上記を通過した Beat に `speakers`（使用許可 alias のみ）、`precedingSummary`、`precedingTailCues` を同梱して発注。

---

## 7. 連続運転モデル

### 7.1 パイプライン

```
t=0     : Beat1 執筆(LLM ~20s) → 合成(TTS ~15s) → 再生(4〜5分)
t≈35s   :                       Beat2 執筆 → 合成 → 再生
t≈70s   :                                   Beat3 執筆 → 合成 → 再生
...
```

- Writer は SceneReport を**待たずに**次 Beat を投機的に執筆してよい（`recentBeats` とハード状態から決定論的に決まる範囲で）。
- Runner は `queue:beats` から BeatSheet を pull し、Novelist を呼び、VdsJson を合成し、Beat 間に 1.5〜2.0 秒の `pause` cue を挿入して連続再生する。
- 再生の切れ目は pause cue のみ。BGM として違和感なく流れる。

### 7.2 先読み深度

- Runner は**再生中の Beat + 合成済みの Beat 2 つ**を常に保持する（合計 3 Beat バッファ）。
- Writer は**発注済み未合成の Beat 1 つ**を常に持つ（Runner の消費に先行して投入）。

### 7.3 ユーザー介入（v1 の最小構成）

- `/drama stop <dramaId>`: Writer のループ停止、Runner のキューを流し切って終了
- `/drama pause <dramaId>`: Runner のみ停止、キュー保持
- 途中での軌道修正（「この展開にして」）は v1 では未対応（§8）

---

## 8. エラー・リトライの合意

全てのメッセージ境界でバリデーションを走らせる。失敗時の扱いは以下に従う。

### 8.1 Novelist → Runner（`VdsJson` の不正）

| 原因 | 検出箇所 | 対応 |
|------|----------|------|
| Zod スキーマ違反 | Runner 手前のバリデータ | 同じ BeatSheet で Novelist に **最大 2 回** 再試行。失敗したら Beat を skip し `schema_violation` で Report |
| 未定義の alias 参照 | `VdsJsonSchema.superRefine` | 同上 |
| `speech.text` 合計が `maxBeatTextLength` 超 | バリデータ | 同上 |
| 1 cue の `text` が 200 字超 | `VdsJsonSchema` | 同上 |

### 8.2 Runner → Irodori-TTS（`/synth` 側の失敗）

| 原因 | 検出箇所 | 対応 |
|------|----------|------|
| UUID が `GET /speakers` に無い（404） | Runner | cue を skip、`reason: 'synth_404'`。Writer は受信時に `DramaBible.speakers[alias].deprecated = true` を立てる |
| caption 経路が未対応（VDS §6.3） | Runner | skip、`reason: 'caption_unsupported'` |
| タイムアウト・5xx | Runner | 1 回だけリトライ。失敗したら skip、`reason: 'synth_error'` |

### 8.3 Writer → Novelist（`BeatSheet` の不正）

Writer 側で自己検証（§6）してから送る。Bible に無い alias を `speakers` に入れない・`preconditions` を満たさない Beat を発注しないのは Writer の責任。

### 8.4 Writer の LLM 出力が JSON でない

Structured Output を前提とする。崩れた場合は同じ入力で再試行（最大 2 回）。連続で失敗したら、その BeatSheet の発注をスキップして次のサイクルを待つ。Runner には波及させない。

### 8.5 DramaState の不整合が検出された場合

例: Writer が `dead` キャラを復活させようとした等。Writer の自己検証で事前に弾く。それでも事後的に検出された場合は、該当 Beat を破棄し、**直前の DramaState から再発注**する。

---

## 9. 未定義・将来拡張

v1 では扱わない：

- **Novelist の短期記憶**：現状は完全 stateless（`precedingTailCues` で擬似的に繋ぐ）。
- **narrativeSummary の生成主体**：Novelist が VdsJson に同梱して返す既定と、Writer が別途要約エージェントを走らせる案がある。実装時に選ぶ。
- **フラッシュバック・並列進行**：`worldTime` の単調増加のみサポート。別視点・別場所の並列進行は未対応。
- **ユーザーの途中介入**：`/drama nudge "<指示>"` のような軌道修正 API は未定義。
- **ペット/NPC**：alias を発行して話させる場合は同じ扱い。純粋な環境音は未対応。
- **複数 Writer の協調**：ドラマ跨ぎで登場人物を共有する等は未対応。
- **ユーザーによる Bible 編集**：Discord 上からの `/drama edit-bible` は未定義。v1 では `DramaBrief` 投入以降、Bible はユーザーが直接編集しない。

これらが必要になったら `schemaVersion: 2` で拡張する。

---

## 10. 補足：このプロトコルの非目標

- **Novelist の汎用化**：Novelist は VDS-JSON を出す役割に固定。他形式への出力は想定しない。
- **LLM プロバイダの固定**：Writer と Novelist のモデルは不問。Structured Output が出せれば何でもよい。
- **リアルタイム性**：BGM 用途を主眼にしているため、初動レイテンシ 30〜60 秒を許容する。その後は先読みで切れ目なく流れる。

---

## 11. 変更履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 1 (初版) | 2026-04-21 | 初版。5 メッセージ、Writer=stateful・Novelist=stateless、Redis 状態管理、エラー時は「skip して続行」。 |
| 1 (改訂) | 2026-04-21 | 短いサイクル連続運転モデルに再設計。1 BeatSheet = 1 Beat (1500 字)、先読みパイプライン、状態をハード制約（status/location/worldTime、不可逆遷移あり）とソフト記述（mood/knownFacts）の二層に分離。Beat に preconditions/effects を追加し、Writer の自己検証手順 §6 を新設。ナレーター運用規約を §4.1 に追記。 |
