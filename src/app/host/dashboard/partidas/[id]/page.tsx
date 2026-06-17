'use client'

import { fetchQuizSetForGame, fetchResults } from '@/lib/api'
import { GameResult } from '@/types/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const MEDAL = ['🥇', '🥈', '🥉']

export default function PlacarPartida({
  params: { id },
}: {
  params: { id: string }
}) {
  const [results, setResults] = useState<GameResult[]>([])
  const [quizName, setQuizName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchResults(id),
      fetchQuizSetForGame(id)
        .then((q) => q.name)
        .catch(() => ''),
    ])
      .then(([res, name]) => {
        setResults(res)
        setQuizName(name)
      })
      .catch(() => alert('Não foi possível carregar o placar'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="animate-fade-up">
      <Link
        href="/host/dashboard/partidas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 transition hover:text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 19-7-7 7-7" />
        </svg>
        Partidas anteriores
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-gradient">
          Placar final
        </h1>
        {quizName && <p className="mt-1 text-white/60">{quizName}</p>}
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center text-white/60">
          Carregando placar…
        </div>
      )}

      {!loading && results.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center text-white/60">
          Nenhuma resposta foi registrada nesta partida.
        </div>
      )}

      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={r.participant_id}
            className={`glass flex items-center gap-4 rounded-2xl px-5 py-3 ${
              i < 3 ? 'ring-1 ring-brand-400/40' : ''
            }`}
          >
            <span className="w-8 text-center font-display text-lg font-bold text-white/60">
              {i < 3 ? MEDAL[i] : i + 1}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 font-display font-bold text-white">
              {r.nickname?.charAt(0).toUpperCase()}
            </span>
            <span className="flex-grow truncate font-display font-bold text-white">
              {r.nickname}
            </span>
            <span className="font-display font-bold text-brand-200">
              {r.total_score} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
