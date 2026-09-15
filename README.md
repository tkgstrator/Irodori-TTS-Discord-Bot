# Irodori-TTS

[Irodori-TTS](https://github.com/Aratako/Irodori-TTS) を軸にした音声合成プロダクト群のモノレポ。Bun ワークスペースで管理している。

## リポジトリ構成

このリポジトリには 2 つのアプリと 1 つの共有パッケージが同居している。

| パッケージ | 場所 | 内容 |
|---|---|---|
| **Discord Bot** | `workers/bot/` | Discord の VC でメッセージを [Irodori-TTS](https://github.com/Aratako/Irodori-TTS) 読み上げする Bot。本リポジトリの中心プロダクト |
| **Plotmaker (開発中)** | `workers/web/` | ボイスドラマ / VDS スクリプトを作るための創作支援 Web アプリ。プロット / キャラクター / チャプター / エピソードの管理と LLM 支援での本文生成を担う。将来的に Bot と VDS 経由で接続予定 |
| **shared** | `packages/shared/` | 両アプリで共有する Zod スキーマ・DTO・VDS 定義 |

以下は主に **Discord Bot** についての説明。Plotmaker については [Plotmaker (workers/web)](#plotmaker-workersweb) セクションを参照。

## Discord Bot の概要

- テキストメッセージを音声合成して VC で読み上げ
- 改行区切りで逐次合成・再生（1 行目が合成でき次第すぐ再生開始、話者混在なしの FIFO）
- LoRA ベースの話者切替（UUID 識別）とサンプリングパラメータのユーザー単位カスタマイズ
- ギルド単位の読み上げ挙動設定（VC外ユーザー読み上げ、入退出アナウンス、対象チャンネル絞り込み）
- Redis による設定の永続化（同一キーへの並行更新はプロセス内でシリアライズ）
- ボイス接続の自動復旧・エラー時の Discord Webhook 通知
- ボイスドラマ入力フォーマット [VDS](docs/voice-drama-format.md) の仕様定義（将来の拡張）

## 技術スタック

- **Runtime**: [Bun](https://bun.com)
- **言語**: TypeScript
- **Linter / Formatter**: [Biome](https://biomejs.dev/)
- **主要ライブラリ**:
  - [discord.js](https://discord.js.org/) — Discord API クライアント
  - [@discordjs/voice](https://discordjs.guide/voice/) — 音声機能
  - [Zod](https://zod.dev/) — スキーマバリデーション
  - [ioredis](https://github.com/redis/ioredis) — Redis クライアント
  - [@zodios/core](https://www.zodios.org/) — Irodori-TTS 用型付き HTTP クライアント
- **音声合成**: [Irodori-TTS](https://github.com/Aratako/Irodori-TTS)

## 前提条件

- Docker / Docker Compose
- **NVIDIA GPU + nvidia-container-toolkit**（CUDA 構成で `irodori-tts` を同一ホストに立てる場合。CPU 構成では不要）
- Discord Bot トークン
  - [Discord Developer Portal](https://discord.com/developers/applications) でアプリ作成・Bot を登録
  - 必要権限: `Send Messages`, `Connect`, `Speak`, `Use Voice Activity`
  - Privileged Gateway Intents: `MESSAGE CONTENT INTENT` を有効化

## セットアップ

### 1. Irodori-TTS の設定ファイルと LoRA を用意

> CUDA 構成でのみ必要。CPU 構成は `irodori-tts` サイドカーを起動しないため、この手順は不要。

`.devcontainer/cuda/compose.yaml` は Irodori-TTS サーバをバインドマウントで起動する構成になっているため、次の2つを用意する。

```
.devcontainer/configs/config.yaml   # Irodori-TTS の設定ファイル
.devcontainer/models/               # ベースモデルと LoRA の配置先
  LoRA/
    <speaker>.safetensors           # PEFT エクスポート済み LoRA
```

> **Warning:** `config.yaml` を置かずに起動すると、Docker がバインドマウント先を**ディレクトリとして自動生成**する。`irodori-tts` は `ERROR: TTS_CONFIG not found` で exit 1 し、`depends_on` で待っている `app` ごと起動に失敗する。その場合は root 所有で作られた `.devcontainer/configs/config.yaml/` を `sudo rm -rf` してから置き直す。

`.devcontainer/configs/config.yaml` の最小例:

```yaml
base_checkpoint: models/Irodori-TTS-500M-v2/model.safetensors
base_hf_repo: Aratako/Irodori-TTS-500M-v2
base_hf_filename: model.safetensors

model_device: cuda
codec_device: cuda
model_precision: bf16
codec_precision: fp32
codec_repo: Aratako/Semantic-DACVAE-Japanese-32dim
codec_deterministic_encode: true
codec_deterministic_decode: true
enable_watermark: false

lora_dir: models/LoRA
```

LoRA の書き出しは Irodori-TTS 本体に付属する `scripts/lora/export_lora_to_safetensors.py` を使う。詳細は [Irodori-TTS の README](https://github.com/Aratako/Irodori-TTS) を参照。

> **Note:** `.devcontainer/configs/` と `.devcontainer/models/` は巨大かつ環境依存のため、本リポジトリでは `.gitignore` 対象。コミットしない。

### 2. 環境変数の設定

ルートの `.env.example` をコピーして `.env` を作る。Bot、Dashboard、Web、Prisma、Docker Compose はすべてこのファイルを読み込むため、各ワークスペースに `.env` を作る必要はない。

```bash
cp .env.example .env
```

```env
# Discord Bot トークン（必須）
DISCORD_TOKEN=your_discord_bot_token_here

# Irodori-TTS サーバーの `/v1` まで含むベース URL
IRODORI_TTS_BASE_URL=http://irodori-tts:8088/v1

# API キーを設定した Irodori-TTS サーバーを使う場合
# IRODORI_TTS_API_KEY=your_irodori_tts_api_key

# Irodori-TTS サーバーへ渡すモデル ID
IRODORI_TTS_MODEL=irodori-tts

# デフォルト話者 ID（`GET /v1/audio/voices` の id）
DEFAULT_SPEAKER_ID=sample

# Redis URL
REDIS_URL=redis://redis:6379

# 設定用ダッシュボードの公開 URL（`/config` と Discord OAuth が使う URL）
DOMAIN_URL=https://example.com

# Discord OAuth（Dashboard のログインに必須）
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
# 通常は DOMAIN_URL/api/auth/callback が使われる。別の URL にする場合だけ設定する
# OAUTH_REDIRECT_URI=https://example.com/api/auth/callback

# エラー通知用 Discord Webhook URL（任意）
# ERROR_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

`DEFAULT_SPEAKER_ID` は、Irodori-TTS サーバ起動後に `GET /v1/audio/voices` を呼び出せば取得できる。

### 3. Dev Container で起動

`.devcontainer/` にはホストの GPU 有無に応じた2構成がある。VS Code の **Reopen in Container** で選ぶ。

| 構成名 | ディレクトリ | 起動するサービス |
| --- | --- | --- |
| Irodori-TTS Discord Bot (CUDA) | `.devcontainer/cuda/` | `app` `irodori-tts` `postgres` `redis` `pgadmin` |
| Irodori-TTS Discord Bot (CPU) | `.devcontainer/cpu/` | `app` `postgres` `redis` `pgadmin` |

CUDA 構成は NVIDIA GPU と nvidia-container-toolkit が必須で、`irodori-tts` のヘルスチェック通過まで最大5分かかる。

CPU 構成は `irodori-tts` を起動しないため、TTS を使うには外部のサーバへ向ける。ホスト側で動かしているなら `.env` を次のようにする:

```env
IRODORI_TTS_BASE_URL=http://host.docker.internal:8088/v1
```

`node_modules` / `pg_data` / `redis_data` / `pgadmin_data` のボリュームは両構成で名前を固定して共有しているため、構成を切り替えても `bun install` のやり直しや開発DBの作り直しは発生しない。

CLI から起動する場合:

```bash
devcontainer up --workspace-folder . --config .devcontainer/cuda/devcontainer.json
```

### 4. ログ確認

```bash
docker compose -f .devcontainer/cuda/compose.yaml logs -f app
```

## 使い方

### コマンド一覧

Bot のコマンドは3つだけ。設定はすべてダッシュボード（WebUI）で行う。

| コマンド | 機能 |
|----------|------|
| `/join` | ボイスチャンネルに参加 |
| `/leave` | ボイスチャンネルから離脱 |
| `/config` | 設定画面（ダッシュボード）の URL を表示 |

### 設定（ダッシュボード）

`DOMAIN_URL` で公開しているダッシュボードに Discord でログインして設定する。

| 画面 | 内容 |
|------|------|
| 話者設定（`/voice`） | 読み上げに使う話者と、話者ごとの合成パラメータ（ユーザー単位） |
| サーバー設定（`/server`） | VC 外ユーザーの読み上げ可否、入退室アナウンス、読み上げ対象チャンネル（サーバー単位） |

サーバー設定の変更には Discord の「サーバー管理」権限が必要で、Bot が参加しているサーバーのみ一覧に出る。

話者ごとの合成パラメータ（未設定の項目は LoRA メタデータのデフォルトが適用される）:

- `num_steps` — Rectified-flow サンプリングステップ数（整数、1〜100）
- `cfg_scale_text` — テキスト条件付け CFG スケール
- `cfg_scale_speaker` — 話者条件付け CFG スケール
- `speaker_kv_scale` — 話者 KV キャッシュスケール
- `truncation_factor` — ノイズ切り詰め係数（0〜1）
- `seed` — 再現用乱数シード（整数）

### 基本の流れ

1. Bot をサーバーに招待
2. ユーザーがボイスチャンネルに参加
3. `/join` で Bot を同じ VC に招く
4. 必要なら `/config` で表示される URL からダッシュボードを開き、話者を切替
5. テキストチャンネルでメッセージを送ると VC で読み上げられる（改行があれば行ごとに逐次合成）

## 開発

```bash
bun install                # 依存解決
bun run dev                # ホットリロード（src/index.ts）
bun run lint               # Biome チェック
bun run lint:fix           # Biome 自動修正
bun run format             # Biome フォーマット
bun run build              # tsc --noEmit + dist 出力
bun run start              # 本番実行
```

## ボイスドラマ入力フォーマット (VDS)

複数話者・複数セリフを順次合成するためのスクリプトフォーマット。仕様は [docs/voice-drama-format.md](docs/voice-drama-format.md) にまとめてある（v1 ドラフト、Bot 側の実行実装は未着手）。次節の Plotmaker が最終的にこの VDS を出力する想定。

## Plotmaker (`workers/web/`)

VDS スクリプトを作るための創作支援 Web アプリ。**まだ開発中（`v0.0.2`）** で API・スキーマともに変わり得るため、本番運用向けではない。

### できること（現状）

- プロット / シナリオ / チャプター / エピソードの階層管理
- キャラクター定義（ウィザードでの初期作成、リレーション定義）
- 読み方辞書（ルビ）管理と本文へのルビ付与
- LLM（[Qwen](https://qwenlm.github.io/)）支援でのチャプター計画・エピソード本文生成
- 話者インポート（Bot 側で利用する UUID を共有）

### 技術スタック

- **Runtime**: [Bun](https://bun.com) + [@hono/node-server](https://hono.dev/getting-started/nodejs)
- **フロント**: React 19 + [TanStack Router](https://tanstack.com/router) + [TanStack Query](https://tanstack.com/query) + [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **バックエンド**: [Hono](https://hono.dev/) + [Prisma](https://www.prisma.io/) (Postgres)
- **LLM**: OpenAI 互換 API（デフォルトは Qwen）
- **ビルド**: [Vite](https://vitejs.dev/)

### 起動

```bash
cd workers/web
bun install
bunx prisma migrate deploy --schema=prisma/schema.prisma
bun run dev              # Vite dev サーバ
# 別ターミナルで
bun run start            # Hono API サーバ (@hono/node-server)
```

Postgres が別途必要（`DATABASE_URL` を `.env` に設定）。開発中のため、詳細セットアップは今後整備予定。

### Bot との関係

`packages/shared` の VDS 型定義を共有しており、将来的には Plotmaker で作成した VDS スクリプトを Bot が読み込んで VC で再生できる構成を目指す。現状は 2 プロダクトを同じリポジトリで並行開発する形。

## ライセンス

MIT

## 関連リンク

- [Irodori-TTS](https://github.com/Aratako/Irodori-TTS)
- [discord.js](https://discord.js.org/)
- [Bun](https://bun.com)
