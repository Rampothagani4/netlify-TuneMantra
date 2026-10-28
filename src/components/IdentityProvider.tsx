import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { getUser, handleAuthCallback, onAuthChange, type User } from '@netlify/identity'

type IdentityState = { user: User | null; ready: boolean }
const IdentityContext = createContext<IdentityState | null>(null)

const CALLBACK_KEYS = ['confirmation_token', 'recovery_token', 'invite_token', 'email_change_token', 'access_token']

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IdentityState>({ user: null, ready: false })
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthChange((_event, user) => {
      if (active) setState((previous) => ({ ...previous, user }))
    })
    async function initialize() {
      try {
        const params = new URLSearchParams(window.location.hash.slice(1))
        if (CALLBACK_KEYS.some((key) => params.has(key))) {
          const result = await handleAuthCallback()
          if (result?.type === 'oauth' || result?.type === 'confirmation')
            toast.success('Signed in. Downloads are unlocked.')
        }
        const user = await getUser()
        if (active) setState({ user, ready: true })
      } catch {
        if (active) setState({ user: null, ready: true })
      }
    }
    void initialize()
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  return <IdentityContext.Provider value={state}>{children}</IdentityContext.Provider>
}

export function useIdentity() {
  const state = useContext(IdentityContext)
  if (!state) throw new Error('IdentityProvider is required')
  return state
}
