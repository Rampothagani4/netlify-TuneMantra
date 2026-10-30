import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Clock, Flame, Search, UserRound, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { forgetSearch, listRecentSearches } from '@/lib/recent-searches'
import { ROLES, matchPeople, songQuery } from '@/lib/south-cinema'
import { cn } from '@/lib/utils'

const TRENDING = [
  'Latest Telugu songs',
  'Telugu love songs',
  'Telugu mass songs',
  'Sid Sriram melodies',
  'Thaman S hits',
  'Anirudh Ravichander hits',
]

type Suggestion = { label: string; query: string; hint?: string; kind: 'recent' | 'person' | 'trending' | 'text' }

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  onClear: () => void
  onFocus?: () => void
  disabled?: boolean
}

/** The header search bar with suggestions: recent searches, matching artists and stars, and trending picks. */
export function SearchBox({ value, onChange, onSearch, onClear, onFocus, disabled }: SearchBoxProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState<string[]>([])
  const listId = useId()
  const rootRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (open) setRecent(listRecentSearches())
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const suggestions = useMemo<Suggestion[]>(() => {
    const text = value.trim().toLowerCase()
    const roleLabel = (role: string) => ROLES.find((r) => r.id === role)?.label
    if (!text) {
      return [
        ...recent.slice(0, 5).map((q) => ({ label: q, query: q, kind: 'recent' as const })),
        ...TRENDING.map((q) => ({ label: q, query: q, kind: 'trending' as const })),
      ]
    }
    return [
      { label: value.trim(), query: value.trim(), kind: 'text' as const },
      ...recent
        .filter((q) => q.toLowerCase().includes(text) && q.toLowerCase() !== text)
        .slice(0, 3)
        .map((q) => ({ label: q, query: q, kind: 'recent' as const })),
      ...matchPeople(text).map((p) => ({
        label: p.name,
        query: songQuery(p),
        hint: roleLabel(p.role),
        kind: 'person' as const,
      })),
      ...TRENDING.filter((q) => q.toLowerCase().includes(text) && q.toLowerCase() !== text)
        .slice(0, 2)
        .map((q) => ({ label: q, query: q, kind: 'trending' as const })),
    ]
  }, [value, recent])

  useEffect(() => setActive(-1), [value])

  const choose = (s: Suggestion) => {
    setOpen(false)
    onSearch(s.query)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (active >= 0 && suggestions[active]) return choose(suggestions[active])
    setOpen(false)
    onSearch(value)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && !disabled && suggestions.length > 0

  return (
    <form ref={rootRef} onSubmit={submit} role="search" className="relative mx-auto w-full max-w-xl flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          onFocus?.()
        }}
        onKeyDown={onKeyDown}
        placeholder="Search songs, singers, music directors, heroes…"
        className="h-11 rounded-full border-border/60 bg-background/80 pl-10 pr-10 text-sm shadow-sm"
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onClear()
            setOpen(false)
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[22rem] overflow-y-auto rounded-2xl border border-border/70 bg-popover p-1.5 shadow-2xl"
        >
          {!value.trim() && recent.length === 0 && (
            <li className="px-3 pt-1.5 pb-1 text-xs font-medium text-muted-foreground">Trending searches</li>
          )}
          {suggestions.map((s, i) => {
            const Icon = s.kind === 'recent' ? Clock : s.kind === 'person' ? UserRound : s.kind === 'trending' ? Flame : Search
            return (
              <li
                key={`${s.kind}:${s.label}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm',
                  active === i ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <Icon
                  className={cn('size-4 shrink-0', s.kind === 'trending' ? 'text-saffron' : 'text-muted-foreground')}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {s.hint && <span className="shrink-0 text-xs text-muted-foreground">{s.hint}</span>}
                {s.kind === 'recent' && (
                  <button
                    type="button"
                    aria-label={`Remove ${s.label} from recent searches`}
                    onClick={(e) => {
                      e.stopPropagation()
                      forgetSearch(s.label)
                      setRecent(listRecentSearches())
                    }}
                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </form>
  )
}
