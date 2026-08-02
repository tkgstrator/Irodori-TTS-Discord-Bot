import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import type { ComboOption } from '@/components/combo-select'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MultiComboSelectProps {
  id: string
  options: readonly ComboOption[]
  values: readonly string[]
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  onChange: (values: string[]) => void
}

/**
 * 複数選択できる ComboSelect
 *
 * 単一選択の ComboSelect と同じ Popover + コマンドリストの見た目にそろえつつ、
 * 選択してもポップオーバーを閉じずに続けて選べるようにしている。
 */
export function MultiComboSelect({
  id,
  options,
  values,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onChange
}: MultiComboSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.filter((option) => values.includes(option.value))

  // 選択済みが多いときにボタン幅を溢れさせないよう、先頭2件＋残り件数に丸める
  const label =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((option) => option.label).join(', ')
        : `${selected
            .slice(0, 2)
            .map((option) => option.label)
            .join(', ')} 他${selected.length - 2}件`

  const toggle = (value: string) =>
    onChange(values.includes(value) ? values.filter((current) => current !== value) : [...values, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal sm:w-80"
        >
          <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>{label}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                  <Check className={cn('size-4', values.includes(option.value) ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
