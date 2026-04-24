# Work Plan: VDS v1 仕様確定 + Annotation対応 + OpenAPIクライアント再生成

Date: 2026-04-24

## Goal

1. irodori-tts の更新済み openapi.json から Zodios クライアントを再生成する
2. VDS/VDS-JSON を v1 正式仕様（docs/irodori-tts-api.md）に準拠させる
3. Annotation（Shortcode）システムを実装し、LLM がセリフ生成時に活用できるようにする

## Tasks

### Shared Package (packages/shared)

- [ ] 1-1. openapi.json から Zodios クライアントを再生成 (`irodori-api.ts`)
- [ ] 1-2. `SpeakerRefSchema` に `type` discriminator を追加 (`{ type: "lora", uuid }` | `{ type: "caption", caption }`)
- [ ] 1-3. `SceneCueSchema` を追加 (`{ kind: "scene", name: string }`)、CueSchema/LooseCueSchema に統合
- [ ] 1-4. `VdsDefaultsSchema` を新設 (`VdsSynthOptionsSchema` + `gap` フィールド)、VdsJsonSchema の defaults を差し替え
- [ ] 1-5. Shortcode モジュール新規作成 (`shortcode.ts`): 39種の shortcode→絵文字マッピング + `expandShortcodes()` 関数
- [ ] 1-6. package.json に `./shortcode` エクスポートを追加

### Web Package (packages/web)

- [ ] 2-1. `lib/scenarios.tsx`: `SceneCue` 型を追加し `Cue` union に統合
- [ ] 2-2. `lib/vds.ts`: SpeakerRef の構築を `type` 付きに更新、scene cue のシリアライズ対応、gap の defaults シリアライズ
- [ ] 2-3. `schemas/scenario-api.dto.ts`: scene cue を ScenarioApiCueSchema に追加
- [ ] 2-4. `server/chapter-episode-writer.ts`: EpisodeCueSchema に scene cue 追加
- [ ] 2-5. `server/templates/chapter-episode-system-instruction.hbs`: shortcode 一覧と使用ルールを追加
- [ ] 2-6. Prisma: `CueKind` enum に `scene` 追加、`ScenarioCue` に `sceneName` フィールド追加、マイグレーション実行

### Bot Package (packages/bot)

- [ ] 3-1. `agents/writer.ts`: SYSTEM_INSTRUCTION の SpeakerRef 例を `type` 付きに更新、shortcode の使用指示を追加
- [ ] 3-2. `utils/tts.ts`: 合成前に `expandShortcodes()` でテキスト展開を適用

### Tests

- [ ] 4-1. `packages/bot/__tests__/voice-drama.test.ts`: SpeakerRef を `type` 付きに更新、scene cue テスト追加
- [ ] 4-2. `packages/web/__tests__/vds-export.test.ts`: 新 SpeakerRef/scene cue/gap のテスト更新
- [ ] 4-3. `packages/shared` に shortcode.test.ts を新規追加
- [ ] 4-4. 既存テストファイル全体の SpeakerRef フィクスチャ更新

### QA

- [ ] 5-1. `bunx tsc -b --noEmit` (型チェック)
- [ ] 5-2. `bunx biome check` (lint + format)
- [ ] 5-3. `bun test` (テスト実行)
- [ ] 5-4. コミット

## Execution Order

1. **Sequential**: 1-2 → 1-3 → 1-4 (shared schema 変更、依存順)
2. **Parallel with step 1**: 1-1 (OpenAPI クライアント再生成)、1-5 + 1-6 (shortcode モジュール)
3. **Sequential after step 1**: 2-6 (Prisma migration)
4. **Parallel after step 1-3**: 2-1, 2-2, 2-3, 2-4, 3-1, 3-2
5. **After step 1-5**: 2-5 (template に shortcode 一覧)
6. **After all above**: 4-1 〜 4-4 (テスト更新)
7. **Final**: 5-1 〜 5-4 (QA)

## Key Design Decisions

### SpeakerRef の `type` discriminator
旧: `{ uuid: string }` | `{ caption: string }` (shape で判別)
新: `{ type: "lora", uuid: string }` | `{ type: "caption", caption: string }` (discriminatedUnion)
→ 全消費箇所で `'uuid' in speaker` → `speaker.type === 'lora'` に変更

### Gap フィールドの配置
`gap` は defaults 専用（per-cue options には不要）→ `VdsDefaultsSchema = VdsSynthOptionsSchema.extend({ gap })` を新設

### Shortcode 展開タイミング
パース時に展開。`expandShortcodes(text)` で `{whisper}` → `👂` のように絵文字に変換。未知 shortcode はそのまま残す。

### Scene cue の DB 保存
Prisma `CueKind` enum に `scene` を追加。`ScenarioCue.sceneName` (nullable) に scene 名を格納。

## Risks / Notes

- SpeakerRef の `type` 追加は破壊的変更。全テストフィクスチャの更新が必要
- Bot の writer.ts は LLM に VDS-JSON を出力させるため、system instruction の SpeakerRef 例を更新しないと `type` フィールドが生成されない
- Shortcode の絵文字マッピングは HuggingFace の EMOJI_ANNOTATIONS.md 準拠（全39種）
- Prisma migration が必要（enum 追加 + nullable フィールド追加なので安全）
