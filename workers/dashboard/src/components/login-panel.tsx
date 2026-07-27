import { AudioLines } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * 未ログイン時に表示するログイン導線
 *
 * OAuth の開始はサーバー側リダイレクトなので、fetch ではなく素のリンクで遷移する。
 */
export function LoginPanel() {
  return (
    <section className="mx-auto flex max-w-sm flex-col items-center gap-8 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <AudioLines className="size-7" />
      </span>

      <div className="flex flex-col gap-3">
        <h1 className="font-brand font-bold text-2xl tracking-tight">読み上げ設定をはじめる</h1>
        <p className="text-balance text-muted-foreground text-sm leading-relaxed">
          Discord でログインすると、自分の声や読み上げの細かいパラメータを変更できます。
        </p>
      </div>

      <Button asChild size="lg" className="w-full sm:w-auto sm:px-10">
        <a href="/api/auth/login">Discord でログイン</a>
      </Button>
    </section>
  )
}
