# コードレビュー修正計画（2026-07-12）

前提: [`docs/code-review-2026-07-12.md`](../code-review-2026-07-12.md) のレポート。

## 設計思想

- **並列化の判断は「触るファイルが重ならないか」で切る**。同じファイルに複数フィックスが乗るなら 1 エージェント / 1 PR に束ねる
- **P0（データロス・恒久沈黙）は §2 の refactor より先に潰す**。refactor 後にバグが混ざると原因切り分けが辛い
- **フェーズごとに QA エージェント（typecheck/lint/format/commit）で締める**
- 並列エージェントが **異なるファイルを触る** ならワーキングツリーの分離は不要（コミットだけ順にすればよい）。**同じファイル** を弄る可能性が出たときだけ worktree isolation を検討

---

## Phase 0 — Dead-code sweep（並列 2, 低リスク, ~30 分）

削除だけ。ロジック変更なし。他フェーズと独立で走らせて OK。

| Agent | 種別 | スコープ |
|---|---|---|
| A | `refactor` | Bot: `utils/tts.ts` `textToSpeech`, `voice/player.ts` `clearQueue`, `agents/split-cue.ts` 一式, 関連する未使用 `schemas/agent-protocol/*`, `player.ts:161` の重複 `await import('node:stream')` |
| B | `refactor` | Web: `hooks/use-mobile.ts` 重複, `schemas/scenario-seed.dto.ts`, `packages/shared/src/voice-drama.dto.ts` の `LooseVdsJsonSchema`/`LooseCueSchema`, `api/speaker-import.ts` `syncSpeakerSeeds` export, nav 上の `/mockups` エントリ, `estimateEpisodeDuration` の `\|\| 0` |

**締め:** `qa` エージェントで `bun run lint` + typecheck、単一の `chore:` コミット。

---

## Phase 1 — Critical hotfixes（並列 4, 中リスク, ~2 時間）

データロス / 恒久沈黙を最短で塞ぐ。**Phase 2 より前に必ずマージ**。触るファイルが重ならないので全部並列可。

| Agent | 種別 | スコープ | 対象ファイル |
|---|---|---|---|
| A | `backend` | Player キューの復旧性 (§2.1 deadlock, §2.2 error race, §2.5 stale closure) | `workers/bot/src/voice/player.ts` |
| B | `backend` | Connection のリスナー idempotent 化と floating promise (§2.4, §2.6, §2.7 Signalling コメント/挙動不一致) | `workers/bot/src/voice/connection.ts`, `workers/bot/src/events/voice-state.ts` |
| C | `backend` | Redis の破壊的 DEL と JSON.parse 例外 (§3.2, §3.3) | `workers/bot/src/utils/redis.ts`, `workers/bot/src/utils/guild-settings.ts` |
| D | `backend` | Web routes の try/catch と wedge 復旧 (§4.1, §4.2) | `workers/web/src/api/routes/scenarios.ts`, `workers/web/src/api/scenario-episode-generation.ts` |

**注意点:**
- Agent A の Player は Phase 2 でどうせ書き直すが、**refactor 中に壊れると原因切り分け不能** になるので、応急処置として先に入れる価値がある
- Agent D は `/plots` vs `/scenarios` の統廃合とは分離。**動いている両方に try/catch を足すだけ** に留める

**締め:** 4 本並列 → `qa` エージェントで typecheck / lint / **各 PR ごとに** `fix(bot):` `fix(web):` コミット。

---

## Phase 2 — TTS group-queue refactor（単一エージェント, 高リスク, ~半日）

§1 の設計。並列化不可（`PcmAudio` 型変更が全ファイルに波及するため単一 PR）。

### エージェント構成

- **単一の `backend` エージェント** で以下を一気に:
  1. `packages/shared` 側で `PcmAudioMeta` 型を定義（`groupId`, `authorId`, `lineIndex`, `kind: 'tts' | 'vds'`）
  2. `workers/bot/src/utils/tts.ts` の `PcmAudio` にメタを持たせる
  3. `workers/bot/src/voice/player.ts` を **グループキュー実装** に置き換え。`enqueueAudio` → `enqueueLine` にリネーム、Idle ハンドラで「先頭グループの次行が未合成なら他グループを 1 つ差し込む」ルール
  4. `workers/bot/src/events/message.ts` から `Promise.all` を撤去、各行 → 完成し次第 `enqueueLine`。`getCurrentSpeakerId` / `getCurrentSpeakerConfig` の逐次 await も `Promise.all` に
  5. `workers/bot/src/vds/player.ts` の `playStream` をキュー経由に統合（`kind: 'vds'`）
  6. `voice/index.ts` の re-export 見直し
- そのあと **`e2e` エージェント** or 単体テストで
  - 短文 1 通 → 即時再生
  - 100 行の長文 → 1 行目が合成完了した瞬間から再生開始
  - X の途中で Y が入る → X(n) 完了 → Y 全消化 → X(n+1) の順
  - Y の途中でさらに Z が入る → Y 完了 → Z 全消化 → X 再開
  - 1 行の合成失敗 → その行だけスキップ、メッセージ全体は死なない

**締め:** `qa` エージェントで `feat(bot):` コミット。

---

## Phase 3 — Bot correctness cleanup（並列 3, 低〜中リスク, ~2 時間）

Phase 2 の TTS リファクタと並走 OK（触るファイルが被らない）。

| Agent | 種別 | スコープ | 対象ファイル |
|---|---|---|---|
| A | `backend` | Redis 更新の原子化（ユーザー単位 `Map<key, Promise>` シリアライザ） (§3.1) | `workers/bot/src/utils/redis.ts`, `workers/bot/src/utils/guild-settings.ts` |
| B | `backend` | Config コマンドの到達不能分岐 + `addChannelTypes` (§3.4, §3.5) | `workers/bot/src/commands/config.ts` |
| C | `backend` | `play.ts` の `response.ok` チェック, `ready.ts` の登録失敗 notifier, `notifier.ts` の POST 結果チェック (§3.5) | `workers/bot/src/commands/play.ts`, `workers/bot/src/events/ready.ts`, `workers/bot/src/utils/notifier.ts` |

**衝突リスク:** Agent A は Phase 1 の Agent C（`redis.ts` の破壊的 DEL 修正）と **同じファイル**。**Phase 1 完了後** に Phase 3 を開始する必要あり（Phase 2 とは並走可）。

**締め:** `qa` エージェントで `fix(bot):` × 3 コミット。

---

## Phase 4 — Web cleanup（部分並列, ~半日, ブロッカー1件）

### ブロッカー: `/plots` vs `/scenarios` 統廃合

7 ファイル × 2 の重複ルート。**どちらを残すかはドメイン判断が必要**。Phase 4 開始時点で `AskUserQuestion` で確認。

### 並列可能なタスク（決定後）

| Agent | 種別 | スコープ | 対象 |
|---|---|---|---|
| A | `frontend` | ルート統廃合（決定に従って片方削除、nav 整理） | `workers/web/src/routes/plots/**`, `workers/web/src/routes/scenarios/**`, `components/shell/nav-bar.tsx` |
| B | `frontend` | TanStack Query の手書きポーリング → `refetchInterval` 化 (§4.4) | `workers/web/src/lib/scenarios.tsx` |
| C | `backend` | 型安全性: `scenarios.ts` の status キャストを `z.enum().parse` に、`character-wizard.tsx` の Resolver / Control 二重キャスト解消 (§4.5) | `workers/web/src/api/routes/scenarios.ts`, `workers/web/src/components/character-wizard.tsx` |
| D | `backend` | セキュリティ設定: rate-limit キー, CORS origin, `syncSpeakers()` を起動 hook 化 (§4.6) | `workers/web/src/app.ts` |
| E | `refactor` | 重複コード: `chapter-planner.ts` / `chapter-episode-writer.ts` の `getClient` 統合, `EpisodeScriptSchema` と `buildEpisodeCueSchema` の cue 検証統合, `lib/vds.ts` のサーバ import 剥がし (§4.8, §4.9) | `workers/web/src/api/chapter-planner.ts`, `workers/web/src/api/chapter-episode-writer.ts`, `workers/web/src/lib/vds.ts` |

**衝突リスク:**
- Agent A（ルート統廃合）と Agent B は同じディレクトリ内でファイルが被り得るので **A 完了後に B**
- Agent C と Phase 1 Agent D（`scenarios.ts` try/catch）は **同ファイル**。Phase 1 が先に merge されていれば Agent C は rebase で吸収可能

**締め:** `qa` エージェントで `refactor(web):` `fix(web):` の複数コミット。

---

## 依存グラフ

```
Phase 0 ─┐
         │
Phase 1 ─┼─→ Phase 2 (TTS refactor)
         │       │
         │       └─→ (Phase 2 終了後にリグレッションテスト)
         │
         ├─→ Phase 3 (Bot cleanup, Phase 2 と並走可)
         │
         └─→ Phase 4 (Web cleanup, ブロッカー解消後)
```

- Phase 0 は完全独立、いつ走らせても良い
- Phase 1 は Phase 2/3/4 の前提
- Phase 2 と Phase 3 は互いに並走可能
- Phase 4 の Agent C だけ Phase 1 の Agent D 完了に依存

---

## 想定合計

- Phase 0: ~30 分（並列 2）
- Phase 1: ~2 時間（並列 4）
- Phase 2: ~4 時間（単一）
- Phase 3: ~2 時間（並列 3）
- Phase 4: ~4 時間（並列 4、ブロッカー解消後）

Phase 1 と Phase 2 を **必ず順に**、Phase 3/4 は Phase 2 と並走 → **実時間で ~7 時間程度** に圧縮可能。

---

## 運用メモ

- **各フェーズ末尾で `qa` エージェント必須**。コミットは commitlint 準拠のプレフィクスで（`fix(bot):`, `feat(bot):`, `refactor(web):`, `chore:`）
- 並列エージェントに worktree isolation を付けるかどうか: **同じファイルを触るペアが並列で走る場合のみ** 付ける。今回の計画では各フェーズ内で衝突が起きないよう分けたので、基本 **isolation なし** で OK
- Phase 2 は blast radius が大きいので、**先に Phase 1 で応急処置** → その後 refactor、が黄金順
- リグレッションテスト: Phase 2 完了後に `e2e` エージェントで TTS 経路の主要ケースを回すか、`workers/bot/__tests__/` に新規テストを追加
