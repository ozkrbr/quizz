'use client'

import {
  createGame,
  fetchQuizSetForGame,
  fetchResults,
  getUserId,
} from '@/lib/api'
import { GameResult } from '@/types/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const MEDAL = ['🥇', '🥈', '🥉']

function exportCsv(quizName: string, results: GameResult[]) {
  const header = 'Posicao,Apelido,Pontos'
  const rows = results.map(
    (r, i) =>
      `${i + 1},"${(r.nickname ?? '').replace(/"/g, '""')}",${r.total_score}`
  )
  const csv = '﻿' + [header, ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `placar-${quizName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function PlacarPartida({
  params: { id },
}: {
  params: { id: string }
}) {
  const [results, setResults] = useState<GameResult[]>([])
  const [quizName, setQuizName] = useState('')
  const [quizSetId, setQuizSetId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchResults(id),
      fetchQuizSetForGame(id).catch(() => null),
    ])
      .then(([res, quiz]) => {
        setResults(res)
        setQuizName(quiz?.name ?? '')
        setQuizSetId(quiz?.id ?? null)
      })
      .catch(() => alert('Não foi possível carregar o placar'))
      .finally(() => setLoading(false))
  }, [id])

  const playAgain = async () => {
    if (!quizSetId) return
    setStarting(true)
    try {
      const game = await createGame(quizSetId, getUserId())
      window.open(`/host/game/${game.id}`, '_blank', 'noopener,noreferrer')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setStarting(false)
    }
  }

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

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gradient">
            Placar final
          </h1>
          {quizName && <p className="mt-1 text-white/60">{quizName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv(quizName || 'quizz', results)}
            disabled={results.length === 0}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
            Exportar CSV
          </button>
          <button
            onClick={playAgain}
            disabled={!quizSetId || starting}
            className="btn-brand py-2 text-sm"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            {starting ? 'Iniciando…' : 'Jogar de novo'}
          </button>
        </div>
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
