import * as React from "react"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      data-slot="avatar"
      className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  )
})

Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ComponentProps<"img">>(({ className, ...props }, ref) => {
  // 画像URLがない場合はフォールバック表示を優先する。
  if (typeof props.src !== "string" || props.src.length === 0) {
    return null
  }

  return <img ref={ref} data-slot="avatar-image" className={cn("size-full object-cover", className)} {...props} />
})

AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLSpanElement, React.ComponentProps<"span">>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="avatar-fallback"
        className={cn(
          "flex size-full items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground",
          className
        )}
        {...props}
      />
    )
  }
)

AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarFallback, AvatarImage }
