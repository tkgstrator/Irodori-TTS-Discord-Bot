# v2 以降のロードマップ・非目標・変更履歴

> 本書は [`README.md`](./README.md) の §9〜§11 に相当する。

---

## 9. 未定義・v2 以降で扱う拡張

v1 では扱わない。必要になったら `schemaVersion: 2` で追加する。

### 9.1 事前プロット / plotted モード
- `DramaBrief.mode: 'improv' | 'plotted'` の導入
- `Bible.arcPlan`（全体プロット、起承転結）
- `ending: 'closed'` 向けの「終幕に向けて収束させる」Editor 挙動

### 9.2 戦略的キャラ行動
- `Bible.cast.speakers[alias].personalGoals.{overt, covert}`（表向きの目標／隠れた目標）
- `DramaState.characterStates[alias].strategies`（話題ごとの `truth` / `lie` / `deflect` / `silent` ポリシーと嘘の内容）
- Editor の「covertGoals と矛盾する Beat の起案回避」チェック

### 9.3 ミステリー拡張
- `Bible.secrets`（犯人・動機・手口を隠す台帳）
- `Bible.facts[].visibility: 'open' | 'restricted'`（Writer への露出制御）
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
- 複数 Editor の協調（ドラマ跨ぎの共通キャラ）
- ペット・NPC・純粋な環境音

---

## 10. 補足：このプロトコルの非目標

- **Writer の汎用化**：Writer は VDS-JSON を出す役割に固定。他形式への出力は想定しない。
- **LLM プロバイダの固定**：Editor と Writer のモデルは不問。Structured Output が出せれば何でもよい。
- **リアルタイム性**：BGM 用途を主眼にしているため、初動レイテンシ 30〜60 秒を許容する。その後は先読みで切れ目なく流れる。
- **戦略的深み**：v1 は「状態整合のある即興会話」を目指す。キャラが意図を持って嘘をつく・駆け引きするシーンは v2 の plotted モードで扱う。

---

## 11. 変更履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 1 (初版) | 2026-04-21 | 初版。5 メッセージ、Editor=stateful・Writer=stateless、Redis 状態管理、エラー時は「skip して続行」。 |
| 1 (改訂) | 2026-04-21 | 短いサイクル連続運転モデルに再設計。1 BeatSheet = 1 Beat (1500 字)、先読みパイプライン、状態をハード制約とソフト記述の二層に分離。Beat に preconditions/effects を追加し、Editor の自己検証手順 §6 を新設。ナレーター運用規約を §4.1 に追記。 |
| 1 (改訂) | 2026-04-21 | `knownFacts` を構造化。`Bible.facts` 台帳を追加、`characterStates[].knownFacts` を `FactRef[]` に変更。`Beat.effects.revealFacts` を追加し、`BeatSheet.speakers` に `knownFactsSnapshot` を導入。 |
| 1 (改訂) | 2026-04-21 | **即興ループモデルに再設計**。事前宣言（`Beat.preconditions` / `effects`）を廃止し、Editor が VdsJson を読んで状態を更新する **事後吸収モデル** に変更。`Bible.facts` を初期空にし、Editor が吸収で追記していく形に。`SceneReport` を再生メタのみに縮小。`sceneKind: 'realtime' \| 'flashback'` と `sceneContext` で回想を独立時空としてサポート。`Season` を 8 分割 enum、`Weather` を 11 分割 enum として導入（realtime では後戻り禁止ルールあり）。戦略機能（covertGoals / strategies）・プロット駆動モード・ミステリー拡張・2 階認知などは §9 の v2 optional として切り出し。Editor の 1 サイクル手順を「吸収 → 起案」の 2 フェーズで §6 に再定義。 |
| 1 (改訂) | 2026-04-21 | `DramaBrief` / `DramaBible` の `genre: string` を `genres: Genre[]`（enum の配列、1〜3 個）＋ `subgenre?: string`（自由文補足）に置き換え。`Genre` enum を 12 種（school_life, slice_of_life, romance, sci_fi, fantasy, mystery, horror, suspense, comedy, historical, workplace, heartwarming）で導入。組み合わせ（学園×ミステリ等）とニッチ要素（スチームパンク等）の両立を図る。 |
| 1 (改訂) | 2026-04-21 | キャラクタープロフィールを全面 enum 化。`DramaBrief.characters[]` と `DramaBible.speakers[alias]` を共通の `CharacterSpec` 型に統一し、8 つの enum を新規導入：`Role`（12 種）・`AgeGroup`（9 種）・`Gender`（5 種）・`Race`（16 種）・`SpeechStyle`（11 種）・`Occupation`（約 35 種）・`PersonalityTrait`（30 種）・`Attribute`（20 種）・`BackgroundTag`（15 種）。WebUI のセレクト入力を前提に必須/任意を整理。enum 粒度を越える情報は各 `*Description` / `*Notes` の自由文で補完できる。 |
| 1 (改訂) | 2026-04-21 | 主人公中心の関係性を導入。`DramaBrief` / `DramaBible` に `protagonistAlias: string` を追加し、`CharacterSpec` に `relationshipToProtagonist: RelationshipToProtagonist`（29 種 enum）と `relationshipNotes?: string` を追加。主人公は 1 人限定（`relationshipToProtagonist: 'self'`）、ナレーターは `'other'` 扱い。他キャラ間の関係マトリクスは §9.8 の v2 optional に切り出し。 |
| 1 (改訂) | 2026-04-21 | `DramaBrief` / `DramaBible` を 3 カテゴリ（`genre` / `cast` / `setting`）にネスト整理し、`initial*` 系 4 フィールドを廃止。`includeNarrator` + `narratorUuid` を `cast.narrator?: { uuid }` に統合。冗長なプロパティ名を短縮：`speakerAlias` → `alias`、`speakerUuid` → `uuid`、`protagonistAlias` → `protagonist`、`personalityTraits` → `personality`、`backgroundTags` → `background`、`relationshipToProtagonist` → `relationship`、`extraNotes` → `notes`。`*Description` / `*Notes` を `*Note` 単数形に統一。enum 名も短縮：`PersonalityTrait` → `Personality`、`BackgroundTag` → `Background`、`RelationshipToProtagonist` → `Relationship`。`DramaState.currentLocation` → `location`。 |
| 1 (改訂) | 2026-04-21 | 単一の `agent-protocol.md`（828 行）を `docs/agent-protocol/` ディレクトリの 5 ファイルに分割：`README.md`（概要・§1-3）、`messages.md`（§4 メッセージ型）、`enums.md`（全 enum リファレンス）、`operations.md`（§5-8 実行モデル）、`roadmap.md`（§9-11 ロードマップ・非目標・変更履歴）。enum 値定義を `enums.md` に集約することで `messages.md` の構造定義に集中できるようにした。クロス参照は相対リンクで接続。 |
| 1 (改訂) | 2026-04-21 | **v1 の自由文入力を `personaNote` 1 箇所に絞り込み**。`DramaBrief.genre.subgenre` / `DramaBrief.notes` / `CharacterSpec.ageNote` / `raceNote` / `occupationNote` / `speechStyleNote` / `relationshipNote` を全て削除。enum でカバーしきれない情報は全て `personaNote` に集約する方針に変更（enum 化を徹底することで WebUI のセレクト入力に素直に載る）。`title?` と機能上の任意フィールド（`narrator?`、`occupation?` / `attributes?` / `background?` の任意 enum、`sceneContext?` / `flashbackViewpointAlias?` 等）は据え置き。 |
| 1 (改訂) | 2026-04-21 | **デモ版としてユーザー入力をさらに削減**。`DramaBrief.setting` ブロック（worldTime / season / weather / location）を全削除し、Editor の **初期化フェーズ（§6.0 新設）** で `genre` + `tone` から自動生成する方針に変更。`location` は型として特別に構造化せず、`DramaState.location` / `Beat.sceneContext.location` は単なる `string` のまま（Editor と Writer のやり取りで具体的な教室名等を育てていく）。併せて `genre.tone: string` を `Tone` enum（9 種：lighthearted / humorous / uplifting / dreamy / bittersweet / melancholic / serious / intense / dark）に置換し、最後の自由文設定項目も enum 化。これで v1 のユーザー入力はキャラクター定義と ending 選択に実質集約された。 |
| 1 (改訂) | 2026-04-21 | **ロール名を出版業界慣習に合わせて改名**。旧 `Writer`（脚本家 + 編集者を兼務していた指揮役）→ `Editor`（編集者）、旧 `Novelist`（小説家）→ `Writer`（作家）。責務・データフローは同じで、メッセージ型名（`DramaBrief` / `DramaBible` / `BeatSheet` / `VdsJson` / `SceneReport` 等）と enum 名は変更しない。Redis キーの `lock:writer` を `lock:editor` に改名。`README.md` の責務分離図・Mermaid 図のラベル、`messages.md` の TOC アンカー、`operations.md` のシーケンス図なども新ロール名に揃える。 |
| 1 (改訂) | 2026-04-21 | `BeatSheet.precedingSummary: string`（全体要約 1 本）を廃止し、`BeatSheet.recentBeats: BeatDigest[]`（直近 5〜10 個の時系列あらすじ）に置換。Editor は `DramaState.recentBeats` の末尾 N 個をそのままコピーすればよい。1 Beat ずつの 1〜2 行要約が順序付きで渡るので、「A と B が雨で濡れた直後に傘を持った C が合流した」のような短期記憶が Writer に正確に伝わるようになる。 |
| 1 (改訂) | 2026-04-21 | v1 の **粒度境界** を §2 設計方針 8 項目目として明文化。User 入力は `DramaBrief` の粒度（ジャンル・トーン・キャラ基本属性・エンディング）に限定し、具体的な教室名・recentBeats のあらすじ・`knownFactsSnapshot` などの細粒度情報は Editor ↔ Writer 間で完結する。Beat 単位のユーザー介入（`/drama nudge` 等）は v2 以降（§9.7）に委ねる。 |
| 1 (改訂) | 2026-04-21 | `DramaBrief` / `DramaBible` をさらにスリム化。**(a)** `cast.protagonist` フィールドを廃止し、`characters` 内で `relationship: 'self'` を持つキャラを主人公として特定する方式に変更（二重管理の解消）。**(b)** `CharacterSpec.race` フィールドを削除し、v1 では全キャラ `human` 固定として扱う。`Race` enum 定義自体は v2（ファンタジー/SF 対応）での復活を見越して `enums.md` に残す。**(c)** `CharacterSpec.traits: Trait[]` → `personality: Personality[]` にリネーム（enum 名も `Trait` → `Personality`）。**(d)** 硬すぎる日本語表現（「機械で突合する」「機械で検証する」）を「Editor のコードで自動検証する」に差し替え、LLM 判断を介さないことを明示。 |
| 1 (改訂) | 2026-04-21 | キャラの一人称・呼称を構造化。`CharacterSpec` に `firstPerson: FirstPerson`（enum 12 種：watashi / watakushi / atashi / boku / ore / uchi / washi / ware / yo / soregashi / name / other）を必須追加し、Writer に一人称の揺れを抑えさせる。併せて `addressOf?: Record<alias, string>` を追加して、他キャラをどう呼ぶか（「ヒロ」「田中先輩」等）を alias キーのマップとして指定できるようにした。固有名詞を含むため `addressOf` の値は v1 の例外として自由文を許容する。`BeatSheet.speakers` にも `firstPerson` / `addressOf` を引き継ぎ、Writer のプロンプトから参照できるようにする。 |
| 1 (改訂) | 2026-04-21 | 敬称パターンを enum 化。`Honorific` enum（9 種：none / san / chan / kun / sama / senpai / sensei / tan / dono）を追加し、`CharacterSpec.defaultHonorific?: Honorific` で「このキャラは他キャラを一律◯◯付けで呼ぶ」を指定できるようにした。Writer の呼称解決順は `addressOf[<alias>]` → `defaultHonorific` + 相手の name → 文脈推測 の順。これにより「エマは全員をちゃん付け」「ヒロは全員を君付け」のようなスタイルが 1 フィールドで済む。`BeatSheet.speakers` にも `defaultHonorific` を引き継ぎ、Writer のプロンプトで enum → 敬称の対応表を明示した。 |
| 1 (改訂) | 2026-04-21 | 二人称代名詞を別概念として分離。`SecondPerson` enum（9 種：kimi / omae / anata / kisama / temae / onushi / sonata / nanji / other）を追加し、`CharacterSpec.secondPerson?: SecondPerson` で「相手の名前を呼ばず代名詞で固定」（例: ヒロがどのキャラも「君（きみ）」と呼ぶ）を表現できるようにした。`defaultHonorific: 'kun'`（名前＋「〜君（くん）」）とは別概念。Writer の呼称解決順を更新：`addressOf[<alias>]` → `secondPerson`（代名詞）→ `defaultHonorific + name` → 文脈推測。`BeatSheet.speakers` と Writer プロンプトにも反映。 |
