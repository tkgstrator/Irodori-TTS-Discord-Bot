import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getNextTheme, themeIcons, themeLabels } from '@/lib/theme'

// トップバーのクイック切り替え文言を組み立てる。
const getToggleLabel = (currentTheme: keyof typeof themeIcons, nextTheme: keyof typeof themeIcons) =>
  `現在: ${themeLabels[currentTheme]}。クリックで${themeLabels[nextTheme]}に切り替え`

// トップバーからテーマを順送りで切り替える。
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const Icon = themeIcons[theme]
  const nextTheme = getNextTheme(theme)
  const toggleLabel = getToggleLabel(theme, nextTheme)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => setTheme(nextTheme)}
          aria-label={toggleLabel}
        >
          <Icon className="size-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{toggleLabel}</TooltipContent>
    </Tooltip>
  )
}
