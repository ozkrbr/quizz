import { GameResult, Participant, QuizSet } from '@/types/types'
import { fetchResults } from '@/lib/api'
import { Brand } from '@/components/Brand'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'

export default function Results({
  quizSet,
  gameId,
}: {
  participants: Participant[]
  quizSet: QuizSet
  gameId: string
}) {
  const [gameResults, setGameResults] = useState<GameResult[]>([])

  const { width, height } = useWindowSize()

  useEffect(() => {
    const getResults = async () => {
      try {
        setGameResults(await fetchResults(gameId))
      } catch (e: any) {
        return alert(e.message)
      }
    }
    getResults()
  }, [gameId])

  const podium = gameResults.slice(0, 3)
  const rest = gameResults.slice(3)

  // Ordem visual do pódio: 2º, 1º, 3º.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean)
  const meta: Record<
    number,
    { height: string; ring: string; badge: string; emoji: string }
  > = {
    0: { height: 'h-44', ring: 'ring-yellow-300', badge: 'bg-yellow-400 text-yellow-950', emoji: '🥇' },
    1: { height: 'h-32', ring: 'ring-slate-200', badge: 'bg-slate-300 text-slate-800', emoji: '🥈' },
    2: { height: 'h-24', ring: 'ring-amber-500', badge: 'bg-amber-500 text-amber-950', emoji: '🥉' },
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Confetti width={width} height={height} recycle numberOfPieces={180} />

      <header className="flex items-center justify-between gap-3 px-6 py-5">
        <Link href="/host/dashboard" title="Voltar ao menu">
          <Brand />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full bg-white/10 px-4 py-2 font-display text-sm font-bold text-white/80 sm:block">
            {quizSet.name}
          </span>
          <Link
            href="/host/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 font-display text-sm font-bold text-white transition hover:bg-white/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
            </svg>
            Voltar ao menu
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pb-12">
        <h1 className="text-center font-display text-4xl font-extrabold text-gradient">
          Placar final
        </h1>

        {/* Pódio */}
        <div className="mt-10 flex items-end justify-center gap-3 sm:gap-5">
          {podiumOrder.map((result) => {
            const rank = gameResults.indexOf(result)
            const m = meta[rank]
            return (
              <div
                key={result.participant_id}
                className="flex w-24 animate-fade-up flex-col items-center sm:w-32"
              >
                <div className="mb-2 text-3xl">{m.emoji}</div>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display text-xl font-extrabold text-white shadow-glow ring-4 ${m.ring}`}
                >
                  {result.nickname?.charAt(0).toUpperCase()}
                </div>
                <div className="mt-2 max-w-full truncate font-display font-bold text-white">
                  {result.nickname}
                </div>
                <div className="text-sm font-bold text-white/60">
                  {result.total_score} pts
                </div>
                <div
                  className={`mt-2 flex w-full ${m.height} items-start justify-center rounded-t-2xl glass pt-3 font-display text-3xl font-extrabold text-white`}
                >
                  {rank + 1}
                </div>
              </div>
            )
          })}
        </div>

        {/* Demais colocações */}
        {rest.length > 0 && (
          <div className="mt-8 space-y-2">
            {rest.map((result, i) => (
              <div
                key={result.participant_id}
                className="glass flex items-center gap-4 rounded-2xl px-5 py-3"
              >
                <span className="w-8 text-center font-display text-lg font-bold text-white/50">
                  {i + 4}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-display font-bold text-white">
                  {result.nickname?.charAt(0).toUpperCase()}
                </span>
                <span className="flex-grow font-display font-bold text-white">
                  {result.nickname}
                </span>
                <span className="font-display font-bold text-brand-200">
                  {result.total_score} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {gameResults.length === 0 && (
          <p className="mt-10 text-center text-white/50">
            Nenhuma resposta registrada.
          </p>
        )}
      </div>
    </div>
  )
}
