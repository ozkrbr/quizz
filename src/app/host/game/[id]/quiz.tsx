import { TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Answer, Participant, Question } from '@/types/types'
import { subscribeToGame, updateGame } from '@/lib/api'
import { AnswerShape, answerColor } from '@/components/AnswerShape'
import { useEffect, useRef, useState } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  gameId,
  participants,
  answerTime,
  autoAdvance,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
  answerTime: number
  autoAdvance: boolean
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const answerStateRef = useRef<Answer[]>()

  answerStateRef.current = answers

  // Garante um único avanço automático por pergunta.
  const advancedRef = useRef(false)

  // Quem ainda não respondeu a pergunta atual.
  const answeredIds = new Set(answers.map((a) => a.participant_id))
  const notAnswered = participants.filter((p) => !answeredIds.has(p.id))

  const getNextQuestion = async () => {
    const updateData =
      questionCount == question.order + 1
        ? { phase: 'result' as const }
        : {
            current_question_sequence: question.order + 1,
            is_answer_revealed: false,
          }

    try {
      await updateGame(gameId, updateData)
    } catch (e: any) {
      return alert(e.message)
    }
  }

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await updateGame(gameId, { is_answer_revealed: true })
  }

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])
    advancedRef.current = false

    setTimeout(() => {
      setHasShownChoices(true)
    }, TIME_TIL_CHOICE_REVEAL)

    const unsubscribe = subscribeToGame(gameId, (event) => {
      if (event.type !== 'answer') return
      const answer = event.payload as Answer
      // Só conta as respostas da pergunta atual.
      if (answer.question_id !== question.id) return

      setAnswers((currentAnswers) => [...currentAnswers, answer])

      if ((answerStateRef.current?.length ?? 0) + 1 === participants.length) {
        onTimeUp()
      }
    })

    return unsubscribe
  }, [question.id])

  // Modo automático: após revelar a resposta, mostra o resultado por alguns
  // segundos e avança sozinho para a próxima pergunta.
  useEffect(() => {
    if (!autoAdvance || !isAnswerRevealed || advancedRef.current) return
    advancedRef.current = true
    const t = setTimeout(() => getNextQuestion(), 4000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvance, isAnswerRevealed])

  const countFor = (choiceId: string) =>
    answers.filter((a) => a.choice_id === choiceId).length

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topo */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="rounded-full bg-white/10 px-4 py-2 font-display text-sm font-bold text-white/80">
          Pergunta {question.order + 1} de {questionCount}
        </span>
        {isAnswerRevealed && !autoAdvance && (
          <button onClick={getNextQuestion} className="btn-brand py-2.5 text-base">
            {questionCount === question.order + 1 ? 'Ver placar' : 'Próxima'}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {isAnswerRevealed && autoAdvance && (
          <span className="rounded-full bg-white/10 px-4 py-2 font-display text-sm font-bold text-white/60">
            {questionCount === question.order + 1
              ? 'Indo para o placar…'
              : 'Próxima pergunta em instantes…'}
          </span>
        )}
      </div>

      {/* Pergunta */}
      <div className="px-6 text-center">
        <h2 className="mx-auto inline-block max-w-4xl rounded-2xl bg-white px-8 py-6 font-display text-2xl font-extrabold leading-snug text-slate-900 shadow-glow md:text-4xl">
          {question.body}
        </h2>
      </div>

      {/* Centro: timer + contador, ou gráfico de respostas */}
      <div className="flex flex-grow items-center justify-center px-6 py-6">
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex w-full max-w-3xl flex-col items-center gap-6">
            <div className="flex w-full items-center justify-between">
              <CountdownCircleTimer
                onComplete={() => {
                  onTimeUp()
                }}
                isPlaying
                duration={answerTime}
                colors={['#26890c', '#d89e00', '#e21b3c', '#e21b3c']}
                colorsTime={[
                  answerTime,
                  Math.round(answerTime * 0.4),
                  Math.round(answerTime * 0.15),
                  0,
                ]}
                trailColor={'rgba(255,255,255,0.12)' as ColorFormat}
                size={130}
              >
                {({ remainingTime }) => (
                  <span className="font-display text-5xl font-extrabold text-white">
                    {remainingTime}
                  </span>
                )}
              </CountdownCircleTimer>

              <div className="text-center">
                <div className="font-display text-7xl font-extrabold text-white">
                  {answers.length}
                  <span className="text-3xl text-white/40">
                    /{participants.length}
                  </span>
                </div>
                <div className="mt-1 font-display text-lg font-bold uppercase tracking-widest text-white/50">
                  respostas
                </div>
              </div>
            </div>

            {notAnswered.length > 0 && (
              <div className="w-full">
                <p className="mb-2 text-center font-display text-sm font-bold uppercase tracking-widest text-white/40">
                  Faltam responder ({notAnswered.length})
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {notAnswered.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white/70"
                    >
                      {p.nickname}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isAnswerRevealed && (
          <div className="flex h-64 w-full max-w-3xl items-end justify-center gap-6">
            {question.choices.map((choice, index) => {
              const count = countFor(choice.id)
              const pct = (count * 100) / (answers.length || 1)
              return (
                <div
                  key={choice.id}
                  className="flex h-full w-24 flex-col items-stretch justify-end"
                >
                  <div className="relative flex-grow">
                    <div
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      className={`absolute bottom-0 left-0 right-0 origin-bottom animate-grow-bar rounded-t-xl ${
                        answerColor(index).bg
                      } ${choice.is_correct ? 'ring-4 ring-white/80' : 'opacity-70'}`}
                    />
                  </div>
                  <div
                    className={`mt-2 flex items-center justify-center gap-2 rounded-xl py-2 font-display text-lg font-bold text-white ${
                      answerColor(index).bg
                    }`}
                  >
                    <AnswerShape index={index} className="h-5 w-5" />
                    {count}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Alternativas */}
      {hasShownChoices && (
        <div className="grid grid-cols-2 gap-3 p-4">
          {question.choices.map((choice, index) => (
            <div
              key={choice.id}
              className={`flex items-center gap-4 rounded-2xl px-5 py-5 font-display text-xl font-bold text-white shadow-answer transition md:text-2xl ${
                answerColor(index).bg
              } ${
                isAnswerRevealed && !choice.is_correct
                  ? 'opacity-40'
                  : isAnswerRevealed && choice.is_correct
                  ? 'ring-4 ring-white'
                  : ''
              }`}
            >
              <AnswerShape index={index} className="h-7 w-7 shrink-0" />
              <span className="flex-grow">{choice.body}</span>
              {isAnswerRevealed && (
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={4}
                  stroke="currentColor"
                  className="h-7 w-7 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={
                      choice.is_correct
                        ? 'm4.5 12.75 6 6 9-13.5'
                        : 'M6 18 18 6M6 6l12 12'
                    }
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
