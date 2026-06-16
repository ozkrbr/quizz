'use client'

import { QuizSet } from '@/types/types'
import {
  createQuizSet,
  updateQuizSet,
  type QuizSetInput,
} from '@/lib/api'
import { AnswerShape, answerColor } from '@/components/AnswerShape'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

const MAX_CHOICES = 4

type ChoiceForm = { body: string; is_correct: boolean }
type QuestionForm = { body: string; image_url: string; choices: ChoiceForm[] }

function emptyChoice(): ChoiceForm {
  return { body: '', is_correct: false }
}
function emptyQuestion(): QuestionForm {
  return { body: '', image_url: '', choices: [emptyChoice(), emptyChoice()] }
}

function fromQuizSet(quiz: QuizSet): {
  name: string
  description: string
  questions: QuestionForm[]
} {
  return {
    name: quiz.name,
    description: quiz.description ?? '',
    questions: (quiz.questions ?? []).map((q) => ({
      body: q.body,
      image_url: q.image_url ?? '',
      choices: q.choices.map((c) => ({
        body: c.body,
        is_correct: c.is_correct,
      })),
    })),
  }
}

export default function QuizEditor({ initial }: { initial?: QuizSet }) {
  const router = useRouter()
  const isEdit = !!initial

  const seed = initial
    ? fromQuizSet(initial)
    : { name: '', description: '', questions: [emptyQuestion()] }

  const [name, setName] = useState(seed.name)
  const [description, setDescription] = useState(seed.description)
  const [questions, setQuestions] = useState<QuestionForm[]>(seed.questions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helpers de mutação imutável das perguntas.
  const patchQuestion = (qi: number, patch: Partial<QuestionForm>) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)))

  const patchChoice = (qi: number, ci: number, patch: Partial<ChoiceForm>) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? {
              ...q,
              choices: q.choices.map((c, j) =>
                j === ci ? { ...c, ...patch } : c
              ),
            }
          : q
      )
    )

  const addQuestion = () =>
    setQuestions((qs) => [...qs, emptyQuestion()])
  const removeQuestion = (qi: number) =>
    setQuestions((qs) => qs.filter((_, i) => i !== qi))
  const addChoice = (qi: number) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi && q.choices.length < MAX_CHOICES
          ? { ...q, choices: [...q.choices, emptyChoice()] }
          : q
      )
    )
  const removeChoice = (qi: number, ci: number) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi ? { ...q, choices: q.choices.filter((_, j) => j !== ci) } : q
      )
    )

  const onSave = async () => {
    setError(null)
    const payload: QuizSetInput = {
      name,
      description,
      questions: questions.map((q) => ({
        body: q.body,
        image_url: q.image_url || null,
        choices: q.choices,
      })),
    }
    setSaving(true)
    try {
      if (isEdit) await updateQuizSet(initial!.id, payload)
      else await createQuizSet(payload)
      router.push('/host/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-up pb-28">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-white">
            {isEdit ? 'Editar quiz' : 'Novo quiz'}
          </h1>
          <p className="mt-1 text-white/60">
            Monte as perguntas e marque a alternativa correta de cada uma.
          </p>
        </div>
        <Link
          href="/host/dashboard"
          className="rounded-xl px-4 py-2 font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Cancelar
        </Link>
      </div>

      {/* Dados do quiz */}
      <div className="glass space-y-4 rounded-2xl p-5">
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">
            Nome do quiz
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Quiz de boas-vindas"
            maxLength={120}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-display text-lg font-bold text-white outline-none transition focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-white/70">
            Descrição (opcional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Um resumo curto do quiz"
            maxLength={200}
            className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-white outline-none transition focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
      </div>

      {/* Perguntas */}
      <div className="mt-6 space-y-5">
        {questions.map((q, qi) => (
          <div key={qi} className="glass rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex h-8 items-center rounded-full bg-brand-500/30 px-3 font-display text-sm font-bold text-brand-100">
                Pergunta {qi + 1}
              </span>
              <button
                onClick={() => removeQuestion(qi)}
                disabled={questions.length === 1}
                className="rounded-lg p-2 text-white/50 transition hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                title="Remover pergunta"
              >
                <TrashIcon />
              </button>
            </div>

            <textarea
              value={q.body}
              onChange={(e) => patchQuestion(qi, { body: e.target.value })}
              placeholder="Digite o enunciado da pergunta"
              rows={2}
              className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-4 py-3 font-display text-lg font-bold text-white outline-none transition focus:ring-2 focus:ring-brand-500/60"
            />

            <input
              value={q.image_url}
              onChange={(e) => patchQuestion(qi, { image_url: e.target.value })}
              placeholder="URL de imagem (opcional)"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80 outline-none transition focus:ring-2 focus:ring-brand-500/40"
            />

            {/* Alternativas */}
            <div className="mt-4 space-y-2">
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      answerColor(ci).bg
                    }`}
                  >
                    <AnswerShape index={ci} className="h-5 w-5" />
                  </span>
                  <input
                    value={c.body}
                    onChange={(e) =>
                      patchChoice(qi, ci, { body: e.target.value })
                    }
                    placeholder={`Alternativa ${ci + 1}`}
                    maxLength={120}
                    className="min-w-0 flex-grow rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 font-medium text-white outline-none transition focus:ring-2 focus:ring-brand-500/60"
                  />
                  <button
                    onClick={() =>
                      patchChoice(qi, ci, { is_correct: !c.is_correct })
                    }
                    title={c.is_correct ? 'Correta' : 'Marcar como correta'}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                      c.is_correct
                        ? 'border-emerald-400 bg-emerald-500/90 text-white'
                        : 'border-white/15 bg-black/20 text-white/40 hover:text-white/80'
                    }`}
                  >
                    <CheckIcon />
                  </button>
                  <button
                    onClick={() => removeChoice(qi, ci)}
                    disabled={q.choices.length <= 2}
                    className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-white/40 transition hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-20"
                    title="Remover alternativa"
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>

            {q.choices.length < MAX_CHOICES && (
              <button
                onClick={() => addChoice(qi)}
                className="mt-3 flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-200 transition hover:text-brand-100"
              >
                <PlusIcon /> Adicionar alternativa
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="glass mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-dashed py-4 font-display font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
      >
        <PlusIcon /> Adicionar pergunta
      </button>

      {/* Barra de ações fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0b0620]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <p className="text-sm text-red-300">{error}</p>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/50 sm:block">
              {questions.length}{' '}
              {questions.length === 1 ? 'pergunta' : 'perguntas'}
            </span>
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-brand py-2.5 text-base"
            >
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5h6v2m-7 0 1 12h6l1-12" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
    </svg>
  )
}
