# コードレビューレポート（2026-07-12）

Fable による横断レビューの結果。主眼は **TTS 読み上げの遅延（`Promise.all` バッチ合成）** と、それを直すときに巻き込む周辺の破綻。あわせて、bot / web / shared を通しての気になる点をまとめる。

対象コミット: `master @ f3ea7fa` 相当（作業ツリー上の変更あり）。

---

## 1. 最優先: 長文メッセージで TTS 読み上げが遅延する

### 現状

`workers/bot/src/events/message.ts:39-54`

```ts
const lines = preprocessMessageForTts(message.content)
  .split('\n')
  .map((line) => preprocessForTts(line))
  .filter((line): line is string => line !== null)

// …
const audioStreams = await Promise.all(
  lines.map((line) => textToSpeechWithSettings(line, speakerId, speakerConfig))
)
for (const audioStream of audioStreams) {
  enqueueAudio(guildId, audioStream, connection)
}
```

コメントに「逐次合成だと行間に他ユーザーが割り込む」とあるとおり、**話者混在を防ぐために全行を `Promise.all` で待ち切ってからまとめてキュー投入**している。結果:

- 100 行のメッセージだと、100 行分の合成が終わるまで **1 音たりとも鳴らない**
- 合成の 1 リクエストでも失敗すると `Promise.all` が拒否され、**そのメッセージまるごと落ちる**
- 「同じユーザーの発話がひとかたまりで流れる」という不変条件は、この **同期的な push ループの原子性だけ** に依存している

`enqueueAudio`（`workers/bot/src/voice/player.ts:127-137`）側に話者情報が入ってこない設計なので、キューは「順番に鳴らす」以上の判断ができない。

### ユーザー提案の再確認

「サブメッセージに話者情報を持たせ、行単位で逐次キュー投入。**別ユーザーの発話は、走っているメッセージの行と行の間になら割り込ませてよい。ただし 1 行の途中では絶対に切らない**」

すなわち:

- ✅ 即時再生（先頭行が合成でき次第すぐに鳴る）
- ✅ 話者混在なし（同時発声は起きない）
- ✅ 割り込みは行の境界だけで発生

これは実現可能。設計上のポイントを以下にまとめる。

### 提案する設計

**A. `PcmAudio` にメタデータを持たせる**

`workers/bot/src/utils/tts.ts:5-8`:

```ts
export interface PcmAudio {
  buffer: Buffer
  sampleRate: number
  // 追加:
  groupId: string   // 同じメッセージから派生した行をまとめる（message.id を使う）
  authorId: string  // ユーザー識別用（同一話者判定・優先度制御に使う）
  lineIndex: number // 順序保証用（out-of-order 合成完了に備える）
}
```

`authorId` ではなく **`message.id` を group キーに使う** のが要点。同じユーザーが立て続けに 2 通投げた場合、`authorId` で括ると 2 通目が 1 通目に飲まれて実質「同一メッセージ扱い」になり、割り込みが効かなくなる。

**B. キューを「グループ単位」で管理する**

```ts
type Group = {
  groupId: string
  authorId: string
  lines: PcmAudio[]   // lineIndex 昇順の投入待ち
  nextExpected: number
}

const guildPlayers = new Map<string, {
  player: AudioPlayer
  groups: Group[]     // FIFO: 先頭が現在再生中のグループ
  isPlaying: boolean
}>()
```

- `enqueueAudio` は `(guildId, audio)` を受け取り、`groups` から `groupId` 一致のエントリを探す。あれば `lines` に足すだけ。無ければ **末尾に新規グループを push**
- 「合成が終わった順に足す」だけなので、`message.ts` 側は `Promise.all` を外して各行 → 完成し次第 `enqueueAudio` を呼べる

**C. 再生ループはグループ先頭から順に**

Idle ハンドラで:

1. 先頭グループの `lines[nextExpected]` が **すでにあれば** それを再生 → `nextExpected++`
2. まだ無ければ（合成待ち）、**先頭グループを保持したまま何もしない**。合成が到着したら `enqueueAudio` 側で「Idle かつこのグループが先頭かつ求める行が来た」を検出して再生を蹴る
3. 先頭グループの全行を鳴らし終わったら shift、次のグループへ

この「先頭グループを固定 → 行が届き次第流す」構造が、**話者混在を防ぎつつ即時性を出す** キモ。

**D. 割り込みは「行の切れ目」でしか発生しない**

上の設計だと、ユーザー Y のメッセージが `groups` の 2 番目以降に積まれるのは自然だが、それが再生されるのは **X のグループが完了したあと**。ユーザー提案の「X(50) → Y(1) → X(51)」を実現するには追加のルールが要る:

> `Idle` になった瞬間、X の次の行 `X(51)` がまだ合成中 かつ Y の合成済み行がキューにあるなら、**先に Y を消化してから X に戻る**

これを入れると:

- X の途中で沈黙が挟まらない（X の合成が間に合っている限り）
- X の合成が詰まった瞬間だけ Y を「間奏」として鳴らす
- ただし Y を **鳴らし始めたら Y のグループを最後まで通す**（Y の途中で X には戻さない）

ユーザーの意図に一番近いのは この「Idle 待ちのタイミングだけ他グループを差し込める」バリアント。実装は `Idle` ハンドラで「先頭グループの次行があるか？無ければ次に消化可能な行を持つ別グループを探して1グループ再生」の分岐を1つ足すだけ。

**E. 部分失敗の扱い**

`Promise.all` を外すので、行ごとに `try/catch` して失敗した行だけスキップできる。今のように **メッセージまるごと落とす** 挙動から解放される。失敗行が多いとき用に「1 グループで X% 失敗したらグループ丸ごとスキップして notifier に通知」等の閾値は入れておくと安全。

### 派生する影響

- `getCurrentSpeakerId` と `getCurrentSpeakerConfig` は `message.ts:46-47` で **逐次 `await`** されてるので `Promise.all([...])` で並行化する。ついでに **同じユーザー設定を 2 回取りに行く二度読み** も直せる（`workers/bot/src/utils/redis.ts:139-142` の `getCurrentSpeakerConfig` が内部で `getUserSettings` → `getSpeakerConfig` を再度回している）
- `enqueueAudio` はもはや「1 個ずつ」ではなくなるので、名前を `enqueueLine` などに寄せた方が読みやすい

---

## 2. Voice / Player レイヤーの深刻な既存バグ

TTS の設計を変える前に、**現状のキューがすでにおかしい** 点を潰しておく必要がある。

### 2.1 キュー・デッドロック（Priority: 高）

`workers/bot/src/voice/player.ts:107-114`

`playAudio` が `entersState(Ready, 5s)` でタイムアウトすると **`isPlaying = true` のまま return** する。以降の `enqueueAudio` は全部 `queue.push` の側に流れ、Player は Idle のままなので **Idle ハンドラも二度と発火しない**。ギルドの読み上げが恒久的に沈黙する。

同様に `player.ts:101-105` の `Destroyed` 早期 return を **Idle ハンドラ経由** で踏むと（`player.ts:65`）、キューの残りが宙に浮く。

**修正案:** 早期 return する分岐で `isPlaying = false` に戻し、次の呼び出しで再挑戦できるようにする。あるいはグループ設計に載せ替える段で「先頭グループが再生不能なら次を試みる」ロジックに組み替える。

### 2.2 プレイヤーエラー時の踏みつぶし race

`player.ts:72-85`

エラーハンドラが `isPlaying = false` にしてから **フラグを立て直さずに** 次の `playAudio` を蹴る。その瞬間に別スレッドから `enqueueAudio` が来ると、`isPlaying === false` を見て **もう 1 本 `player.play()` を呼ぶ** ため、直前に始まった音源が上書きされて途切れる。

**修正案:** 次を再生する前に `isPlaying = true` を戻すか、状態遷移を単一のヘルパに集約する。

### 2.3 `playStream` がキューを完全に無視

`player.ts:139-195`（呼び出し元: `workers/bot/src/vds/player.ts:36`）

キューを見ずに `player.play(resource)` を直接叩くので、**enqueueAudio 経由で再生中の TTS を強制切断する**。しかも自分の完了通知（`onIdle` の resolve）と、グローバル Idle ハンドラの「次を鳴らす」が同じ Idle イベントに乗るため race する。

**修正案:** VDS 再生もキューに乗せる。TTS と VDS で別優先度が要るなら、それこそ **メタデータ付き PcmAudio** の設計に統一で押し込める（`kind: 'tts' | 'vds'` を持たせて優先度ルールを書く）。

### 2.4 チャンネル移動時のリスナー蓄積

`workers/bot/src/events/voice-state.ts:40-41` は「チャンネル移動 = destroyPlayer → connectToChannel」の流れだが、`joinVoiceChannel` は同一 guild の既存 connection を返すため、`setupConnectionRecovery`（`connection.ts:32, 48`）が **同じ connection に対して 2 度目のリスナー登録** を行う。移動を繰り返すたびに Disconnected / Destroyed ハンドラが増殖し、`notifyError` の多重発火や二重 destroy が起きる。

**修正案:** `setupConnectionRecovery` を idempotent にする（登録済みフラグ、または `removeAllListeners` 後に付け直す）。

### 2.5 stale closure による接続向け先ずれ

`getOrCreatePlayer`（`player.ts:65, 81`）のハンドラは **初回作成時の `connection`** をクローズオーバーする。再接続後、Map エントリが destroy されずに残るケースだと、**古い connection に向けて `playAudio` を呼び続ける**。

**修正案:** ハンドラ内で毎回 `getConnection(guildId)` を再取得するか、`guildPlayers` のエントリに現在の connection 参照を持たせて上書き可能にする。

### 2.6 floating promise

`workers/bot/src/events/message.ts:53` および `voice-state.ts:75, 90` で `enqueueAudio` を `await` していない。`playAudio` からの reject が **周囲の try/catch を素通りして unhandled rejection** になる。

**修正案:** `void enqueueAudio(...)` にするか、キューへの投入自体は同期化してエラー通知を分離する。

### 2.7 その他

- `connection.ts:53-54`: コメントは「Signalling を待つ」だが実際は `Connecting` を待っている。Discord 4014 の標準対応は **Signalling OR Connecting** を待つ。今の実装だとチャンネル移動の一部で誤タイムアウト → 接続破棄になり得る
- `player.ts:161` の `await import('node:stream')` は無意味（同ファイル冒頭で `Readable` を静的 import 済み）
- `player.ts:14-38` の WAV ヘッダの `dataSize + 36` は表記として誤解を招く（意図は「オーバーライドで巨大にしておく」だが定数の意味が読めない）
- 未使用エクスポート: `utils/tts.ts:40` `textToSpeech`、`player.ts:197` `clearQueue`

---

## 3. Bot コマンド / ユーティリティ層

### 3.1 Redis 更新の非原子性（Priority: 中）

- `utils/redis.ts:90-94, 114-131` と `utils/guild-settings.ts:51-55` は「get → mutate → set」を **WATCH/ロックなし** に実行している。同一ユーザーからのコマンドが並列で走ると **後勝ちで更新が消える**
- 対策: `WATCH/MULTI/EXEC` か、少なくともユーザー単位の `Promise` チェーン（Map<userId, Promise> でシリアライズ）

### 3.2 破壊的な読み取り（Priority: 高）

`utils/redis.ts:55` `getUserSettings` は **schema parse に失敗するとその場でユーザー設定を DEL する**。将来スキーマを絞ったときに **既存ユーザー全員の設定を初回読み取りで消し飛ばす** 地雷。getter が副作用で消すのは危険。

- 対策: 失敗時はデフォルト値を返すだけに留め、ログか notifier で不整合を報告する。マイグレーションは明示的に。

### 3.3 未処理の `JSON.parse` 例外

`utils/redis.ts:51` と `utils/guild-settings.ts:27`。Redis に非 JSON が入っていると **`safeParse` に届く前に throw**。フォールバック経路が意味を成さない。

- 対策: `JSON.parse` を try/catch でラップして「壊れていたらデフォルト」に落とす。

### 3.4 到達不能な分岐（Priority: 中）

`commands/config.ts:127-135`。オプションが 1 つでも渡されていれば `channels.length > 0` が常に真になるため、`channelIds.length === 0` で「全チャンネルにリセット」する分岐に **絶対に入らない**。ユーザーは `readChannels` を明示クリアできない（`reset` サブコマンドを叩くしかない）。

- 対策: 「クリア用のサブコマンド or 明示フラグ」を追加、もしくは 0 個渡し = クリア を有効にする。

### 3.5 その他

- `commands/play.ts:53-54`: 添付ファイル fetch に `response.ok` チェックなし。404 / HTML が返ると `.json()` で throw して汎用エラーに丸められる
- `commands/config.ts:32-36`: `addChannelTypes` 未指定。ボイスチャンネルやカテゴリを read channel として保存できてしまう
- `events/ready.ts:12-14`: コマンド登録失敗が console のみ。**古いコマンドのまま bot が起動** しても誰も気づかない → `notifyError` に流すべき
- `utils/notifier.ts:47-51`: Webhook POST の戻り値をチェックしていない。Discord 4xx が握り潰される
- `agents/split-cue.ts` はどこからも import されていない **完全な dead code**（`schemas/agent-protocol/*` も同様）。`splitText` の再帰にはサロゲートペア分割リスクあるが、生きていないので急ぎではない
- `let` 使用: 対象ファイル内には **なし**（プロジェクト規約は満たされている）

---

## 4. Web / Shared

### 4.1 例外がハンドラを突き抜けて 500 化（Priority: 高）

`workers/web/src/api/routes/scenarios.ts`

- `toScenarioApi` は throw する（`:195-207`）が、呼び出し側（`:281, 322, 434, 531, 658, 745`）は try/catch なし。書き込み成功後の再フェッチで null → throw → generic 500、ロールバック信号も出ない
- `/chapter-plan`（`:550`）だけ try/catch がある。整合性がない

### 4.2 世代生成が「wedge（詰まる）」

`scenarios.ts:645` の `void runScenarioEpisodeGeneration(...)`。catch 節が `persistFailedEpisodeGeneration`（`api/scenario-episode-generation.ts:143`）を呼ぶが、これ自体が reject 可能（DB down 等）→ unhandled rejection、chapter は `generating` のまま **恒久的にロック**。二重トリガー防止のガードも無し。

- 対策: 最外殻を必ず try/catch し、`finally` で状態を必ず更新。あわせて chapter に対して「進行中フラグ」を CAS 的に立てる。

### 4.3 ルート二重化

`routes/plots/` と `routes/scenarios/` がそれぞれ 7 ファイルずつあり、内容が乖離している（`StatusBadge` が scenarios にはあるが plots には無い等）。Nav（`components/shell/nav-bar.tsx:24`）は `/plots` しか繋げていないので、`/scenarios` は到達不能ながら **コンパイル対象** として存在し続けている。

- どちらが正典か決めて片方を削るのが最優先。読み手の負荷が高すぎる。

### 4.4 TanStack Query の作法違反

`lib/scenarios.tsx` の `useScenarioPolling` / `useSuspenseResolvedScenario`（~240-345 行）が `useEffect` + `window.setInterval` + `refetch()` で手書きポーリングしている。**`refetchInterval` オプションを使うのが正解**。今の実装は非アクティブタブでも回り続け、フックが 2 つマウントされると setInterval が 2 本走る。

### 4.5 型安全性

- `scenarios.ts:108, 232` で DB の生 status を union 型へ **`as` キャスト**。壊れた値が入っても型が守ってくれない → `z.enum(...).parse` を挟む
- `components/character-wizard.tsx:601, 613, 639, 699, 708, 714` の `as Resolver` / `as CharacterFormValues` / `control as unknown as Control<CharacterFormValues>` の連発。ジェネリクスの不一致を型で押し切っているので、フォームスキーマ変更時に **コンパイルは通るが実行時に壊れる**

### 4.6 セキュリティ / 構成

- `app.ts:31`: rate limiter のキーが **偽装可能な `x-forwarded-for`** そのまま。信頼できる proxy hop 数を数えたキーに
- `app.ts:18`: CORS origin が `http://localhost:3000` ハードコード。環境変数化を
- `app.ts:9`: `syncSpeakers().catch(...)` を **モジュール ロード時に副作用実行**。テストや import 時に走る。起動 hook に移すべき

### 4.7 dead / 重複

- `hooks/use-mobile.ts` と `hooks/use-mobile.tsx` が **バイト一致の重複**（片方しか解決されないが両方コミットされている）
- `schemas/scenario-seed.dto.ts` は import 元ゼロ
- `packages/shared/src/voice-drama.dto.ts:131-168` の `LooseVdsJsonSchema` / `LooseCueSchema` はリポジトリ内で未使用
- `syncSpeakerSeeds`（`api/speaker-import.ts:326`）は export されているが呼び出しなし
- `/mockups` ルートが nav に残っている（`nav-bar.tsx:28`）
- `estimateEpisodeDuration`（`api/chapter-episode-writer.ts:259`）に無意味な `|| 0`

### 4.8 レイヤリング

- `api/routes/scenarios.ts:26-51` は **Tailwind のクラス名をサーバ側で生成して API 経由で返している**。表示ロジックがサーバに漏れている
- `lib/vds.ts:8` が **クライアントからサーバ側 `@/api/ruby-replacer` を import**。バンドルに server-only コードが混入するリスク
- `workers/web` を名乗るが実体は **Node サーバ**（`index.ts` で `@hono/node-server`、Prisma pg、`node:fs` を使用）。Cloudflare Workers ではない。名前と実体の乖離が新規参加者を混乱させる

### 4.9 重複コード

- `api/chapter-planner.ts:12-38` と `api/chapter-episode-writer.ts:20-30, 193-212` に **同一の `getClient`/env/cache 実装**
- Cue 数バリデーションが `EpisodeScriptSchema` と `buildEpisodeCueSchema` の 2 箇所に。`parseEpisodeScript` は alias 検証をスキップするので、**呼び出し側が `validateEpisodeCues` を忘れると素通り**

---

## 5. 優先度サマリ

| # | 項目 | 場所 | 影響 |
|---|---|---|---|
| P0 | TTS バッチ合成 → 長文遅延 | `events/message.ts:39-54` | UX |
| P0 | Player キュー・デッドロック | `voice/player.ts:107-114` | 恒久沈黙 |
| P0 | `getUserSettings` が破壊的 DEL | `utils/redis.ts:55` | データロス |
| P0 | Web ルーテナントスルー例外 | `api/routes/scenarios.ts` 多数 | 500 多発 |
| P1 | `playStream` がキュー無視 | `voice/player.ts:139` | TTS ぶつ切り |
| P1 | プレイヤーエラー時の踏みつぶし | `voice/player.ts:72-85` | 再生欠落 |
| P1 | Web 世代生成 wedge | `scenarios.ts:645` | Chapter ロック |
| P1 | ルート `/plots` `/scenarios` 二重化 | `workers/web/src/routes/` | 保守崩壊 |
| P2 | チャンネル移動でリスナー蓄積 | `voice-state.ts:40-41` | 通知多発 |
| P2 | Redis 更新の非原子性 | `redis.ts` `guild-settings.ts` | 更新ロス |
| P2 | TanStack 手書きポーリング | `lib/scenarios.tsx` | パフォーマンス |
| P3 | dead code / 重複ファイル / 未使用 export | 各所 | 認知負荷 |

---

## 6. 推奨する着手順

1. **P0: Player の恒久沈黙とデータ DEL** — 一発でユーザーに損害が出る。数十行の修正で潰せる
2. **P0: TTS を「グループ単位キュー」に載せ替え** — 本レポートの §1 の設計。`PcmAudio` にメタを持たせ、`enqueueAudio` を `enqueueLine` にリネームしつつ、`playStream`（VDS）もこの経路に統合
3. **P0: Web routes の try/catch と `finally` での状態解放** — 詰まった chapter の復旧手段も同時に用意
4. **P1: `playStream`・エラーハンドラの整理、connection listener の idempotent 化**
5. **P1: `/plots` と `/scenarios` の統廃合方針を決める**
6. **P2 以降**: 順次
