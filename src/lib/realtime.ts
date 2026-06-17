import 'server-only'
import { EventEmitter } from 'events'

// Substitui o Realtime do Supabase (postgres_changes) por um event bus em
// memória dentro do processo Next.js. Cada partida (gameId) tem seu próprio
// canal; as rotas de API publicam eventos e a rota SSE os retransmite aos
// clientes conectados.
//
// Premissa: a app roda em UM único processo Node (next dev / next start). Para
// uso interno/local isso é suficiente — não há serverless nem múltiplos workers.

export type GameEvent =
  | { type: 'game'; payload: any }
  | { type: 'participant'; payload: any }
  | { type: 'answer'; payload: any }
  | { type: 'kick'; payload: { participantId: string } }

const globalForBus = globalThis as unknown as { gameBus?: EventEmitter }

const bus =
  globalForBus.gameBus ??
  (() => {
    const e = new EventEmitter()
    // Muitos jogadores podem assistir a mesma partida.
    e.setMaxListeners(0)
    return e
  })()

globalForBus.gameBus = bus

/** Publica um evento para todos os inscritos de uma partida. */
export function publish(gameId: string, event: GameEvent) {
  bus.emit(gameId, event)
}

/** Inscreve um listener nos eventos de uma partida. Retorna o "unsubscribe". */
export function subscribe(
  gameId: string,
  listener: (event: GameEvent) => void
): () => void {
  bus.on(gameId, listener)
  return () => bus.off(gameId, listener)
}
