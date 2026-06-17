'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Game, Participant, Question } from '@/types/types'
import { fetchGame, fetchQuizSetForGame, subscribeToGame } from '@/lib/api'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const onRegisterCompleted = (participant: Participant) => {
    setParticipant(participant)
    getGame()
  }

  const stateRef = useRef<Participant | null>()

  const [participant, setParticipant] = useState<Participant | null>()

  stateRef.current = participant

  const [currentScreen, setCurrentScreen] = useState(Screens.lobby)

  const [questions, setQuestions] = useState<Question[]>()

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)
  const [removed, setRemoved] = useState(false)
  const [answerTime, setAnswerTime] = useState(30)

  const getGame = async () => {
    const game = await fetchGame(gameId).catch(() => null)
    if (!game) return
    setCurrentScreen(game.phase as Screens)
    if (game.phase == Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    getQuestions()
  }

  const getQuestions = async () => {
    try {
      const quizSet = await fetchQuizSetForGame(gameId)
      setQuestions(quizSet.questions)
      setAnswerTime(quizSet.answer_time ?? 30)
    } catch (e) {
      getQuestions()
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToGame(gameId, (event) => {
      if (event.type === 'kick') {
        if (
          stateRef.current &&
          event.payload.participantId === stateRef.current.id
        ) {
          setRemoved(true)
        }
        return
      }
      if (event.type !== 'game') return
      if (!stateRef.current) return

      // start the quiz game
      const game = event.payload as Game

      if (game.phase == 'result') {
        setCurrentScreen(Screens.results)
      } else {
        setCurrentScreen(Screens.quiz)
        setCurrentQuestionSequence(game.current_question_sequence)
        setIsAnswerRevealed(game.is_answer_revealed)
      }
    })
    return unsubscribe
  }, [gameId])

  if (removed) {
    return (
      <main className="min-h-[100dvh]">
        <div className="flex min-h-[100dvh] items-center justify-center px-5 text-center">
          <div className="glass animate-pop-in rounded-3xl p-10 shadow-glow">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
              👋
            </div>
            <h2 className="font-display text-2xl font-extrabold text-white">
              Você saiu da partida
            </h2>
            <p className="mt-2 text-white/60">
              O apresentador removeu você desta partida. Pode fechar esta aba.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh]">
      {currentScreen == Screens.lobby && (
        <Lobby
          onRegisterCompleted={onRegisterCompleted}
          gameId={gameId}
        ></Lobby>
      )}
      {currentScreen == Screens.quiz && questions && (
        <Quiz
          question={questions![currentQuestionSequence]}
          questionCount={questions!.length}
          participantId={participant!.id}
          gameId={gameId}
          isAnswerRevealed={isAnswerRevealed}
          answerTime={answerTime}
        ></Quiz>
      )}
      {currentScreen == Screens.results && (
        <Results participant={participant!}></Results>
      )}
    </main>
  )
}

function Results({ participant }: { participant: Participant }) {
  const [left, setLeft] = useState(false)

  const onLeave = () => {
    setLeft(true)
    // Tenta fechar a aba (funciona se foi aberta por script); senão, a tela de
    // despedida abaixo orienta o jogador a fechar manualmente.
    window.close()
  }

  if (left) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-5 text-center">
        <div className="glass animate-pop-in rounded-3xl p-10 shadow-glow">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
            👋
          </div>
          <h2 className="font-display text-2xl font-extrabold text-white">
            Até a próxima!
          </h2>
          <p className="mt-2 text-white/60">
            Você saiu da partida. Pode fechar esta aba com segurança.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-5 text-center">
      <div className="glass animate-pop-in rounded-3xl p-10 shadow-glow">
        <div className="mx-auto mb-5 flex h-20 w-20 animate-float items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-4xl shadow-glow">
          🎉
        </div>
        <h2 className="font-display text-3xl font-extrabold text-white">
          Mandou bem, {participant.nickname}!
        </h2>
        <p className="mt-2 text-white/60">
          Obrigado por jogar. Confira o placar na tela do apresentador.
        </p>
        <button onClick={onLeave} className="btn-brand mt-6 w-full text-base">
          Encerrar e sair
        </button>
      </div>
    </div>
  )
}
