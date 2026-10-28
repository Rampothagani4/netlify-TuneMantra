import { createFileRoute } from '@tanstack/react-router'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const input = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20),
  nowPlaying: z
    .object({ title: z.string().max(300), artist: z.string().max(300), source: z.string().max(20) })
    .nullable()
    .optional(),
  queue: z.array(z.string().max(300)).max(20).optional(),
})

const SYSTEM = `You are Mantra, the friendly music guide inside TuneMantra, a music player.
Keep replies short (2-5 sentences), warm and specific. You know a lot about artists, genres, history, moods and lyrics' themes (never reproduce full lyrics).
When recommending music, end your reply with a line exactly like:
SEARCH: <query 1> | <query 2> | <query 3>
using 1-3 concrete "artist song" search queries the listener can tap to play. Omit the SEARCH line if you are not recommending anything.`

export const Route = createFileRoute('/api/mantra')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ error: 'Invalid JSON' }, { status: 400 })
        }
        const parsed = input.safeParse(body)
        if (!parsed.success) return Response.json({ error: 'A message is required' }, { status: 400 })
        const { messages, nowPlaying, queue } = parsed.data
        const context = [
          nowPlaying
            ? `The listener is currently playing "${nowPlaying.title}" by ${nowPlaying.artist}.`
            : 'Nothing is playing right now.',
          queue?.length ? `Up next in their queue: ${queue.join('; ')}.` : '',
        ]
          .filter(Boolean)
          .join(' ')
        try {
          const anthropic = new Anthropic()
          const message = await anthropic.messages.create({
            model: 'claude-haiku-5-5',
            max_tokens: 500,
            system: `${SYSTEM}\n\nContext: ${context}`,
            messages,
          })
          const text = message.content
            .map((block) => (block.type === 'text' ? block.text : ''))
            .join('')
            .trim()
          const searchLine = text.match(/^SEARCH:\s*(.+)$/m)
          const searches = searchLine
            ? searchLine[1]
                .split('|')
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 3)
            : []
          const reply = text.replace(/^SEARCH:.*$/m, '').trim()
          return Response.json({ reply, searches })
        } catch (error) {
          console.error('Mantra failed', error)
          return Response.json({ error: 'Mantra is resting. Try again in a moment.' }, { status: 502 })
        }
      },
    },
  },
})
