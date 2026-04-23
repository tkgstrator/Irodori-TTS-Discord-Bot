import { createFileRoute, Link, useLocation, useNavigate, useParams } from '@tanstack/react-router'
import { ChevronLeft, Loader2, Play, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { requestChapterPlan, resolveChapterPlanCharacterNames } from '@/lib/chapter-plan'
import { clearChapterPlanPreview, loadChapterPlanPreview, saveChapterPlanPreview } from '@/lib/chapter-plan-preview'
import { buildChapterPlanDebugPayload } from '@/lib/chapter-plan-prompt'
import { useScenarios } from '@/lib/scenarios'
import type { ChapterPlanPreviewState } from '@/schemas/chapter-plan-preview.dto'

// 章計画プレビュー画面を描画する。
export const ChapterPlanPreviewPage = () => {
  const { id } = useParams({ strict: false })
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { appendNextChapter, getScenario, isLoading, errorMessage } = useScenarios()
  const [isChapterGenerating, setIsChapterGenerating] = useState(false)
  const [preview, setPreview] = useState<ChapterPlanPreviewState | null>(() =>
    loadChapterPlanPreview({ scenarioId: id })
  )
  const requestKeyRef = useRef<string | null>(null)
  const scenario = getScenario(id)
  const isPlotsRoute = pathname.startsWith('/plots')
  const backTo = isPlotsRoute ? '/plots/$id' : '/scenarios/$id'

  const chapterRequestJson = useMemo(() => (preview ? `${JSON.stringify(preview.request, null, 2)}\n` : ''), [preview])
  const chapterGeminiPayloadJson = useMemo(
    () => (preview ? `${JSON.stringify(buildChapterPlanDebugPayload(preview.request), null, 2)}\n` : ''),
    [preview]
  )
  const chapterPlanJson = useMemo(() => (preview?.plan ? `${JSON.stringify(preview.plan, null, 2)}\n` : ''), [preview])

  // preview 状態を画面と sessionStorage に同期する。
  const savePreviewState = useCallback((value: ChapterPlanPreviewState) => {
    setPreview(value)
    clearChapterPlanPreview()
    saveChapterPlanPreview(value)
  }, [])

  // loading 状態のときだけ Editor へ章計画生成を依頼する。
  useEffect(() => {
    if (!preview || preview.status !== 'loading') {
      requestKeyRef.current = null
      return
    }

    const requestKey = JSON.stringify(preview.request)

    if (requestKeyRef.current === requestKey) {
      return
    }

    requestKeyRef.current = requestKey

    const run = async () => {
      try {
        const plan = await requestChapterPlan(preview.request)
        savePreviewState({
          ...preview,
          status: 'ready',
          plan,
          errorMessage: null
        })
      } catch (error) {
        savePreviewState({
          ...preview,
          status: 'error',
          plan: null,
          errorMessage: error instanceof Error ? error.message : 'Failed to generate chapter plan'
        })
      } finally {
        requestKeyRef.current = null
      }
    }

    void run()
  }, [preview, savePreviewState])

  // 確認済みの章計画から下書き章を作成する。
  const handleGenerateChapter = async () => {
    if (!scenario || !preview?.plan) {
      return
    }

    setIsChapterGenerating(true)

    try {
      const nextScenario = await appendNextChapter(scenario.id, {
        title: preview.plan.chapter.title,
        promptNote: preview.plan.chapter.summary,
        characterNames: resolveChapterPlanCharacterNames({
          plan: preview.plan,
          request: preview.request
        })
      })

      const nextChapter =
        nextScenario?.chapters
          .slice()
          .sort((left, right) => right.number - left.number)
          .find((chapter) => chapter.status === 'draft') ??
        nextScenario?.chapters.slice().sort((left, right) => right.number - left.number)[0]

      if (!nextChapter) {
        throw new Error('Failed to resolve created chapter')
      }

      clearChapterPlanPreview()
      await navigate({
        to: isPlotsRoute ? '/plots/$id/chapters/$chapterId' : '/scenarios/$id/chapters/$chapterId',
        params: {
          id: scenario.id,
          chapterId: nextChapter.id
        }
      })
    } finally {
      setIsChapterGenerating(false)
    }
  }

  // Editor 応答の再取得を開始する。
  const handleRetry = () => {
    if (!preview) {
      return
    }

    savePreviewState({
      ...preview,
      status: 'loading',
      plan: null,
      errorMessage: null
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">シナリオを読み込み中です</p>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-destructive">{errorMessage}</p>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">シナリオが見つかりません</p>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">確認できる章計画プレビューがありません</p>
        <Button asChild variant="outline">
          <Link to={backTo} params={{ id: scenario.id }}>
            <ChevronLeft className="size-3.5" />
            シナリオに戻る
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="sm:px-6">
      <div className="sticky top-0 z-10 -mx-6 bg-background/95 px-6 pb-5 backdrop-blur-sm">
        <div className="w-full">
          <Link
            to={backTo}
            params={{ id: scenario.id }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {scenario.title}
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">章計画プレビュー</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                第{preview.request.request.nextChapterNumber}章の確認
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                送信内容は先に表示し、そのまま Editor の返答を待てます
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:shrink-0 md:pt-0.5">
              <Button asChild variant="outline" className="w-full gap-2 sm:w-auto">
                <Link to={backTo} params={{ id: scenario.id }}>
                  <ChevronLeft className="size-3.5" />
                  戻る
                </Link>
              </Button>
              <Button
                className="w-full gap-2 sm:w-auto"
                onClick={() => void handleGenerateChapter()}
                disabled={isChapterGenerating || preview.plan === null}
              >
                {isChapterGenerating ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" />
                    この章を作成
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="mt-5 border-b border-border" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl py-8">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Editor の返答</p>
            {preview.status === 'loading' ? (
              <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">章計画を作成中です</p>
                  <p className="text-sm text-muted-foreground">
                    送信内容は下に表示したまま、Editor の返答を待っています
                  </p>
                </div>
              </div>
            ) : preview.status === 'error' ? (
              <div className="space-y-3">
                <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {preview.errorMessage ?? 'Failed to generate chapter plan'}
                </p>
                <Button type="button" variant="outline" onClick={handleRetry}>
                  <RefreshCw className="size-3.5" />
                  再試行
                </Button>
              </div>
            ) : (
              <>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  第{preview.plan?.chapter.number}章 {preview.plan?.chapter.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{preview.plan?.chapter.summary}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">章の目的</p>
                    <p className="mt-1 text-sm text-foreground">{preview.plan?.chapter.goal}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground">感情線</p>
                    <p className="mt-1 text-sm text-foreground">{preview.plan?.chapter.emotionalArc}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground">Beat の流れ</p>
            {preview.plan ? (
              <div className="mt-3 space-y-3">
                {preview.plan.beatOutline.map((beat) => (
                  <div key={beat.order} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-foreground">Beat {beat.order}</p>
                      <span className="text-xs text-muted-foreground">
                        {beat.sceneKind} / {beat.tension}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{beat.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Editor の返答待ちです
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/30">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">ChapterPlanRequest</p>
              </div>
              <pre className="max-h-[56vh] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                {chapterRequestJson}
              </pre>
            </div>
            <div className="rounded-xl border border-border bg-muted/30">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">Gemini Payload</p>
              </div>
              <pre className="max-h-[56vh] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                {chapterGeminiPayloadJson}
              </pre>
            </div>
            <div className="rounded-xl border border-border bg-muted/30">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground">ChapterPlan</p>
              </div>
              <pre className="max-h-[56vh] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all">
                {chapterPlanJson}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/scenarios/$id/chapter-plan')({
  component: ChapterPlanPreviewPage
})
