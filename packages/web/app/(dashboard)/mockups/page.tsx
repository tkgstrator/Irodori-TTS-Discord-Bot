'use client'

import { Columns2, Monitor, Moon, Palette, Smartphone, Sun, Tablet } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CategoryId = 'dashboard' | 'character-list' | 'character-edit' | 'scenario' | 'relation'

type MockupEntry = {
  name: string
  title: string
  description: string
  file: string
  category: CategoryId
  createdAt: string
}

type Viewport = 'mobile' | 'tablet' | 'desktop'

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  mobile: '375px',
  tablet: '768px',
  desktop: '100%'
}

const CATEGORIES: Record<CategoryId, string> = {
  dashboard: 'ダッシュボード',
  'character-list': 'キャラクター一覧',
  'character-edit': 'キャラクター編集',
  scenario: 'シナリオ編集',
  relation: '相関図'
}

const CATEGORY_ORDER: CategoryId[] = ['dashboard', 'character-list', 'character-edit', 'scenario', 'relation']

export default function MockupsPage() {
  const [mockups, setMockups] = useState<MockupEntry[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [compareWith, setCompareWith] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [darkPreview, setDarkPreview] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const compareIframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    fetch('/mockups/manifest.json')
      .then((r) => r.json())
      .then((data: MockupEntry[]) => {
        setMockups(data)
        const firstCategory = CATEGORY_ORDER.find((cat) => data.some((m) => m.category === cat)) ?? null
        setSelectedCategory(firstCategory)
        const firstInCategory = data.find((m) => m.category === firstCategory)
        if (firstInCategory) setSelected(firstInCategory.name)
      })
      .catch(() => {})
  }, [])

  const toggleDark = () => {
    const next = !darkPreview
    setDarkPreview(next)
    for (const ref of [iframeRef, compareIframeRef]) {
      try {
        ref.current?.contentDocument?.documentElement.classList.toggle('dark', next)
      } catch {}
    }
  }

  const handleIframeLoad = (ref: React.RefObject<HTMLIFrameElement | null>) => {
    if (darkPreview) {
      try {
        ref.current?.contentDocument?.documentElement.classList.add('dark')
      } catch {}
    }
  }

  const handleCategorySelect = (cat: CategoryId) => {
    setSelectedCategory(cat)
    setCompareWith(null)
    const firstInCategory = mockups.find((m) => m.category === cat)
    if (firstInCategory) setSelected(firstInCategory.name)
  }

  const handleVersionSelect = (name: string) => {
    if (compareMode && selected !== name) {
      setCompareWith(name)
    } else {
      setSelected(name)
      setCompareWith(null)
    }
  }

  const categoryMockups = mockups.filter((m) => m.category === selectedCategory)
  const selectedMockup = mockups.find((m) => m.name === selected)
  const compareMockup = mockups.find((m) => m.name === compareWith)

  const iframeStyle =
    viewport === 'desktop' ? { width: '100%' } : { width: VIEWPORT_WIDTHS[viewport], margin: '0 auto' }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] gap-4">
      <div className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">モック一覧</h2>
          <Badge variant="secondary">{mockups.length}</Badge>
        </div>

        {mockups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <Palette className="size-8 text-muted-foreground/50" />
              <p className="text-sm">モックがありません</p>
              <p className="text-xs">UI Designer エージェントでモックを作成してください</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              {CATEGORY_ORDER.filter((cat) => mockups.some((m) => m.category === cat)).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    'w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors',
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {CATEGORIES[cat]}
                </button>
              ))}
            </div>

            {selectedCategory !== null && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground px-1">バージョン</p>
                {categoryMockups.map((m) => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => handleVersionSelect(m.name)}
                    className="w-full text-left"
                  >
                    <Card
                      className={cn(
                        'cursor-pointer transition-colors',
                        selected === m.name ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50',
                        compareWith === m.name ? 'border-ring ring-1 ring-ring' : ''
                      )}
                    >
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm">{m.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
                      </CardContent>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={viewport === 'mobile' ? 'default' : 'outline'}
                    size="icon-sm"
                    onClick={() => setViewport('mobile')}
                    aria-label="モバイル"
                  />
                }
              >
                <Smartphone className="size-4" />
              </TooltipTrigger>
              <TooltipContent>モバイル (375px)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={viewport === 'tablet' ? 'default' : 'outline'}
                    size="icon-sm"
                    onClick={() => setViewport('tablet')}
                    aria-label="タブレット"
                  />
                }
              >
                <Tablet className="size-4" />
              </TooltipTrigger>
              <TooltipContent>タブレット (768px)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant={viewport === 'desktop' ? 'default' : 'outline'}
                    size="icon-sm"
                    onClick={() => setViewport('desktop')}
                    aria-label="デスクトップ"
                  />
                }
              >
                <Monitor className="size-4" />
              </TooltipTrigger>
              <TooltipContent>デスクトップ</TooltipContent>
            </Tooltip>
          </div>

          <div className="h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={darkPreview ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={toggleDark}
                  aria-label="ダークモード"
                />
              }
            >
              {darkPreview ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </TooltipTrigger>
            <TooltipContent>{darkPreview ? 'ダークモード' : 'ライトモード'}</TooltipContent>
          </Tooltip>

          <div className="h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={compareMode ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => {
                    setCompareMode(!compareMode)
                    setCompareWith(null)
                  }}
                  aria-label="比較モード"
                />
              }
            >
              <Columns2 className="size-4" />
            </TooltipTrigger>
            <TooltipContent>比較モード</TooltipContent>
          </Tooltip>

          {compareMode && (
            <span className="text-xs text-muted-foreground">左: 選択中 / 右: 同カテゴリからもう1つ選択</span>
          )}
        </div>

        {!selected ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
            モックを選択してください
          </div>
        ) : compareMode ? (
          <div className="flex flex-1 gap-2 overflow-hidden">
            <div className="flex-1 overflow-auto rounded-lg border bg-background">
              <iframe
                ref={iframeRef}
                src={`/mockups/${selectedMockup?.file}`}
                className="h-full border-0"
                style={iframeStyle}
                title={selectedMockup?.title}
                onLoad={() => handleIframeLoad(iframeRef)}
              />
            </div>
            <div className="flex-1 overflow-auto rounded-lg border bg-background">
              {compareWith ? (
                <iframe
                  ref={compareIframeRef}
                  src={`/mockups/${compareMockup?.file}`}
                  className="h-full border-0"
                  style={iframeStyle}
                  title={compareMockup?.title}
                  onLoad={() => handleIframeLoad(compareIframeRef)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  比較するモックを左パネルから選択
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto rounded-lg border bg-background">
            <iframe
              ref={iframeRef}
              src={`/mockups/${selectedMockup?.file}`}
              className="h-full border-0"
              style={iframeStyle}
              title={selectedMockup?.title}
              onLoad={() => handleIframeLoad(iframeRef)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
