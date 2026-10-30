import { useState } from 'react'
import { ChevronDown, ChevronUp, ListMusic, MoreHorizontal, Pencil, Play, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { usePlayer } from '@/components/player/PlayerProvider'
import { usePlaylists } from '@/components/player/PlaylistsProvider'
import { TrackRow } from './TrackRow'

interface PlaylistDetailProps {
  playlistId: string
  onRequireSignIn: () => void
  onBack: () => void
  onDeleted: () => void
}

export function PlaylistDetail({ playlistId, onRequireSignIn, onBack, onDeleted }: PlaylistDetailProps) {
  const { getById, rename, remove, removeTrack, moveTrack, ready } = usePlaylists()
  const player = usePlayer()
  const playlist = getById(playlistId)
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(playlist?.name ?? '')

  if (!ready) {
    return <div className="h-32 animate-pulse rounded-xl bg-muted" />
  }

  if (!playlist) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-muted-foreground">This playlist was removed.</p>
        <Button className="mt-4 rounded-full" onClick={onBack}>
          Back to library
        </Button>
      </div>
    )
  }

  const tracks = playlist.tracks

  const saveName = () => {
    void rename(playlist.id, nameDraft)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid size-20 place-items-center rounded-lg bg-gradient-to-br from-primary/70 to-saffron/50 shadow-lg sm:size-28">
          <ListMusic className="size-10 text-primary-foreground sm:size-14" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Playlist</p>
          {editing ? (
            <form
              className="mt-1 flex max-w-md gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                saveName()
              }}
            >
              <Input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-10 rounded-lg"
                autoFocus
              />
              <Button type="submit" size="sm" className="rounded-full">
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{playlist.name}</h1>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {tracks.length} song{tracks.length === 1 ? '' : 's'} · on this device
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tracks.length > 0 && (
            <Button className="rounded-full" onClick={() => player.play(tracks[0], tracks)}>
              <Play /> Play all
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full" aria-label="Playlist options">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setNameDraft(playlist.name)
                  setEditing(true)
                }}
              >
                <Pencil /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void remove(playlist.id).then(onDeleted)
                }}
              >
                <Trash2 /> Delete playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            This playlist is empty. Use <strong>Add to playlist</strong> on any song.
          </p>
          <Button className="mt-4 rounded-full" variant="secondary" onClick={onBack}>
            Back to library
          </Button>
        </div>
      ) : (
        <ul className="space-y-0.5">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              list={tracks}
              position={i + 1}
              onRequireSignIn={onRequireSignIn}
              trailing={
                <span className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === 0}
                    aria-label="Move up"
                    onClick={() => void moveTrack(playlist.id, track.id, -1)}
                  >
                    <ChevronUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={i === tracks.length - 1}
                    aria-label="Move down"
                    onClick={() => void moveTrack(playlist.id, track.id, 1)}
                  >
                    <ChevronDown />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${track.title} from playlist`}
                    onClick={() => void removeTrack(playlist.id, track.id)}
                  >
                    <Trash2 />
                  </Button>
                </span>
              }
            />
          ))}
        </ul>
      )}
    </div>
  )
}

interface LibraryViewProps {
  onRequireSignIn: () => void
  onOpenPlaylist: (id: string) => void
  onBrowse: () => void
}

export function LibraryView({ onRequireSignIn, onOpenPlaylist, onBrowse }: LibraryViewProps) {
  const { playlists, ready, create } = usePlaylists()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const pl = await create(name)
    setName('')
    setCreating(false)
    onOpenPlaylist(pl.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Your Library</h1>
          <p className="mt-1 text-muted-foreground">
            Playlists stay on this device. Liked songs and downloads are in the sidebar.
          </p>
        </div>
        {!creating ? (
          <Button className="rounded-full" onClick={() => setCreating(true)}>
            Create playlist
          </Button>
        ) : (
          <form onSubmit={(e) => void submitCreate(e)} className="flex flex-wrap gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="h-10 w-48 rounded-full"
              autoFocus
            />
            <Button type="submit" className="rounded-full">
              Create
            </Button>
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </form>
        )}
      </div>

      {!ready && <div className="h-24 animate-pulse rounded-xl bg-muted" />}

      {ready && playlists.length === 0 && (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <ListMusic className="mx-auto size-10 text-primary" aria-hidden />
          <h2 className="mt-4 font-display text-xl font-bold">Create your first playlist</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Save mixes on this device, then add songs from search or Home with “Add to playlist”.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button className="rounded-full" onClick={() => setCreating(true)}>
              Create playlist
            </Button>
            <Button variant="outline" className="rounded-full" onClick={onBrowse}>
              Discover music
            </Button>
          </div>
        </div>
      )}

      {ready && playlists.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {playlists.map((pl) => (
            <li key={pl.id}>
              <button
                type="button"
                onClick={() => onOpenPlaylist(pl.id)}
                className="flex w-full items-center gap-3 rounded-xl bg-card/50 p-3 text-left transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="grid size-14 place-items-center rounded-md bg-gradient-to-br from-primary/50 to-saffron/40">
                  <ListMusic className="size-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pl.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pl.tracks.length} song{pl.tracks.length === 1 ? '' : 's'}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* keep prop used for future gated actions */}
      <span className="sr-only">{onRequireSignIn ? 'ready' : ''}</span>
    </div>
  )
}
