'use client'

import type {
  Answer,
  Game,
  GameResult,
  Participant,
  QuizSet,
} from '@/types/types'

// Camada de acesso do cliente: substitui o supabase-js por chamadas às rotas
// de API (fetch) e o Realtime por um EventSource (SSE).

// Espelha o tipo de evento publicado pelo servidor (src/lib/realtime.ts).
export type GameEvent =
  | { type: 'game'; payload: Game }
  | { type: 'participant'; payload: Participant }
  | { type: 'answer'; payload: Answer }
  | { type: 'kick'; payload: { participantId: string } }

/** Gera um UUID v4. Usa crypto.randomUUID quando disponível (contexto seguro:
 *  HTTPS ou localhost) e cai para getRandomValues / Math.random caso contrário.
 *  Necessário porque crypto.randomUUID NÃO existe em HTTP puro (ex.: acessar a
 *  app por http://IP:porta numa EC2). */
function uuid(): string {
  const c: Crypto | undefined = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()

  const bytes = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40 // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante RFC 4122
  const h = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`
}

/** UUID estável por navegador, guardado no localStorage. Substitui o login
 *  anônimo do Supabase (auth.signInAnonymously). */
export function getUserId(): string {
  const KEY = 'kahoot_user_id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(KEY, id)
  }
  return id
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Erro ${res.status}`)
  }
  return res.json()
}

// ---- Quiz sets ----

// Forma da entrada do editor (criar/editar quiz).
export type QuizChoiceInput = { body: string; is_correct: boolean }
export type QuizQuestionInput = {
  body: string
  image_url?: string | null
  choices: QuizChoiceInput[]
}
export type QuizSetInput = {
  name: string
  description?: string | null
  answer_time?: number
  auto_advance?: boolean
  questions: QuizQuestionInput[]
}

export async function fetchQuizSets(): Promise<QuizSet[]> {
  return json(await fetch('/api/quiz-sets'))
}

export async function fetchQuizSet(id: string): Promise<QuizSet> {
  return json(await fetch(`/api/quiz-sets/${id}`))
}

export async function createQuizSet(input: QuizSetInput): Promise<QuizSet> {
  return json(
    await fetch('/api/quiz-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  )
}

export async function updateQuizSet(
  id: string,
  input: QuizSetInput
): Promise<QuizSet> {
  return json(
    await fetch(`/api/quiz-sets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  )
}

export async function deleteQuizSet(id: string): Promise<void> {
  await json(await fetch(`/api/quiz-sets/${id}`, { method: 'DELETE' }))
}

// ---- Games ----

// Resumo de partida para a listagem "Partidas anteriores".
export type GameSummary = {
  id: string
  created_at: string
  phase: string
  quiz_set_id: string
  quiz_name: string
  participant_count: number
  winner_nickname: string | null
}

export async function fetchGames(): Promise<GameSummary[]> {
  return json(await fetch('/api/games'))
}

export async function createGame(
  quizSetId: string,
  hostUserId: string
): Promise<Game> {
  return json(
    await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quiz_set_id: quizSetId, host_user_id: hostUserId }),
    })
  )
}

export async function fetchGame(gameId: string): Promise<Game> {
  return json(await fetch(`/api/games/${gameId}`))
}

export async function deleteGame(gameId: string): Promise<void> {
  await json(await fetch(`/api/games/${gameId}`, { method: 'DELETE' }))
}

export async function updateGame(
  gameId: string,
  patch: Partial<
    Pick<Game, 'phase' | 'current_question_sequence' | 'is_answer_revealed'>
  >
): Promise<Game> {
  return json(
    await fetch(`/api/games/${gameId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  )
}

export async function fetchQuizSetForGame(gameId: string): Promise<QuizSet> {
  return json(await fetch(`/api/games/${gameId}/quiz-set`))
}

// ---- Participants ----
export async function fetchParticipants(
  gameId: string
): Promise<Participant[]> {
  return json(await fetch(`/api/games/${gameId}/participants`))
}

export async function fetchMyParticipant(
  gameId: string,
  userId: string
): Promise<Participant | null> {
  return json(
    await fetch(`/api/games/${gameId}/participants?userId=${userId}`)
  )
}

export async function kickParticipant(participantId: string): Promise<void> {
  await json(await fetch(`/api/participants/${participantId}`, { method: 'DELETE' }))
}

export async function joinGame(
  gameId: string,
  nickname: string,
  userId: string
): Promise<Participant> {
  return json(
    await fetch(`/api/games/${gameId}/participants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, user_id: userId }),
    })
  )
}

// ---- Answers ----
export async function submitAnswer(input: {
  gameId: string
  participantId: string
  questionId: string
  choiceId: string
  score: number
}): Promise<Answer> {
  return json(
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        game_id: input.gameId,
        participant_id: input.participantId,
        question_id: input.questionId,
        choice_id: input.choiceId,
        score: input.score,
      }),
    })
  )
}

// ---- Results ----
export async function fetchResults(gameId: string): Promise<GameResult[]> {
  return json(await fetch(`/api/games/${gameId}/results`))
}

// ---- Realtime (SSE) ----
/** Abre um EventSource nos eventos da partida. Retorna a função de cleanup.
 *  Substitui supabase.channel(...).on('postgres_changes', ...). */
export function subscribeToGame(
  gameId: string,
  onEvent: (event: GameEvent) => void
): () => void {
  const source = new EventSource(`/api/games/${gameId}/events`)
  source.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data) as GameEvent)
    } catch {
      // ignora comentários/heartbeats
    }
  }
  return () => source.close()
}
