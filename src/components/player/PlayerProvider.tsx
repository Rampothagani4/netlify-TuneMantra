import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { Track } from '@/lib/tracks'
import { listenCache, offlineStore } from '@/lib/offline-store'
import { YT_STATE, loadYouTubeApi, type YTPlayer } from '@/lib/youtube-player'

interface PlayerApi {
  queue: Track[]
  index: number
  current: Track | null
  isPlaying: boolean
  isLoading: boolean
  volume: number
  /** Play a track; when a list is given it becomes the queue (like playing from an album). */
  play: (track: Track, list?: Track[]) => void
  playAt: (index: number) => void
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
  removeAt: (index: number) => void
  clearUpcoming: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (volume: number) => void
}

// Playback position changes several times a second, so it has its own context:
// only the progress bar re-renders while a song plays, not every track row.
interface PlayerProgress {
  position: number
  duration: number
}

const PlayerContext = createContext<PlayerApi | null>(null)
const ProgressContext = createContext<PlayerProgress>({ position: 0, duration: 0 })

function prefersLightData() {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return Boolean(connection?.saveData)
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([])
  const [index, setIndex] = useState(-1)
  const [playKey, setPlayKey] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(80)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytRef = useRef<YTPlayer | null>(null)
  const ytPromise = useRef<Promise<YTPlayer> | null>(null)
  const ytHostRef = useRef<HTMLDivElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const volumeRef = useRef(volume)
  const sourceRef = useRef<Track['source'] | null>(null)
  const positionRef = useRef(0)
  const caching = useRef(new Set<string>())
  const actionsRef = useRef({ next: () => {}, prev: () => {}, toggle: () => {} })

  const current = queue[index] ?? null
  sourceRef.current = current?.source ?? null
  positionRef.current = position
  const upcoming = queue[index + 1] ?? null
  const upcomingRef = useRef(upcoming)
  upcomingRef.current = upcoming

  // Listening cache: a Creative Commons song is fetched once through the
  // server-side song cache and kept on this device, so the next play starts
  // instantly (and works offline). YouTube audio is never stored.
  const cacheForReplay = useCallback(async (track: Track | null) => {
    if (!track || track.source !== 'jamendo' || caching.current.has(track.id)) return
    if (!navigator.onLine || prefersLightData()) return
    caching.current.add(track.id)
    try {
      const [saved, listened] = await Promise.all([
        offlineStore.get(track.id).catch(() => undefined),
        listenCache.get(track.id).catch(() => undefined),
      ])
      if (saved || listened) return
      const res = await fetch(`/api/stream?id=${encodeURIComponent(track.id.replace(/^jm:/, ''))}`)
      if (!res.ok) return
      await listenCache.put({ id: track.id, blob: await res.blob(), playedAt: Date.now() })
    } catch {
      // Caching is a bonus; playback never depends on it.
    } finally {
      caching.current.delete(track.id)
    }
  }, [])

  // HTML audio engine for Creative Commons tracks and offline downloads.
  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audio.volume = volumeRef.current / 100
    audioRef.current = audio
    const isActive = () => sourceRef.current === 'jamendo'
    const handlers: [keyof HTMLMediaElementEventMap, () => void][] = [
      ['timeupdate', () => isActive() && setPosition(audio.currentTime)],
      ['durationchange', () => isActive() && Number.isFinite(audio.duration) && setDuration(audio.duration)],
      ['play', () => isActive() && setIsPlaying(true)],
      ['pause', () => isActive() && setIsPlaying(false)],
      ['waiting', () => isActive() && setIsLoading(true)],
      ['playing', () => isActive() && setIsLoading(false)],
      ['ended', () => isActive() && actionsRef.current.next()],
      [
        'error',
        () => {
          if (!isActive() || !audio.src) return
          setIsLoading(false)
          toast.error('That track could not be played.')
        },
      ],
    ]
    for (const [event, fn] of handlers) audio.addEventListener(event, fn)
    return () => {
      for (const [event, fn] of handlers) audio.removeEventListener(event, fn)
      audio.pause()
    }
  }, [])

  // Hidden YouTube player: songs stream as audio only.
  const getYouTube = useCallback(() => {
    if (!ytPromise.current) {
      ytPromise.current = loadYouTubeApi().then(
        (YT) =>
          new Promise<YTPlayer>((resolve) => {
            const el = document.createElement('div')
            ytHostRef.current?.appendChild(el)
            const isActive = () => sourceRef.current === 'youtube'
            const player = new YT.Player(el, {
              width: 200,
              height: 200,
              playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, iv_load_policy: 3 },
              events: {
                onReady: () => {
                  ytRef.current = player
                  resolve(player)
                },
                onStateChange: ({ data }) => {
                  if (!isActive()) return
                  if (data === YT_STATE.PLAYING) {
                    setIsPlaying(true)
                    setIsLoading(false)
                    const d = player.getDuration()
                    if (d) setDuration(d)
                  } else if (data === YT_STATE.PAUSED) setIsPlaying(false)
                  else if (data === YT_STATE.BUFFERING) setIsLoading(true)
                  else if (data === YT_STATE.ENDED) actionsRef.current.next()
                },
                onError: () => {
                  if (!isActive()) return
                  setIsLoading(false)
                  toast.error("This song can't be streamed here. Skipping ahead.")
                  actionsRef.current.next()
                },
              },
            })
          }),
      )
      ytPromise.current.catch(() => {
        ytPromise.current = null
      })
    }
    return ytPromise.current
  }, [])

  // Load whichever engine the current track needs.
  useEffect(() => {
    if (!current) return
    let cancelled = false
    const audio = audioRef.current
    setPosition(0)
    setDuration(current.duration)
    setIsLoading(true)

    if (current.source === 'youtube') {
      audio?.pause()
      if (!navigator.onLine) {
        setIsLoading(false)
        toast.error('YouTube songs need a connection. Your downloads still play offline.')
        return
      }
      getYouTube()
        .then((player) => {
          if (cancelled || !current.videoId) return
          player.setVolume(volumeRef.current)
          player.loadVideoById(current.videoId)
        })
        .catch(() => {
          setIsLoading(false)
          toast.error('The YouTube player could not load. Check your connection.')
        })
    } else {
      ytRef.current?.pauseVideo()
      void (async () => {
        const saved = await offlineStore.get(current.id).catch(() => undefined)
        const listened = saved ? undefined : await listenCache.get(current.id).catch(() => undefined)
        if (cancelled || !audio) return
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
        let src = current.streamUrl
        const blob = saved?.blob ?? listened?.blob
        if (blob) {
          src = URL.createObjectURL(blob)
          objectUrlRef.current = src
          if (listened) void listenCache.touch(listened).catch(() => {})
        } else if (!navigator.onLine) {
          setIsLoading(false)
          toast.error("You're offline and this track isn't downloaded.")
          return
        }
        if (!src) return
        audio.src = src
        audio
          .play()
          .then(async () => {
            // Keep this song for next time, then get the next one in the queue ready.
            await cacheForReplay(current)
            if (!cancelled) await cacheForReplay(upcomingRef.current)
          })
          .catch(() => {
            setIsLoading(false)
            setIsPlaying(false)
          })
      })()
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, playKey, getYouTube])

  // Load the YouTube player in the background so the first song starts faster.
  useEffect(() => {
    const warm = () => void getYouTube().catch(() => {})
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(warm, 2000)
    return () => window.clearTimeout(id)
  }, [getYouTube])

  // The YouTube player has no time events, so poll while it plays.
  useEffect(() => {
    if (current?.source !== 'youtube' || !isPlaying) return
    const timer = window.setInterval(() => {
      const player = ytRef.current
      if (!player) return
      setPosition(player.getCurrentTime())
      const d = player.getDuration()
      if (d) setDuration(d)
    }, 500)
    return () => window.clearInterval(timer)
  }, [current?.source, isPlaying])

  const stop = () => {
    audioRef.current?.pause()
    ytRef.current?.pauseVideo()
    setIsPlaying(false)
  }

  const playAt = useCallback((i: number) => {
    setIndex(i)
    setPlayKey((k) => k + 1)
  }, [])

  const play = useCallback((track: Track, list?: Track[]) => {
    if (list?.length) {
      const at = list.findIndex((t) => t.id === track.id)
      setQueue(at >= 0 ? list : [track, ...list])
      setIndex(at >= 0 ? at : 0)
    } else {
      setQueue([track])
      setIndex(0)
    }
    setPlayKey((k) => k + 1)
  }, [])

  const addToQueue = (track: Track) => {
    setQueue((q) => [...q, track])
    if (index < 0) playAt(queue.length)
    toast.success(`Added “${track.title}” to your queue`)
  }

  const playNext = (track: Track) => {
    if (index < 0) return play(track)
    setQueue((q) => [...q.slice(0, index + 1), track, ...q.slice(index + 1)])
    toast.success(`“${track.title}” plays next`)
  }

  const removeAt = (i: number) => {
    if (i === index) return
    setQueue((q) => q.filter((_, j) => j !== i))
    if (i < index) setIndex((x) => x - 1)
  }

  const clearUpcoming = () => setQueue((q) => q.slice(0, index + 1))

  const next = () => {
    if (index < queue.length - 1) playAt(index + 1)
    else stop()
  }

  const prev = () => {
    if (positionRef.current > 3 || index <= 0) seek(0)
    else playAt(index - 1)
  }

  const toggle = () => {
    if (!current) return
    if (current.source === 'youtube') {
      const player = ytRef.current
      if (!player) return
      if (isPlaying) player.pauseVideo()
      else player.playVideo()
    } else {
      const audio = audioRef.current
      if (!audio) return
      if (audio.paused) void audio.play().catch(() => setIsPlaying(false))
      else audio.pause()
    }
  }

  const seek = (seconds: number) => {
    if (current?.source === 'youtube') ytRef.current?.seekTo(seconds, true)
    else if (audioRef.current) audioRef.current.currentTime = seconds
    setPosition(seconds)
  }

  const setVolume = (v: number) => {
    volumeRef.current = v
    setVolumeState(v)
    if (audioRef.current) audioRef.current.volume = v / 100
    ytRef.current?.setVolume(v)
  }

  actionsRef.current = { next, prev, toggle }

  // Lock screen and hardware media keys.
  useEffect(() => {
    if (!current || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: 'TuneMantra',
      artwork: current.artwork ? [{ src: current.artwork, sizes: '480x360' }] : [],
    })
    navigator.mediaSession.setActionHandler('play', () => actionsRef.current.toggle())
    navigator.mediaSession.setActionHandler('pause', () => actionsRef.current.toggle())
    navigator.mediaSession.setActionHandler('nexttrack', () => actionsRef.current.next())
    navigator.mediaSession.setActionHandler('previoustrack', () => actionsRef.current.prev())
  }, [current])

  // Rebuilt only when what the controls show changes, never on position ticks.
  const api = useMemo<PlayerApi>(
    () => ({
      queue,
      index,
      current,
      isPlaying,
      isLoading,
      volume,
      play,
      playAt,
      addToQueue,
      playNext,
      removeAt,
      clearUpcoming,
      toggle,
      next,
      prev,
      seek,
      setVolume,
    }),
    // The actions read only the state listed here (position comes from a ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queue, index, current, isPlaying, isLoading, volume, play, playAt],
  )
  const progress = useMemo(() => ({ position, duration }), [position, duration])

  return (
    <PlayerContext.Provider value={api}>
      <ProgressContext.Provider value={progress}>
        {children}
        <div
          ref={ytHostRef}
          aria-hidden="true"
          className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
        />
      </ProgressContext.Provider>
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('PlayerProvider is required')
  return ctx
}

export function usePlayerProgress() {
  return useContext(ProgressContext)
}
