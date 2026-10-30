import { useEffect } from 'react'
import { usePlayer, usePlayerProgress } from '@/components/player/PlayerProvider'

/**
 * Global shortcuts when focus is not in a form field.
 * Space = play/pause · ←/→ = seek ±5s · Shift+←/→ = prev/next
 */
export function KeyboardShortcuts() {
  const player = usePlayer()
  const { position, duration } = usePlayerProgress()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.tagName === 'SELECT' ||
          t.isContentEditable)
      ) {
        return
      }
      if (!player.current) return

      if (e.code === 'Space') {
        e.preventDefault()
        player.toggle()
        return
      }
      if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault()
        player.prev()
        return
      }
      if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault()
        player.next()
        return
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        player.seek(Math.max(0, position - 5))
        return
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        player.seek(Math.min(duration || position + 5, position + 5))
        return
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player, position, duration])

  return null
}
