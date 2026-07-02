'use client'

import { QuizSet } from '@/types/types'
import { createGame, deleteQuizSet, fetchQuizSets, getUserId } from '@/lib/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const getQuizSets = async () => {
      try {
        setQuizSet(await fetchQuizSets())
      } catch (e) {
        alert('Não foi possível carregar os quizzes')
      } finally {
        setLoading(false)
      }
    }
    getQuizSets()
  }, [])

  const startGame = async (quizSetId: string) => {
    try {
      const game = await createGame(quizSetId, getUserId())
      window.open(`/host/game/${game.id}`, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.error(e)
      alert('Não foi possível iniciar a partida')
    }
  }

  const onDelete = async (quiz: QuizSet) => {
    if (
      !confirm(
        `Excluir o quiz "${quiz.name}"? Esta ação não pode ser desfeita.`
      )
    )
      return
    setDeletingId(quiz.id)
    try {
      await deleteQuizSet(quiz.id)
      setQuizSet((qs) => qs.filter((q) => q.id !== quiz.id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const gradients = [
    'from-amber-400 to-brand-700',
    'from-orange-400 to-red-700',
    'from-yellow-400 to-brand-700',
    'from-amber-400 to-orange-600',
    'from-rose-500 to-brand-800',
    'from-orange-400 to-brand-900',
  ]

  return (
    <div className="animate-fade-up">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            Seus quizzes
          </h1>
          <p className="mt-1 text-white/60">
            Crie, edite e inicie partidas ao vivo.
          </p>
        </div>
        <Link href="/host/dashboard/quizzes/new" className="btn-brand shrink-0 py-2.5 text-base">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
          Novo quiz
        </Link>
      </div>

      {loading && (
        <div className="glass rounded-2xl p-10 text-center text-white/60">
          Carregando quizzes…
        </div>
      )}

      {!loading && quizSet.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="font-display text-xl font-bold text-white">
            Nenhum quiz ainda
          </p>
          <p className="mt-1 text-white/60">
            Crie seu primeiro quiz para começar a jogar.
          </p>
          <Link
            href="/host/dashboard/quizzes/new"
            className="btn-brand mt-5 inline-flex text-base"
          >
            Criar quiz
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quizSet.map((quizSet, i) => (
          <div
            key={quizSet.id}
            className="group glass flex flex-col overflow-hidden rounded-2xl transition hover:-translate-y-1 hover:shadow-glow"
          >
            <div
              className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${
                gradients[i % gradients.length]
              }`}
            >
              <span className="font-display text-5xl font-extrabold text-white/90 drop-shadow">
                {quizSet.name.charAt(0).toUpperCase()}
              </span>
              <span className="absolute bottom-2 right-2 rounded-full bg-black/30 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                {quizSet.questions.length} perguntas
              </span>
            </div>

            <div className="flex flex-grow flex-col justify-between gap-4 p-4">
              <h2 className="font-display text-lg font-bold leading-snug text-white">
                {quizSet.name}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  className="btn-brand flex-grow text-base"
                  onClick={() => startGame(quizSet.id)}
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Iniciar
                </button>
                <Link
                  href={`/host/dashboard/quizzes/${quizSet.id}/edit`}
                  title="Editar"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                  </svg>
                </Link>
                <button
                  onClick={() => onDelete(quizSet)}
                  disabled={deletingId === quizSet.id}
                  title="Excluir"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/60 transition hover:bg-red-500/30 hover:text-red-200 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-7 0 1 12h6l1-12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
