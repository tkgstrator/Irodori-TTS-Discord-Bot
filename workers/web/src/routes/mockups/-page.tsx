import { Monitor, Smartphone } from 'lucide-react'
import { PageContainer } from '@/components/page-container'

interface MockupPattern {
  readonly name: string
  readonly description: string
  readonly desktop: string
  readonly mobile: string
}

interface MockupPage {
  readonly slug: string
  readonly title: string
  readonly patterns: ReadonlyArray<MockupPattern>
}

const mockupPages: ReadonlyArray<MockupPage> = [
  {
    slug: 'character-management',
    title: 'キャラクター管理',
    patterns: [
      {
        name: 'グリッド',
        description: 'カード形式のグリッドレイアウト',
        desktop: '/mockups/character-grid-desktop.html',
        mobile: '/mockups/character-grid-mobile.html'
      },
      {
        name: 'テーブル',
        description: 'データテーブル形式の一覧',
        desktop: '/mockups/character-table-desktop.html',
        mobile: '/mockups/character-table-mobile.html'
      },
      {
        name: 'カンバン',
        description: 'ロール別のカンバンボード',
        desktop: '/mockups/character-kanban-desktop.html',
        mobile: '/mockups/character-kanban-mobile.html'
      },
      {
        name: 'リスト',
        description: 'コンパクトなリスト表示',
        desktop: '/mockups/character-list-desktop.html',
        mobile: '/mockups/character-list-mobile.html'
      },
      {
        name: 'ギャラリー',
        description: 'ビジュアル重視のギャラリー表示',
        desktop: '/mockups/character-gallery-desktop.html',
        mobile: '/mockups/character-gallery-mobile.html'
      }
    ]
  },
  {
    slug: 'character-relationship',
    title: 'キャラクター関係図',
    patterns: [
      {
        name: 'グラフ',
        description: 'ノードとエッジによるインタラクティブ関係図',
        desktop: '/mockups/character-relationship-graph-desktop.html',
        mobile: '/mockups/character-relationship-graph-mobile.html'
      },
      {
        name: 'マトリクス',
        description: '隣接マトリクス形式の関係一覧',
        desktop: '/mockups/character-relationship-matrix-desktop.html',
        mobile: '/mockups/character-relationship-matrix-mobile.html'
      },
      {
        name: 'リスト',
        description: 'キャラクター別にグループ化したフラットリスト',
        desktop: '/mockups/character-relationship-list-desktop.html',
        mobile: '/mockups/character-relationship-list-mobile.html'
      }
    ]
  },
  {
    slug: 'character-create',
    title: 'キャラクター新規作成',
    patterns: [
      {
        name: 'フォーム',
        description: '標準フォーム。3セクション縦並び',
        desktop: '/mockups/character-create-desktop.html',
        mobile: '/mockups/character-create-mobile.html'
      },
      {
        name: 'ウィザード',
        description: '4ステップ進行式',
        desktop: '/mockups/character-create-wizard-desktop.html',
        mobile: '/mockups/character-create-wizard-mobile.html'
      },
      {
        name: 'プレビュー',
        description: 'ライブプレビュー付きフォーム',
        desktop: '/mockups/character-create-preview-desktop.html',
        mobile: '/mockups/character-create-preview-mobile.html'
      },
      {
        name: 'アコーディオン',
        description: '折りたたみセクション形式',
        desktop: '/mockups/character-create-accordion-desktop.html',
        mobile: '/mockups/character-create-accordion-mobile.html'
      },
      {
        name: 'タブ',
        description: 'タブ切り替え形式',
        desktop: '/mockups/character-create-tabs-desktop.html',
        mobile: '/mockups/character-create-tabs-mobile.html'
      }
    ]
  },
  {
    slug: 'scenario-list',
    title: 'シナリオ管理',
    patterns: [
      {
        name: 'カードリスト',
        description: '縦型カードリスト・AI生成ステータス付き',
        desktop: '/mockups/scenario-list-desktop.html',
        mobile: '/mockups/scenario-list-mobile.html'
      },
      {
        name: 'グリッド',
        description: 'カードグリッド・再生成ボタン付き',
        desktop: '/mockups/scenario-list-grid-desktop.html',
        mobile: '/mockups/scenario-list-grid-mobile.html'
      },
      {
        name: 'テーブル',
        description: 'ソート可能データテーブル',
        desktop: '/mockups/scenario-list-table-desktop.html',
        mobile: '/mockups/scenario-list-table-mobile.html'
      },
      {
        name: 'カンバン',
        description: 'ステータス別カンバンボード',
        desktop: '/mockups/scenario-list-kanban-desktop.html',
        mobile: '/mockups/scenario-list-kanban-mobile.html'
      }
    ]
  },
  {
    slug: 'scenario-detail',
    title: 'シナリオ詳細',
    patterns: [
      {
        name: '章タイムライン',
        description: '章ごとの進捗タイムライン・再生成対応',
        desktop: '/mockups/scenario-detail-desktop.html',
        mobile: '/mockups/scenario-detail-mobile.html'
      }
    ]
  },
  {
    slug: 'chapter-detail',
    title: '章詳細',
    patterns: [
      {
        name: 'セリフタイムライン',
        description: 'セリフ単位のタイムライン・章ナビゲーション付き',
        desktop: '/mockups/chapter-detail-desktop.html',
        mobile: '/mockups/chapter-detail-mobile.html'
      }
    ]
  },
  {
    slug: 'scenario-create',
    title: 'プロット作成',
    patterns: [
      {
        name: 'エディタ',
        description: 'ステップ式プロット作成フロー',
        desktop: '/mockups/scenario-create-desktop.html',
        mobile: '/mockups/scenario-create-mobile.html'
      },
      {
        name: 'スプリット',
        description: 'エディタ＋ライブプレビュー分割',
        desktop: '/mockups/scenario-create-split-desktop.html',
        mobile: '/mockups/scenario-create-split-mobile.html'
      },
      {
        name: 'ステップ',
        description: 'ステップ進行式プロット作成',
        desktop: '/mockups/scenario-create-chat-desktop.html',
        mobile: '/mockups/scenario-create-chat-mobile.html'
      },
      {
        name: 'シングルページ',
        description: '1ページ完結のプロット作成',
        desktop: '/mockups/scenario-create-timeline-desktop.html',
        mobile: '/mockups/scenario-create-timeline-mobile.html'
      },
      {
        name: 'カード',
        description: 'カード形式のプロット作成',
        desktop: '/mockups/scenario-create-fullscreen-desktop.html',
        mobile: '/mockups/scenario-create-fullscreen-mobile.html'
      }
    ]
  }
]

// モックアップ一覧ページを表示する。
export const MockupsPage = () => {
  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">モックアップ</h1>
        <p className="mt-1 text-sm text-muted-foreground">各ページのデザインパターンを確認できます</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {mockupPages.map((page) => (
          <section key={page.slug}>
            <h2 className="mb-2 text-sm font-semibold">{page.title}</h2>
            <div className="divide-y divide-border rounded-xl border border-border">
              {page.patterns.map((pattern) => (
                <div key={pattern.name} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{pattern.name}</p>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                  </div>
                  <div className="flex w-full justify-end gap-2 sm:w-auto sm:shrink-0">
                    <a
                      href={pattern.desktop}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Desktop mockup"
                      className="inline-flex size-8 items-center justify-center rounded-(--radius) bg-primary text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:h-7 sm:w-auto sm:gap-1.5 sm:px-2.5"
                    >
                      <Monitor className="size-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Desktop</span>
                    </a>
                    <a
                      href={pattern.mobile}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Mobile mockup"
                      className="inline-flex size-8 items-center justify-center rounded-(--radius) border border-input bg-background text-xs font-medium text-foreground transition-colors hover:bg-secondary sm:h-7 sm:w-auto sm:gap-1.5 sm:px-2.5"
                    >
                      <Smartphone className="size-3" aria-hidden="true" />
                      <span className="hidden sm:inline">Mobile</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
