import { subscribe, type GameEvent } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

// Stream SSE com os eventos da partida (game / participant / answer).
// Substitui as inscrições `postgres_changes` do Supabase Realtime: o cliente
// abre um EventSource nesta rota e recebe cada evento como uma mensagem JSON.
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: GameEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        )
      }

      // Comentário inicial para abrir o stream imediatamente.
      controller.enqueue(encoder.encode(': connected\n\n'))

      const unsubscribe = subscribe(params.id, send)

      // Heartbeat para manter a conexão viva através de proxies.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': ping\n\n'))
      }, 25000)

      // Encerra quando o cliente desconecta.
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
