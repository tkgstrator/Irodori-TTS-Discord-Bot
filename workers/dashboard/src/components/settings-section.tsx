/**
 * 設定セクションの共通レイアウト
 *
 * 左に見出しと説明、右にコントロールを置く2カラム。狭い画面では縦積みになる。
 */
export function SettingsSection({
  title,
  titleExtra,
  description,
  children
}: {
  title: string
  titleExtra?: React.ReactNode
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-x-12 gap-y-6 py-10 md:grid-cols-[15rem_1fr]">
      <div className="flex flex-col gap-1.5">
        <h2 className="flex items-center gap-2 font-medium text-base">
          {title}
          {titleExtra}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}
