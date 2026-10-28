import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Compass, HardDriveDownload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppHeader } from '@/components/app/AppHeader'
import { DiscoverView } from '@/components/app/DiscoverView'
import { DownloadsView } from '@/components/app/DownloadsView'
import { NowPlaying } from '@/components/app/NowPlaying'
import { PlayerBar } from '@/components/app/PlayerBar'
import { MantraChat } from '@/components/app/MantraChat'
import { SignInDialog } from '@/components/app/SignInDialog'
import { useDownloads } from '@/components/player/DownloadsProvider'
import { useOnline } from '@/lib/use-online'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const online = useOnline()
  const [tab, setTab] = useState('discover')
  const [signInOpen, setSignInOpen] = useState(false)
  const { saved } = useDownloads()
  const requireSignIn = () => setSignInOpen(true)

  // Offline visitors land on what they can actually play.
  useEffect(() => {
    if (!online) setTab('downloads')
  }, [online])

  // Cache the app shell so downloads keep playing without a connection.
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <div className="tm-glow min-h-screen pb-32">
      <AppHeader online={online} onSignIn={requireSignIn} />
      <main className="mx-auto grid max-w-content gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Tabs value={tab} onValueChange={setTab} className="min-w-0 gap-6">
          <TabsList className="h-11 rounded-full p-1">
            <TabsTrigger value="discover" className="rounded-full px-4">
              <Compass /> Discover
            </TabsTrigger>
            <TabsTrigger value="downloads" className="rounded-full px-4">
              <HardDriveDownload /> My downloads
              {saved.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {saved.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="discover">
            <DiscoverView online={online} onRequireSignIn={requireSignIn} />
          </TabsContent>
          <TabsContent value="downloads">
            <DownloadsView onBrowse={() => setTab('discover')} onRequireSignIn={requireSignIn} />
          </TabsContent>
          <p className="pt-6 text-xs text-muted-foreground">
            Songs stream as audio through YouTube. Free tracks come from independent artists on{' '}
            <a href="https://www.jamendo.com" className="underline underline-offset-2 hover:text-foreground">
              Jamendo
            </a>{' '}
            and are shared under Creative Commons licenses.
          </p>
        </Tabs>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <NowPlaying />
        </div>
      </main>
      <PlayerBar />
      <MantraChat online={online} />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  )
}
