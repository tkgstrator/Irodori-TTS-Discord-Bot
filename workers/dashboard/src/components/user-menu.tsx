import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useLogout, useMe } from '@/lib/auth'

/**
 * Discord のアバター画像URLを組み立てる
 */
const avatarUrl = (userId: string, avatar: string | null): string | undefined =>
  avatar === null ? undefined : `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`

/**
 * ヘッダー右上のユーザーメニュー
 *
 * 未ログイン時はログインボタンを出す。
 */
export function UserMenu() {
  const { me, isPending } = useMe()
  const { logout, isLoggingOut } = useLogout()

  if (isPending) {
    return null
  }

  if (me === null) {
    return (
      <Button asChild size="sm">
        <a href="/api/auth/login">ログイン</a>
      </Button>
    )
  }

  const displayName = me.globalName === null ? me.username : me.globalName
  const initial = displayName.slice(0, 1).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="アカウントメニュー">
          <Avatar className="size-7">
            <AvatarImage src={avatarUrl(me.id, me.avatar)} alt="" />
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60 p-0">
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="size-9">
            <AvatarImage src={avatarUrl(me.id, me.avatar)} alt="" />
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium text-sm">{displayName}</span>
            <span className="truncate text-muted-foreground text-xs">@{me.username}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-1">
          <DropdownMenuItem
            disabled={isLoggingOut}
            onSelect={() => void logout()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="size-4" />
            ログアウト
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
