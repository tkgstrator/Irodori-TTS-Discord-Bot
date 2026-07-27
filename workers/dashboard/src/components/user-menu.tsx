import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  const displayName = me.globalName ?? me.username

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="アカウントメニュー">
          <Avatar className="size-7">
            <AvatarImage src={avatarUrl(me.id, me.avatar)} alt="" />
            <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{displayName}</span>
          <span className="truncate font-normal text-muted-foreground text-xs">@{me.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={() => void logout()}>
          <LogOut className="size-4" />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
