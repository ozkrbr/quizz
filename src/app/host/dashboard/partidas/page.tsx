'use client'

import { deleteGame, fetchGames, type GameSummary } from '@/lib/api'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'

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
  const [showAll, setShowAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchGames()
      .then(setGames)
      .catch(() => alert('Não foi possível carregar as partidas'))
      .finally(() => setLoading(false))
  }, [])

  const hiddenCount = useMemo(
    () => games.filter((g) => Number(g.participant_count) === 0).length,
    [games]
  )
  const visible = useMemo(
    () =>
      showAll ? games : games.filter((g) => Number(g.participant_count) > 0),
    [games, showAll]
  )

  const onDelete = async (e: React.MouseEvent, g: GameSummary) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Excluir esta partida de "${g.quiz_name}"?`)) return
    setDeletingId(g.id)
    try {
      await deleteGame(g.id)
      setGames((gs) => gs.filter((x) => x.id !== g.id))
    } catch (err: any) {
      alert(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Partidas anteriores
          </h1>
          <p className="mt-1 text-white/60">
            Reveja os placares finais das partidas já realizadas.
          </p>
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/20"
          >
            {showAll
              ? 'Ocultar vazias'
              : `Mostrar todas (+${hiddenCount} vazias)`}
          </button>
        )}
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center text-white/60">
          Carregando partidas…
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="font-display text-xl font-bold text-white">
            Nenhuma partida com jogadores ainda
          </p>
          <p className="mt-1 text-white/60">
            Inicie uma partida em <strong>Início</strong> para vê-la aqui.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((g) => {
          const phase = PHASE[g.phase] ?? PHASE.lobby
          return (
            <Link
              key={g.id}
              href={`/host/dashboard/partidas/${g.id}`}
              className="glass group flex items-center gap-4 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-glow"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-brand-700 font-display text-xl font-extrabold text-white">
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
              <button
                onClick={(e) => onDelete(e, g)}
                disabled={deletingId === g.id}
                title="Excluir partida"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-red-500/30 hover:text-red-200 disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-7 0 1 12h6l1-12" />
                </svg>
              </button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
