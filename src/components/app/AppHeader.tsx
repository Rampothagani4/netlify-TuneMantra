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

/** A bold, flat mark: a play triangle cut from a rounded tile, with a sound-wave notch. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden>
      <defs>
        <linearGradient id="tm-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--saffron)" />
          <stop offset="0.55" stopColor="var(--primary)" />
          <stop offset="1" stopColor="oklch(0.5 0.2 25)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#tm-mark)" />
      <path d="M12 9.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L13.5 8.64A1 1 0 0 0 12 9.5z" fill="var(--background)" />
      <rect x="6.5" y="12" width="2.2" height="8" rx="1.1" fill="var(--background)" opacity="0.85" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[1.35rem] leading-none font-extrabold tracking-[-0.04em]">
        TUNE<span className="text-primary">MANTRA</span>
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
