import { useEffect, useState, type FormEvent } from 'react'
import { HardDriveDownload } from 'lucide-react'
import { toast } from 'sonner'
import { getSettings, login, oauthLogin, signup } from '@netlify/identity'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.2 14.6 2.2 12 2.2 6.6 2.2 2.2 6.6 2.2 12s4.4 9.8 9.8 9.8c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  )
}

export function SignInDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [mode, setMode] = useState<'choose' | 'login' | 'signup'>('choose')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [googleEnabled, setGoogleEnabled] = useState(true)

  useEffect(() => {
    if (!open) return
    setMode('choose')
    setError(null)
    getSettings()
      .then((settings) => setGoogleEnabled(settings.providers.google))
      .catch(() => setGoogleEnabled(true))
  }, [open])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email'))
    const password = String(fields.get('password'))
    setPending(true)
    setError(null)
    try {
      if (mode === 'signup') {
        const user = await signup(email, password, { full_name: String(fields.get('name') ?? '') })
        if (!user.confirmedAt) {
          toast.success('Check your inbox to confirm your email, then sign in.')
          setMode('login')
          return
        }
      } else {
        await login(email, password)
      }
      toast.success('Signed in. Downloads are unlocked.')
      onOpenChange(false)
    } catch {
      setError(
        mode === 'signup'
          ? "We couldn't create that account. It may already exist."
          : "We couldn't sign you in. Check your email and password.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <HardDriveDownload className="size-6" aria-hidden />
          </div>
          <DialogTitle className="font-display text-2xl">Sign in to download</DialogTitle>
          <DialogDescription>
            Downloaded tracks are stored on this device, so they play even without internet.
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' ? (
          <div className="space-y-2">
            {googleEnabled && (
              <Button size="lg" className="w-full rounded-full" onClick={() => oauthLogin('google')}>
                <GoogleMark /> Continue with Google
              </Button>
            )}
            <Button
              size="lg"
              variant={googleEnabled ? 'outline' : 'default'}
              className="w-full rounded-full"
              onClick={() => setMode('login')}
            >
              Continue with email
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <fieldset disabled={pending} className="space-y-3">
              <legend className="sr-only">{mode === 'signup' ? 'Create an account' : 'Sign in with email'}</legend>
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="tm-name">Name</Label>
                  <Input id="tm-name" name="name" autoComplete="name" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="tm-email">Email</Label>
                <Input id="tm-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tm-password">Password</Label>
                <Input
                  id="tm-password"
                  name="password"
                  type="password"
                  minLength={mode === 'signup' ? 8 : undefined}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full rounded-full">
                {pending ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </Button>
            </fieldset>
            <p className="text-center text-sm text-muted-foreground">
              {mode === 'signup' ? 'Already have an account?' : 'New to TuneMantra?'}{' '}
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
              >
                {mode === 'signup' ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          </form>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
