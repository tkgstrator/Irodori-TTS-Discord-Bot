import { type ChapterPlanPreviewState, ChapterPlanPreviewStateSchema } from '@/schemas/chapter-plan-preview.dto'

const chapterPlanPreviewStorageKey = 'irodori-chapter-plan-preview'

// プレビュー状態を sessionStorage の文字列から安全に復元する。
export const parseStoredChapterPlanPreview = ({
  scenarioId,
  storedValue
}: {
  scenarioId: string
  storedValue: string | null
}): ChapterPlanPreviewState | null => {
  if (storedValue === null) {
    return null
  }

  try {
    const parsedValue = JSON.parse(storedValue)
    const parsedResult = ChapterPlanPreviewStateSchema.safeParse(parsedValue)

    if (!parsedResult.success) {
      return null
    }

    if (
      parsedResult.data.scenarioId !== scenarioId ||
      parsedResult.data.request.dramaId !== scenarioId ||
      parsedResult.data.plan?.dramaId !== scenarioId
    ) {
      return null
    }

    return parsedResult.data
  } catch {
    return null
  }
}

// 章計画プレビュー状態を保存する。
export const saveChapterPlanPreview = (value: ChapterPlanPreviewState) => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.setItem(chapterPlanPreviewStorageKey, JSON.stringify(value))
}

// 章計画プレビュー状態を取得する。
export const loadChapterPlanPreview = ({ scenarioId }: { scenarioId: string }) => {
  if (typeof window === 'undefined') {
    return null
  }

  const storedValue = sessionStorage.getItem(chapterPlanPreviewStorageKey)
  const parsedValue = parseStoredChapterPlanPreview({
    scenarioId,
    storedValue
  })

  if (parsedValue === null) {
    sessionStorage.removeItem(chapterPlanPreviewStorageKey)
  }

  return parsedValue
}

// 章計画プレビュー状態を削除する。
export const clearChapterPlanPreview = () => {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.removeItem(chapterPlanPreviewStorageKey)
}
