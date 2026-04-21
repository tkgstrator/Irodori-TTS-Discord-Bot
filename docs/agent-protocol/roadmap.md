# v2 以降のロードマップ・非目標・変更履歴

> 本書は [`README.md`](./README.md) の §9〜§11 に相当する。

---

## 9. 未定義・v2 以降で扱う拡張

v1 では扱わない。必要になったら `schemaVersion: 2` で追加する。

### 9.1 事前プロット / plotted モード
- `DramaBrief.mode: 'improv' | 'plotted'` の導入
- `Bible.arcPlan`（全体プロット、起承転結）
- `ending: 'closed'` 向けの「終幕に向けて収束させる」Writer 挙動

### 9.2 戦略的キャラ行動
- `Bible.cast.speakers[alias].personalGoals.{overt, covert}`（表向きの目標／隠れた目標）
- `DramaState.characterStates[alias].strategies`（話題ごとの `truth` / `lie` / `deflect` / `silent` ポリシーと嘘の内容）
- Writer の「covertGoals と矛盾する Beat の起案回避」チェック

### 9.3 ミステリー拡張
- `Bible.secrets`（犯人・動機・手口を隠す台帳）
- `Bible.facts[].visibility: 'open' | 'restricted'`（Novelist への露出制御）
- `Beat.kind: 'clue_drop' | 'red_herring' | 'revelation'`
- `revelation` Beat 発注前の「探偵役の knownFacts で推理が成立するか」自己検証

### 9.4 2 階認知（Theory of Mind）
- `DramaState.characterStates[alias].perceivedKnowledge`（A は B がこの事実を知っていると思っている）
- `characterStates[alias].suspicionsTowards`（他 alias への疑い度）

### 9.5 伏線台帳
- `Bible.foreshadows`（`plantedInBeatId` / `resolvedInBeatId` による回収管理）

### 9.6 連続回想
- 複数 Beat を跨ぐ flashback（現 v1 は 1 Beat = 1 回想完結）
- `DramaState.flashbackContext` を一時的に持ち、回想中の時間を進める

### 9.7 ユーザーの途中介入
- `/drama nudge "<指示>"` で展開の軌道修正
- `/drama edit-bible` で Bible の直接編集

### 9.8 キャラ間関係マトリクス
- v1 は `CharacterSpec.relationship` のみ enum 化。他キャラ間の関係（A と B は兄弟、B と C は恋人、等）は `DramaBible.relationships` の自由文のみ
- v2 以降で `DramaBible.relationshipMatrix?: Record<alias, Record<alias, RelationshipType>>` のような N×N enum 構造を optional 追加

### 9.9 その他
- 並列進行（別視点・別場所を同時に描く）
- 夢・空想のシーン（`sceneKind: 'dream' | 'imagination'`）
- 複数 Writer の協調（ドラマ跨ぎの共通キャラ）
- ペット・NPC・純粋な環境音

---

## 10. 補足：このプロトコルの非目標

- **Novelist の汎用化**：Novelist は VDS-JSON を出す役割に固定。他形式への出力は想定しない。
- **LLM プロバイダの固定**：Writer と Novelist のモデルは不問。Structured Output が出せれば何でもよい。
- **リアルタイム性**：BGM 用途を主眼にしているため、初動レイテンシ 30〜60 秒を許容する。その後は先読みで切れ目なく流れる。
- **戦略的深み**：v1 は「状態整合のある即興会話」を目指す。キャラが意図を持って嘘をつく・駆け引きするシーンは v2 の plotted モードで扱う。

---

## 11. 変更履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 1 (初版) | 2026-04-21 | 初版。5 メッセージ、Writer=stateful・Novelist=stateless、Redis 状態管理、エラー時は「skip して続行」。 |
| 1 (改訂) | 2026-04-21 | 短いサイクル連続運転モデルに再設計。1 BeatSheet = 1 Beat (1500 字)、先読みパイプライン、状態をハード制約とソフト記述の二層に分離。Beat に preconditions/effects を追加し、Writer の自己検証手順 §6 を新設。ナレーター運用規約を §4.1 に追記。 |
| 1 (改訂) | 2026-04-21 | `knownFacts` を構造化。`Bible.facts` 台帳を追加、`characterStates[].knownFacts` を `FactRef[]` に変更。`Beat.effects.revealFacts` を追加し、`BeatSheet.speakers` に `knownFactsSnapshot` を導入。 |
| 1 (改訂) | 2026-04-21 | **即興ループモデルに再設計**。事前宣言（`Beat.preconditions` / `effects`）を廃止し、Writer が VdsJson を読んで状態を更新する **事後吸収モデル** に変更。`Bible.facts` を初期空にし、Writer が吸収で追記していく形に。`SceneReport` を再生メタのみに縮小。`sceneKind: 'realtime' \| 'flashback'` と `sceneContext` で回想を独立時空としてサポート。`Season` を 8 分割 enum、`Weather` を 11 分割 enum として導入（realtime では後戻り禁止ルールあり）。戦略機能（covertGoals / strategies）・プロット駆動モード・ミステリー拡張・2 階認知などは §9 の v2 optional として切り出し。Writer の 1 サイクル手順を「吸収 → 起案」の 2 フェーズで §6 に再定義。 |
| 1 (改訂) | 2026-04-21 | `DramaBrief` / `DramaBible` の `genre: string` を `genres: Genre[]`（enum の配列、1〜3 個）＋ `subgenre?: string`（自由文補足）に置き換え。`Genre` enum を 12 種（school_life, slice_of_life, romance, sci_fi, fantasy, mystery, horror, suspense, comedy, historical, workplace, heartwarming）で導入。組み合わせ（学園×ミステリ等）とニッチ要素（スチームパンク等）の両立を図る。 |
| 1 (改訂) | 2026-04-21 | キャラクタープロフィールを全面 enum 化。`DramaBrief.characters[]` と `DramaBible.speakers[alias]` を共通の `CharacterSpec` 型に統一し、8 つの enum を新規導入：`Role`（12 種）・`AgeGroup`（9 種）・`Gender`（5 種）・`Race`（16 種）・`SpeechStyle`（11 種）・`Occupation`（約 35 種）・`PersonalityTrait`（30 種）・`Attribute`（20 種）・`BackgroundTag`（15 種）。WebUI のセレクト入力を前提に必須/任意を整理。enum 粒度を越える情報は各 `*Description` / `*Notes` の自由文で補完できる。 |
| 1 (改訂) | 2026-04-21 | 主人公中心の関係性を導入。`DramaBrief` / `DramaBible` に `protagonistAlias: string` を追加し、`CharacterSpec` に `relationshipToProtagonist: RelationshipToProtagonist`（29 種 enum）と `relationshipNotes?: string` を追加。主人公は 1 人限定（`relationshipToProtagonist: 'self'`）、ナレーターは `'other'` 扱い。他キャラ間の関係マトリクスは §9.8 の v2 optional に切り出し。 |
| 1 (改訂) | 2026-04-21 | `DramaBrief` / `DramaBible` を 3 カテゴリ（`genre` / `cast` / `setting`）にネスト整理し、`initial*` 系 4 フィールドを廃止。`includeNarrator` + `narratorUuid` を `cast.narrator?: { uuid }` に統合。冗長なプロパティ名を短縮：`speakerAlias` → `alias`、`speakerUuid` → `uuid`、`protagonistAlias` → `protagonist`、`personalityTraits` → `traits`、`backgroundTags` → `background`、`relationshipToProtagonist` → `relationship`、`extraNotes` → `notes`。`*Description` / `*Notes` を `*Note` 単数形に統一。enum 名も短縮：`PersonalityTrait` → `Trait`、`BackgroundTag` → `Background`、`RelationshipToProtagonist` → `Relationship`。`DramaState.currentLocation` → `location`。 |
| 1 (改訂) | 2026-04-21 | 単一の `agent-protocol.md`（828 行）を `docs/agent-protocol/` ディレクトリの 5 ファイルに分割：`README.md`（概要・§1-3）、`messages.md`（§4 メッセージ型）、`enums.md`（全 enum リファレンス）、`operations.md`（§5-8 実行モデル）、`roadmap.md`（§9-11 ロードマップ・非目標・変更履歴）。enum 値定義を `enums.md` に集約することで `messages.md` の構造定義に集中できるようにした。クロス参照は相対リンクで接続。 |
