import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DownloadsView } from '@/components/app/DownloadsView'
import { HomeFeed } from '@/components/app/HomeFeed'
import { LikedView } from '@/components/app/LikedView'
import { LibraryView, PlaylistDetail } from '@/components/app/PlaylistView'
import { MantraChat } from '@/components/app/MantraChat'
import { NowPlaying } from '@/components/app/NowPlaying'
import { PlayerBar } from '@/components/app/PlayerBar'
import { SearchBox } from '@/components/app/SearchBox'
import { SearchResults } from '@/components/app/SearchResults'
import { LatestTeluguRow, SouthCinema } from '@/components/app/SouthCinema'
import { Sidebar, type AppView } from '@/components/app/Sidebar'
import { SignInDialog } from '@/components/app/SignInDialog'
import { KeyboardShortcuts } from '@/components/app/KeyboardShortcuts'
import { searchTracks } from '@/components/app/search-api'
import { rememberSearch } from '@/lib/recent-searches'
import type { Track } from '@/lib/tracks'
import { useOnline } from '@/lib/use-online'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: Home,
})

type Section = { status: 'idle' | 'loading' | 'done' | 'error'; tracks: Track[]; error?: string }
const empty: Section = { status: 'idle', tracks: [] }

function Home() {
  const online = useOnline()
  const [view, setView] = useState<AppView>('home')
  const [playlistId, setPlaylistId] = useState<string | null>(null)
  const [signInOpen, setSignInOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState<{ q: string; nonce: number } | null>(null)
  const [songs, setSongs] = useState<Section>(empty)
  const [free, setFree] = useState<Section>(empty)

  const requireSignIn = () => setSignInOpen(true)

  useEffect(() => {
    if (!online) setView('downloads')
  }, [online])

  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!online || !query?.q) {
      setSongs(empty)
      setFree(empty)
      return
    }
    const controller = new AbortController()
    const q = query.q

    setSongs({ status: 'loading', tracks: [] })
    setFree({ status: 'loading', tracks: [] })

    searchTracks('youtube', q, controller.signal)
      .then((tracks) => setSongs({ status: 'done', tracks }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setSongs({ status: 'error', tracks: [], error: e.message })
      })

    searchTracks('jamendo', q, controller.signal)
      .then((tracks) => setFree({ status: 'done', tracks }))
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setFree({ status: 'error', tracks: [], error: e.message })
      })

    return () => controller.abort()
  }, [query, online])

  const runSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    rememberSearch(trimmed)
    setDraft(trimmed)
    setQuery({ q: trimmed, nonce: Date.now() })
    setView('search')
    setPlaylistId(null)
    setMobileNav(false)
  }

  const clearSearch = () => {
    setDraft('')
    setQuery(null)
    setSongs(empty)
    setFree(empty)
    setView('home')
  }

  const navigate = (next: AppView) => {
    setView(next)
    setPlaylistId(null)
    setMobileNav(false)
  }

  const openPlaylist = (id: string) => {
    setPlaylistId(id)
    setView('playlist')
    setMobileNav(false)
  }

  const showSearchResults = view === 'search' && query?.q

  return (
    <div className="tm-glow flex h-dvh flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 gap-2 p-2 pb-0">
        <Sidebar
          view={view}
          onNavigate={navigate}
          onOpenPlaylist={openPlaylist}
          activePlaylistId={playlistId}
          online={online}
          onSignIn={requireSignIn}
          className="hidden w-[15.5rem] shrink-0 lg:flex"
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-card/30">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/70 px-3 py-3 backdrop-blur-xl sm:px-5">
            <Sheet open={mobileNav} onOpenChange={setMobileNav}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[17rem] border-sidebar-border bg-sidebar p-0">
                <Sidebar
                  view={view}
                  onNavigate={navigate}
                  onOpenPlaylist={openPlaylist}
                  activePlaylistId={playlistId}
                  online={online}
                  onSignIn={requireSignIn}
                  className="h-full rounded-none border-0"
                />
              </SheetContent>
            </Sheet>

            <SearchBox
              value={draft}
              onChange={setDraft}
              onSearch={runSearch}
              onClear={clearSearch}
              onFocus={() => {
                if (view !== 'search') {
                  setView('search')
                  setPlaylistId(null)
                }
              }}
              disabled={!online}
            />
          </header>

          <main
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-3 py-6 sm:px-6',
              'lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 lg:overflow-hidden',
            )}
          >
            <div className="min-w-0 lg:overflow-y-auto lg:pr-2">
              {view === 'home' && (
                <HomeFeed online={online} onRequireSignIn={requireSignIn} onSearch={runSearch} />
              )}

              {view === 'search' && showSearchResults && (
                <SearchResults
                  query={query!.q}
                  songs={songs}
                  free={free}
                  onRequireSignIn={requireSignIn}
                  onSearch={runSearch}
                  online={online}
                />
              )}

              {view === 'search' && !showSearchResults && (
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h1 className="font-display text-2xl font-bold">Search</h1>
                    <p className="text-muted-foreground">
                      Type a song, movie, singer, music director or hero above, or start with one of these.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        'Latest Telugu songs',
                        'Telugu love songs',
                        'Thaman S hits',
                        'Devi Sri Prasad hits',
                        'Sid Sriram melodies',
                        'Anirudh mass songs',
                        'Ilaiyaraaja classics',
                        'A. R. Rahman',
                        'Arijit Singh',
                        'Lo-fi',
                      ].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => runSearch(m)}
                          className="rounded-full border bg-card px-3.5 py-1.5 text-sm hover:border-primary hover:text-primary"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LatestTeluguRow online={online} />
                  <SouthCinema online={online} onSearch={runSearch} />
                </div>
              )}

              {view === 'liked' && (
                <LikedView onRequireSignIn={requireSignIn} onBrowse={() => navigate('home')} />
              )}

              {view === 'downloads' && (
                <DownloadsView onBrowse={() => navigate('home')} onRequireSignIn={requireSignIn} />
              )}

              {view === 'library' && (
                <LibraryView
                  onRequireSignIn={requireSignIn}
                  onOpenPlaylist={openPlaylist}
                  onBrowse={() => navigate('home')}
                />
              )}

              {view === 'playlist' && playlistId && (
                <PlaylistDetail
                  playlistId={playlistId}
                  onRequireSignIn={requireSignIn}
                  onBack={() => navigate('library')}
                  onDeleted={() => navigate('library')}
                />
              )}

              <p className="mt-10 pb-4 text-xs text-muted-foreground">
                Songs stream as audio through YouTube. Free tracks come from independent artists on{' '}
                <a
                  href="https://www.jamendo.com"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Jamendo
                </a>{' '}
                under Creative Commons licenses.
              </p>
            </div>

            <div className="hidden lg:block lg:overflow-y-auto">
              <div className="sticky top-0">
                <NowPlaying />
              </div>
            </div>
          </main>
        </div>
      </div>

      <PlayerBar />
      <KeyboardShortcuts />
      <MantraChat online={online} />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  )
}
