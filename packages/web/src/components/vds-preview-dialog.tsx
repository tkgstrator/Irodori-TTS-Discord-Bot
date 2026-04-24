import { Eye } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { downloadVdsFile, type VdsExportResult } from '@/lib/vds'

type PreviewFormat = 'vds' | 'json'
type TriggerVariant = 'default' | 'secondary' | 'outline'
type TriggerSize = 'default' | 'sm'

type PreviewItem = {
  format: PreviewFormat
  label: string
  fileName: string
  content: string
  contentType: string
}

type VdsPreviewDialogProps = {
  title: string
  description: string
  vdsExport: VdsExportResult
  vdsJsonExport: VdsExportResult
  triggerLabel?: string
  triggerVariant?: TriggerVariant
  triggerSize?: TriggerSize
  triggerClassName?: string
}

// ダイアログ内で扱うプレビュー対象を抽出する。
const createPreviewItems = ({
  vdsExport,
  vdsJsonExport
}: {
  vdsExport: VdsExportResult
  vdsJsonExport: VdsExportResult
}): PreviewItem[] => [
  ...(vdsExport.ok
    ? [
        {
          format: 'vds' as const,
          label: 'VDS',
          fileName: vdsExport.fileName,
          content: vdsExport.content,
          contentType: 'text/vnd.vds;charset=utf-8'
        }
      ]
    : []),
  ...(vdsJsonExport.ok
    ? [
        {
          format: 'json' as const,
          label: 'VDS JSON',
          fileName: vdsJsonExport.fileName,
          content: vdsJsonExport.content,
          contentType: 'application/json;charset=utf-8'
        }
      ]
    : [])
]

// 指定フォーマットの内容をブラウザから保存する。
const handlePreviewDownload = (item: PreviewItem) => {
  downloadVdsFile({
    fileName: item.fileName,
    content: item.content,
    contentType: item.contentType
  })
}

// VDS 出力前に内容を確認できるダイアログ。
export const VdsPreviewDialog = ({
  title,
  description,
  vdsExport,
  vdsJsonExport,
  triggerLabel = 'VDSビュー',
  triggerVariant = 'outline',
  triggerSize = 'default',
  triggerClassName
}: VdsPreviewDialogProps) => {
  const previewItems = useMemo(() => createPreviewItems({ vdsExport, vdsJsonExport }), [vdsExport, vdsJsonExport])
  const [selectedFormat, setSelectedFormat] = useState<PreviewFormat>(previewItems[0]?.format ?? 'vds')

  if (previewItems.length === 0) {
    return null
  }

  const activeItem = previewItems.find((item) => item.format === selectedFormat) ?? previewItems[0]

  if (!activeItem) {
    return null
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) {
          setSelectedFormat(previewItems[0]?.format ?? 'vds')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} className={triggerClassName}>
          <Eye className="size-3.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-3 sm:max-w-4xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          {previewItems.map((item) => (
            <Button
              key={item.format}
              type="button"
              variant={item.format === activeItem.format ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFormat(item.format)}
            >
              {item.label}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground">{activeItem.fileName}</span>
        </div>

        <div className="rounded-xl border border-border bg-muted/30">
          <pre
            className={cn(
              'max-h-[60vh] overflow-auto p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap',
              activeItem.format === 'json' && 'break-all'
            )}
          >
            {activeItem.content}
          </pre>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">内容を確認してから任意の形式で出力できます。</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {previewItems.map((item) => (
              <Button
                key={`download-${item.format}`}
                type="button"
                variant={item.format === activeItem.format ? 'default' : 'secondary'}
                onClick={() => handlePreviewDownload(item)}
              >
                {item.label}を出力
              </Button>
            ))}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
