import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotFoundPage } from '@/components/error-pages'
import { IdentityProvider } from '@/components/IdentityProvider'
import { PlayerProvider } from '@/components/player/PlayerProvider'
import { DownloadsProvider } from '@/components/player/DownloadsProvider'
import { ReactionsProvider } from '@/components/player/ReactionsProvider'
import { PlaylistsProvider } from '@/components/player/PlaylistsProvider'

import '../styles.css'

const siteName = 'TuneMantra: find a song, keep it forever'
const siteDescription =
  'Search any song and listen instantly as audio, queue up what comes next, save free Creative Commons tracks for offline listening, and ask Mantra, your music guide.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: siteName,
      },
      {
        name: 'description',
        content: siteDescription,
      },
      {
        property: 'og:title',
        content: siteName,
      },
      {
        property: 'og:description',
        content: siteDescription,
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      { name: 'theme-color', content: '#1c1410' },
    ],
    links: [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap',
      },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/icon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <TooltipProvider>
          <IdentityProvider>
            <ReactionsProvider>
              <DownloadsProvider>
                <PlaylistsProvider>
                  <PlayerProvider>{children}</PlayerProvider>
                </PlaylistsProvider>
              </DownloadsProvider>
            </ReactionsProvider>
          </IdentityProvider>
        </TooltipProvider>
        <Toaster position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}
