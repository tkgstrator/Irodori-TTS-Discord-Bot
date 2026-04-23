import { createFileRoute } from '@tanstack/react-router'
import { Check, Palette, Sparkles } from 'lucide-react'
import { useLlmSettings } from '@/components/llm-settings-provider'
import { useTheme } from '@/components/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { themeIcons, themeLabels } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { type GeminiModel, geminiModelCatalog } from '@/schemas/llm-settings.dto'
import type { Theme } from '@/schemas/theme.dto'

type ThemeOption = {
  readonly value: Theme
  readonly summary: string
}

// 設定ページで表示するテーマ候補を定義する。
const themeOptions: ReadonlyArray<ThemeOption> = [
  {
    value: 'light',
    summary: '明るい背景でコントラストを保ちながら表示します。'
  },
  {
    value: 'dark',
    summary: '夜間利用でも眩しさを抑えて表示します。'
  },
  {
    value: 'system',
    summary: 'デバイス設定に合わせて自動で切り替えます。'
  }
]

// 画面上で案内する設定の要点を定義する。
const guideItems: ReadonlyArray<{ readonly title: string; readonly description: string }> = [
  {
    title: 'クイック切り替え',
    description: '右上のアイコンは素早く切り替えるためのショートカットです。'
  },
  {
    title: '詳細設定',
    description: 'テーマの意味や現在値を確認しながら変更したい場合は、この画面を利用します。'
  }
]

// モデル名から表示ラベルを引く。
const getGeminiModelLabel = (model: GeminiModel) => {
  return geminiModelCatalog.find((item) => item.value === model)?.label ?? model
}

// 星評価を文字列へ変換する。
const getStars = (count: number) => '★'.repeat(count) + '☆'.repeat(5 - count)

// 設定ページを描画する。
const SettingsPage = () => {
  const { theme, setTheme } = useTheme()
  const { llmSettings, setEditorModel, setWriterModel } = useLlmSettings()

  return (
    <div className="flex w-full flex-col gap-6 pt-4 sm:gap-8 sm:px-4 sm:py-6 lg:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">設定</h1>
        <p className="text-sm text-muted-foreground">
          表示や作業環境に関する設定をまとめて管理できます。現在の設定を確認しながら、その場で切り替えられます。
        </p>
      </header>

      <section className="border-b border-border/80 pb-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)] xl:gap-10">
          <div className="max-w-5xl space-y-5">
            <div className="flex flex-col gap-3 border-b border-border/70 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Palette className="size-5 text-muted-foreground" aria-hidden="true" />
                  テーマ
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  ライト・ダーク・システム追従から選択できます。どのモードでも同じデザイントークンを利用します。
                </p>
              </div>
              <Badge className="shrink-0 self-start">{themeLabels[theme]}</Badge>
            </div>

            <ul className="max-w-4xl grid gap-3 sm:grid-cols-3">
              {themeOptions.map((option) => {
                const Icon = themeIcons[option.value]
                const isActive = theme === option.value

                return (
                  <li key={option.value}>
                    <Button
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      size="lg"
                      className={cn(
                        'h-10 w-full justify-start rounded-lg px-3 text-left',
                        'hover:border-foreground/15 hover:bg-muted/70',
                        isActive &&
                          'border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_var(--color-primary)]'
                      )}
                      aria-pressed={isActive}
                      onClick={() => setTheme(option.value)}
                    >
                      <span className="flex w-full items-center justify-between gap-2.5">
                        <span className={cn('flex min-w-0 items-center gap-1.5')}>
                          <span
                            className={cn(
                              'flex size-4 shrink-0 items-center justify-center',
                              isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 text-sm font-semibold">{themeLabels[option.value]}</span>
                          <span className="sr-only">{option.summary}</span>
                        </span>
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center',
                            isActive ? 'text-primary-foreground' : 'text-muted-foreground/50'
                          )}
                        >
                          {isActive ? <Check className="size-3.5" aria-hidden="true" /> : null}
                        </span>
                      </span>
                    </Button>
                  </li>
                )
              })}
            </ul>

            <p className="text-xs leading-5 text-muted-foreground">
              システム設定は OS の外観に追従します。右上の切り替えはクイックアクションとして利用できます。
            </p>

            <section className="space-y-4 border-t border-border/70 pt-6">
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Sparkles className="size-5 text-muted-foreground" aria-hidden="true" />
                  LLM の既定モデル
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Editor と Writer の既定値はここで直接変更できます。作業内容に合わせて、それぞれ別のモデルを選べます。
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="flex h-full flex-col gap-4 rounded-xl border border-border/80 bg-card p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Editor</p>
                      <Badge variant="secondary">{getGeminiModelLabel(llmSettings.editor)}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      構成整理や吸収を担当する Editor の既定モデルです。長い文脈を扱うなら Pro が向いています。
                    </p>
                  </div>

                  <div className="mt-auto">
                    <Select value={llmSettings.editor} onValueChange={setEditorModel}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {geminiModelCatalog.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>

                <section className="flex h-full flex-col gap-4 rounded-xl border border-border/80 bg-card p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Writer</p>
                      <Badge variant="secondary">{getGeminiModelLabel(llmSettings.writer)}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      台詞や地の文を生成する Writer の既定モデルです。速度重視なら Flash が扱いやすいです。
                    </p>
                  </div>

                  <div className="mt-auto">
                    <Select value={llmSettings.writer} onValueChange={setWriterModel}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {geminiModelCatalog.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </section>
              </div>
            </section>
          </div>

          <aside className="space-y-8 border-t border-border/70 pt-6 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-8">
            <section className="space-y-4 border-b border-border/70 pb-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">LLM モデル比較</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Google Gemini 系モデルの傾向を比較できます。既定値の変更は左側の設定カードから行えます。
                </p>
              </div>

              <div className="border-t border-border/70 pt-4">
                <p className="text-xs text-muted-foreground">★が多いほど、速い・高精度・低コストです。</p>

                <ul className="mt-4 space-y-4">
                  {geminiModelCatalog.map((item) => (
                    <li key={item.value} className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-start gap-2 sm:items-center">
                          <p className="text-sm font-semibold">{item.label}</p>
                          <Badge variant={item.release === 'GA' ? 'secondary' : 'outline'}>{item.release}</Badge>
                        </div>

                        <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>

                        <dl className="grid max-w-sm grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <dt className="text-xs font-medium tracking-wide text-muted-foreground">速度</dt>
                            <dd className="text-sm font-medium">
                              <span className="sr-only">{`速度 ${item.speedStars} / 5`}</span>
                              <span aria-hidden="true">{getStars(item.speedStars)}</span>
                            </dd>
                          </div>
                          <div className="space-y-1">
                            <dt className="text-xs font-medium tracking-wide text-muted-foreground">精度</dt>
                            <dd className="text-sm font-medium">
                              <span className="sr-only">{`精度 ${item.accuracyStars} / 5`}</span>
                              <span aria-hidden="true">{getStars(item.accuracyStars)}</span>
                            </dd>
                          </div>
                          <div className="space-y-1">
                            <dt className="text-xs font-medium tracking-wide text-muted-foreground">コスト</dt>
                            <dd className="text-sm font-medium">
                              <span className="sr-only">{`コスト ${item.costStars} / 5`}</span>
                              <span aria-hidden="true">{getStars(item.costStars)}</span>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">操作ガイド</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  クイックアクションと詳細設定の使い分けを明確にしています。
                </p>
              </div>

              <ul className="space-y-4">
                {guideItems.map((item) => (
                  <li key={item.title} className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage
})
