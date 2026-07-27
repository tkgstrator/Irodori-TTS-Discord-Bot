import { Check, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboOption {
  value: string
  label: string
}

interface ComboSelectProps {
  id: string
  options: readonly ComboOption[]
  value: string
  placeholder: string
  searchPlaceholder: string
  emptyText: string
  disabled?: boolean
  onSelect: (value: string) => void
}

/**
 * Popover とコマンドリストで作る選択コントロール
 *
 * 話者は数十件になるため、ネイティブの Select ではなく
 * インクリメンタル検索できる Popover 形式にしている。
 */
export function ComboSelect({
  id,
  options,
  value,
  placeholder,
  searchPlaceholder,
  emptyText,
  disabled,
  onSelect
}: ComboSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((option) => option.value === value)

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
          <span className={cn('truncate', selected === undefined && 'text-muted-foreground')}>
            {selected === undefined ? placeholder : selected.label}
          </span>
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
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    setOpen(false)
                    onSelect(option.value)
                  }}
                >
                  <Check className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')} />
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
