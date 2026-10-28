# TuneMantra

**Find a song. Keep it forever.**

TuneMantra is a web music player. Search any song and it plays straight away as audio, with no video on screen. Free Creative Commons tracks from independent artists on [Jamendo](https://www.jamendo.com) can be saved to your device and played offline. Mantra, the built-in music guide, knows what you're playing and suggests songs you can play with one tap.

## Features

- **Discover**: one search box returns *Songs* (streamed as audio through YouTube) and *Free to keep* tracks (Jamendo). Quick-pick chips help you get started, and the week's popular free tracks show before you search.
- **Audio-only playback**: YouTube songs play through a hidden player. Results are filtered and ranked to favour actual songs (official audio, "Topic" channels, normal song lengths) over videos, live streams and long mixes.
- **Queue**: playing from a list queues the rest of it. You can also use *Play next* and *Add to queue*, remove tracks, or clear what's coming up.
- **Player bar**: play and pause, previous and next, seek, and volume, plus lock-screen and media-key controls through the Media Session API.
- **My downloads**: signed-in listeners can save Jamendo tracks to IndexedDB. A service worker caches the app shell so saved tracks play with no connection.
- **Sign in**: Netlify Identity with Google or email and password. Downloading requires an account.
- **Ask Mantra**: an AI music guide (Claude via Netlify AI Gateway) that knows the current song and queue.

## Tech stack

- TanStack Start (React 19, TanStack Router) and Vite
- Tailwind CSS 4 with shadcn/ui components
- Netlify Identity (`@netlify/identity`)
- Netlify AI Gateway (`@anthropic-ai/sdk`)
- YouTube IFrame Player API and the Jamendo API v3
- IndexedDB and a service worker for offline playback

## Configuration

| Variable            | Required | Purpose                                                                                                    |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `JAMENDO_CLIENT_ID` | yes      | Jamendo API client ID for free tracks and downloads. Already set on the Netlify site.                       |
| `YOUTUBE_API_KEY`   | no       | YouTube Data API v3 key. When it's set, song search uses the official API instead of reading YouTube's results page. |

To show the **Continue with Google** button, enable Google under *Project configuration → Identity → External providers* in Netlify. Email sign-in works without any extra setup.

## Running locally

```bash
pnpm install
netlify dev   # emulates Identity, AI Gateway and site env vars
```

Plain `pnpm dev` also starts the app, but sign-in, Mantra and site environment variables need `netlify dev`.
