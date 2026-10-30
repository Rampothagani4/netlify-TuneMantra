// Minimal typings and loader for the YouTube IFrame Player API. TuneMantra
// keeps the player out of sight (unless video mode is on) and uses it as an audio engine.

export interface YTPlayer {
  loadVideoById(id: string): void
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  setVolume(volume: number): void
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  destroy(): void
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      width?: number
      height?: number
      host?: string
      playerVars?: Record<string, number | string>
      events?: {
        onReady?: () => void
        onStateChange?: (e: { data: number }) => void
        onError?: (e: { data: number }) => void
      }
    },
  ) => YTPlayer
}

declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const

let apiPromise: Promise<YTNamespace> | null = null

export function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      apiPromise = null
      reject(new Error('YouTube player failed to load'))
    }
    document.head.appendChild(script)
  })
  return apiPromise
}
