# Work Plan: PostgreSQL → SQLite Migration

Date: 2026-04-24

## Goal

packages/web のデータベースを PostgreSQL から SQLite に移行し、Cloudflare Workers (D1) で動作可能にする。

## Tasks

### Backend

- [x] `packages/web/prisma/schema.prisma`: provider を `postgresql` → `sqlite` に変更
- [x] `packages/web/prisma/schema.prisma`: 3つの enum (`ScenarioStatus`, `ChapterStatus`, `CueKind`) を削除し String フィールドに変換
- [x] `packages/web/prisma/schema.prisma`: 5つの配列カラム (`personalityTags`, `attributeTags`, `backgroundTags`, `sampleQuotes`, `genres`) を `String` (JSON) に変換
- [x] `packages/web/prisma/schema.prisma`: 2つの JSONB カラム (`vdsJson`, `synthOptions`) を `String?` に変換
- [x] `packages/web/prisma/migrations/`: 既存の6マイグレーションを削除し、SQLite互換の初期マイグレーションを生成
- [x] `packages/web/server/db.ts`: `@prisma/adapter-pg` → `@prisma/adapter-libsql` に切り替え
- [x] `packages/web/package.json`: `pg`, `@prisma/adapter-pg` を削除、`@libsql/client`, `@prisma/adapter-libsql` を追加
- [x] `packages/web/server/routes/characters.ts`: 配列フィールドの JSON serialize/deserialize 追加
- [x] `packages/web/server/routes/scenarios.ts`: `genres` の JSON serialize/deserialize、`Prisma.ScenarioGetPayload` 型の修正
- [x] `packages/web/server/scenario-episode-generation.ts`: `kind` リテラル値が String 型で動作するか確認（変更不要）
- [x] `packages/web/server/speaker-import.ts`: 配列フィールドの DB 書き込み時に JSON 文字列化
- [x] `packages/web/prisma/scenario-seeds.ts`: `Prisma.JsonNull` → `null` に置換、配列値を JSON 文字列化
- [x] `packages/web/prisma/character-seeds.ts`: 変更不要（Zod経由で検証後にseed関数でstringify）
- [x] `packages/web/prisma/seed.ts`: 変更不要

### Frontend

- [x] `packages/web/lib/scenarios.tsx`: ScenarioStatus/ChapterStatus 型が Prisma enum 非依存であることを確認（変更不要）
- [x] `packages/web/schemas/scenario-seed.dto.ts`: 変更不要（自前の z.enum で独立）
- [x] `packages/web/lib/speaker-import.ts`: 変更不要（API レスポンスは parse 済み配列）

### QA

- [x] `bunx tsc -b --noEmit` で型チェック
- [x] `bunx biome check --write .` でlint/format
- [x] `bunx prisma generate` でクライアント生成確認
- [x] テスト実行: 95 pass, 0 fail
- [x] コミット: `462c64a`

## Execution Order

1. Sequential: Prisma schema 変更 → マイグレーション生成 → クライアント生成
2. Sequential: パッケージ依存関係更新 → DB アダプタ変更
3. Parallel: server routes の serialize/deserialize 追加 + seed ファイル更新
4. Parallel: frontend 型確認 + スキーマ更新
5. Sequential: QA (型チェック → lint → ビルド → コミット)

## Deliverables

- `packages/web/prisma/schema.prisma`: SQLite 対応スキーマ
- `packages/web/prisma/migrations/20260424100000_init/migration.sql`: SQLite 初期マイグレーション
- `packages/web/server/db.ts`: libsql アダプタ対応
- `packages/web/server/json-fields.ts`: 配列フィールドの JSON serialize/deserialize ヘルパー
- 各 server route: JSON serialize/deserialize レイヤー追加

## Risks / Notes

- `better-sqlite3` は Bun 非対応のため `@prisma/adapter-libsql` を採用
- 本番 Workers では `@prisma/adapter-d1` への切り替えが必要（将来対応）
- 既存の PostgreSQL データは手動 ETL が必要（今回のスコープ外）
- `Prisma.JsonNull` は SQLite では不要になるため `null` に置換済み
