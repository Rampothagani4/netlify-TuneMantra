# AGENTS.md

TuneMantra is a music player built with TanStack Start and deployed on Netlify. YouTube songs play as audio only. Jamendo Creative Commons tracks can be downloaded for offline play. Mantra is an AI music guide. See README.md for the feature list and configuration.

## Architecture

The whole app is a single screen at `/`. Global state lives in React context providers that are mounted in `src/routes/__root.tsx`, in this order: `IdentityProvider`, then `DownloadsProvider`, then `PlayerProvider`.

```
src/
├── routes/
│   ├── __root.tsx          # HTML shell, fonts, manifest, providers
│   ├── index.tsx           # The app screen: header, Discover / My downloads tabs, now playing, player bar, Mantra
│   ├── api.youtube.ts      # GET ?q=: song search (YouTube Data API if YOUTUBE_API_KEY, else parses the results page)
│   ├── api.jamendo.ts      # GET ?q=: Jamendo CC tracks (empty q returns weekly popular tracks)
│   ├── api.download.ts     # GET ?id=<jamendo id>: signed-in only; streams the audio file for offline storage
│   └── api.mantra.ts       # POST chat → Claude (claude-haiku-5-5) via AI Gateway; parses the "SEARCH:" suggestion line
├── components/
│   ├── IdentityProvider.tsx        # Netlify Identity client state + OAuth callback handling
│   ├── player/PlayerProvider.tsx   # Queue + two playback engines (hidden YouTube IFrame player, HTMLAudioElement)
│   ├── player/DownloadsProvider.tsx# IndexedDB downloads with progress
│   └── app/                        # Screen components (DiscoverView, DownloadsView, NowPlaying, PlayerBar, MantraChat, SignInDialog, TrackRow…)
└── lib/
    ├── tracks.ts           # Unified Track type (source: 'youtube' | 'jamendo') and helpers
    ├── offline-store.ts    # IndexedDB wrapper
    ├── youtube-player.ts   # IFrame API loader + minimal types
    └── use-online.ts       # navigator.onLine hook
public/sw.js                # App-shell service worker (skips /api and /.netlify)
```

## Non-obvious decisions

- **Songs, not videos.** The user asked for YouTube songs to play as audio. The IFrame player is mounted in a 1px, transparent, non-interactive container inside `PlayerProvider`. Search results are filtered to 1–12 minutes and ranked towards official audio and "Topic" channels. Titles are cleaned up into a title and an artist.
- **Only Jamendo tracks can be downloaded.** YouTube audio is never stored, because that would break YouTube's terms. `canDownload()` enforces this in the UI, and `/api/download` only accepts numeric Jamendo IDs, so it can't be used as an open proxy.
- **Two engines, one state.** Engine event handlers check `sourceRef` so that only the active engine updates player state. YouTube has no time events, so the provider polls it every 500 ms while it plays.
- **Offline.** When a track has a saved blob, it plays from an object URL even when the connection is up. When offline, the app switches to the My downloads tab.
- **Secrets.** `JAMENDO_CLIENT_ID` and the optional `YOUTUBE_API_KEY` are only read on the server. Don't hardcode them. The AI Gateway injects the Anthropic credentials, so don't add any API-key checks.
- **The theme is dark only.** The palette is in `src/styles.css` `:root`: vermillion `--primary` and a `--saffron` accent. The fonts are Bricolage Grotesque for headings and DM Sans for body text.

## Conventions

- Import with the `@/` alias. Components use PascalCase and hooks and utilities use camelCase.
- Use the theme variable classes (`bg-primary`, `text-muted-foreground`, `text-saffron`) rather than raw colors.
- Read browser-only APIs (localStorage, IndexedDB, navigator) inside effects, so the server-rendered HTML matches the first client render.
- Netlify Identity is enabled for the site. Add Google as an external provider in the Identity settings to turn on Google sign-in.
