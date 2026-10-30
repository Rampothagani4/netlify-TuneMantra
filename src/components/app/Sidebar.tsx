import {
  Heart,
  HardDriveDownload,
  Home,
  Library,
  ListMusic,
  LogOut,
  Plus,
  Search,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { logout } from '@netlify/identity'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useIdentity } from '@/components/IdentityProvider'
import { useDownloads } from '@/components/player/DownloadsProvider'
import { usePlaylists } from '@/components/player/PlaylistsProvider'
import { useReactions } from '@/components/player/ReactionsProvider'
import { cn } from '@/lib/utils'
import { Logo } from './AppHeader'

export type AppView = 'home' | 'search' | 'liked' | 'downloads' | 'library' | 'playlist'

const NAV: { id: AppView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'library', label: 'Your Library', icon: Library },
  { id: 'liked', label: 'Liked Songs', icon: Heart },
  { id: 'downloads', label: 'Downloads', icon: HardDriveDownload },
]

interface SidebarProps {
  view: AppView
  onNavigate: (view: AppView) => void
  onOpenPlaylist: (id: string) => void
  activePlaylistId?: string | null
  online: boolean
  onSignIn: () => void
  className?: string
}

export function Sidebar({
  view,
  onNavigate,
  onOpenPlaylist,
  activePlaylistId,
  online,
  onSignIn,
  className,
}: SidebarProps) {
  const { user, ready } = useIdentity()
  const { saved } = useDownloads()
  const { reacted } = useReactions()
  const { playlists, create } = usePlaylists()
  const likedCount = reacted.filter((r) => r.reaction === 'like' || r.reaction === 'love').length
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-2 rounded-xl bg-sidebar p-3 text-sidebar-foreground',
        className,
      )}
    >
      <div className="px-2 pt-1 pb-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = view === id || (id === 'library' && view === 'playlist')
          const badge =
            id === 'downloads' && saved.length > 0
              ? saved.length
              : id === 'liked' && likedCount > 0
                ? likedCount
                : null
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5 shrink-0', active && 'text-primary')} />
              <span className="flex-1 text-left">{label}</span>
              {badge != null && (
                <span className="rounded-full bg-primary/20 px-1.5 text-xs tabular-nums text-primary">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-sidebar-border/60 bg-background/40">
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Playlists
          </span>
          <button
            type="button"
            onClick={() => void create('My playlist').then((pl) => onOpenPlaylist(pl.id))}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Create playlist"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
          {playlists.length === 0 ? (
            <p className="px-2 py-2 text-xs leading-relaxed text-muted-foreground">
              Create a playlist, then add songs from the ⋯ menu on any track.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {playlists.map((pl) => (
                <li key={pl.id}>
                  <button
                    type="button"
                    onClick={() => onOpenPlaylist(pl.id)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
                      activePlaylistId === pl.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <ListMusic className="size-3.5 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{pl.name}</span>
                    <span className="text-xs tabular-nums opacity-70">{pl.tracks.length}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t border-sidebar-border/60 pt-3">
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
            online ? 'border-sidebar-border text-muted-foreground' : 'border-saffron/50 text-saffron',
          )}
          role="status"
        >
          {online ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
          {online ? 'Online' : 'Offline'}
        </div>

        {ready && !user && (
          <Button variant="outline" className="w-full rounded-full" onClick={onSignIn}>
            Sign in
          </Button>
        )}

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
              >
                <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-primary/20 text-sm font-medium text-primary ring-1 ring-border">
                  {user.pictureUrl ? (
                    <img src={user.pictureUrl} alt="" className="size-full object-cover" />
                  ) : (
                    initial
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{user.name || 'Listener'}</span>
                  <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <span className="block font-medium">{user.name || 'Listener'}</span>
                <span className="block text-xs text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() =>
                  void logout()
                    .then(() => toast.success('Signed out. Your downloads stay on this device.'))
                    .catch(() => toast.error('Sign out failed'))
                }
              >
                <LogOut /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
