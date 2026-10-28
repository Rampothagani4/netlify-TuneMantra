import { HardDriveDownload, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDownloads } from '@/components/player/DownloadsProvider'
import { usePlayer } from '@/components/player/PlayerProvider'
import { useIdentity } from '@/components/IdentityProvider'
import { TrackListSkeleton, TrackRow } from './TrackRow'

export function DownloadsView({ onBrowse, onRequireSignIn }: { onBrowse: () => void; onRequireSignIn: () => void }) {
  const { saved, ready, remove } = useDownloads()
  const { user } = useIdentity()
  const player = usePlayer()
  const tracks = saved.map((s) => s.track)
  const totalMb = saved.reduce((sum, s) => sum + s.blob.size, 0) / 1024 / 1024

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">My downloads</h1>
          <p className="mt-2 text-muted-foreground">
            {saved.length
              ? `${saved.length} track${saved.length === 1 ? '' : 's'} on this device · ${totalMb.toFixed(1)} MB · plays without internet`
              : 'Tracks you save live on this device and play without internet.'}
          </p>
        </div>
        {tracks.length > 0 && (
          <Button onClick={() => player.play(tracks[0], tracks)} className="rounded-full">
            <Play /> Play all
          </Button>
        )}
      </div>

      {!ready && <TrackListSkeleton rows={3} />}

      {ready && !saved.length && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <HardDriveDownload className="mx-auto size-10 text-saffron" aria-hidden />
          <h2 className="mt-4 font-display text-xl font-bold">Nothing saved yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Look for the download button on tracks under “Free to keep”. They're Creative Commons, so you can
            keep them forever.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={onBrowse} className="rounded-full">
              Browse free music
            </Button>
            {!user && (
              <Button variant="outline" onClick={onRequireSignIn} className="rounded-full">
                Sign in
              </Button>
            )}
          </div>
        </div>
      )}

      {ready && saved.length > 0 && (
        <ul className="space-y-0.5">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              list={tracks}
              position={i + 1}
              onRequireSignIn={onRequireSignIn}
              trailing={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${track.title} from this device`}
                  onClick={() => void remove(track.id)}
                >
                  <Trash2 />
                </Button>
              }
            />
          ))}
        </ul>
      )}
    </section>
  )
}
