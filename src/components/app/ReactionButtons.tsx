import { Heart, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReactions } from '@/components/player/ReactionsProvider'
import type { Track } from '@/lib/tracks'
import { cn } from '@/lib/utils'

/** Like (thumbs up) and Love (heart) toggles for a song. */
export function ReactionButtons({
  track,
  size = 'icon-sm',
  className,
}: {
  track: Track
  size?: 'icon-sm' | 'icon'
  className?: string
}) {
  const { reactionOf, react } = useReactions()
  const reaction = reactionOf(track.id)
  const liked = reaction === 'like'
  const loved = reaction === 'love'
  return (
    <div className={cn('flex items-center', className)}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => react(track, 'like')}
        aria-pressed={liked}
        aria-label={liked ? `Remove like from ${track.title}` : `Like ${track.title}`}
        title={liked ? 'Liked' : 'Like'}
        className={cn(liked ? 'text-saffron' : 'text-muted-foreground')}
      >
        <ThumbsUp className={cn(liked && 'fill-current')} />
      </Button>
      <Button
        variant="ghost"
        size={size}
        onClick={() => react(track, 'love')}
        aria-pressed={loved}
        aria-label={loved ? `Remove love from ${track.title}` : `Love ${track.title}`}
        title={loved ? 'Loved' : 'Love'}
        className={cn(loved ? 'text-primary' : 'text-muted-foreground')}
      >
        <Heart className={cn(loved && 'fill-current')} />
      </Button>
    </div>
  )
}
