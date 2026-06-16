import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Choice, Question } from '@/types/types'
import { submitAnswer } from '@/lib/api'
import { AnswerShape, answerColor } from '@/components/AnswerShape'
import { useState, useEffect } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  participantId: playerId,
  gameId,
  isAnswerRevealed,
}: {
  question: Question
  questionCount: number
  participantId: string
  gameId: string
  isAnswerRevealed: boolean
}) {
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  useEffect(() => {
    setChosenChoice(null)
    setHasShownChoices(false)
  }, [question.id])

  const answer = async (choice: Choice) => {
    setChosenChoice(choice)

    const now = Date.now()
    const score = !choice.is_correct
      ? 0
      : 1000 -
        Math.round(
          Math.max(
            0,
            Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)
          ) * 1000
        )

    try {
      await submitAnswer({
        gameId,
        participantId: playerId,
        questionId: question.id,
        choiceId: choice.id,
        score,
      })
    } catch (e: any) {
      setChosenChoice(null)
      alert(e.message)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Pergunta */}
      <div className="px-5 pt-8 text-center">
        <h2 className="mx-auto inline-block max-w-3xl rounded-2xl bg-white px-6 py-5 font-display text-xl font-extrabold leading-snug text-slate-900 shadow-glow md:text-3xl">
          {question.body}
        </h2>
      </div>

      {/* Esperando os outros */}
      {!isAnswerRevealed && chosenChoice && (
        <div className="flex flex-grow flex-col items-center justify-center gap-4 px-5">
          <div
            className="flex h-24 w-24 animate-pop-in items-center justify-center rounded-3xl text-white shadow-answer"
            style={{ backgroundColor: answerColor(question.choices.indexOf(chosenChoice)).hex }}
          >
            <AnswerShape
              index={question.choices.indexOf(chosenChoice)}
              className="h-10 w-10"
            />
          </div>
          <p className="font-display text-xl font-bold text-white/80">
            Resposta enviada!
          </p>
          <p className="text-white/50">Aguardando os outros jogadores…</p>
        </div>
      )}

      {/* Contagem antes de liberar as alternativas */}
      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex flex-grow flex-col items-center justify-center gap-5">
          <CountdownCircleTimer
            onComplete={() => {
              setHasShownChoices(true)
              setQuestionStartTime(Date.now())
            }}
            isPlaying
            duration={TIME_TIL_CHOICE_REVEAL / 1000}
            colors={['#9f75ff', '#9f75ff', '#9f75ff', '#9f75ff']}
            trailColor={'rgba(255,255,255,0.12)' as ColorFormat}
            colorsTime={[7, 5, 2, 0]}
            size={140}
          >
            {({ remainingTime }) => (
              <span className="font-display text-5xl font-extrabold text-white">
                {remainingTime}
              </span>
            )}
          </CountdownCircleTimer>
          <p className="font-display text-lg font-bold text-white/70">
            Prepare-se…
          </p>
        </div>
      )}

      {/* Alternativas */}
      {hasShownChoices && !isAnswerRevealed && !chosenChoice && (
        <div className="flex flex-grow flex-col justify-end">
          <div className="grid grid-cols-2 gap-3 p-4">
            {question.choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => answer(choice)}
                disabled={chosenChoice !== null || isAnswerRevealed}
                className={`answer-btn animate-fade-up ${answerColor(index).bg}`}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <AnswerShape index={index} className="h-7 w-7 shrink-0" />
                <span className="leading-tight">{choice.body}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Resultado da rodada */}
      {isAnswerRevealed && (
        <div className="flex flex-grow flex-col items-center justify-center gap-4 px-5">
          <div
            className={`flex h-28 w-28 animate-pop-in items-center justify-center rounded-full text-white shadow-glow ${
              chosenChoice?.is_correct ? 'bg-answer-green' : 'bg-answer-red'
            }`}
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={4}
              stroke="currentColor"
              className="h-14 w-14"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={
                  chosenChoice?.is_correct
                    ? 'm4.5 12.75 6 6 9-13.5'
                    : 'M6 18 18 6M6 6l12 12'
                }
              />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-white">
            {chosenChoice?.is_correct
              ? 'Correto!'
              : chosenChoice
              ? 'Não foi dessa vez'
              : 'Tempo esgotado'}
          </h2>
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="rounded-full bg-white/10 px-4 py-1.5 font-display text-sm font-bold text-white/80">
          {question.order + 1} / {questionCount}
        </span>
      </div>
    </div>
  )
}
