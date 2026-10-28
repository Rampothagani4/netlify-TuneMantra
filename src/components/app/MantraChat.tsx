import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Play, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { usePlayer } from '@/components/player/PlayerProvider'
import { cn } from '@/lib/utils'
import { searchTracks } from './search-api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  searches?: string[]
}

const STARTERS = ['Tell me about this song', 'Play something similar', 'Songs for a rainy evening', 'Surprise me']

export function MantraChat({ online }: { online: boolean }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const player = usePlayer()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || pending) return
    const history = [...messages, { role: 'user' as const, content }]
    setMessages(history)
    setDraft('')
    setPending(true)
    try {
      const res = await fetch('/api/mantra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.slice(-12).map(({ role, content }) => ({ role, content })),
          nowPlaying: player.current
            ? { title: player.current.title, artist: player.current.artist, source: player.current.source }
            : null,
          queue: player.queue.slice(player.index + 1, player.index + 6).map((t) => `${t.title} by ${t.artist}`),
        }),
      })
      const body = (await res.json().catch(() => null)) as { reply?: string; searches?: string[]; error?: string } | null
      if (!res.ok || !body?.reply) throw new Error(body?.error ?? 'Mantra is resting. Try again in a moment.')
      setMessages((m) => [...m, { role: 'assistant', content: body.reply ?? '', searches: body.searches }])
    } catch (error) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: error instanceof Error ? error.message : 'Something went wrong.' },
      ])
    } finally {
      setPending(false)
    }
  }

  const playSuggestion = async (query: string) => {
    const id = toast.loading(`Finding “${query}”…`)
    try {
      const [first] = await searchTracks('youtube', query)
      if (!first) throw new Error('No match')
      player.play(first)
      toast.success(`Playing ${first.title}`, { id })
    } catch {
      toast.error(`Couldn't find “${query}”`, { id })
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(draft)
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 z-40 h-12 rounded-full px-5 shadow-lg shadow-primary/20 sm:right-6"
      >
        <Sparkles /> Ask Mantra
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-5">
            <SheetTitle className="flex items-center gap-2 font-display text-xl">
              <Sparkles className="size-5 text-primary" aria-hidden /> Mantra
            </SheetTitle>
            <SheetDescription>
              Your music guide · knows what you're playing
              {player.current ? ` (“${player.current.title}”)` : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
            {!messages.length && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Ask about the artist, the story behind a song, or what to play next.
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={!online}
                      onClick={() => void send(s)}
                      className="rounded-full border px-3 py-1.5 text-sm hover:border-primary hover:text-primary disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn('flex flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
                <p
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap',
                    m.role === 'user' ? 'rounded-br-sm bg-primary text-primary-foreground' : 'rounded-bl-sm bg-muted',
                  )}
                >
                  {m.content}
                </p>
                {m.searches && m.searches.length > 0 && (
                  <div className="mt-2 flex max-w-[85%] flex-wrap gap-1.5">
                    {m.searches.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => void playSuggestion(q)}
                        className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
                      >
                        <Play className="size-3" aria-hidden /> {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {pending && (
              <p className="w-fit rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                Mantra is listening…
              </p>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t p-4">
            <label htmlFor="tm-mantra" className="sr-only">
              Message Mantra
            </label>
            <Input
              id="tm-mantra"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={online ? 'Ask Mantra anything about music…' : 'Mantra needs a connection'}
              disabled={!online}
              autoComplete="off"
              maxLength={2000}
            />
            <Button type="submit" size="icon" disabled={!online || pending || !draft.trim()} aria-label="Send">
              <Send />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}
