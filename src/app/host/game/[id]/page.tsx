'use client'

import { Game, Participant, QuizSet } from '@/types/types'
import {
  fetchGame,
  fetchParticipants,
  fetchQuizSetForGame,
  subscribeToGame,
} from '@/lib/api'
import { useEffect, useState } from 'react'
import Lobby from './lobby'
import Quiz from './quiz'
import Results from './results'

enum AdminScreens {
  lobby = 'lobby',
  quiz = 'quiz',
  result = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const [currentScreen, setCurrentScreen] = useState<AdminScreens>(
    AdminScreens.lobby
  )

  const [participants, setParticipants] = useState<Participant[]>([])

  const [quizSet, setQuizSet] = useState<QuizSet>()

  useEffect(() => {
    const getQuestions = async () => {
      try {
        setQuizSet(await fetchQuizSetForGame(gameId))
      } catch (e) {
        console.error(e)
        getQuestions()
      }
    }

    const setGameListner = async () => {
      try {
        setParticipants(await fetchParticipants(gameId))

        const gameData = await fetchGame(gameId)
        setCurrentQuestionSequence(gameData.current_question_sequence)
        setCurrentScreen(gameData.phase as AdminScreens)
      } catch (e: any) {
        alert(e.message)
        console.error(e)
      }
    }

    const unsubscribe = subscribeToGame(gameId, (event) => {
      if (event.type === 'participant') {
        const participant = event.payload as Participant
        setParticipants((current) => {
          if (current.some((p) => p.id === participant.id)) return current
          return [...current, participant]
        })
      } else if (event.type === 'game') {
        const game = event.payload as Game
        setCurrentQuestionSequence(game.current_question_sequence)
        setCurrentScreen(game.phase as AdminScreens)
      }
    })

    getQuestions()
    setGameListner()
    return unsubscribe
  }, [gameId])

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)

  return (
    <main className="min-h-screen">
      {currentScreen == AdminScreens.lobby && (
        <Lobby participants={participants} gameId={gameId}></Lobby>
      )}
      {currentScreen == AdminScreens.quiz && (
        <Quiz
          question={quizSet!.questions![currentQuestionSequence]}
          questionCount={quizSet!.questions!.length}
          gameId={gameId}
          participants={participants}
        ></Quiz>
      )}
      {currentScreen == AdminScreens.result && (
        <Results
          participants={participants!}
          quizSet={quizSet!}
          gameId={gameId}
        ></Results>
      )}
    </main>
  )
}
