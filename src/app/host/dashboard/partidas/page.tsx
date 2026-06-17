'use client'

import { fetchGames, type GameSummary } from '@/lib/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const PHASE: Record<string, { label: string; cls: string }> = {
  result: { label: 'Finalizada', cls: 'bg-emerald-500/20 text-emerald-200' },
  quiz: { label: 'Em andamento', cls: 'bg-amber-500/20 text-amber-200' },
  lobby: { label: 'Não iniciada', cls: 'bg-white/10 text-white/60' },
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export default function PartidasAnteriores() {
  const [games, setGames] = useState<GameSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(() => alert('Não foi possível carregar as partidas'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold text-white">
          Partidas anteriores
        </h1>
        <p className="mt-1 text-white/60">
          Reveja os placares finais das partidas já realizadas.
        </p>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center text-white/60">
          Carregando partidas…
        </div>
      )}

      {!loading && games.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="font-display text-xl font-bold text-white">
            Nenhuma partida ainda
          </p>
          <p className="mt-1 text-white/60">
            Inicie uma partida em <strong>Início</strong> para vê-la aqui.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {games.map((g) => {
          const phase = PHASE[g.phase] ?? PHASE.lobby
          return (
            <Link
              key={g.id}
              href={`/host/dashboard/partidas/${g.id}`}
              className="glass flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-brand-600 font-display text-xl font-extrabold text-white">
                {g.quiz_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-grow">
                <h2 className="truncate font-display font-bold text-white">
                  {g.quiz_name}
                </h2>
                <p className="text-sm text-white/50">
                  {formatDate(g.created_at)} · {g.participant_count}{' '}
                  {Number(g.participant_count) === 1 ? 'jogador' : 'jogadores'}
                  {g.winner_nickname ? ` · 🏆 ${g.winner_nickname}` : ''}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${phase.cls}`}
              >
                {phase.label}
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-5 w-5 shrink-0 text-white/40"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
              </svg>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
