import { LogOut, Wifi, WifiOff } from 'lucide-react'
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
import { cn } from '@/lib/utils'

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--primary)" />
        <circle cx="16" cy="16" r="10" fill="none" stroke="var(--background)" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M13 10v9.2a3 3 0 1 0 2 2.8V13.5l6-1.5v-3z" fill="var(--background)" />
      </svg>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Tune<span className="text-primary">Mantra</span>
      </span>
    </span>
  )
}

export function AppHeader({ online, onSignIn }: { online: boolean; onSignIn: () => void }) {
  const { user, ready } = useIdentity()
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
              online ? 'text-muted-foreground' : 'border-saffron/50 text-saffron',
            )}
            role="status"
          >
            {online ? <Wifi className="size-3.5" aria-hidden /> : <WifiOff className="size-3.5" aria-hidden />}
            {online ? 'Online' : 'Offline'}
          </span>
          {ready && !user && (
            <Button variant="outline" className="rounded-full" onClick={onSignIn}>
              Sign in
            </Button>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="grid size-9 place-items-center overflow-hidden rounded-full bg-primary/20 font-medium text-primary ring-1 ring-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  aria-label="Account menu"
                >
                  {user.pictureUrl ? <img src={user.pictureUrl} alt="" className="size-full object-cover" /> : initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
      </div>
    </header>
  )
}
